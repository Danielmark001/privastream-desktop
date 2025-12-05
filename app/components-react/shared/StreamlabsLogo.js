import React from 'react';
import logo from '../../../../media/images/privastream_logo.png';
export default function StreamlabsLogo({ color = 'white', className }) {
    return (React.createElement("div", { style: { display: 'flex', alignItems: 'center', gap: '12px' }, className: className },
        React.createElement("img", { src: logo, alt: "PrivaStream Logo", style: { height: '40px', width: 'auto' } }),
        React.createElement("span", { style: {
                color: color,
                fontSize: '24px',
                fontWeight: 'bold',
                fontFamily: 'Inter, sans-serif'
            } }, "PrivaStream")));
}
//# sourceMappingURL=StreamlabsLogo.js.map