import React, { useRef, useMemo } from 'react';
import useBaseElement from './hooks';
import { Tooltip } from 'antd';
import { useVuex } from 'components-react/hooks';
import Scrollable from 'components-react/shared/Scrollable';
import GLVolmeters from './mixer/GLVolmeters';
import MixerItem from './mixer/MixerItem';
import { Services } from 'components-react/service-provider';
import { Menu } from 'util/menus/Menu';
import { $t } from 'services/i18n';
import { useRealmObject } from 'components-react/hooks/realm';
const mins = { x: 150, y: 120 };
export function Mixer() {
    const { EditorCommandsService, AudioService, CustomizationService, WindowsService } = Services;
    const containerRef = useRef(null);
    const { renderElement } = useBaseElement(React.createElement(Element, null), mins, containerRef.current);
    const needToRenderVolmeters = useMemo(() => {
        const canvas = document.createElement('canvas');
        return !canvas.getContext('webgl');
    }, []);
    const performanceMode = useRealmObject(CustomizationService.state).performanceMode;
    const { audioSourceIds, hideStyleBlockers } = useVuex(() => ({
        audioSourceIds: AudioService.views.sourcesForCurrentScene
            .filter(source => !source.mixerHidden && source.isControlledViaObs)
            .map(source => source.sourceId),
        hideStyleBlockers: WindowsService.state.main.hideStyleBlockers,
    }));
    function showAdvancedSettings() {
        AudioService.actions.showAdvancedSettings();
    }
    function handleRightClick() {
        const menu = new Menu();
        menu.append({
            label: $t('Unhide All'),
            click: () => EditorCommandsService.actions.executeCommand('UnhideMixerSourcesCommand'),
        });
        menu.popup();
    }
    function Element() {
        return (React.createElement(React.Fragment, null,
            React.createElement("div", { className: "studio-controls-top" },
                React.createElement(Tooltip, { title: $t('Monitor audio levels. If the bars are moving you are outputting audio.'), placement: "bottom" },
                    React.createElement("h2", { className: "studio-controls__label" }, $t('Mixer'))),
                React.createElement(Tooltip, { title: $t('Open advanced audio settings'), placement: "left" },
                    React.createElement("i", { className: "icon-settings icon-button", role: "show-advanced-audio", onClick: showAdvancedSettings }))),
            React.createElement(Scrollable, { className: "studio-controls-selector mixer-panel", style: { height: 'calc(100% - 32px)' } },
                React.createElement("div", { style: { position: 'relative' }, onContextMenu: handleRightClick },
                    audioSourceIds.length !== 0 && !performanceMode && React.createElement(GLVolmeters, null),
                    audioSourceIds.map(sourceId => (React.createElement(MixerItem, { key: sourceId, audioSourceId: sourceId, volmetersEnabled: needToRenderVolmeters })))))));
    }
    return (React.createElement("div", { ref: containerRef, style: { height: '100%' } }, renderElement()));
}
Mixer.mins = mins;
//# sourceMappingURL=Mixer.js.map