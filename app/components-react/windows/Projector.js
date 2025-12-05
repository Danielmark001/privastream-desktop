import React, { useMemo, useRef } from 'react';
import * as remote from '@electron/remote';
import { ModalLayout } from 'components-react/shared/ModalLayout';
import Display from 'components-react/shared/Display';
import Util from 'services/utils';
import Scrollable from 'components-react/shared/Scrollable';
import { Services } from 'components-react/service-provider';
import { useOneOffWindowParams, useVuex } from 'components-react/hooks';
import { useSubscription } from 'components-react/hooks/useSubscription';
import styles from './Projector.m.less';
export default function Projector() {
    const { WindowsService, SourcesService } = Services;
    const oldBounds = useRef(null);
    const { sourceId, renderingMode } = useOneOffWindowParams();
    const windowId = useMemo(() => Util.getCurrentUrlParams().windowId, []);
    const { fullscreen } = useVuex(() => {
        return {
            fullscreen: WindowsService.state[windowId].isFullScreen,
        };
    });
    useSubscription(SourcesService.sourceRemoved, source => {
        if (source.sourceId === sourceId) {
            remote.getCurrentWindow().close();
        }
    });
    function enterFullscreen(display) {
        const currentWindow = remote.getCurrentWindow();
        WindowsService.actions.setOneOffFullscreen(windowId, true);
        oldBounds.current = currentWindow.getBounds();
        currentWindow.setPosition(display.bounds.x, display.bounds.y);
        currentWindow.fullScreenable = true;
        currentWindow.setFullScreen(true);
        document.addEventListener('keydown', exitFullscreen);
    }
    function exitFullscreen(e) {
        if (e.code !== 'Escape')
            return;
        document.removeEventListener('keydown', exitFullscreen);
        WindowsService.actions.setOneOffFullscreen(windowId, false);
        const currentWindow = remote.getCurrentWindow();
        currentWindow.setFullScreen(false);
        if (oldBounds.current) {
            currentWindow.setBounds(oldBounds.current);
        }
    }
    return (React.createElement("div", { className: styles.projectorContainer },
        fullscreen && (React.createElement("div", { className: styles.projectorFullscreen },
            React.createElement(Display, { sourceId: sourceId, renderingMode: renderingMode, style: { flexGrow: 1 } }))),
        !fullscreen && (React.createElement(ModalLayout, { bodyStyle: { padding: 0 }, hideFooter: true },
            React.createElement("div", { className: styles.projectorWindowed },
                React.createElement(Scrollable, { className: styles.buttonContainer, style: { height: 40 } },
                    React.createElement("div", { className: styles.projectorButtons }, remote.screen.getAllDisplays().map((display, idx) => (React.createElement("button", { className: "button button--trans", key: display.id, onClick: () => enterFullscreen(display) },
                        "Fullscreen Display ",
                        idx + 1,
                        ": ",
                        display.size.width,
                        "x",
                        display.size.height))))),
                React.createElement(Display, { sourceId: sourceId, renderingMode: renderingMode }))))));
}
//# sourceMappingURL=Projector.js.map