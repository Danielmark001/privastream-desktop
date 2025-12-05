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
import styles from './GoLive.m.less';
import { WindowsService } from 'app-services';
import { ModalLayout } from '../../shared/ModalLayout';
import { Button, message } from 'antd';
import { Services } from '../../service-provider';
import GoLiveSettings from './GoLiveSettings';
import { $t } from '../../../services/i18n';
import GoLiveChecklist from './GoLiveChecklist';
import Form from '../../shared/inputs/Form';
import Animation from 'rc-animate';
import { useGoLiveSettings, useGoLiveSettingsRoot } from './useGoLiveSettings';
import { inject } from 'slap';
import RecordingSwitcher from './RecordingSwitcher';
import { promptAction } from 'components-react/modals';
export default function GoLiveWindow() {
    const { lifecycle, form } = useGoLiveSettingsRoot().extend(module => ({
        destroy() {
            if (module.checklist.startVideoTransmission !== 'done') {
                Services.StreamingService.actions.resetInfo();
            }
        },
    }));
    const shouldShowSettings = ['empty', 'prepopulate', 'waitForNewSettings'].includes(lifecycle);
    const shouldShowChecklist = ['runChecklist', 'live'].includes(lifecycle);
    return (React.createElement(ModalLayout, { footer: React.createElement(ModalFooter, null), className: styles.dualOutputGoLive },
        React.createElement(Form, { form: form, style: { position: 'relative', height: '100%' }, layout: "horizontal", name: "editStreamForm" },
            React.createElement(Animation, { transitionName: shouldShowChecklist ? 'slideright' : '' },
                shouldShowSettings && React.createElement(GoLiveSettings, { key: 'settings' }),
                shouldShowChecklist && React.createElement(GoLiveChecklist, { className: styles.page, key: 'checklist' })))));
}
function ModalFooter() {
    const { error, lifecycle, checklist, goLive, close, goBackToSettings, getCanStreamDualOutput, isLoading, isDualOutputMode, isPrime, } = useGoLiveSettings().extend(module => ({
        windowsService: inject(WindowsService),
        close() {
            this.windowsService.actions.closeChildWindow();
        },
        goBackToSettings() {
            module.prepopulate();
        },
    }));
    const [isFetchingStreamStatus, setIsFetchingStreamStatus] = useState(false);
    const shouldShowConfirm = ['prepopulate', 'waitForNewSettings'].includes(lifecycle);
    const shouldShowGoBackButton = lifecycle === 'runChecklist' && error && checklist.startVideoTransmission !== 'done';
    function handleGoLive() {
        return __awaiter(this, void 0, void 0, function* () {
            if (isPrime) {
                try {
                    setIsFetchingStreamStatus(true);
                    const isLive = yield Services.RestreamService.checkIsLive();
                    setIsFetchingStreamStatus(false);
                    const { streamShiftForceGoLive } = Services.RestreamService.state;
                    if (isLive && !streamShiftForceGoLive) {
                        let shouldForceGoLive = false;
                        yield promptAction({
                            title: $t('Another stream detected'),
                            message: $t('A stream on another device has been detected. Would you like to switch your stream to Streamlabs Desktop? If you do not wish to continue this stream, please end it from the current streaming source. If you\'re sure you\'re not live and it has been incorrectly detected, choose "Force Start" below.'),
                            btnText: $t('Switch to Streamlabs Desktop'),
                            fn: () => {
                                goLive();
                                close();
                            },
                            cancelBtnText: $t('Cancel'),
                            cancelBtnPosition: 'left',
                            secondaryActionText: $t('Force Start'),
                            secondaryActionFn: () => __awaiter(this, void 0, void 0, function* () {
                                Services.RestreamService.actions.forceStreamShiftGoLive(true);
                                shouldForceGoLive = true;
                            }),
                        });
                        if (!shouldForceGoLive)
                            return;
                    }
                }
                catch (e) {
                    console.error('Error checking stream switcher status:', e);
                    setIsFetchingStreamStatus(false);
                }
            }
            if (isDualOutputMode && !getCanStreamDualOutput()) {
                message.error({
                    key: 'dual-output-error',
                    className: styles.errorAlert,
                    content: (React.createElement("div", { className: styles.alertContent },
                        React.createElement("div", { style: { marginRight: '10px' } }, $t('To use Dual Output you must stream to one horizontal and one vertical platform.')),
                        React.createElement("i", { className: "icon-close" }))),
                    onClick: () => message.destroy('dual-output-error'),
                });
                return;
            }
            goLive();
        });
    }
    return (React.createElement(Form, { layout: 'inline' },
        !isDualOutputMode && shouldShowConfirm && React.createElement(RecordingSwitcher, null),
        React.createElement(Button, { onClick: close }, $t('Close')),
        shouldShowGoBackButton && (React.createElement(Button, { onClick: goBackToSettings }, $t('Go back to settings'))),
        shouldShowConfirm && (React.createElement(Button, { "data-name": "confirmGoLiveBtn", type: "primary", onClick: handleGoLive, disabled: isLoading || !!error, className: styles.confirmBtn }, isFetchingStreamStatus ? (React.createElement("i", { className: "fa fa-spinner fa-pulse" })) : ($t('Confirm & Go Live'))))));
}
//# sourceMappingURL=GoLiveWindow.js.map