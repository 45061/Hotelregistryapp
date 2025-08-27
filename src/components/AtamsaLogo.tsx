import React from "react";

import Image from "next/image";

interface AtamsaLogoProps {
  isLarge?: boolean;
}

const AtamsaLogo: React.FC<AtamsaLogoProps> = ({ isLarge = false }) => {
  const width = isLarge ? 160 : 80;
  const height = isLarge ? 160 : 80;
  const className = isLarge ? "h-40" : "h-20";

  return (
    <Image
      src={require('/public/logo.png')}
      alt="ATAMSA Logo"
      width={width}
      height={height}
      className={className}
      style={{ width: 'auto' }}
      priority
    />
  );
};

export default AtamsaLogo;