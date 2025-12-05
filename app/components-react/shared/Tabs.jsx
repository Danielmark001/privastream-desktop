import React from 'react';
import { Tabs as AntdTabs } from 'antd';
import { $t } from 'services/i18n';
export default function Tabs(p) {
    const dualOutputData = [
        {
            label: (<span>
          <i className="icon-desktop" style={{ paddingRight: '5px' }}/>
          {$t('Horizontal')}
        </span>),
            key: 'horizontal',
        },
        {
            label: (<span>
          <i className="icon-phone-case" style={{ paddingRight: '5px' }}/>
          {$t('Vertical')}
        </span>),
            key: 'vertical',
        },
    ];
    const data = (p === null || p === void 0 ? void 0 : p.tabs) ? formatTabs(p.tabs) : dualOutputData;
    function formatTabs(tabs) {
        return tabs.map((tab) => ({
            label: $t(tab),
            key: tab,
        }));
    }
    return (<AntdTabs defaultActiveKey={data[0].key} onChange={p === null || p === void 0 ? void 0 : p.onChange} style={p === null || p === void 0 ? void 0 : p.style}>
      {data.map((tab) => (<AntdTabs.TabPane tab={tab.label} key={tab.key} style={p === null || p === void 0 ? void 0 : p.tabStyle}/>))}
    </AntdTabs>);
}
//# sourceMappingURL=Tabs.jsx.map