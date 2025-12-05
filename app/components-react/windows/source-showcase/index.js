import React, { useState, useMemo } from 'react';
import { Layout, Menu, Input } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { ModalLayout } from 'components-react/shared/ModalLayout';
import { Services } from 'components-react/service-provider';
import { useVuex } from 'components-react/hooks';
import { SourceDisplayData } from 'services/sources';
import { WidgetDisplayData, WidgetType } from 'services/widgets';
import { $i } from 'services/utils';
import { $t } from 'services/i18n';
import { SourceShowcaseController, SourceShowcaseControllerCtx, useSourceShowcaseSettings, } from './useSourceShowcase';
import styles from './SourceShowcase.m.less';
import SourceGrid from './SourceGrid';
import Scrollable from 'components-react/shared/Scrollable';
import * as remote from '@electron/remote';
import { useRealmObject } from 'components-react/hooks/realm';
const { Content, Sider } = Layout;
export default function SourcesShowcase() {
    const controller = useMemo(() => new SourceShowcaseController(), []);
    return (React.createElement(SourceShowcaseControllerCtx.Provider, { value: controller },
        React.createElement(SourcesShowcaseModal, null)));
}
function SourcesShowcaseModal() {
    const { selectInspectedSource, availableAppSources } = useSourceShowcaseSettings();
    const [activeTab, setActiveTab] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    return (React.createElement(ModalLayout, { onOk: selectInspectedSource, okText: $t('Add Source'), bodyStyle: { paddingBottom: 0, paddingTop: 0, paddingLeft: 0 } },
        React.createElement(Layout, { style: { height: '100%' } },
            React.createElement(Content, { style: { paddingRight: 0, paddingLeft: 0 } },
                React.createElement("div", { className: styles.header },
                    React.createElement(Menu, { onClick: e => setActiveTab(e.key), selectedKeys: [activeTab], mode: "horizontal", style: { borderBottom: 0 } },
                        React.createElement(Menu.Item, { key: "all" }, $t('All Sources')),
                        React.createElement(Menu.Item, { key: "general" }, $t('Media Categories')),
                        React.createElement(Menu.Item, { key: "widgets" }, $t('Widgets')),
                        availableAppSources.length > 0 && React.createElement(Menu.Item, { key: "apps" }, $t('Apps'))),
                    activeTab !== 'apps' && (React.createElement(Input, { type: "search", className: styles.search, allowClear: true, placeholder: $t('Search...'), prefix: React.createElement(SearchOutlined, null), onChange: ev => setSearchTerm(ev.target.value), value: searchTerm }))),
                React.createElement(SourceGrid, { activeTab: activeTab, searchTerm: searchTerm })),
            React.createElement(SideBar, null))));
}
function SideBar() {
    var _a, _b;
    const { UserService, CustomizationService, PlatformAppsService } = Services;
    const { store } = useSourceShowcaseSettings();
    const { inspectedSource, inspectedAppId, inspectedAppSourceId } = store.useState();
    const { platform } = useVuex(() => {
        var _a;
        return ({
            platform: (_a = UserService.views.platform) === null || _a === void 0 ? void 0 : _a.type,
        });
    });
    const demoMode = useRealmObject(CustomizationService.state).isDarkTheme ? 'night' : 'day';
    const appData = useMemo(() => {
        if (!inspectedAppId)
            return;
        const appManifest = PlatformAppsService.views.getApp(inspectedAppId).manifest;
        const source = appManifest.sources.find(source => source.id === inspectedAppSourceId);
        if (source) {
            return {
                supportList: source.about.bullets,
                description: source.about.description,
                demoFilename: source.about.bannerImage,
                demoVideo: false,
                name: source.name,
                link: null,
                linkText: null,
            };
        }
    }, [inspectedAppId]);
    function widgetData(type) {
        return WidgetDisplayData(platform)[WidgetType[type]];
    }
    function openLink(url) {
        remote.shell.openExternal(url);
    }
    const displayData = appData || widgetData(inspectedSource) || SourceDisplayData()[inspectedSource];
    const previewSrc = useMemo(() => {
        if (appData) {
            return PlatformAppsService.views.getAssetUrl(inspectedAppId, (displayData === null || displayData === void 0 ? void 0 : displayData.demoFilename) || '');
        }
        return $i(`source-demos/${demoMode}/${displayData === null || displayData === void 0 ? void 0 : displayData.demoFilename}`);
    }, [demoMode, displayData === null || displayData === void 0 ? void 0 : displayData.demoFilename]);
    return (React.createElement(Sider, { width: 300, style: { marginRight: '-24px', height: '100%' }, collapsed: !displayData, collapsedWidth: 0 },
        React.createElement("div", { className: styles.preview },
            (displayData === null || displayData === void 0 ? void 0 : displayData.demoFilename) &&
                ((displayData === null || displayData === void 0 ? void 0 : displayData.demoVideo) ? (React.createElement("video", { autoPlay: true, loop: true, key: previewSrc },
                    React.createElement("source", { src: previewSrc }))) : (React.createElement("img", { src: previewSrc }))),
            React.createElement(Scrollable, { style: { height: '100%' } },
                React.createElement("h2", { style: { marginTop: '24px' } }, displayData === null || displayData === void 0 ? void 0 : displayData.name),
                React.createElement("div", null, displayData === null || displayData === void 0 ? void 0 : displayData.description),
                ((_a = displayData === null || displayData === void 0 ? void 0 : displayData.supportList) === null || _a === void 0 ? void 0 : _a.length) > 0 && (React.createElement("div", { className: styles.supportHeader }, $t('Supports:'))),
                React.createElement("ul", { style: { fontSize: '13px' } }, (_b = displayData === null || displayData === void 0 ? void 0 : displayData.supportList) === null || _b === void 0 ? void 0 : _b.map(support => (React.createElement("li", { key: support }, support)))),
                (displayData === null || displayData === void 0 ? void 0 : displayData.link) && (displayData === null || displayData === void 0 ? void 0 : displayData.linkText) && (React.createElement("span", { className: styles.infoLink, onClick: () => openLink(displayData.link) }, displayData === null || displayData === void 0 ? void 0 : displayData.linkText))))));
}
//# sourceMappingURL=index.js.map