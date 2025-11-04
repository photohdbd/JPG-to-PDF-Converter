import React from 'react';

type LogoProps = React.SVGProps<SVGSVGElement>;

export const Logo: React.FC<LogoProps> = (props) => (
<svg viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
<defs>
    {/* Main gradient for the document icon */}
    <linearGradient id="doc-gradient" x1="16" y1="14" x2="104" y2="106" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FF8A5C"/>
        <stop offset="1" stopColor="#E84A70"/>
    </linearGradient>

    {/* Shadow for the document icon */}
    <filter id="icon-shadow" x="-15%" y="-15%" width="130%" height="130%">
      <feDropShadow dx="1" dy="3" stdDeviation="3" floodColor="#000000" floodOpacity="0.2"/>
    </filter>

    {/* White glow/shadow for the text */}
    <filter id="text-shadow-glow" x="-50%" y="-50%" width="200%" height="200%">
        <feDropShadow dx="0" dy="1" stdDeviation="2.5" floodColor="#FFFFFF" floodOpacity="0.9"/>
    </filter>
</defs>

{/* Document Icon with multiple layers for depth */}
<g filter="url(#icon-shadow)">
    {/* Back layer (darker shade for depth) */}
    <path d="M26 18C20.4772 18 16 22.4772 16 28V100C16 105.523 20.4772 110 26 110H74L104 82V28C104 22.4772 99.5228 18 94 18H26Z" fill="#B3234F"/>
    
    {/* Middle layer */}
    <path d="M26 16C20.4772 16 16 20.4772 16 26V98C16 103.523 20.4772 108 26 108H74L104 80V26C104 20.4772 99.5228 16 94 16H26Z" fill="#D02C4D"/>
    
    {/* Top layer with gradient */}
    <path d="M26 14C20.4772 14 16 18.4772 16 24V96C16 101.523 20.4772 106 26 106H74L104 78V24C104 18.4772 99.5228 14 94 14H26Z" fill="url(#doc-gradient)"/>
    
    {/* Page fold highlight */}
    <path d="M74 14V78H104L74 14Z" fill="white" fillOpacity="0.25"/>
</g>

{/* Text "lolopdf" */}
<g style={{ fontFamily: "'Poppins', 'Nunito Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'sans-serif'", fontWeight: 800, fontSize: '40px', letterSpacing: '-2.5px', textAnchor: 'middle' }}>
    <text x="64" y="80" filter="url(#text-shadow-glow)">
        <tspan fill="#F8676F">lolo</tspan><tspan fill="#FFFFFF">pdf</tspan>
    </text>
</g>
</svg>
);