import React from 'react';

type LogoProps = React.SVGProps<SVGSVGElement>;

export const Logo: React.FC<LogoProps> = (props) => (
  <svg
    viewBox="0 0 280 80"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <defs>
      <linearGradient id="logo-gradient-text" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#f97316" />
        <stop offset="100%" stopColor="#ef4444" />
      </linearGradient>
    </defs>
    <text 
        x="50%" 
        y="50%" 
        dominantBaseline="central" 
        textAnchor="middle" 
        fontFamily="'Poppins', 'Helvetica Neue', sans-serif" 
        fontSize="60" 
        fontWeight="800"
        letterSpacing="-2"
    >
        <tspan fill="url(#logo-gradient-text)">LOLO</tspan>
        <tspan fill="currentColor">PDF</tspan>
    </text>
  </svg>
);