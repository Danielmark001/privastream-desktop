import styles from './GoLive.m.less';
import React from 'react';
import cx from 'classnames';
import InputWrapper from '../../shared/inputs/InputWrapper';
export function Section(p) {
    const title = p.title;
    if (!p.isSimpleMode) {
        return (React.createElement("div", { className: cx({ section: true, [styles.sectionWithoutTitle]: !title }) },
            title && (React.createElement(InputWrapper, null,
                React.createElement("h2", { style: { marginBottom: 0 } }, title))),
            React.createElement("div", null, p.children)));
    }
    return React.createElement("div", null, p.children);
}
//# sourceMappingURL=Section.js.map