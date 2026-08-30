import React from 'react';

interface LogoProps {
  size?: number;
  className?: string;
  color?: string;
}

export const Logo: React.FC<LogoProps> = ({ 
  size = 24, 
  className = '', 
  color = '#f59e0b' 
}) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Shield Outline */}
      <path 
        d="M50 5 L90 20 L90 50 C90 75, 50 95, 50 95 C50 95, 10 75, 10 50 L10 20 Z" 
        fill="none" 
        stroke={color} 
        strokeWidth="4" 
        strokeLinejoin="round"
      />
      
      {/* Eye Outer Shape */}
      <path 
        d="M20 50 C20 50, 35 30, 50 30 C65 30, 80 50, 80 50 C80 50, 65 70, 50 70 C35 70, 20 50, 20 50 Z" 
        fill="none" 
        stroke="#FFFFFF" 
        strokeWidth="0.5" 
        strokeOpacity="0.7"
      />
      
      {/* Central Iris Target Ring */}
      <circle cx="50" cy="50" r="14" fill="none" stroke={color} strokeWidth="4"/>
      
      {/* Crosshairs on Ring */}
      <line x1="50" y1="32" x2="50" y2="40" stroke={color} strokeWidth="2"/>
      <line x1="50" y1="60" x2="50" y2="68" stroke={color} strokeWidth="2"/>
      <line x1="32" y1="50" x2="40" y2="50" stroke={color} strokeWidth="2"/>
      <line x1="60" y1="50" x2="68" y2="50" stroke={color} strokeWidth="2"/>
      
      {/* Pupil */}
      <circle cx="50" cy="50" r="5" fill={color}/>
      
      {/* Radiating Circuit Nodes */}
      <g stroke={color} strokeWidth="2" fill="none">
        {/* Top */}
        <line x1="50" y1="18" x2="50" y2="28" />
        <circle cx="50" cy="15" r="3" />
        
        {/* Bottom */}
        <line x1="50" y1="72" x2="50" y2="82" />
        <circle cx="50" cy="85" r="3" />
        
        {/* Top Right */}
        <polyline points="79,25 65,25 56,34" />
        <circle cx="82" cy="25" r="3" />
        
        {/* Bottom Right */}
        <line x1="60" y1="60" x2="68" y2="68" />
        <circle cx="70.5" cy="70.5" r="3" />
        
        {/* Bottom Left */}
        <line x1="40" y1="60" x2="32" y2="68" />
        <circle cx="29.5" cy="70.5" r="3" />
        
        {/* Top Left */}
        <polyline points="21,25 35,25 44,34" />
        <circle cx="18" cy="25" r="3" />
      </g>
    </svg>
  );
};
