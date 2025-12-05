import React, { useState, useEffect, useMemo } from 'react';
import { Services } from '../../service-provider';
import HotkeyGroup from './HotkeyGroup';
import { $t } from '../../../services/i18n';
import mapValues from 'lodash/mapValues';
import Fuse from 'fuse.js';
import Tooltip from 'components-react/shared/Tooltip';
import { getOS, OS } from 'util/operating-systems';
import * as remote from '@electron/remote';
function hasHotkeys(hotkeyDict) {
    return Object.values(hotkeyDict).some(hotkeys => hotkeys.length);
}
const mkFilterHotkeys = (searchString) => (hotkeys) => {
    return new Fuse(hotkeys, {
        keys: ['description', 'categoryName'],
        threshold: 0.4,
        shouldSort: true,
    }).search(searchString);
};
const setCategoryNameFrom = (srcOrScene) => (hotkey) => {
    if (!(srcOrScene === null || srcOrScene === void 0 ? void 0 : srcOrScene.name))
        return hotkey;
    hotkey.categoryName = srcOrScene.name;
    return hotkey;
};
export function Hotkeys(props) {
    const { globalSearchStr: searchString } = props;
    const { HotkeysService, SourcesService, ScenesService, DualOutputService } = Services;
    const [hotkeySet, setHotkeysSet] = useState(null);
    useEffect(() => {
        let isMounted = true;
        if (!hotkeySet) {
            HotkeysService.actions.unregisterAll();
            HotkeysService.actions.return.getHotkeysSet().then((hotkeys) => {
                if (!isMounted)
                    return;
                setHotkeysSet(hotkeys);
            });
        }
        return () => {
            if (hotkeySet) {
                HotkeysService.actions.applyHotkeySet(hotkeySet);
            }
            isMounted = false;
        };
    }, [hotkeySet]);
    const emptyHotkeySet = {
        general: {},
        sources: {},
        scenes: {},
        markers: {},
    };
    const augmentedHotkeySet = useMemo(() => {
        if (!hotkeySet) {
            return emptyHotkeySet;
        }
        return {
            general: hotkeySet.general,
            sources: mapValues(hotkeySet.sources, (hotkeys, sourceId) => {
                return hotkeys.map(setCategoryNameFrom(SourcesService.views.getSource(sourceId)));
            }),
            scenes: mapValues(hotkeySet.scenes, (hotkeys, sceneId) => {
                return hotkeys.map(setCategoryNameFrom(ScenesService.views.getScene(sceneId)));
            }),
            markers: hotkeySet.markers,
        };
    }, [hotkeySet]);
    const filteredHotkeySet = useMemo(() => {
        if (!hotkeySet) {
            return emptyHotkeySet;
        }
        const filterHotkeys = mkFilterHotkeys(searchString);
        const filteredHotkeySet = searchString
            ? {
                general: filterHotkeys(augmentedHotkeySet.general),
                sources: mapValues(augmentedHotkeySet.sources, filterHotkeys),
                scenes: mapValues(augmentedHotkeySet.scenes, filterHotkeys),
                markers: filterHotkeys(augmentedHotkeySet.markers),
            }
            : augmentedHotkeySet;
        return filteredHotkeySet;
    }, [augmentedHotkeySet, searchString]);
    if (!hotkeySet) {
        return React.createElement("div", null);
    }
    const isSearch = !!searchString;
    const isDualOutputMode = DualOutputService.views.dualOutputMode;
    const generalHotkeys = filteredHotkeySet.general;
    const hasGeneralHotkeys = !!generalHotkeys.length;
    const sceneHotkeys = filteredHotkeySet.scenes;
    const hasSceneHotkeys = hasHotkeys(sceneHotkeys);
    const sourceHotkeys = filteredHotkeySet.sources;
    const hasSourceHotkeys = hasHotkeys(sourceHotkeys);
    const markerHotkeys = filteredHotkeySet.markers;
    const hasMarkers = !!markerHotkeys.length;
    function renderHotkeyGroup(id, hotkeys, title, isDualOutputScene = false) {
        return (React.createElement(HotkeyGroup, { key: id, title: title, hotkeys: hotkeys, isSearch: isSearch, hasSceneHotkeys: hasSceneHotkeys, isDualOutputMode: isDualOutputMode, isDualOutputScene: isDualOutputScene }));
    }
    function renderScenesHotkeyGroup(sceneId) {
        const sceneHotkeys = filteredHotkeySet.scenes[sceneId];
        const scene = ScenesService.views.getScene(sceneId);
        const isDualOutputScene = scene === null || scene === void 0 ? void 0 : scene.getIsDualOutputScene();
        return scene ? renderHotkeyGroup(sceneId, sceneHotkeys, scene.name, isDualOutputScene) : null;
    }
    function renderSourcesHotkeyGroup(sourceId) {
        const sourceHotkeys = filteredHotkeySet.sources[sourceId];
        const source = SourcesService.views.getSource(sourceId);
        return source ? renderHotkeyGroup(sourceId, sourceHotkeys, source.name) : null;
    }
    function openMarkersInfoPage() {
        remote.shell.openExternal('https://streamlabs.com/content-hub/post/bookmarking-for-streamlabs-desktop');
    }
    return (React.createElement("div", null,
        hasGeneralHotkeys && (React.createElement(React.Fragment, null,
            getOS() === OS.Mac && (React.createElement("div", { style: { display: 'flex', alignItems: 'center' } },
                React.createElement("h2", null, $t('Hotkeys')),
                React.createElement(Tooltip, { title: $t('To use hotkeys on Mac, go to System Settings > Security > Accessibility and toggle on for Streamlabs Desktop.'), lightShadow: true, wrapperStyle: { marginBottom: '4px' }, placement: "leftTop" },
                    React.createElement("i", { className: "icon-information", style: { padding: '0 0 4px 5px' } })))),
            React.createElement(HotkeyGroup, { hotkeys: generalHotkeys, isSearch: isSearch, title: null, isDualOutputMode: isDualOutputMode }))),
        hasSceneHotkeys && (React.createElement(React.Fragment, null,
            React.createElement("h2", null, $t('Scenes')),
            Object.keys(sceneHotkeys).map(renderScenesHotkeyGroup))),
        hasSourceHotkeys && (React.createElement(React.Fragment, null,
            React.createElement("h2", null, $t('Sources')),
            Object.keys(sourceHotkeys).map(renderSourcesHotkeyGroup))),
        hasMarkers && (React.createElement(React.Fragment, null,
            React.createElement("div", { style: { display: 'flex', justifyContent: 'space-between' } },
                React.createElement("h2", null, $t('Markers')),
                React.createElement("a", { onClick: openMarkersInfoPage, style: {
                        fontWeight: 'normal',
                        textDecoration: 'underline',
                        color: 'var(--paragraph)',
                    } }, $t('Learn more here'))),
            React.createElement(HotkeyGroup, { hotkeys: markerHotkeys, isSearch: isSearch, title: null, isDualOutputMode: isDualOutputMode })))));
}
//# sourceMappingURL=Hotkeys.js.map