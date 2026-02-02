import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  increment,
  runTransaction,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Review,
  CreateReviewData,
  UpdateReviewData,
  ReviewFilters,
  SellerRatingSummary,
} from "@/types/review.types";

const REVIEWS_COLLECTION = "reviews";
const USERS_COLLECTION = "users";
const reviewsRef = collection(db, REVIEWS_COLLECTION);

/**
 * Obtener una review por ID
 */
export async function getReview(reviewId: string): Promise<Review | null> {
  try {
    const docRef = doc(db, REVIEWS_COLLECTION, reviewId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    return {
      id: docSnap.id,
      ...docSnap.data(),
    } as Review;
  } catch (error) {
    console.error("[ReviewService] Error getting review:", error);
    throw error;
  }
}

/**
 * Obtener reviews con filtros
 */
export async function getReviews(filters: ReviewFilters = {}): Promise<Review[]> {
  try {
    let q = query(reviewsRef);

    // Filtrar por vendedor
    if (filters.sellerId) {
      q = query(q, where("sellerId", "==", filters.sellerId));
    }

    // Filtrar por reviewer
    if (filters.reviewerId) {
      q = query(q, where("reviewerId", "==", filters.reviewerId));
    }

    // Filtrar por subasta
    if (filters.auctionId) {
      q = query(q, where("auctionId", "==", filters.auctionId));
    }

    // Filtrar por rating mínimo
    if (filters.minRating) {
      q = query(q, where("rating", ">=", filters.minRating));
    }

    // Ordenar
    const sortField = filters.sortBy || "createdAt";
    const sortDirection = filters.sortOrder || "desc";
    q = query(q, orderBy(sortField, sortDirection));

    // Limitar resultados
    if (filters.limit) {
      q = query(q, limit(filters.limit));
    }

    const querySnapshot = await getDocs(q);
    const reviews: Review[] = [];

    querySnapshot.forEach((doc) => {
      reviews.push({
        id: doc.id,
        ...doc.data(),
      } as Review);
    });

    return reviews;
  } catch (error) {
    console.error("[ReviewService] Error getting reviews:", error);
    throw error;
  }
}

/**
 * Obtener reviews de un vendedor
 */
export async function getSellerReviews(
  sellerId: string,
  limitCount = 20
): Promise<Review[]> {
  return getReviews({
    sellerId,
    sortBy: "createdAt",
    sortOrder: "desc",
    limit: limitCount,
  });
}

/**
 * Obtener reviews hechas por un usuario
 */
export async function getUserReviews(
  reviewerId: string,
  limitCount = 20
): Promise<Review[]> {
  return getReviews({
    reviewerId,
    sortBy: "createdAt",
    sortOrder: "desc",
    limit: limitCount,
  });
}

/**
 * Verificar si ya existe una review para una subasta
 */
export async function hasReviewForAuction(
  reviewerId: string,
  auctionId: string
): Promise<boolean> {
  try {
    const q = query(
      reviewsRef,
      where("reviewerId", "==", reviewerId),
      where("auctionId", "==", auctionId)
    );
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  } catch (error) {
    console.error("[ReviewService] Error checking review exists:", error);
    throw error;
  }
}

/**
 * Obtener la review de una subasta específica
 */
export async function getReviewForAuction(
  auctionId: string
): Promise<Review | null> {
  try {
    const q = query(reviewsRef, where("auctionId", "==", auctionId));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }

    const doc = querySnapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data(),
    } as Review;
  } catch (error) {
    console.error("[ReviewService] Error getting review for auction:", error);
    throw error;
  }
}

/**
 * Crear una nueva review
 */
export async function createReview(
  reviewerId: string,
  reviewerName: string,
  reviewerAvatar: string | undefined,
  data: CreateReviewData
): Promise<string> {
  try {
    // Verificar que no exista ya una review
    const exists = await hasReviewForAuction(reviewerId, data.auctionId);
    if (exists) {
      throw new Error("Ya has dejado una valoración para esta subasta");
    }

    // Usar una transacción para crear la review y actualizar el rating del vendedor
    const reviewId = await runTransaction(db, async (transaction) => {
      // Obtener el perfil del vendedor
      const sellerRef = doc(db, USERS_COLLECTION, data.sellerId);
      const sellerDoc = await transaction.get(sellerRef);

      if (!sellerDoc.exists()) {
        throw new Error("Vendedor no encontrado");
      }

      const sellerData = sellerDoc.data();
      const currentRating = sellerData.stats?.rating || 0;
      const currentReviewsCount = sellerData.stats?.reviewsCount || 0;

      // Calcular nuevo rating promedio
      const newReviewsCount = currentReviewsCount + 1;
      const newAverageRating =
        (currentRating * currentReviewsCount + data.rating) / newReviewsCount;

      // Crear la review
      const newReviewRef = doc(collection(db, REVIEWS_COLLECTION));
      const reviewData = {
        ...data,
        reviewerId,
        reviewerName,
        reviewerAvatar: reviewerAvatar || null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isVerified: true, // Asumimos que es verificado ya que ganó la subasta
        isEdited: false,
      };

      transaction.set(newReviewRef, reviewData);

      // Actualizar stats del vendedor
      transaction.update(sellerRef, {
        "stats.rating": Math.round(newAverageRating * 10) / 10, // Redondear a 1 decimal
        "stats.reviewsCount": increment(1),
        updatedAt: serverTimestamp(),
      });

      return newReviewRef.id;
    });

    return reviewId;
  } catch (error) {
    console.error("[ReviewService] Error creating review:", error);
    throw error;
  }
}

/**
 * Actualizar una review existente
 */
