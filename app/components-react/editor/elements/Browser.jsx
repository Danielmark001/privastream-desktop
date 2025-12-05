import React, { useRef } from 'react';
import BrowserView from 'components-react/shared/BrowserView';
import { ELayoutElement } from 'services/layout';
import { Services } from 'components-react/service-provider';
import useBaseElement from './hooks';
const mins = { x: 0, y: 0 };
export function Browser() {
    const { LayoutService, UserService } = Services;
    const containerRef = useRef(null);
    const { renderElement } = useBaseElement(<BrowserEl />, mins, containerRef.current);
    function url() {
        var _a;
        const src = (_a = LayoutService.views.currentTab.slottedElements[ELayoutElement.Browser]) === null || _a === void 0 ? void 0 : _a.src;
        if (!src)
            return '';
        if (!/^https?\:\/\//.test(src)) {
            return `https://${src}`;
        }
        return src;
    }
    function BrowserEl() {
        var _a;
        return (<BrowserView src={url()} options={{
                webPreferences: { partition: (_a = UserService.views.auth) === null || _a === void 0 ? void 0 : _a.partition, contextIsolation: true },
            }}/>);
    }
    return (<div ref={containerRef} style={{ height: '100%' }}>
      {renderElement()}
    </div>);
}
Browser.mins = mins;
//# sourceMappingURL=Browser.jsx.map