import React from 'react';
import { Button } from 'antd';
import { ObsSettingsSection } from './ObsSettings';
import { $t } from '../../../services/i18n';
import { Services } from '../../service-provider';
import { SwitchInput, TextInput } from '../../shared/inputs';
import styles from './Mobile.m.less';
import { useRealmObject } from 'components-react/hooks/realm';
import { useVuex } from 'components-react/hooks';
import UltraIcon from 'components-react/shared/UltraIcon';
import { $i } from 'services/utils';
import ButtonHighlighted from 'components-react/shared/ButtonHighlighted';
import UltraBox from 'components-react/shared/UltraBox';
export function MobileSettings() {
    const { RemoteControlService, UserService, TcpServerService } = Services;
    const connectedDevices = useRealmObject(RemoteControlService.connectedDevices).devices;
    const enabled = useRealmObject(RemoteControlService.state).enabled;
    const { isLoggedIn, websocketsEnabled, token, port } = useVuex(() => ({
        isLoggedIn: UserService.views.isLoggedIn,
        websocketsEnabled: TcpServerService.state.websockets.enabled,
        token: TcpServerService.state.token,
        port: TcpServerService.state.websockets.port,
    }));
    function handleToggle() {
        if (enabled) {
            RemoteControlService.actions.disconnect();
        }
        else {
            RemoteControlService.actions.createStreamlabsRemoteConnection();
        }
    }
    function handleSocket() {
        if (websocketsEnabled) {
            TcpServerService.actions.disableWebsocketsRemoteConnections();
        }
        else {
            TcpServerService.actions.enableWebsoketsRemoteConnections();
        }
    }
    function getIPAddresses() {
        return TcpServerService.getIPAddresses()
            .filter(address => !address.internal)
            .map(address => address.address)
            .join(', ');
    }
    function generateToken() {
        TcpServerService.actions.generateToken();
    }
    function disconnectDevice(device) {
        RemoteControlService.actions.disconnectDevice(device.socketId);
    }
    return (React.createElement(React.Fragment, null,
        React.createElement("h2", null, $t('Mobile Streaming')),
        React.createElement(ObsSettingsSection, null,
            React.createElement("div", { style: { marginBottom: '8px' } }, $t('Stream your phone camera or mobile game on the go with Streamlabs Mobile App.')),
            React.createElement("div", { style: { display: 'flex', justifyContent: 'space-around' } }, ['ios', 'android'].map(os => (React.createElement("div", { style: { display: 'flex', flexDirection: 'column', alignItems: 'center' }, key: os },
                React.createElement("img", { className: styles.qrCode, src: $i(`images/mobile/qr_${os}.png`) }),
                React.createElement("img", { className: styles.badge, src: $i(`images/mobile/badge_${os}.png`) }))))),
            React.createElement(UltraInsert, null)),
        React.createElement("h2", null, $t('Remote Controller')),
        React.createElement(ObsSettingsSection, null,
            React.createElement("div", null,
                $t('The free Streamlabs Controller app allows you to control Streamlabs Desktop from your iOS or Android device. You must be logged in to use this feature.'),
                React.createElement("br", null),
                React.createElement("br", null)),
            React.createElement("div", null,
                isLoggedIn && (React.createElement(SwitchInput, { label: $t('Allow Controller app connections'), onInput: handleToggle, value: enabled, layout: "horizontal" })),
                enabled && (React.createElement("div", { style: { paddingBottom: 8 } },
                    React.createElement("span", null, $t('Connected Devices')),
                    connectedDevices.length < 1 && (React.createElement("span", { className: styles.whisper }, $t('No devices connected'))),
                    connectedDevices.map(device => (React.createElement("div", { className: styles.device },
                        React.createElement("span", null, device.deviceName),
                        React.createElement("span", { className: styles.disconnect, onClick: () => disconnectDevice(device) }, $t('Disconnect'))))))))),
        React.createElement("h2", null, $t('Third Party Connections')),
        React.createElement(ObsSettingsSection, null,
            React.createElement("div", null,
                $t('Some third party applications connect to Streamlabs Desktop via websockets connection. Toggle this to allow such connections and display connection info.'),
                React.createElement("br", null),
                React.createElement("span", { style: { color: 'var(--info)', display: 'inline' } },
                    React.createElement("i", { className: "icon-error" }),
                    "\u00A0",
                    $t('Warning: Displaying this portion on stream may leak sensitive information.')),
                React.createElement("br", null),
                React.createElement("br", null)),
            React.createElement("div", null,
                React.createElement(SwitchInput, { label: $t('Allow third party connections'), onInput: handleSocket, value: websocketsEnabled, layout: "horizontal" }),
                websocketsEnabled && (React.createElement("div", { className: styles.websocketsForm },
                    React.createElement(TextInput, { label: $t('IP Addresses'), value: getIPAddresses(), readOnly: true }),
                    React.createElement(TextInput, { label: $t('Port'), value: port.toString(10), readOnly: true }),
                    React.createElement(TextInput, { label: $t('API Token'), value: token, readOnly: true, addonAfter: React.createElement(Button, { onClick: generateToken }, $t('Generate new')) })))))));
}
function UltraInsert() {
    const { UserService, MagicLinkService } = Services;
    const { isPrime } = useVuex(() => ({
        isPrime: UserService.views.isPrime,
    }));
    function Content() {
        return (React.createElement("div", { style: { display: 'flex' } },
            React.createElement(UltraIcon, { style: { width: '20px', height: '20px', alignSelf: 'flex-start' } }),
            React.createElement("div", { style: { margin: '0 8px', display: 'flex', flexDirection: 'column' } },
                React.createElement("h2", null, $t('Go Ultra and do more!')),
                React.createElement("ul", { style: { paddingInlineStart: 0 } },
                    React.createElement("li", null, $t('Enjoy your Ultra membership benefits on mobile including Multistream, Disconnect protection and premium themes.')),
                    React.createElement("li", null, $t('Switch between your Desktop and Mobile stream without going offline with Stream Shift.'))),
                !isPrime && (React.createElement(ButtonHighlighted, { style: { alignSelf: 'center', width: '120px' }, text: $t('Get Ultra'), onClick: () => MagicLinkService.actions.linkToPrime('mobile-settings') })))));
    }
    return isPrime ? (React.createElement("div", { className: styles.ultraBox },
        React.createElement(Content, null))) : (React.createElement(UltraBox, { className: styles.ultraBox },
        React.createElement(Content, null)));
}
//# sourceMappingURL=Mobile.js.map