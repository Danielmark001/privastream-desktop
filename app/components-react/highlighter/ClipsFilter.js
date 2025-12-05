import React from 'react';
import { Tabs, Button, Dropdown, Menu } from 'antd';
import { FilterOutlined } from '@ant-design/icons';
const { TabPane } = Tabs;
export default function ClipsFilter({ activeFilter, onFilterChange }) {
    const additionalFiltersMenu = (React.createElement(Menu, null,
        React.createElement(Menu.Item, { key: "1" }, "Filter by Duration"),
        React.createElement(Menu.Item, { key: "2" }, "Filter by Date")));
    return (React.createElement("div", { style: { display: 'flex', alignItems: 'center', padding: '0 20px' } },
        React.createElement(Tabs, { activeKey: activeFilter, onChange: onFilterChange, style: { flex: 1 } },
            React.createElement(TabPane, { tab: "All Clips", key: "all" }),
            React.createElement(TabPane, { tab: "AI", key: "ai" }),
            React.createElement(TabPane, { tab: "Manual", key: "manual" })),
        React.createElement(Dropdown, { overlay: additionalFiltersMenu, trigger: ['click'] },
            React.createElement(Button, { icon: React.createElement(FilterOutlined, null), style: { marginLeft: 16 } }, "More Filters"))));
}
//# sourceMappingURL=ClipsFilter.js.map