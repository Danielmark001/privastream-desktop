import styles from './GoLive.m.less';
import { ModalLayout } from '../../shared/ModalLayout';
import { Button } from 'antd';
import { useOnCreate } from 'slap';
import { Services } from '../../service-provider';
import React from 'react';
import { $t } from '../../../services/i18n';
import GoLiveChecklist from './GoLiveChecklist';
import Form from '../../shared/inputs/Form';
import Animation from 'rc-animate';
import { useGoLiveSettingsRoot } from './useGoLiveSettings';
import PlatformSettings from './PlatformSettings';
import Scrollable from '../../shared/Scrollable';
import Spinner from '../../shared/Spinner';
import GoLiveError from './GoLiveError';
import PrimaryChatSwitcher from './PrimaryChatSwitcher';
export default function EditStreamWindow() {
    const { StreamingService, WindowsService } = Services;
    const { error, lifecycle, updateStream, prepopulate, isLoading, form, enabledPlatforms, hasMultiplePlatforms, primaryChat, setPrimaryChat, } = useGoLiveSettingsRoot({ isUpdateMode: true });
    const shouldShowChecklist = lifecycle === 'runChecklist';
    const shouldShowSettings = !shouldShowChecklist;
    const shouldShowUpdateButton = lifecycle !== 'runChecklist';
    const shouldShowGoBackButton = !shouldShowUpdateButton && error;
    useOnCreate(() => {
        StreamingService.actions.resetError();
        prepopulate();
    });
    function close() {
        WindowsService.actions.closeChildWindow();
    }
    function goBackToSettings() {
        StreamingService.actions.showEditStream();
    }
    function renderFooter() {
        return (React.createElement(Form, { layout: 'inline' },
            React.createElement(Button, { onClick: close }, $t('Close')),
            shouldShowGoBackButton && (React.createElement(Button, { onClick: goBackToSettings }, $t('Go back to settings'))),
            shouldShowUpdateButton && (React.createElement(Button, { type: "primary", onClick: updateStream, disabled: isLoading }, $t('Update')))));
    }
    const shouldShowPrimaryChatSwitcher = hasMultiplePlatforms;
    return (React.createElement(ModalLayout, { footer: renderFooter() },
        React.createElement(Form, { form: form, style: { position: 'relative', height: '100%' }, layout: "horizontal", name: "editStreamForm" },
            React.createElement(Spinner, { visible: isLoading }),
            React.createElement(Animation, { transitionName: "fade" },
                shouldShowSettings && (React.createElement(Scrollable, { key: 'settings', style: { height: '100%' }, snapToWindowEdge: true },
                    React.createElement(GoLiveError, null),
                    React.createElement(PlatformSettings, null),
                    shouldShowPrimaryChatSwitcher && (React.createElement(PrimaryChatSwitcher, { layout: "horizontal", enabledPlatforms: enabledPlatforms, primaryChat: primaryChat, onSetPrimaryChat: setPrimaryChat })))),
                shouldShowChecklist && React.createElement(GoLiveChecklist, { className: styles.page, key: 'checklist' })))));
}
//# sourceMappingURL=EditStreamWindow.js.map