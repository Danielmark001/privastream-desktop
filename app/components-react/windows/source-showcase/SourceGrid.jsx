import React, { useMemo, useState } from 'react';
import { Empty, Row, Col, PageHeader, Button, Collapse } from 'antd';
import Fuse from 'fuse.js';
import Scrollable from 'components-react/shared/Scrollable';
import { Services } from 'components-react/service-provider';
import { useVuex } from 'components-react/hooks';
import { WidgetDisplayData, WidgetType } from 'services/widgets';
import { SourceDisplayData } from 'services/sources';
import { getPlatformService } from 'services/platforms';
import { $i } from 'services/utils';
import { byOS, OS } from 'util/operating-systems';
import { $t, I18nService } from 'services/i18n';
import SourceTag from './SourceTag';
import { useSourceShowcaseSettings } from './useSourceShowcase';
import { EAvailableFeatures } from 'services/incremental-rollout';
import { useRealmObject } from 'components-react/hooks/realm';
import styles from './SourceGrid.m.less';
export default function SourceGrid(p) {
    const { SourcesService, UserService, ScenesService, WindowsService, CustomizationService, IncrementalRolloutService, } = Services;
    const [expandedSections, setExpandedSections] = useState([
        'essentialSources',
        'captureSources',
        'avSources',
        'mediaSources',
        'widgets',
        'apps',
    ]);
    const [widgetSections, setWidgetExpandedSections] = useState([
        'essentialWidgets',
        'interactive',
        'goals',
        'flair',
    ]);
    const { isLoggedIn, linkedPlatforms, primaryPlatform } = useVuex(() => {
        var _a;
        return ({
            isLoggedIn: UserService.views.isLoggedIn,
            linkedPlatforms: UserService.views.linkedPlatforms,
            primaryPlatform: (_a = UserService.views.platform) === null || _a === void 0 ? void 0 : _a.type,
        });
    });
    const customization = useRealmObject(CustomizationService.state);
    const demoMode = customization.isDarkTheme ? 'night' : 'day';
    const designerMode = customization.designerMode;
    const i18nService = I18nService.instance;
    const locale = i18nService.state.locale;
    const excludedLanguages = ['en', 'ko', 'zh'];
    const excludeWrap = excludedLanguages.includes(locale.split('-')[0]);
    const { availableAppSources } = useSourceShowcaseSettings();
    const primaryPlatformService = UserService.state.auth
        ? getPlatformService(UserService.state.auth.primaryPlatform)
        : null;
    const iterableWidgetTypesBase = useMemo(() => {
        const filtered = Object.keys(WidgetType)
            .filter((type) => isNaN(Number(type)) && type !== 'SubscriberGoal')
            .filter((type) => {
            var _a;
            const widgetPlatforms = (_a = WidgetDisplayData(primaryPlatform)[WidgetType[type]]) === null || _a === void 0 ? void 0 : _a.platforms;
            if (!widgetPlatforms)
                return true;
            return linkedPlatforms === null || linkedPlatforms === void 0 ? void 0 : linkedPlatforms.some(platform => widgetPlatforms && widgetPlatforms.has(platform));
        })
            .filter(type => {
            const whitelist = primaryPlatformService === null || primaryPlatformService === void 0 ? void 0 : primaryPlatformService.widgetsWhitelist;
            if (!whitelist)
                return true;
            return whitelist.includes(WidgetType[type]);
        });
        if (isLoggedIn) {
            filtered.push('streamlabel');
        }
        return filtered;
    }, [isLoggedIn]);
    const { platform } = useVuex(() => { var _a; return ({ platform: (_a = UserService.views.platform) === null || _a === void 0 ? void 0 : _a.type }); });
    const [searchThreshold, _setSearchThreshold] = useState(0.3);
    const toFuseCollection = (xs, threshold = 0.3) => {
        const list = xs.reduce((acc, type) => {
            const displayData = WidgetDisplayData(platform)[WidgetType[type]] || SourceDisplayData()[type];
            if (!displayData) {
                return acc;
            }
            return [
                ...acc,
                {
                    type,
                    name: displayData.name,
                    description: displayData.description,
                    shortDesc: displayData.shortDesc,
                },
            ];
        }, []);
        const result = new Fuse(list, {
            threshold,
            keys: [
                { name: 'type', weight: 1 },
                { name: 'name', weight: 0.8 },
                { name: 'shortDesc', weight: 0.5 },
                { name: 'description', weight: 0.2 },
            ],
        });
        return result;
    };
    const isSourceType = (x) => {
        return x && typeof x === 'object' && 'value' in x;
    };
    const isSourceTypeList = (xs) => {
        return isSourceType(xs[0]);
    };
    const useSearchMemo = (xs, options = {}, deps = []) => useMemo(() => {
        const coll = (() => {
            if (!xs.length) {
                return [];
            }
            if (isSourceTypeList(xs)) {
                return xs.map(x => x.value);
            }
            else {
                return xs;
            }
        })();
        const list = toFuseCollection(coll, options.threshold);
        const toOrigElement = (x) => {
            if (isSourceTypeList(xs)) {
                return {
                    description: x.description,
                    value: x.type,
                };
            }
            else {
                return x.type;
            }
        };
        const result = p.searchTerm ? list.search(p.searchTerm).map(toOrigElement) : xs;
        return result;
    }, [xs, platform, p.searchTerm, ...(options.threshold ? [options.threshold] : []), ...deps]);
    const iterableWidgetTypes = useSearchMemo(iterableWidgetTypesBase, {
        threshold: searchThreshold,
    });
    const availableSourcesBase = useMemo(() => {
        const guestCamAvailable = (IncrementalRolloutService.views.featureIsEnabled(EAvailableFeatures.guestCamBeta) ||
            IncrementalRolloutService.views.featureIsEnabled(EAvailableFeatures.guestCamProduction)) &&
            UserService.views.isLoggedIn;
        const result = SourcesService.getAvailableSourcesTypesList().filter(type => {
            if (type.value === 'text_ft2_source' && byOS({ [OS.Windows]: true, [OS.Mac]: false })) {
                return;
            }
            if (type.value === 'mediasoupconnector' && !guestCamAvailable) {
                return false;
            }
            return !(type.value === 'scene' && ScenesService.views.scenes.length <= 1);
        });
        return [
            ...result,
            {
                description: 'Instant Replay',
                value: 'replay',
            },
            ...(designerMode
                ? [
                    {
                        value: 'icon_library',
                        description: 'Custom Icon',
                    },
                ]
                : []),
        ];
    }, []);
    const availableSources = useSearchMemo(availableSourcesBase);
    const essentialSourcesOrder = ['game_capture', 'dshow_input', 'ffmpeg_source'];
    const essentialWidgetsOrder = [
        WidgetType.AlertBox,
        WidgetType.ChatBox,
        WidgetType.EventList,
        WidgetType.ViewerCount,
        'streamlabel',
    ];
    function customOrder(orderArray, getter) {
        return (s1, s2) => orderArray.indexOf(getter(s1)) - orderArray.indexOf(getter(s2));
    }
    const essentialSources = useMemo(() => {
        const essentialDefaults = availableSources
            .filter(source => [
            'dshow_input',
            'ffmpeg_source',
            'game_capture',
        ].includes(source.value))
            .sort(customOrder(essentialSourcesOrder, s => s.value));
        const essentialWidgets = iterableWidgetTypes.filter(type => [WidgetType.AlertBox, WidgetType.ChatBox, 'streamlabel'].includes(type === 'streamlabel' ? type : WidgetType[type]));
        return { essentialDefaults, essentialWidgets };
    }, [availableSources, iterableWidgetTypes, isLoggedIn]);
    function showContent(key) {
        const correctKey = key === p.activeTab;
        if (key === 'apps') {
            return correctKey && availableAppSources.length > 0;
        }
        return correctKey;
    }
    function handleAuth() {
        WindowsService.closeChildWindow();
        UserService.showLogin();
    }
    function filterEssential(source) {
        if (p.activeTab !== 'all')
            return true;
        if (typeof source === 'string') {
            return !essentialSources.essentialWidgets.find(s => s === source);
        }
        return !essentialSources.essentialDefaults.find(s => s.value === source.value);
    }
    const toSourceEl = (source) => (<SourceTag key={source.value} type={source.value} essential excludeWrap={excludeWrap}/>);
    const toWidgetEl = (widget, { essential = false, hideShortDescription = false } = {}) => widget === 'streamlabel' ? (<SourceTag key="streamlabel" name={$t('Stream Label')} type="streamlabel" essential hideShortDescription={p.activeTab !== 'all'} excludeWrap={excludeWrap}/>) : (<SourceTag key={widget} type={widget} excludeWrap={excludeWrap} essential={essential} hideShortDescription={hideShortDescription}/>);
    const essentialSourcesList = useMemo(() => {
        if (essentialSources.essentialDefaults.length || essentialSources.essentialWidgets.length) {
            return (<>
          {essentialSources.essentialDefaults.map(source => (<SourceTag key={source.value} type={source.value} essential excludeWrap={excludeWrap}/>))}

          {isLoggedIn &&
                    essentialSources.essentialWidgets.map(widgetType => toWidgetEl(widgetType, { essential: true }))}
        </>);
        }
    }, [essentialSources, isLoggedIn, excludeWrap, iterableWidgetTypes]);
    const sourceDisplayData = useMemo(() => SourceDisplayData(), []);
    const widgetDisplayData = useMemo(() => WidgetDisplayData(), []);
    const byGroup = (group) => (source) => {
        const displayData = sourceDisplayData[source.value];
        return (displayData === null || displayData === void 0 ? void 0 : displayData.group) === group;
    };
    const byWidgetGroup = (group) => (widget) => {
        const displayData = widgetDisplayData[WidgetType[widget]];
        if (widget === 'streamlabel' && group === 'essential') {
            return true;
        }
        return (displayData === null || displayData === void 0 ? void 0 : displayData.group) === group;
    };
    const mapToSourceElIfSourceGiven = (xs) => {
        if (isSourceTypeList(xs)) {
            return xs.map(toSourceEl);
        }
        return xs;
    };
    const useNonEmptySourceElements = (factory, deps, mapper = mapToSourceElIfSourceGiven) => {
        return useMemo(() => {
            const result = factory();
            if (result.length) {
                return mapper(result);
            }
        }, deps);
    };
    const mapToWidgetEl = (type) => toWidgetEl(type, { hideShortDescription: true });
    const useNonEmptyWidgetElements = (factory, deps = [iterableWidgetTypes]) => {
        return useNonEmptySourceElements(factory, deps, widgets => widgets.map(mapToWidgetEl));
    };
    const captureSourcesList = useNonEmptySourceElements(() => availableSources.filter(byGroup('capture')), [availableSources, excludeWrap]);
    const avSourcesList = useNonEmptySourceElements(() => availableSources.filter(byGroup('av')), [
        availableSources,
        excludeWrap,
    ]);
    const mediaSourcesList = useNonEmptySourceElements(() => availableSources.filter(byGroup('media')), [availableSources, excludeWrap, designerMode]);
    const widgetList = useMemo(() => {
        const widgets = iterableWidgetTypes.filter(filterEssential);
        if (isLoggedIn && !widgets.length) {
            return;
        }
        const list = widgets.map(widgetType => toWidgetEl(widgetType, { hideShortDescription: true }));
        return (<>
        {!isLoggedIn ? (<Empty description={$t('You must be logged in to use Widgets')} image={$i(`images/sleeping-kevin-${demoMode}.png`)}>
            <Button onClick={handleAuth}>{$t('Click here to log in')}</Button>
          </Empty>) : (list)}
      </>);
    }, [isLoggedIn, iterableWidgetTypes, p.activeTab, excludeWrap]);
    const widgetsInGroup = (group, sorter) => {
        return (iterableWidgetTypes
            .filter(byWidgetGroup(group))
            .sort(sorter));
    };
    const essentialWidgets = useNonEmptyWidgetElements(() => widgetsInGroup('essential', customOrder(essentialWidgetsOrder, x => x === 'streamlabel' ? 'streamlabel' : WidgetType[x])));
    const interactiveWidgets = useNonEmptyWidgetElements(() => widgetsInGroup('interactive'));
    const goalWidgets = useNonEmptyWidgetElements(() => widgetsInGroup('goals'));
    const flairWidgets = useNonEmptyWidgetElements(() => widgetsInGroup('flair'));
    const charityWidgets = useNonEmptyWidgetElements(() => widgetsInGroup('charity'));
    const widgetGroupedList = useMemo(() => {
        return (<>
        {!isLoggedIn ? (<Empty description={$t('You must be logged in to use Widgets')} image={$i(`images/sleeping-kevin-${demoMode}.png`)}>
            <Button onClick={handleAuth}>{$t('Click here to log in')}</Button>
          </Empty>) : (<Collapse ghost activeKey={widgetSections} onChange={xs => setWidgetExpandedSections(xs)}>
            {nonEmptyPanel({
                    id: 'essentialWidgets',
                    src: essentialWidgets,
                    header: $t('Essentials'),
                    testId: 'essential-widgets',
                })}

            {nonEmptyPanel({
                    id: 'interactive',
                    src: interactiveWidgets,
                    header: $t('Interactive'),
                    testId: 'interactive-widgets',
                })}

            {nonEmptyPanel({
                    id: 'goals',
                    src: goalWidgets,
                    header: $t('Goals'),
                    testId: 'goal-widgets',
                })}

            {nonEmptyPanel({
                    id: 'flair',
                    src: flairWidgets,
                    header: $t('Flair'),
                    testId: 'flair-widgets',
                })}

            
          </Collapse>)}
      </>);
    }, [
        widgetSections,
        isLoggedIn,
        essentialWidgets,
        interactiveWidgets,
        goalWidgets,
        flairWidgets,
        excludeWrap,
    ]);
    const appsList = useMemo(() => (<>
        {availableAppSources.map(app => (<SourceTag key={`${app.appId}${app.source.id}`} name={app.source.name} type="app_source" appId={app.appId} appSourceId={app.source.id} excludeWrap={excludeWrap}/>))}
      </>), [availableAppSources, excludeWrap]);
    const groupedSources = useMemo(() => (<>
        {nonEmptyPanel({
            id: 'captureSources',
            src: captureSourcesList,
            header: $t('Capture Sources'),
            testId: 'capture-sources',
        })}

        {nonEmptyPanel({
            id: 'avSources',
            src: avSourcesList,
            header: $t('Video and Audio'),
            testId: 'av-sources',
        })}

        {nonEmptyPanel({
            id: 'mediaSources',
            src: mediaSourcesList,
            header: $t('Media'),
            testId: 'media-sources',
        })}
      </>), [captureSourcesList, avSourcesList, mediaSourcesList]);
    const individualTab = useMemo(() => {
        if (showContent('general')) {
            return (<>
          <Col span={24}>
            <Collapse ghost activeKey={expandedSections} onChange={xs => setExpandedSections(xs)}>
              {groupedSources}
            </Collapse>
          </Col>
        </>);
        }
        else if (showContent('widgets')) {
            return (<>
          <Col span={24}>{widgetGroupedList}</Col>
        </>);
        }
        else if (showContent('apps')) {
            return (<>
          <Col span={24}>
            <PageHeader style={{ paddingLeft: 0 }} title={$t('Apps')}/>
          </Col>
          {appsList}
        </>);
        }
    }, [p.activeTab, availableAppSources, appsList, widgetList]);
    return (<Scrollable style={{ height: 'calc(100% - 64px)' }} className={styles.sourceGrid}>
      <Row gutter={[8, 8]} style={{ marginLeft: '8px', marginRight: '8px', paddingBottom: '24px' }}>
        {p.activeTab === 'all' ? (<>
            <Col span={24}>
              <Collapse ghost activeKey={expandedSections} onChange={xs => setExpandedSections(xs)}>
                {nonEmptyPanel({
                id: 'essentialSources',
                src: essentialSourcesList,
                header: $t('Essentials'),
                testId: 'essential-sources',
            })}

                {groupedSources}

                {nonEmptyPanel({
                id: 'widgets',
                src: widgetList,
                header: $t('Widgets'),
                testId: 'widget-sources',
            })}

                
                {!p.searchTerm &&
                nonEmptyPanel({
                    id: 'apps',
                    src: appsList,
                    header: $t('Apps'),
                    testId: 'app-sources',
                })}
              </Collapse>
            </Col>
          </>) : (individualTab)}
      </Row>
    </Scrollable>);
}
const { Panel } = Collapse;
const nonEmptyPanel = ({ src, id, header, testId, }) => {
    if (!src) {
        return null;
    }
    return (<Panel header={header} key={id}>
      <div className="collapse-section" data-testid={testId}>
        {src}
      </div>
    </Panel>);
};
//# sourceMappingURL=SourceGrid.jsx.map