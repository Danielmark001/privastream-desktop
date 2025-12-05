import React from 'react';
import { CardInput, InputComponent } from '../../shared/inputs';
import { Services } from '../../service-provider';
import { getDefined } from '../../../util/properties-type-guards';
export const LayoutInput = InputComponent((p) => {
    const nightMode = Services.CustomizationService.isDarkTheme ? 'night' : 'day';
    const options = [
        {
            label: require(`../../../../media/images/alert-box/layout-bottom-${nightMode}.png`),
            value: 'above',
        },
        {
            label: require(`../../../../media/images/alert-box/layout-over-${nightMode}.png`),
            value: 'banner',
        },
        {
            label: require(`../../../../media/images/alert-box/layout-side-${nightMode}.png`),
            value: 'side',
        },
    ];
    const value = getDefined(p.value);
    return React.createElement(CardInput, Object.assign({}, p, { value: value, options: options }));
});
//# sourceMappingURL=LayoutInput.js.map