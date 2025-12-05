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
    return (<SourceShowcaseControllerCtx.Provider value={controller}>
      <SourcesShowcaseModal />
    </SourceShowcaseControllerCtx.Provider>);
}
function SourcesShowcaseModal() {
    const { selectInspectedSource, availableAppSources } = useSourceShowcaseSettings();
    const [activeTab, setActiveTab] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    return (<ModalLayout onOk={selectInspectedSource} okText={$t('Add Source')} bodyStyle={{ paddingBottom: 0, paddingTop: 0, paddingLeft: 0 }}>
      <Layout style={{ height: '100%' }}>
        <Content style={{ paddingRight: 0, paddingLeft: 0 }}>
          <div className={styles.header}>
            <Menu onClick={e => setActiveTab(e.key)} selectedKeys={[activeTab]} mode="horizontal" style={{ borderBottom: 0 }}>
              <Menu.Item key="all">{$t('All Sources')}</Menu.Item>
              <Menu.Item key="general">{$t('Media Categories')}</Menu.Item>
              <Menu.Item key="widgets">{$t('Widgets')}</Menu.Item>
              {availableAppSources.length > 0 && <Menu.Item key="apps">{$t('Apps')}</Menu.Item>}
            </Menu>
            {activeTab !== 'apps' && (<Input type="search" className={styles.search} allowClear placeholder={$t('Search...')} prefix={<SearchOutlined />} onChange={ev => setSearchTerm(ev.target.value)} value={searchTerm}/>)}
          </div>
          <SourceGrid activeTab={activeTab} searchTerm={searchTerm}/>
        </Content>
        <SideBar />
      </Layout>
    </ModalLayout>);
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
    return (<Sider width={300} style={{ marginRight: '-24px', height: '100%' }} collapsed={!displayData} collapsedWidth={0}>
      <div className={styles.preview}>
        {(displayData === null || displayData === void 0 ? void 0 : displayData.demoFilename) &&
            ((displayData === null || displayData === void 0 ? void 0 : displayData.demoVideo) ? (<video autoPlay loop key={previewSrc}>
              <source src={previewSrc}/>
            </video>) : (<img src={previewSrc}/>))}
        <Scrollable style={{ height: '100%' }}>
          <h2 style={{ marginTop: '24px' }}>{displayData === null || displayData === void 0 ? void 0 : displayData.name}</h2>
          <div>{displayData === null || displayData === void 0 ? void 0 : displayData.description}</div>
          {((_a = displayData === null || displayData === void 0 ? void 0 : displayData.supportList) === null || _a === void 0 ? void 0 : _a.length) > 0 && (<div className={styles.supportHeader}>{$t('Supports:')}</div>)}
          <ul style={{ fontSize: '13px' }}>
            {(_b = displayData === null || displayData === void 0 ? void 0 : displayData.supportList) === null || _b === void 0 ? void 0 : _b.map(support => (<li key={support}>{support}</li>))}
          </ul>
          {(displayData === null || displayData === void 0 ? void 0 : displayData.link) && (displayData === null || displayData === void 0 ? void 0 : displayData.linkText) && (<span className={styles.infoLink} onClick={() => openLink(displayData.link)}>
              {displayData === null || displayData === void 0 ? void 0 : displayData.linkText}
            </span>)}
        </Scrollable>
      </div>
    </Sider>);
}
//# sourceMappingURL=index.jsx.map