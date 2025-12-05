import React, { useMemo } from 'react';
import { Divider } from 'antd';
import { ListInput } from 'components-react/shared/inputs';
import Form from 'components-react/shared/inputs/Form';
import { getPlatformService } from 'services/platforms';
import PlatformLogo from 'components-react/shared/PlatformLogo';
import Tooltip from 'components-react/shared/Tooltip';
import { $t } from 'services/i18n';
import { Services } from 'components-react/service-provider';
import UltraIcon from 'components-react/shared/UltraIcon';
export default function PrimaryChatSwitcher({ enabledPlatforms, primaryChat, onSetPrimaryChat, style = {}, layout = 'vertical', className = undefined, suffixIcon = undefined, tooltip = undefined, size = undefined, logo = true, border = true, disabled = false, }) {
    const primaryChatOptions = useMemo(() => enabledPlatforms.map(platform => {
        const service = getPlatformService(platform);
        return {
            label: service.displayName,
            value: platform,
        };
    }), [enabledPlatforms]);
    return (React.createElement("div", { "data-name": "primaryChat", style: style, className: className },
        border && React.createElement(Divider, { style: { marginBottom: '8px' } }),
        React.createElement(Form, { layout: layout },
            React.createElement(ListInput, { name: "primaryChat", label: tooltip ? (React.createElement("div", { style: { display: 'flex', alignItems: 'center' } },
                    `${$t('Primary Chat')}:`,
                    !Services.UserService.views.isPrime &&
                        !Services.DualOutputService.views.dualOutputMode ? (React.createElement(UltraIcon, { type: "badge", style: { marginLeft: '10px' } })) : (React.createElement(Tooltip, { title: tooltip, placement: "top", lightShadow: true },
                        React.createElement("i", { className: "icon-information", style: { marginLeft: '10px' } }))))) : (`${$t('Primary Chat')}:`), options: primaryChatOptions, labelRender: opt => renderPrimaryChatOption(opt, logo), optionRender: opt => renderPrimaryChatOption(opt, logo), value: primaryChat, onChange: onSetPrimaryChat, suffixIcon: suffixIcon, size: size, disabled: disabled, dropdownMatchSelectWidth: false }))));
}
const renderPrimaryChatOption = (option, logo) => {
    return (React.createElement("div", { style: {
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: '8px',
        } },
        logo && React.createElement(PlatformLogo, { platform: option.value, size: 16 }),
        React.createElement("div", null, option.label)));
};
//# sourceMappingURL=PrimaryChatSwitcher.js.map