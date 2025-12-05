import React from 'react';
import { Tooltip } from 'antd';
import cx from 'classnames';
import { Services } from 'components-react/service-provider';
import { $t } from 'services/i18n';
import styles from './InstalledApps.m.less';
import { useVuex } from 'components-react/hooks';
export function InstalledApps() {
    const { PlatformAppsService, HighlighterService } = Services;
    const { installedApps, highlighterVersion } = useVuex(() => ({
        installedApps: PlatformAppsService.views.productionApps,
        highlighterVersion: HighlighterService.views.highlighterVersion,
    }));
    const enabledInstalledAppIds = installedApps.filter(app => app.enabled).map(app => app.id);
    function isEnabled(appId) {
        return enabledInstalledAppIds.includes(appId);
    }
    function reload(appId) {
        PlatformAppsService.actions.refreshApp(appId);
    }
    function toggleEnable(app) {
        if (isEnabled(app.id)) {
            PlatformAppsService.actions.setEnabled(app.id, false);
        }
        else {
            PlatformAppsService.actions.setEnabled(app.id, true);
        }
    }
    function noUnpackedVersionLoaded(appId) {
        return !PlatformAppsService.views.enabledApps.find(app => app.id === appId && app.unpacked);
    }
    return (React.createElement("div", { className: "section" },
        React.createElement("table", { className: styles.installedApps, style: { width: '100%' } },
            React.createElement("thead", null,
                React.createElement("tr", null,
                    React.createElement("th", null,
                        " ",
                        $t('Icon'),
                        " "),
                    React.createElement("th", null,
                        " ",
                        $t('Name'),
                        " "),
                    React.createElement("th", null,
                        " ",
                        $t('Vers'),
                        " "),
                    React.createElement("th", null))),
            React.createElement("tbody", null,
                installedApps.map(app => (React.createElement("tr", { key: app.id },
                    React.createElement("td", null,
                        ' ',
                        React.createElement("img", { src: app.icon, alt: "-", width: "50" }),
                        ' '),
                    React.createElement("td", null,
                        " ",
                        app.manifest.name,
                        " "),
                    React.createElement("td", null,
                        " ",
                        app.manifest.version,
                        " "),
                    React.createElement("td", { className: cx(styles.buttonContainer, 'button-container--right') },
                        isEnabled(app.id) && (React.createElement("button", { onClick: () => reload(app.id), className: "button button--trans" },
                            React.createElement("i", { className: "icon-reset" }),
                            $t('Reload'))),
                        noUnpackedVersionLoaded(app.id) && (React.createElement("button", { onClick: () => toggleEnable(app), className: cx('button', {
                                'button--soft-warning': isEnabled(app.id),
                                'button--default': !isEnabled(app.id),
                            }) }, isEnabled(app.id) ? $t('Disable') : $t('Enable'))),
                        !isEnabled(app.id) && !noUnpackedVersionLoaded(app.id) && (React.createElement(React.Fragment, null,
                            React.createElement("button", { disabled: true, className: "button button--default" }, $t('Unpacked vers loaded')),
                            React.createElement(Tooltip, { title: $t('You must unload unpacked version before enabling this app.'), placement: "left" },
                                React.createElement("i", { className: "icon-question" })))))))),
                highlighterVersion !== '' && (React.createElement("tr", { key: 'Ai Highlighter' },
                    React.createElement("td", null,
                        React.createElement("div", { className: styles.aiHighlighterThumbnail },
                            React.createElement("i", { style: { margin: 0, fontSize: '20px', color: 'black' }, className: "icon-highlighter" }))),
                    React.createElement("td", null,
                        " ",
                        'Streamlabs AI Highlighter',
                        " "),
                    React.createElement("td", null,
                        " ",
                        highlighterVersion,
                        " "),
                    React.createElement("td", { className: cx(styles.buttonContainer, 'button-container--right') },
                        React.createElement("button", { onClick: () => {
                                HighlighterService.uninstallAiHighlighter();
                            }, className: cx('button', {
                                'button--soft-warning': true,
                            }) }, $t('Uninstall')))))))));
}
//# sourceMappingURL=InstalledApps.js.map