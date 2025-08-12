import React from "react";

import Image from "next/image";

interface AtamsaLogoProps {
  isLarge?: boolean;
}

const AtamsaLogo: React.FC<AtamsaLogoProps> = ({ isLarge = false }) => {
  const width = isLarge ? 160 : 80;
  const height = isLarge ? 160 : 80;
  const className = isLarge ? "h-40 w-auto" : "h-20 w-auto";

  return (
    <Image
      src={require('/public/logo.png')}
      alt="ATAMSA Logo"
      width={width}
      height={height}
      className={className}
    />
  );
};

export default AtamsaLogo;
