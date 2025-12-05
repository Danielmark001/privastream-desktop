import React from 'react';
import { Col } from 'antd';
import cx from 'classnames';
import { WidgetDisplayData, WidgetType } from 'services/widgets';
import { SourceDisplayData } from 'services/sources';
import { useSourceShowcaseSettings } from './useSourceShowcase';
import styles from './SourceShowcase.m.less';
import { useVuex } from 'components-react/hooks';
import { Services } from '../../service-provider';
export default function SourceTag(p) {
    const { inspectSource, selectInspectedSource, store } = useSourceShowcaseSettings();
    const { inspectedSource, inspectedAppId, inspectedAppSourceId } = store.useState(s => {
        return {
            inspectedSource: s.inspectedSource,
            inspectedAppId: s.inspectedAppId,
            inspectedAppSourceId: s.inspectedAppSourceId,
        };
    });
    const { UserService } = Services;
    const { platform } = useVuex(() => { var _a; return ({ platform: (_a = UserService.views.platform) === null || _a === void 0 ? void 0 : _a.type }); });
    const displayData = WidgetDisplayData(platform)[WidgetType[p.type]] || SourceDisplayData()[p.type];
    function active() {
        if (!p.appId)
            return inspectedSource === p.type;
        return p.appSourceId === inspectedAppSourceId && p.appId === inspectedAppId;
    }
    return (<Col span={8}>
      <div className={cx('source-tag', styles.sourceTag, {
            [styles.active]: active(),
            [styles.essential]: p.essential,
            [styles.excludeWrap]: p.excludeWrap,
        })} onClick={() => inspectSource(p.type, p.appId, p.appSourceId)} onDoubleClick={() => selectInspectedSource()} data-name={(displayData === null || displayData === void 0 ? void 0 : displayData.name) || p.name}>
        <div style={{ display: 'flex', flexDirection: 'row' }}>
          <div className={styles.iconWrapper}>
            {(displayData === null || displayData === void 0 ? void 0 : displayData.icon) && <i className={displayData === null || displayData === void 0 ? void 0 : displayData.icon}/>}
          </div>
          <div className={styles.displayName}>{(displayData === null || displayData === void 0 ? void 0 : displayData.name) || p.name}</div>
        </div>
        {(displayData === null || displayData === void 0 ? void 0 : displayData.shortDesc) && !p.hideShortDescription && (<div style={{
                opacity: '0.5',
            }}>
            {displayData === null || displayData === void 0 ? void 0 : displayData.shortDesc}
          </div>)}
      </div>
    </Col>);
}
//# sourceMappingURL=SourceTag.jsx.map