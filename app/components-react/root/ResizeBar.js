import React from 'react';
import { Resizable } from 'react-resizable';
import cx from 'classnames';
import styles from './ResizeBar.m.less';
import { Services } from 'components-react/service-provider';
import { useVuex } from 'components-react/hooks';
export default function ResizeBar(p) {
    var _a;
    const { WindowsService } = Services;
    const v = useVuex(() => ({
        hideStyleBlockers: WindowsService.state.main.hideStyleBlockers,
    }));
    let resizableProps;
    if (p.position === 'top') {
        resizableProps = {
            width: Infinity,
            height: p.value,
            resizeHandles: ['n'],
            minConstraints: [Infinity, p.min],
            maxConstraints: [Infinity, p.max],
            axis: 'y',
        };
    }
    else {
        resizableProps = {
            height: Infinity,
            width: p.value,
            resizeHandles: [p.position === 'left' ? 'e' : 'w'],
            minConstraints: [p.min, Infinity],
            maxConstraints: [p.max, Infinity],
            axis: 'x',
        };
    }
    function handleResize(callback) {
        return (e, data) => {
            const value = p.position === 'top' ? data.size.height : data.size.width;
            callback(value);
        };
    }
    function resizeStart(val) {
        WindowsService.actions.updateStyleBlockers('main', true);
        if (p.onResizestart) {
            p.onResizestart(val);
        }
    }
    function resizeStop(val) {
        WindowsService.actions.updateStyleBlockers('main', false);
        if (p.onResizestop) {
            p.onResizestop(val);
        }
    }
    return (React.createElement(Resizable, Object.assign({ onResizeStart: handleResize(resizeStart), onResizeStop: handleResize(resizeStop), onResize: handleResize(p.onInput), transformScale: (_a = p.transformScale) !== null && _a !== void 0 ? _a : 2 }, resizableProps, { handle: React.createElement("div", { className: cx(styles.resizeBar, styles[p.position], p.className, {
                [styles.unset]: v.hideStyleBlockers,
            }) },
            React.createElement("div", { className: styles.resizeLine })) }), p.children));
}
//# sourceMappingURL=ResizeBar.js.map