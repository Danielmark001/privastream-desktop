import React from 'react';
import { useWidget, WidgetModule } from './common/useWidget';
import { WidgetLayout } from './common/WidgetLayout';
import { $t } from '../../services/i18n';
import { metadata } from '../shared/inputs/metadata';
import FormFactory from 'components-react/shared/inputs/FormFactory';
export function EmoteWall() {
    const { isLoading, settings, meta, updateSetting } = useEmoteWall();
    return (React.createElement(WidgetLayout, null, !isLoading && React.createElement(FormFactory, { metadata: meta, values: settings, onChange: updateSetting })));
}
export class EmoteWallModule extends WidgetModule {
    get isComboRequired() {
        var _a;
        return (_a = this.settings) === null || _a === void 0 ? void 0 : _a.combo_required;
    }
    get meta() {
        var _a, _b;
        return {
            enabled: { type: 'switch', label: $t('Enabled') },
            emote_animation_duration: metadata.seconds({ label: $t('Duration'), min: 1000, max: 60000 }),
            emote_scale: metadata.slider({ label: $t('Emote Scale'), min: 1, max: 10 }),
            combo_required: {
                type: 'switch',
                label: $t('Combo Required'),
                children: {
                    combo_count: metadata.slider({
                        label: $t('Combo Count'),
                        min: 2,
                        max: 100,
                        displayed: (_a = this.settings) === null || _a === void 0 ? void 0 : _a.combo_required,
                    }),
                    combo_timeframe: metadata.seconds({
                        label: $t('Combo Timeframe'),
                        min: 1000,
                        max: 60000,
                        displayed: (_b = this.settings) === null || _b === void 0 ? void 0 : _b.combo_required,
                    }),
                },
            },
            ignore_duplicates: { type: 'switch', label: $t('Ignore Duplicates') },
        };
    }
}
function useEmoteWall() {
    return useWidget();
}
//# sourceMappingURL=EmoteWall.js.map