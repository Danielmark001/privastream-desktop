import { useModule } from 'slap';
import PlatformLogo from 'components-react/shared/PlatformLogo';
import React, { useState } from 'react';
import { $t } from 'services/i18n';
import styles from './Connect.m.less';
import * as remote from '@electron/remote';
import { TextInput } from 'components-react/shared/inputs/TextInput';
import { OnboardingModule } from './Onboarding';
import { Services } from 'components-react/service-provider';
import Form from 'components-react/shared/inputs/Form';
export function ExtraPlatformConnect(p) {
    const { selectedExtraPlatform, setExtraPlatform } = p;
    const { next } = useModule(OnboardingModule);
    const [key, setKey] = useState('');
    if (!selectedExtraPlatform)
        return React.createElement("div", null);
    const platformDefinition = {
        dlive: {
            name: 'DLive',
            ingestUrl: 'rtmp://stream.dlive.tv/live',
            helpUrl: 'https://go.dlive.tv/stream',
            icon: 'dlive-white.png',
        },
        nimotv: {
            name: 'Nimo.TV',
            ingestUrl: 'rtmp://txpush.rtmp.nimo.tv/live/',
            helpUrl: 'https://article.nimo.tv/p/1033/streamlabsprotocol.html',
            icon: 'nimo-logo.png',
        },
    }[selectedExtraPlatform];
    function openHelp() {
        remote.shell.openExternal(platformDefinition.helpUrl);
    }
    function onFinish() {
        Services.StreamSettingsService.setSettings({
            key,
            streamType: 'rtmp_custom',
            server: platformDefinition.ingestUrl,
        });
        next();
    }
    return (React.createElement("div", { style: { height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' } },
        React.createElement("div", { className: styles.container, style: { height: '50%' } },
            React.createElement("p", null,
                React.createElement(PlatformLogo, { platform: selectedExtraPlatform })),
            React.createElement("h1", null, $t('Connect to %{platform}', { platform: platformDefinition.name })),
            React.createElement("p", null,
                $t('Enter your stream key.'),
                "\u00A0",
                React.createElement("span", { className: styles['link-button'], onClick: openHelp }, $t('View help docs'))),
            React.createElement("div", { className: "section" },
                React.createElement(Form, null,
                    React.createElement(TextInput, { label: $t('Stream Key'), value: key, onChange: setKey, isPassword: true, uncontrolled: false }))),
            React.createElement("p", null,
                React.createElement("button", { className: "button button--action", onClick: onFinish, disabled: !key.trim().length }, $t('Finish'))),
            React.createElement("p", null,
                React.createElement("a", { className: styles['link-button'], onClick: () => next() }, $t('Skip')),
                React.createElement("span", { style: { display: 'inline-block', width: 32 } }, " "),
                React.createElement("a", { className: styles['link-button'], onClick: () => setExtraPlatform(undefined) }, $t('Back'))))));
}
//# sourceMappingURL=ExtraPlatformConnect.js.map