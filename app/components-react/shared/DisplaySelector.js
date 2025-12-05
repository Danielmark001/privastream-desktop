import React, { useMemo } from 'react';
import { $t } from 'services/i18n';
import { RadioInput } from './inputs';
import { platformLabels } from 'services/platforms';
import { useGoLiveSettings } from 'components-react/windows/go-live/useGoLiveSettings';
export default function DisplaySelector(p) {
    var _a;
    const { display, canDualStream, updateCustomDestinationDisplayAndSaveSettings, updatePlatformDisplayAndSaveSettings, } = useGoLiveSettings().extend(module => ({
        get canDualStream() {
            if (!p.platform)
                return false;
            return module.getCanDualStream(p.platform);
        },
        get display() {
            var _a, _b;
            const defaultDisplay = p.platform
                ? (_a = module.settings.platforms[p.platform]) === null || _a === void 0 ? void 0 : _a.display
                : (_b = module.settings.customDestinations[p.index]) === null || _b === void 0 ? void 0 : _b.display;
            return defaultDisplay !== null && defaultDisplay !== void 0 ? defaultDisplay : 'horizontal';
        },
    }));
    const displays = useMemo(() => {
        const defaultDisplays = [
            {
                label: $t('Horizontal'),
                value: 'horizontal',
                icon: 'icon-desktop',
            },
            {
                label: $t('Vertical'),
                value: 'vertical',
                icon: 'icon-phone-case',
            },
        ];
        if (canDualStream) {
            const tooltip = (p === null || p === void 0 ? void 0 : p.platform)
                ? $t('Stream both horizontally and vertically to %{platform}', {
                    platform: platformLabels(p.platform),
                })
                : undefined;
            return [
                ...defaultDisplays,
                {
                    label: $t('Both'),
                    value: 'both',
                    icon: 'icon-dual-output',
                    tooltip,
                },
            ];
        }
        return defaultDisplays;
    }, [canDualStream]);
    const onChange = (val) => {
        if (p.platform) {
            updatePlatformDisplayAndSaveSettings(p.platform, val);
        }
        else {
            if (val === 'both') {
                throw new Error('Attempted to update custom display for dual stream, this is impossible');
            }
            updateCustomDestinationDisplayAndSaveSettings(p.index, val);
        }
    };
    const displayDict = useMemo(() => {
        return displays.reduce((acc, curr) => {
            acc[curr.value] = curr;
            return acc;
        }, {});
    }, [displays]);
    const name = `${p.platform || `destination${p.index}`}Display`;
    const value = ((_a = displayDict[display]) === null || _a === void 0 ? void 0 : _a.value) || 'horizontal';
    return (React.createElement(RadioInput, { nolabel: p === null || p === void 0 ? void 0 : p.nolabel, label: (p === null || p === void 0 ? void 0 : p.nolabel) ? undefined : p.title, name: name, value: value, defaultValue: "horizontal", options: displays, onChange: onChange, icons: true, className: p === null || p === void 0 ? void 0 : p.className, style: p === null || p === void 0 ? void 0 : p.style, direction: "horizontal", gapsize: 0 }));
}
//# sourceMappingURL=DisplaySelector.js.map