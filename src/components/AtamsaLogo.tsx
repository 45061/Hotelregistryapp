import React from "react";
import Image from "next/image";
import logoImg from "../../public/logo.png";

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

  const heightClass = {
    small: "h-11 max-w-[140px]",
    medium: "h-20 max-w-[240px]",
    large: "h-32 sm:h-40 max-w-[340px]",
  }[effectiveSize];

  return (
    <div className={`inline-flex items-center justify-center ${className}`.trim()}>
      <Image
        src={logoImg}
        alt="Logo ATAMSA"
        className={`${heightClass} w-auto object-contain`}
        priority
      />
    </div>
  );
};

export default AtamsaLogo;