export async function updateReview(
  reviewId: string,
  reviewerId: string,
  data: UpdateReviewData
): Promise<void> {
  try {
    const review = await getReview(reviewId);

    if (!review) {
      throw new Error("Review no encontrada");
    }

    if (review.reviewerId !== reviewerId) {
      throw new Error("No tienes permiso para editar esta review");
    }

    // Si cambia el rating, actualizar también el promedio del vendedor
    if (data.rating !== undefined && data.rating !== review.rating) {
      const newRating = data.rating;
      await runTransaction(db, async (transaction) => {
        const sellerRef = doc(db, USERS_COLLECTION, review.sellerId);
        const sellerDoc = await transaction.get(sellerRef);

        if (sellerDoc.exists()) {
          const sellerData = sellerDoc.data();
          const currentRating = sellerData.stats?.rating || 0;
          const reviewsCount = sellerData.stats?.reviewsCount || 1;

          // Recalcular el promedio
          const totalRating = currentRating * reviewsCount - review.rating + newRating;
          const newAverageRating = totalRating / reviewsCount;

          transaction.update(sellerRef, {
            "stats.rating": Math.round(newAverageRating * 10) / 10,
            updatedAt: serverTimestamp(),
          });
        }

        const reviewRef = doc(db, REVIEWS_COLLECTION, reviewId);
        transaction.update(reviewRef, {
          ...data,
          updatedAt: serverTimestamp(),
          isEdited: true,
        });
      });
    } else {
      const reviewRef = doc(db, REVIEWS_COLLECTION, reviewId);
      await updateDoc(reviewRef, {
        ...data,
        updatedAt: serverTimestamp(),
        isEdited: true,
      });
    }
  } catch (error) {
    console.error("[ReviewService] Error updating review:", error);
    throw error;
  }
}

/**
 * Eliminar una review
 */
export async function deleteReview(
  reviewId: string,
  reviewerId: string
): Promise<void> {
  try {
    const review = await getReview(reviewId);

    if (!review) {
      throw new Error("Review no encontrada");
    }

    if (review.reviewerId !== reviewerId) {
      throw new Error("No tienes permiso para eliminar esta review");
    }

    await runTransaction(db, async (transaction) => {
      // Actualizar stats del vendedor
      const sellerRef = doc(db, USERS_COLLECTION, review.sellerId);
      const sellerDoc = await transaction.get(sellerRef);

      if (sellerDoc.exists()) {
        const sellerData = sellerDoc.data();
        const currentRating = sellerData.stats?.rating || 0;
        const reviewsCount = sellerData.stats?.reviewsCount || 1;

        if (reviewsCount > 1) {
          // Recalcular el promedio sin esta review
          const newReviewsCount = reviewsCount - 1;
          const totalRating = currentRating * reviewsCount - review.rating;
          const newAverageRating = totalRating / newReviewsCount;

          transaction.update(sellerRef, {
            "stats.rating": Math.round(newAverageRating * 10) / 10,
            "stats.reviewsCount": increment(-1),
            updatedAt: serverTimestamp(),
          });
        } else {
          // Era la única review, resetear
          transaction.update(sellerRef, {
            "stats.rating": 0,
            "stats.reviewsCount": 0,
            updatedAt: serverTimestamp(),
          });
        }
      }

      const reviewRef = doc(db, REVIEWS_COLLECTION, reviewId);
      transaction.delete(reviewRef);
    });
  } catch (error) {
    console.error("[ReviewService] Error deleting review:", error);
    throw error;
  }
}

/**
 * Agregar respuesta del vendedor a una review
 */
export async function addSellerResponse(
  reviewId: string,
  sellerId: string,
  comment: string
): Promise<void> {
  try {
    const review = await getReview(reviewId);

    if (!review) {
      throw new Error("Review no encontrada");
    }

    if (review.sellerId !== sellerId) {
      throw new Error("No tienes permiso para responder a esta review");
    }

    const reviewRef = doc(db, REVIEWS_COLLECTION, reviewId);
    await updateDoc(reviewRef, {
      sellerResponse: {
        comment,
        respondedAt: serverTimestamp(),
      },
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("[ReviewService] Error adding seller response:", error);
    throw error;
  }
}

/**
 * Obtener resumen de ratings de un vendedor
 */
export async function getSellerRatingSummary(
  sellerId: string
): Promise<SellerRatingSummary> {
  try {
    const reviews = await getSellerReviews(sellerId, 1000); // Obtener todas las reviews

    if (reviews.length === 0) {
      return {
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      };
    }

    // Calcular distribución de ratings
    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let totalRating = 0;
    let communicationTotal = 0;
    let itemAsDescribedTotal = 0;
    let shippingTotal = 0;
    let aspectsCount = 0;

    reviews.forEach((review) => {
      const rating = Math.min(5, Math.max(1, Math.round(review.rating))) as 1 | 2 | 3 | 4 | 5;
      ratingDistribution[rating]++;
      totalRating += review.rating;

      if (review.aspects) {
        communicationTotal += review.aspects.communication || 0;
        itemAsDescribedTotal += review.aspects.itemAsDescribed || 0;
        shippingTotal += review.aspects.shipping || 0;
        aspectsCount++;
      }
    });

    const summary: SellerRatingSummary = {
      averageRating: Math.round((totalRating / reviews.length) * 10) / 10,
      totalReviews: reviews.length,
      ratingDistribution,
    };

    if (aspectsCount > 0) {
      summary.aspectAverages = {
        communication: Math.round((communicationTotal / aspectsCount) * 10) / 10,
        itemAsDescribed: Math.round((itemAsDescribedTotal / aspectsCount) * 10) / 10,
        shipping: Math.round((shippingTotal / aspectsCount) * 10) / 10,
      };
    }

    return summary;
  } catch (error) {
    console.error("[ReviewService] Error getting seller rating summary:", error);
    throw error;
  }
}
