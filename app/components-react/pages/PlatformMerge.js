var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import React, { useState } from 'react';
import { EAuthProcessState } from 'services/user';
import { $t } from 'services/i18n';
import { EPlatformCallResult, externalAuthPlatforms, getPlatformService, } from '../../services/platforms';
import { Services } from 'components-react/service-provider';
import { useVuex } from 'components-react/hooks';
import { alertAsync } from 'components-react/modals';
export default function PlatformMerge(p) {
    var _a;
    const { UserService, NavigationService, StreamSettingsService, SceneCollectionsService, WindowsService, } = Services;
    const [showOverlay, setShowOverlay] = useState(false);
    const platform = (_a = p.params) === null || _a === void 0 ? void 0 : _a.platform;
    if (!platform)
        throw new Error('Platform should be provided for PlatformMerge');
    const { loading, authInProgress, platformName } = useVuex(() => ({
        loading: UserService.state.authProcessState === EAuthProcessState.Loading,
        authInProgress: UserService.state.authProcessState === EAuthProcessState.InProgress,
        platformName: getPlatformService(platform).displayName,
    }));
    function mergePlatform() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!platform)
                return;
            const mode = externalAuthPlatforms.includes(platform) ? 'external' : 'internal';
            yield UserService.actions.return
                .startAuth(platform, mode, true)
                .then(res => {
                if (res === EPlatformCallResult.Error) {
                    WindowsService.actions.setWindowOnTop();
                    alertAsync($t('This account is already linked to another Streamlabs Account. Please use a different account.')).then(() => {
                        NavigationService.actions.navigate('Studio');
                    });
                    return;
                }
                if (p.params.highlighter) {
                    NavigationService.actions.navigate('Highlighter');
                    return;
                }
                StreamSettingsService.actions.setSettings({ protectedModeEnabled: true });
                if (p.params.overlayUrl) {
                    setShowOverlay(true);
                }
                else {
                    NavigationService.actions.navigate('Studio');
                }
            })
                .catch(e => {
                NavigationService.actions.navigate('Studio');
                WindowsService.actions.setWindowOnTop();
            });
        });
    }
    function installOverlay() {
        return __awaiter(this, void 0, void 0, function* () {
            if (p.params.overlayUrl && p.params.overlayName) {
                yield SceneCollectionsService.actions.return.installOverlay(p.params.overlayUrl, p.params.overlayName);
            }
            NavigationService.actions.navigate('Studio');
        });
    }
    function LoginStep() {
        return (React.createElement(React.Fragment, null,
            $t('Connect %{platformName} to Streamlabs.', { platformName }),
            React.createElement("br", null),
            $t('All of your scenes, sources, and settings will be preserved.'),
            React.createElement("button", { style: { marginTop: '24px' }, className: `button button--${platform}`, disabled: loading, onClick: mergePlatform },
                loading && React.createElement("i", { className: "fas fa-spinner fa-spin" }),
                $t('Connect'))));
    }
    function OverlayStep() {
        return (React.createElement(React.Fragment, null,
            React.createElement("b", null, $t('Step 3:')),
            " ",
            $t('Install Your Theme'),
            React.createElement("br", null),
            React.createElement("button", { style: { marginTop: '24px' }, className: "button button--action", disabled: loading || authInProgress, onClick: installOverlay },
                React.createElement("i", { className: loading ? 'fas fa-spinner fa-spin' : 'icon-themes' }),
                $t('Install %{overlayName}', { overlayName: p.params.overlayName }))));
    }
    return (React.createElement("div", { className: p.className, style: { display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' } },
        React.createElement("div", { style: { width: '400px' } },
            React.createElement("h1", null, $t('Connect %{platformName}', { platformName })),
            showOverlay ? React.createElement(OverlayStep, null) : React.createElement(LoginStep, null))));
}
//# sourceMappingURL=PlatformMerge.js.map