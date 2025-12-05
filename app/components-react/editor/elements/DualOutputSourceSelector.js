import React, { useMemo, useState } from 'react';
import { Services } from 'components-react/service-provider';
import { useVuex } from 'components-react/hooks';
import { SourceSelectorCtx } from './SourceSelector';
import { Tooltip } from 'antd';
import { $t } from 'services/i18n';
import { useController } from 'components-react/hooks/zustand';
export function DualOutputSourceSelector(p) {
    const { toggleVisibility, makeActive, horizontalActive, verticalActive } = useController(SourceSelectorCtx);
    const { DualOutputService } = Services;
    const [hoveredIcon, setHoveredIcon] = useState('');
    const v = useVuex(() => ({
        verticalNodeId: DualOutputService.views.verticalNodeIds && horizontalActive
            ? DualOutputService.views.activeSceneNodeMap[p.nodeId]
            : p.nodeId,
        isHorizontalVisible: DualOutputService.views.getIsHorizontalVisible(p.nodeId, p === null || p === void 0 ? void 0 : p.sceneId),
        isVerticalVisible: DualOutputService.views.getIsVerticalVisible(p.nodeId, p === null || p === void 0 ? void 0 : p.sceneId),
    }));
    const showHorizontalToggle = horizontalActive;
    const showVerticalToggle = v.verticalNodeId && verticalActive;
    const horizontalToggleMessage = useMemo(() => {
        return v.isHorizontalVisible ? $t('Hide from Horizontal') : $t('Show in Horizontal');
    }, [v.isHorizontalVisible]);
    const verticalToggleMessage = useMemo(() => {
        return v.isVerticalVisible ? $t('Hide from Vertical') : $t('Show in Vertical');
    }, [v.isVerticalVisible]);
    return (React.createElement(React.Fragment, null,
        showHorizontalToggle && (React.createElement(Tooltip, { title: horizontalToggleMessage, placement: "left", visible: ['icon-desktop', 'icon-desktop-hide'].includes(hoveredIcon) },
            React.createElement("i", { onClick: () => {
                    toggleVisibility(p.nodeId);
                    makeActive(p.nodeId);
                }, className: v.isHorizontalVisible ? 'icon-desktop' : 'icon-desktop-hide', style: { marginRight: '8px' }, onMouseEnter: () => setHoveredIcon(v.isVerticalVisible ? 'icon-desktop' : 'icon-desktop-hide'), onMouseLeave: () => setHoveredIcon('') }))),
        showVerticalToggle && (React.createElement(Tooltip, { title: verticalToggleMessage, placement: "left", visible: ['icon-phone-case', 'icon-phone-case-hide'].includes(hoveredIcon) },
            React.createElement("i", { onClick: () => {
                    toggleVisibility(v.verticalNodeId);
                    makeActive(v.verticalNodeId);
                }, className: v.isVerticalVisible ? 'icon-phone-case' : 'icon-phone-case-hide', style: { marginRight: '8px' }, onMouseEnter: () => setHoveredIcon(v.isVerticalVisible ? 'icon-phone-case' : 'icon-phone-case-hide'), onMouseLeave: () => setHoveredIcon('') })))));
}
//# sourceMappingURL=DualOutputSourceSelector.js.map