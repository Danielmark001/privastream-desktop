import React from 'react';
import { shell } from '@electron/remote';
import cx from 'classnames';
import { ModalLayout } from 'components-react/shared/ModalLayout';
import styles from './MarketingModal.m.less';
import { $t } from 'services/i18n';
import { Services } from 'components-react/service-provider';
import { useRealmObject } from 'components-react/hooks/realm';
export default function MarketingModal() {
    const { AnnouncementsService } = Services;
    const productUpdates = useRealmObject(AnnouncementsService.currentAnnouncements).productUpdates;
    function handleButton(url) {
        shell.openExternal(url);
    }
    return (React.createElement(ModalLayout, null,
        React.createElement("h2", null, $t('New Updates to Streamlabs Desktop')),
        React.createElement("div", { className: styles.separator }),
        React.createElement("div", { className: cx(styles.cell, styles.main) },
            React.createElement("div", { className: styles.imageContainer },
                React.createElement("img", { className: styles.image, src: productUpdates[0].thumbnail })),
            React.createElement("div", { className: styles.info },
                React.createElement("h3", null, productUpdates[0].header),
                React.createElement("p", null, productUpdates[0].subHeader),
                React.createElement("button", { className: "button button--action", onClick: () => handleButton(productUpdates[0].link) }, productUpdates[0].linkTitle))),
        React.createElement("div", { className: styles.separator }),
        React.createElement("div", { className: styles.subUpdates },
            productUpdates[1] && (React.createElement("div", { className: styles.cell },
                React.createElement("div", { className: styles.imageContainer },
                    React.createElement("img", { className: styles.image, src: productUpdates[1].thumbnail })),
                React.createElement("div", { className: styles.info },
                    React.createElement("h3", null, productUpdates[1].header),
                    React.createElement("p", null, productUpdates[1].subHeader),
                    React.createElement("button", { className: "button button--default", onClick: () => handleButton(productUpdates[1].link) }, productUpdates[1].linkTitle)))),
            productUpdates[2] && (React.createElement("div", { className: styles.cell },
                React.createElement("div", { className: styles.imageContainer },
                    React.createElement("img", { className: styles.image, src: productUpdates[2].thumbnail })),
                React.createElement("div", { className: styles.info },
                    React.createElement("h3", null, productUpdates[2].header),
                    React.createElement("p", null, productUpdates[2].subHeader),
                    React.createElement("button", { className: "button button--default", onClick: () => handleButton(productUpdates[2].link) }, productUpdates[2].linkTitle)))))));
}
//# sourceMappingURL=MarketingModal.js.map