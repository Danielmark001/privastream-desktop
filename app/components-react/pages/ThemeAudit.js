var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import React, { useEffect, useState } from 'react';
import execa from 'execa';
import cx from 'classnames';
import { Services } from 'components-react/service-provider';
import { FFPROBE_EXE } from 'services/highlighter/constants';
import { pmap } from 'util/pmap';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import Scrollable from 'components-react/shared/Scrollable';
import styles from './ThemeAudit.m.less';
import groupBy from 'lodash/groupBy';
import { Tabs, Modal } from 'antd';
import Display from 'components-react/shared/Display';
import { useVuex } from 'components-react/hooks';
class MediaFileReader {
    constructor(filePath) {
        this.filePath = filePath;
    }
    readInfo() {
        return __awaiter(this, void 0, void 0, function* () {
            const { stdout } = yield execa(FFPROBE_EXE, [
                '-v',
                'error',
                '-select_streams',
                'v:0',
                '-show_entries',
                'stream=width,height,r_frame_rate : format=duration',
                '-of',
                'json',
                this.filePath,
            ]);
            const result = JSON.parse(stdout);
            return {
                width: result.streams[0].width,
                height: result.streams[0].height,
                duration: result.format.duration,
                fps: result.streams[0].r_frame_rate,
            };
        });
    }
}
function readMediaInfo() {
    return __awaiter(this, void 0, void 0, function* () {
        const { ScenesService } = Services;
        const info = yield pmap(ScenesService.views.getSceneItems().filter(s => s.type === 'ffmpeg_source'), (sceneItem) => __awaiter(this, void 0, void 0, function* () {
            const source = sceneItem.getSource();
            const reader = new MediaFileReader(source.getSettings().local_file);
            const info = yield reader.readInfo();
            return {
                width: parseInt(info.width, 10),
                height: parseInt(info.height, 10),
                duration: parseFloat(info.duration),
                fps: parseInt(info.fps.split('/')[0], 10) / parseInt(info.fps.split('/')[1], 10),
                name: source.name,
                id: source.sourceId,
                scene: sceneItem.getScene().name,
            };
        }));
        return info;
    });
}
export default function ThemeAudit(p) {
    var _a;
    const { SceneCollectionsService, ScenesService, SourcesService, TransitionsService, PerformanceService, SettingsService, } = Services;
    const [mediaInfo, setMediaInfo] = useState(null);
    const [inspectedSource, setInspectedSource] = useState(null);
    const v = useVuex(() => ({
        cpu: PerformanceService.views.cpuPercent,
    }));
    useEffect(() => {
        readMediaInfo().then(info => setMediaInfo(info));
    }, []);
    useEffect(() => {
        const currentValue = SettingsService.views.values.Advanced.fileCaching;
        SettingsService.actions.setSettingsPatch({ Advanced: { fileCaching: false } });
        return () => {
            SettingsService.actions.setSettingsPatch({ Advanced: { fileCaching: currentValue } });
        };
    }, []);
    const grouped = groupBy(mediaInfo !== null && mediaInfo !== void 0 ? mediaInfo : [], s => s.scene);
    const sources = SourcesService.views.sources;
    const sourceCount = sources.length;
    const hasWebcam = !!sources.find(s => s.type === 'dshow_input');
    const hasGameCapture = !!sources.find(s => s.type === 'game_capture');
    function renderStat(label, displayValue, type) {
        const color = {
            OK: 'inherit',
            WARN: 'var(--info)',
            CRITICAL: 'var(--red)',
        }[type];
        return (React.createElement("span", { style: { color, marginRight: 8 } },
            ['WARN', 'CRITICAL'].includes(type) && React.createElement(ExclamationCircleOutlined, { style: { color } }),
            ' ',
            React.createElement("b", null,
                label,
                ":"),
            " ",
            displayValue));
    }
    function renderNumericStat(label, displayValue, numericValue, thresholds) {
        let type = 'OK';
        if (numericValue > thresholds[0])
            type = 'WARN';
        if (numericValue > thresholds[1])
            type = 'CRITICAL';
        return renderStat(label, displayValue, type);
    }
    function inspect(sourceId) {
        setInspectedSource(sourceId);
        if (sourceId) {
            TransitionsService.inspectSource(sourceId);
        }
        else {
            TransitionsService.cancelInspectSource();
        }
    }
    return (React.createElement("div", { style: { width: '100%', display: 'flex' }, className: cx(styles.themeAuditRoot, p.className) },
        React.createElement(Scrollable, { style: { flexGrow: 1, padding: 20 } },
            React.createElement("h1", null,
                "Theme Audit: ", (_a = SceneCollectionsService.activeCollection) === null || _a === void 0 ? void 0 :
                _a.name),
            React.createElement(Tabs, null,
                React.createElement(Tabs.TabPane, { tab: "Overview", key: "overview" },
                    React.createElement("div", { className: "section" },
                        React.createElement("h2", null, "Overall Stats"),
                        React.createElement("div", null, renderNumericStat('Source Count', sourceCount, sourceCount, [49, 99])),
                        React.createElement("div", null, renderStat('Webcam', hasWebcam ? 'Present' : 'Missing', hasWebcam ? 'OK' : 'CRITICAL')),
                        React.createElement("div", null, renderStat('Game Capture', hasGameCapture ? 'Present' : 'Missing', hasGameCapture ? 'OK' : 'CRITICAL')))),
                React.createElement(Tabs.TabPane, { tab: "Media Sources", key: "media" },
                    mediaInfo && (React.createElement("div", null, ScenesService.views.scenes.map(scene => {
                        var _a, _b, _c;
                        return (React.createElement("div", { key: scene.name, className: "section" },
                            React.createElement("h3", null, scene.name),
                            React.createElement("div", null, renderNumericStat('Media Source Count', ((_a = grouped[scene.name]) !== null && _a !== void 0 ? _a : []).length.toString(), ((_b = grouped[scene.name]) !== null && _b !== void 0 ? _b : []).length, [2, 4])),
                            ((_c = grouped[scene.name]) !== null && _c !== void 0 ? _c : []).map(info => (React.createElement("div", { key: info.id, style: { padding: '5px 0' } },
                                React.createElement("i", { className: "fas fa-film" }),
                                " ",
                                React.createElement("b", null, info.name),
                                React.createElement("button", { className: "button button--trans", onClick: () => inspect(info.id) }, "Inspect"),
                                React.createElement("br", null),
                                renderNumericStat('Resolution', `${info.width} x ${info.height}`, info.width * info.height, [1280 * 720 - 1, 1920 * 1080 - 1]),
                                renderNumericStat('FPS', info.fps.toFixed(2), info.fps, [30, 59]),
                                renderNumericStat('Duration', info.duration.toFixed(2), info.duration, [
                                    10,
                                    18,
                                ]))))));
                    }))),
                    mediaInfo == null && React.createElement("div", null, "Loading..."))),
            React.createElement(Modal, { visible: !!inspectedSource, destroyOnClose: true, closable: false, onCancel: () => inspect(null), onOk: () => inspect(null), width: 780 }, inspectedSource && (React.createElement("div", null,
                React.createElement("div", { style: { height: 400 } },
                    React.createElement(Display, { sourceId: inspectedSource })),
                React.createElement("div", { style: { fontSize: 48 } },
                    "CPU: ",
                    v.cpu,
                    "%")))))));
}
//# sourceMappingURL=ThemeAudit.js.map