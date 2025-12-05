import React from 'react';

interface StreamlabsLogoProps {
  color?: string;
  className?: string;
}

import logo from '../../../../media/images/privastream_logo.png';

export default function StreamlabsLogo({ color = 'white', className }: StreamlabsLogoProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }} className={className}>
      <img src={logo} alt="PrivaStream Logo" style={{ height: '40px', width: 'auto' }} />
      <span style={{ 
        color: color, 
        fontSize: '24px', 
        fontWeight: 'bold', 
        fontFamily: 'Inter, sans-serif' 
      }}>
        PrivaStream
      </span>
    </div>
  );
}
