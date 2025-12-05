import React from 'react';
import cx from 'classnames';
import { $t } from '../../services/i18n';
import { Services } from '../service-provider';
import styles from './PatchNotes.m.less';
export default function PatchNotes(p) {
    const { PatchNotesService, NavigationService } = Services;
    const notes = PatchNotesService.notes;
    function done() {
        NavigationService.navigate('Studio');
    }
    return (React.createElement("div", { className: cx(styles.patchNotesPage, p.className) },
        React.createElement("div", { className: styles.patchNotesContainer },
            React.createElement("div", { className: styles.patchNotesContent },
                React.createElement("div", { className: styles.patchNotesHeader },
                    React.createElement("div", { className: styles.patchNotesTitle }, notes.title),
                    React.createElement("div", { className: styles.patchNotesVersion }, notes.version)),
                React.createElement("ul", { className: styles.patchNotesList }, notes.notes.map(item => (React.createElement("li", { className: styles.patchNotesItem, key: item }, item)))),
                React.createElement("button", { onClick: done, className: cx(styles.patchNotesButton, 'button button--action') }, $t('Done'))))));
}
//# sourceMappingURL=PatchNotes.js.map