import React from 'react';

interface LogoSvgProps {
  className?: string;
  width?: number | string;
  height?: number | string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const LogoSvg: React.FC<LogoSvgProps> = ({ 
  className = '', 
  width, 
  height,
  size = 'md' 
}) => {
  const sizeMap = {
    sm: 'h-8 w-auto',
    md: 'h-12 w-auto',
    lg: 'h-16 w-auto',
    xl: 'h-24 sm:h-32 md:h-40 w-auto',
  };

  const style: React.CSSProperties = {};
  if (width) style.width = width;
  if (height) style.height = height;

  return (
    <img
      src="/images/logo_yellow.png"
      alt="ZALUPA DROP"
      style={style}
      className={`inline-block object-contain select-none ${sizeMap[size]} ${className}`}
    />
  );
};
