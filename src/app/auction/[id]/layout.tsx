import type { Metadata } from "next";
import { truncate } from "@/lib/utils";
import { getAdminDb } from "@/lib/firebaseAdmin";

interface AuctionLayoutProps {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  try {
    const { id } = await params;
    const db = getAdminDb();
    const docSnap = await db.collection("auctions").doc(id).get();

    if (!docSnap.exists) {
      return {
        title: "Subasta no encontrada | BidPulse",
        description: "La subasta solicitada no existe o fue eliminada.",
      };
    }

    const auction = docSnap.data();
    if (!auction) {
      return {
        title: "Subasta no encontrada | BidPulse",
        description: "La subasta solicitada no existe o fue eliminada.",
      };
    }
    const title = `${auction.title || "Subasta"} | BidPulse`;
    const description = truncate(auction.description, 160);
    const image = auction.images?.[0] || "/assets/logo.png";

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        images: [image],
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [image],
      },
    };
  } catch (error) {
    return {
      title: "Subasta | BidPulse",
      description: "Detalles de la subasta en tiempo real.",
    };
  }
}

export default function AuctionLayout({ children }: AuctionLayoutProps) {
  return children;
}
