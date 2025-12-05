import styles from './GoLive.m.less';
import React from 'react';
import cx from 'classnames';
import InputWrapper from '../../shared/inputs/InputWrapper';
export function Section(p) {
    const title = p.title;
    if (!p.isSimpleMode) {
        return (<div className={cx({ section: true, [styles.sectionWithoutTitle]: !title })}>
        {title && (<InputWrapper>
            <h2 style={{ marginBottom: 0 }}>{title}</h2>
          </InputWrapper>)}
        <div>{p.children}</div>
      </div>);
    }
    return <div>{p.children}</div>;
}
//# sourceMappingURL=Section.jsx.map