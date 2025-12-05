var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { Button } from 'antd';
import React from 'react';
import { $t } from 'services/i18n';
import { EPlatformCallResult, externalAuthPlatforms } from 'services/platforms';
import styles from './ConnectButton.m.less';
import cx from 'classnames';
import { Services } from 'components-react/service-provider';
import { alertAsync } from 'components-react/modals';
import { EAuthProcessState } from 'services/user';
import { useVuex } from 'components-react/hooks';
export default function ConnectButton(p) {
    const { UserService, InstagramService } = Services;
    const { isLoading, authInProgress } = useVuex(() => ({
        isLoading: UserService.state.authProcessState === EAuthProcessState.Loading,
        authInProgress: UserService.state.authProcessState === EAuthProcessState.InProgress,
        instagramSettings: InstagramService.state.settings,
    }));
    function platformMergeInline(platform) {
        return __awaiter(this, void 0, void 0, function* () {
            const mode = externalAuthPlatforms.includes(platform) ? 'external' : 'internal';
            yield Services.UserService.actions.return.startAuth(platform, mode, true).then(res => {
                Services.WindowsService.actions.setWindowOnTop('child');
                if (res === EPlatformCallResult.Error) {
                    alertAsync($t('This account is already linked to another Streamlabs Account. Please use a different account.'));
                    return;
                }
                Services.StreamSettingsService.actions.setSettings({ protectedModeEnabled: true });
            });
        });
    }
    function instagramConnect() {
        return __awaiter(this, void 0, void 0, function* () {
            yield UserService.actions.return.startAuth('instagram', 'internal', true);
        });
    }
    return (React.createElement(Button, { onClick: e => {
            e.stopPropagation();
            if (p.platform === 'instagram') {
                instagramConnect();
            }
            else {
                platformMergeInline(p.platform);
            }
        }, className: cx(p === null || p === void 0 ? void 0 : p.className, { [styles.tiktokConnectBtn]: p.platform === 'tiktok' }), disabled: isLoading || authInProgress, style: {
            backgroundColor: `var(--${p.platform})`,
            borderColor: 'transparent',
            color: ['trovo', 'instagram', 'kick'].includes(p.platform) ? 'black' : 'inherit',
        } }, $t('Connect')));
}
//# sourceMappingURL=ConnectButton.js.map