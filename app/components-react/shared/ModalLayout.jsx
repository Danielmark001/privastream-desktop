import React from 'react';
import { Services } from '../service-provider';
import { getOS, OS } from '../../util/operating-systems';
import cx from 'classnames';
import { $t } from '../../services/i18n';
import { Button } from 'antd';
import Scrollable from './Scrollable';
import { useRealmObject } from 'components-react/hooks/realm';
const titleHeight = getOS() === OS.Mac ? 22 : 30;
const wrapperStyles = {
    height: `calc(100% - ${titleHeight}px)`,
};
const fixedStyles = {
    height: '200px',
    background: 'var(--section)',
    margin: 0,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
};
export function ModalLayout(p) {
    const footerHeight = p.hideFooter ? 0 : 53;
    const bodyStyles = Object.assign({ height: p.fixedChild
            ? `calc(100% - ${footerHeight + 200}px)`
            : `calc(100% - ${footerHeight}px)` }, (p.bodyStyle || {}));
    const { WindowsService, CustomizationService } = Services;
    const currentTheme = useRealmObject(CustomizationService.state).theme;
    function close() {
        WindowsService.actions.closeChildWindow();
    }
    function DefaultFooter() {
        const okText = p.okText || $t('Done');
        const closeFunc = p.onCancel || close;
        return (<>
        <Button onClick={closeFunc}>{$t('Close')}</Button>
        {p.onOk && (<Button onClick={p.onOk} type="primary" disabled={p.confirmLoading}>
            {p.confirmLoading && (<i className="fa fa-pulse fa-spinner" style={{ marginRight: 8 }}/>)}
            {okText}
          </Button>)}
      </>);
    }
    return (<div className={cx('ant-modal-content', currentTheme, p.className)} style={Object.assign(Object.assign({}, wrapperStyles), p.wrapperStyle)}>
      {p.fixedChild && <div style={fixedStyles}>{p.fixedChild}</div>}

      {p.scrollable ? (<div style={bodyStyles}>
          <Scrollable isResizable={false} style={{ height: '100%' }}>
            <div className={cx('ant-modal-body', p.bodyClassName)}>{p.children}</div>
          </Scrollable>
        </div>) : (<div className={cx('ant-modal-body', p.bodyClassName)} style={bodyStyles}>
          {p.children}
        </div>)}

      {!p.hideFooter && <div className="ant-modal-footer">{p.footer || <DefaultFooter />}</div>}
    </div>);
}
//# sourceMappingURL=ModalLayout.jsx.map