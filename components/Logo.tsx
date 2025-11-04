import React from 'react';

type LogoProps = React.SVGProps<SVGSVGElement>;

// Fix: The component definition was incomplete, causing a syntax error.
// Completed the component with an arrow function and SVG content.
export const Logo: React.FC<LogoProps> = (props) => (
  <svg
    viewBox="0 0 200 200"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <defs>
      <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ef4444" /> 
        <stop offset="100%" stopColor="#f97316" />
      </linearGradient>
    </defs>
    <path
      fill="url(#logo-gradient)"
      d="M50,10 C27.9,10 10,27.9 10,50 L10,150 C10,172.1 27.9,190 50,190 L150,190 C172.1,190 190,172.1 190,150 L190,50 C190,27.9 172.1,10 150,10 L50,10 Z M100,60 C122.1,60 140,77.9 140,100 C140,122.1 122.1,140 100,140 C77.9,140 60,122.1 60,100 C60,77.9 77.9,60 100,60 Z"
    />
    <path
      fill="#FFFFFF"
      d="M100,70 C83.4,70 70,83.4 70,100 C70,116.6 83.4,130 100,130 C116.6,130 130,116.6 130,100 C130,83.4 116.6,70 100,70 Z"
    />
  </svg>
);
