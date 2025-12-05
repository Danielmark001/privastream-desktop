import React, { useState, useMemo, useEffect } from 'react';
import Animation from 'rc-animate';
import { Services } from '../service-provider';
import { $t } from '../../services/i18n';
const VISION_TESTERS = [
    { name: 'Kill', value: 'elimination' },
    { name: 'Win', value: 'victory' },
    { name: 'Death', value: 'death' },
];
function isReactiveSource(source) {
    return source.propertiesManagerType === 'smartBrowserSource';
}
export default function TestWidgets(p) {
    const { WidgetsService, VisionService, SourcesService } = Services;
    const [slideOpen, setSlideOpen] = useState(false);
    const [hasSmartBrowser, setHasSmartBrowser] = useState(!!SourcesService.views.sources.some(s => s.propertiesManagerType === 'smartBrowserSource'));
    useEffect(() => {
        const addSub = SourcesService.sourceAdded.subscribe(source => {
            if (isReactiveSource(source)) {
                setHasSmartBrowser(true);
            }
            else if (!SourcesService.views.sources.some(isReactiveSource)) {
                setHasSmartBrowser(false);
            }
        });
        const removeSub = SourcesService.sourceRemoved.subscribe(source => {
            if (isReactiveSource(source) &&
                !SourcesService.views.sources.some(s => s.state.sourceId !== source.sourceId && isReactiveSource(s))) {
                setHasSmartBrowser(false);
            }
        });
        return () => {
            var _a, _b;
            (_a = addSub === null || addSub === void 0 ? void 0 : addSub.unsubscribe) === null || _a === void 0 ? void 0 : _a.call(addSub);
            (_b = removeSub === null || removeSub === void 0 ? void 0 : removeSub.unsubscribe) === null || _b === void 0 ? void 0 : _b.call(removeSub);
        };
    }, [SourcesService]);
    const allTesters = useMemo(() => WidgetsService.views.testers, []);
    const widgetTesters = p.testers
        ? allTesters.filter(tester => { var _a; return (_a = p.testers) === null || _a === void 0 ? void 0 : _a.includes(tester.name); })
        : allTesters;
    function test(testerName) {
        WidgetsService.actions.test(testerName);
    }
    function testReactive(testerName) {
        VisionService.actions.testEvent(testerName);
    }
    return (React.createElement("div", { className: "slide-open" },
        React.createElement("a", { className: "slide-open__open link", onClick: () => setSlideOpen(!slideOpen) }, $t('Test Widgets')),
        React.createElement(Animation, { transitionName: "ant-slide-right" }, slideOpen && (React.createElement("div", { className: "slide-open__menu", style: { zIndex: 1011 } },
            hasSmartBrowser &&
                VISION_TESTERS.map(tester => (React.createElement("button", { className: "button button--trans", key: `test-reactive-${tester.value}`, onClick: () => testReactive(tester.value) }, $t(tester.name)))),
            widgetTesters.map(tester => (React.createElement("button", { className: "button button--trans", key: tester.name, onClick: () => test(tester.name) }, $t(tester.name)))))))));
}
//# sourceMappingURL=TestWidgets.js.map