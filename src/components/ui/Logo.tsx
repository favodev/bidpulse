import Image from "next/image";
import Link from "next/link";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

const sizeConfig = {
  sm: { width: 28, height: 28, text: "text-lg", gap: "gap-2" },
  md: { width: 36, height: 36, text: "text-xl", gap: "gap-2.5" },
  lg: { width: 44, height: 44, text: "text-2xl", gap: "gap-3" },
};

export function Logo({ size = "md", showText = true }: LogoProps) {
  const config = sizeConfig[size];

  return (
    <Link href="/" className={`inline-flex items-center ${config.gap}`}>
      <Image
        src="/assets/logo.png"
        alt="BidPulse Logo"
        width={config.width}
        height={config.height}
        priority
      />
      {showText && (
        <span className={`${config.text} font-bold text-white`}>BidPulse</span>
      )}
    </Link>
  );
}

export default Logo;
