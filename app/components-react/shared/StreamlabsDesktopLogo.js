import React from 'react';
import logo from '../../../../media/images/privastream_logo.png';
export default function StreamlabsDesktopLogo() {
    return (React.createElement("div", { style: { display: 'flex', alignItems: 'center', gap: '12px' } },
        React.createElement("img", { src: logo, alt: "PrivaStream Logo", style: { height: '40px', width: 'auto' } }),
        React.createElement("span", { style: {
                color: '#ffffff',
                fontSize: '24px',
                fontWeight: 'bold',
                fontFamily: 'Inter, sans-serif'
            } }, "PrivaStream Desktop")));
}
//# sourceMappingURL=StreamlabsDesktopLogo.js.map