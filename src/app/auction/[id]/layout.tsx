import type { Metadata } from "next";
import { getAuction } from "@/services/auction.service";
import { truncate } from "@/lib/utils";

interface AuctionLayoutProps {
  children: React.ReactNode;
  params: { id: string };
}

export async function generateMetadata(
  { params }: { params: { id: string } }
): Promise<Metadata> {
  try {
    const auction = await getAuction(params.id);

    if (!auction) {
      return {
        title: "Subasta no encontrada | BidPulse",
        description: "La subasta solicitada no existe o fue eliminada.",
      };
    }

    const title = `${auction.title} | BidPulse`;
    const description = truncate(auction.description || "", 160);
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
