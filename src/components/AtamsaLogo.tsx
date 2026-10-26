import React from "react";
import Image from "next/image";

interface AtamsaLogoProps {
  isLarge?: boolean;
  size?: "small" | "medium" | "large";
  className?: string;
}

const AtamsaLogo: React.FC<AtamsaLogoProps> = ({
  isLarge = false,
  size,
  className = "",
}) => {
  let effectiveSize = size || (isLarge ? "large" : "medium");

  const dimensions = {
    small: { width: 44, height: 44, defaultClass: "h-11" },
    medium: { width: 80, height: 80, defaultClass: "h-20" },
    large: { width: 160, height: 160, defaultClass: "h-40" },
  }[effectiveSize];

  return (
    <Image
      src="/logo.png"
      alt="Logo ATAMSA"
      width={dimensions.width}
      height={dimensions.height}
      className={`${dimensions.defaultClass} w-auto object-contain ${className}`.trim()}
      priority
      unoptimized
    />
  );
};

export default AtamsaLogo;
