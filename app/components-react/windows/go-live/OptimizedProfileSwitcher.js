var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import React from 'react';
import { useGoLiveSettings } from './useGoLiveSettings';
import { $t } from '../../../services/i18n';
import { CheckboxInput } from '../../shared/inputs';
import InputWrapper from '../../shared/inputs/InputWrapper';
import { inject, injectQuery } from 'slap';
import { VideoEncodingOptimizationService } from '../../../app-services';
export default function OptimizedProfileSwitcher() {
    const { game, enabled, setEnabled, label, tooltip, optimizedProfileQuery, } = useGoLiveSettings().extend(settings => {
        const optimizationService = inject(VideoEncodingOptimizationService);
        function fetchProfile(game) {
            return __awaiter(this, void 0, void 0, function* () {
                const optimizedProfile = yield optimizationService.actions.return.fetchOptimizedProfile(game);
                settings.updateSettings({ optimizedProfile });
            });
        }
        const optimizedProfileQuery = injectQuery(fetchProfile, () => settings.game);
        return {
            optimizedProfileQuery,
            get enabled() {
                return optimizationService.state.useOptimizedProfile;
            },
            setEnabled(enabled) {
                optimizationService.actions.useOptimizedProfile(enabled);
            },
            tooltip: $t('Optimized encoding provides better quality and/or lower cpu/gpu usage. Depending on the game, ' +
                'resolution may be changed for a better quality of experience'),
            get label() {
                var _a, _b;
                return ((_a = settings.state.optimizedProfile) === null || _a === void 0 ? void 0 : _a.game) &&
                    ((_b = settings.state.optimizedProfile) === null || _b === void 0 ? void 0 : _b.game) !== 'DEFAULT'
                    ? $t('Use optimized encoder settings for %{game}', { game })
                    : $t('Use optimized encoder settings');
            },
        };
    });
    return (React.createElement(InputWrapper, null,
        optimizedProfileQuery.isLoading && $t('Checking optimized setting for %{game}', { game }),
        !optimizedProfileQuery.isLoading && (React.createElement(CheckboxInput, { value: enabled, onChange: setEnabled, label: label, tooltip: tooltip }))));
}
//# sourceMappingURL=OptimizedProfileSwitcher.js.map