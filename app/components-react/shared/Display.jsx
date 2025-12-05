import React, { useEffect, useRef } from 'react';
import { useVuex } from '../hooks';
import { Services } from '../service-provider';
import { Display as OBSDisplay } from '../../services/video';
import uuid from 'uuid/v4';
import { useRealmObject } from 'components-react/hooks/realm';
import Utils from 'services/utils';
export default function Display(props) {
    var _a;
    const { CustomizationService, VideoSettingsService, WindowsService } = Services;
    const windowId = Utils.getWindowId();
    const p = Object.assign({ paddingSize: 0, drawUI: false, clickHandler: () => { }, onOutputResize: () => { }, type: (_a = props === null || props === void 0 ? void 0 : props.type) !== null && _a !== void 0 ? _a : 'horizontal' }, props);
    const v = useVuex(() => {
        var _a;
        const videoSettings = VideoSettingsService.baseResolutions[p.type];
        return {
            baseResolution: `${videoSettings === null || videoSettings === void 0 ? void 0 : videoSettings.baseWidth}x${videoSettings === null || videoSettings === void 0 ? void 0 : videoSettings.baseHeight}`,
            hideDisplay: (_a = WindowsService.state[windowId]) === null || _a === void 0 ? void 0 : _a.hideStyleBlockers,
        };
    }, false);
    const paddingColor = useRealmObject(CustomizationService.state).displayBackground;
    const obsDisplay = useRef(null);
    const displayEl = useRef(null);
    useEffect(updateDisplay, [p.sourceId, paddingColor]);
    useEffect(handleResize, [v.baseResolution]);
    useEffect(handleHideDisplay, [v.hideDisplay]);
    function handleHideDisplay() {
        if (v.hideDisplay) {
            destroyDisplay();
        }
        else {
            if (!obsDisplay.current) {
                createDisplay();
            }
            if (obsDisplay.current) {
                obsDisplay.current.refreshOutputRegion();
            }
        }
    }
    function handleResize() {
        if (!obsDisplay.current)
            return;
        const [width, height] = v.baseResolution.split('x');
        obsDisplay.current.resize(Number(width), Number(height));
    }
    function onClickHandler(event) {
        p.clickHandler(event);
    }
    function createDisplay() {
        const displayId = uuid();
        obsDisplay.current = new OBSDisplay(displayId, {
            sourceId: p.sourceId,
            paddingSize: p.paddingSize,
            paddingColor,
            renderingMode: p.renderingMode,
            type: p.type,
        });
        obsDisplay.current.setShoulddrawUI(p.drawUI);
        obsDisplay.current.onOutputResize(region => p.onOutputResize(region));
        if (displayEl.current)
            obsDisplay.current.trackElement(displayEl.current);
    }
    function destroyDisplay() {
        if (obsDisplay.current)
            obsDisplay.current.destroy();
        obsDisplay.current = null;
    }
    function updateDisplay() {
        destroyDisplay();
        if (!v.hideDisplay) {
            createDisplay();
        }
        return function cleanup() {
            destroyDisplay();
        };
    }
    return (<div id={p === null || p === void 0 ? void 0 : p.id} className="display" ref={displayEl} style={Object.assign({ height: '100%', backgroundColor: 'var(--section)', flexGrow: 1 }, p.style)} onClick={onClickHandler}/>);
}
//# sourceMappingURL=Display.jsx.map