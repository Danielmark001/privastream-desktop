import React from 'react';
import { $t } from 'services/i18n';
import styles from './UltraComparison.m.less';
import cx from 'classnames';
import { Services } from 'components-react/service-provider';
import UltraIcon from 'components-react/shared/UltraIcon';
export function UltraComparison(p) {
    const { MagicLinkService } = Services;
    const shouldDisplayPrices = false;
    const featureData = p.featureData || {
        standard: [
            { icon: 'icon-broadcast', text: $t('Go live to one platform') },
            { icon: 'icon-balance', text: $t('Tipping (no Streamlabs fee)') },
            { icon: 'icon-widgets', text: $t('Alerts & other Widgets') },
            { icon: 'icon-record', text: $t('Recording') },
            { icon: 'icon-smart-record', text: $t('Selective Recording') },
            { icon: 'icon-editor-3', text: $t('Game Overlay') },
            { icon: 'icon-dual-output', text: $t('Dual Output (1 platform + TikTok)') },
            { text: $t('And many more free features') },
        ],
        ultra: [
            { icon: 'icon-streamlabs', text: $t('All free features') },
            { icon: 'icon-multistream', text: $t('Multistream to multiple platforms') },
            { icon: 'icon-design', text: $t('Premium Stream Overlays') },
            { icon: 'icon-themes', text: $t('Alert Box & Widget Themes') },
            { icon: 'icon-store', text: $t('Access all App Store Apps') },
            { icon: 'icon-dual-output', text: $t('Dual Output (3+ destinations)') },
            { icon: 'icon-team', text: $t('Collab Cam up to 11 guests') },
            { icon: 'icon-ultra', text: $t('Pro tier across the rest of the suite') },
            { text: $t('And many more Ultra features') },
        ],
    };
    function linkToPrime() {
        MagicLinkService.actions.linkToPrime(p.refl);
    }
    return (React.createElement("div", { style: {
            display: 'flex',
            justifyContent: 'center',
            fontSize: p.condensed ? '10px' : undefined,
        } },
        React.createElement("div", { className: cx(styles.cardContainer, { [styles.condensed]: p.condensed }), onClick: p.onSkip },
            React.createElement("div", { className: styles.header },
                React.createElement("h1", null,
                    React.createElement("i", { className: "icon-streamlabs" }),
                    $t('Free')),
                React.createElement("div", { className: styles.subheader },
                    React.createElement("span", null, $t('Everything you need to go live.')),
                    React.createElement("span", null, $t('Always and forever free'))),
                React.createElement("div", { className: styles.button, "data-testid": "choose-free-plan-btn" }, $t('Choose Free')),
                React.createElement("div", { className: styles.features }, featureData.standard.map(data => (React.createElement("div", { key: data.text, className: styles.row },
                    data.icon && React.createElement("i", { className: data.icon }),
                    React.createElement("span", null, data.text))))))),
        React.createElement("div", { className: cx(styles.cardContainer, styles.primeCardContainer, {
                [styles.condensed]: p.condensed,
            }), onClick: linkToPrime },
            React.createElement("div", { className: styles.primeBacking }),
            React.createElement("div", { className: styles.header },
                React.createElement("h1", null,
                    React.createElement(UltraIcon, { type: "night", style: { marginRight: '5px' } }),
                    "Streamlabs Ultra"),
                React.createElement("div", { className: styles.subheader },
                    React.createElement("span", null, $t('Premium features for your stream.')),
                    shouldDisplayPrices ? (React.createElement("span", null, $t('%{monthlyPrice}/mo or %{yearlyPrice}/year', {
                        monthlyPrice: '$19',
                        yearlyPrice: '$149',
                    }))) : (React.createElement("span", { style: { marginBottom: '18px' } }))),
                React.createElement("div", { className: cx(styles.button, styles.primeButton), "data-testid": "choose-ultra-plan-btn" }, $t('Choose Ultra'))),
            React.createElement("div", { className: styles.features }, featureData.ultra.map(data => (React.createElement("div", { className: styles.row, key: data.text },
                data.icon && React.createElement("i", { className: data.icon }),
                React.createElement("span", null, data.text))))))));
}
//# sourceMappingURL=UltraComparison.js.map