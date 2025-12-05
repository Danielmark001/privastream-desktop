import React from 'react';
export default function PlatformSettingsLayout(p) {
    let layoutItems = [];
    switch (p.layoutMode) {
        case 'singlePlatform':
            layoutItems = [
                p.essentialOptionalFields,
                p.commonFields,
                p.requiredFields,
                p.optionalFields,
                p.layout,
            ];
            break;
        case 'multiplatformSimple':
            layoutItems = [p.requiredFields, p.layout];
            return p.requiredFields;
        case 'multiplatformAdvanced':
            layoutItems = [p.essentialOptionalFields, p.requiredFields, p.optionalFields, p.commonFields];
            break;
    }
    return <>{layoutItems.map(item => item)}</>;
}
//# sourceMappingURL=PlatformSettingsLayout.jsx.map