import React from 'react';
import logo from '../../../../media/images/privastream_logo.png';
export default function StreamlabsDesktopLogo() {
    return (<div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <img src={logo} alt="PrivaStream Logo" style={{ height: '40px', width: 'auto' }}/>
      <span style={{
            color: '#ffffff',
            fontSize: '24px',
            fontWeight: 'bold',
            fontFamily: 'Inter, sans-serif'
        }}>
        PrivaStream Desktop
      </span>
    </div>);
}
//# sourceMappingURL=StreamlabsDesktopLogo.jsx.map