import React from 'react';
import cx from 'classnames';
import { $t } from 'services/i18n';
import { SwitchInput } from 'components-react/shared/inputs';
import styles from './WelcomeToPrime.m.less';
import { Services } from 'components-react/service-provider';
import { useRealmObject } from 'components-react/hooks/realm';
export default function WelcomeToPrime() {
    const { CustomizationService } = Services;
    const theme = useRealmObject(CustomizationService.state).theme;
    const panelData = [
        {
            title: $t('Overlay, Widget, and Site Themes'),
            icon: 'icon-themes',
            description: $t("Fully customize your stream and your website to represent your brand; or pick from thousands of our pre-made overlays. Either way, your stream will look amazing and it's all included with Ultra."),
            link: 'BrowseOverlays',
            button: $t('View Themes'),
            img: 'prime-themes.png',
        },
        {
            title: $t('Every App is FREE'),
            icon: 'icon-store',
            description: $t("We've curated a list of diverse and feature rich applications to give you more control, automation, better analytics, and new ways to interact with your audience."),
            link: 'PlatformAppStore',
            button: $t('Browse Apps'),
            img: 'prime-apps.png',
        },
    ];
    function toggleTheme() {
        if (theme === 'prime-dark') {
            return CustomizationService.actions.setTheme('night-theme');
        }
        if (theme === 'night-theme') {
            return CustomizationService.actions.setTheme('prime-dark');
        }
        if (theme === 'prime-light') {
            return CustomizationService.actions.setTheme('day-theme');
        }
        if (theme === 'day-theme') {
            return CustomizationService.actions.setTheme('prime-light');
        }
    }
    return (React.createElement("div", { className: styles.container },
        React.createElement("h1", { className: styles.title }, $t('Welcome to Ultra!')),
        React.createElement("p", null, $t("We've picked out a few Ultra benefits to get you started:")),
        React.createElement("div", { className: styles.panelContainer }, panelData.map(panel => (React.createElement(Panel, { panel: panel, key: panel.link })))),
        React.createElement("div", { className: styles.themeToggle },
            $t("We've added a new UI theme exclusive to Ultra members:"),
            React.createElement("span", null, $t('Classic Theme')),
            React.createElement(SwitchInput, { value: /prime/.test(theme), onInput: toggleTheme }),
            React.createElement("span", null, $t('Ultra Theme')))));
}
function Panel(p) {
    const { NavigationService, WindowsService } = Services;
    function navigate(link) {
        NavigationService.actions.navigate(link);
        WindowsService.actions.closeChildWindow();
    }
    return (React.createElement("div", { className: styles.panel },
        React.createElement("h2", { className: styles.subtitle },
            React.createElement("i", { className: cx(p.panel.icon, styles.icon) }),
            p.panel.title),
        React.createElement("p", null, p.panel.description),
        React.createElement("img", { src: require(`../../../media/images/${p.panel.img}`) }),
        React.createElement("button", { className: "button button--action", onClick: () => navigate(p.panel.link) }, p.panel.button)));
}
//# sourceMappingURL=WelcomeToPrime.js.map