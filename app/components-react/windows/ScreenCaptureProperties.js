var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import React, { useMemo, useState, useEffect } from 'react';
import electron from 'electron';
import { Services } from 'components-react/service-provider';
import styles from './ScreenCaptureProperties.m.less';
import { ModalLayout } from 'components-react/shared/ModalLayout';
import Display from 'components-react/shared/Display';
import cx from 'classnames';
import { $t } from 'services/i18n';
import { Modal, Button, Form, Tooltip } from 'antd';
import { CheckboxInput } from 'components-react/shared/inputs';
import * as remote from '@electron/remote';
import { useChildWindowParams } from 'components-react/hooks';
function useCaptureSource(sourceId) {
    var _a;
    const { SourcesService, EditorCommandsService } = Services;
    const source = SourcesService.views.getSource(sourceId);
    const settings = useMemo(() => source.getSettings(), []);
    const [options, setOptions] = useState([]);
    const [selectedOption, setSelectedOption] = useState(settings['capture_source_list']);
    const [captureCursor, setCaptureCursor] = useState((_a = settings['capture_cursor']) !== null && _a !== void 0 ? _a : true);
    function buildSetter(source, field, stateSetter) {
        return (val) => {
            stateSetter(val);
            EditorCommandsService.actions.executeCommand('EditSourceSettingsCommand', source.sourceId, {
                [field]: val,
            });
        };
    }
    useEffect(() => {
        (() => __awaiter(this, void 0, void 0, function* () {
            const windows = yield electron.ipcRenderer.invoke('DESKTOP_CAPTURER_GET_SOURCES', {
                types: ['window'],
                fetchWindowIcons: true,
            });
            const windowOptions = windows.map(win => {
                var _a;
                const opt = {
                    description: win.name,
                    value: win.id,
                    thumbnail: win.thumbnail.toDataURL(),
                    icon: (_a = win.appIcon) === null || _a === void 0 ? void 0 : _a.toDataURL(),
                    type: 'window',
                };
                return opt;
            });
            const screenData = yield electron.ipcRenderer.invoke('DESKTOP_CAPTURER_GET_SOURCES', { types: ['screen'] });
            const screenOptions = remote.screen.getAllDisplays().map((screen, index) => {
                var _a, _b;
                const opt = {
                    description: `Screen ${index + 1}`,
                    value: `monitor:${index}`,
                    thumbnail: (_b = (_a = screenData
                        .find(s => s.display_id === screen.id.toString())) === null || _a === void 0 ? void 0 : _a.thumbnail) === null || _b === void 0 ? void 0 : _b.toDataURL(),
                    type: 'screen',
                };
                return opt;
            });
            const gameOptions = [
                {
                    description: $t('Automatic'),
                    value: 'game:1',
                    type: 'game',
                },
            ];
            setOptions([...gameOptions, ...screenOptions, ...windowOptions]);
        }))();
    }, []);
    return {
        selectedOption,
        setSelectedOption: buildSetter(source, 'capture_source_list', setSelectedOption),
        options,
        captureCursor,
        setCaptureCursor: buildSetter(source, 'capture_cursor', setCaptureCursor),
    };
}
export default function ScreenCaptureProperties() {
    const { WindowsService } = Services;
    const sourceId = useChildWindowParams('sourceId');
    const sourceApi = useCaptureSource(sourceId);
    const [modal, setModal] = useState(false);
    function renderThumbnail(opt) {
        if (opt.thumbnail)
            return React.createElement("img", { src: opt.thumbnail });
        if (opt.type === 'game') {
            return React.createElement("i", { className: cx('fas fa-gamepad', styles.captureItemThumbnailIcon) });
        }
        return React.createElement("i", { className: cx('fas fa-desktop', styles.captureItemThumbnailIcon) });
    }
    function renderCaptureOption(opt) {
        return (React.createElement("div", { className: cx(styles.captureItem, {
                [styles.captureItemSelected]: sourceApi.selectedOption === opt.value,
            }), key: opt.value, onClick: () => sourceApi.setSelectedOption(opt.value) },
            renderThumbnail(opt),
            React.createElement("div", { className: styles.captureItemThumbnailOverlay }),
            React.createElement("div", { className: styles.captureItemText },
                opt.type === 'screen' && React.createElement("i", { className: "fas fa-desktop", style: { marginRight: 8 } }),
                opt.type === 'game' && React.createElement("i", { className: "fas fa-gamepad", style: { marginRight: 8 } }),
                opt.type === 'window' && React.createElement("img", { src: opt.icon }),
                React.createElement("span", { className: styles.captureItemDescription }, opt.description),
                opt.value === 'game:1' && (React.createElement(Tooltip, { title: $t('Automatic game capture will scan for running games and automatically capture them.') },
                    React.createElement("i", { className: "fas fa-question-circle", style: { marginLeft: 8 } }))))));
    }
    function renderFooter() {
        return (React.createElement(React.Fragment, null,
            React.createElement("span", { className: styles.additionalSettings, onClick: () => setModal(true) }, $t('Show Additional Settings')),
            React.createElement(Button, { type: "primary", onClick: () => WindowsService.actions.closeChildWindow() }, $t('Done'))));
    }
    return (React.createElement(ModalLayout, { scrollable: true, fixedChild: modal ? React.createElement("div", null) : React.createElement(Display, { sourceId: sourceId }), footer: renderFooter() },
        React.createElement("div", null,
            sourceApi.options.length === 0 && (React.createElement("div", { className: styles.captureListLoading },
                React.createElement("i", { className: "fa fa-spinner fa-pulse" }))),
            sourceApi.options.length > 0 && (React.createElement(React.Fragment, null,
                React.createElement("h2", null, $t('Capture Game')),
                React.createElement("div", { className: styles.captureList }, sourceApi.options.filter(opt => opt.type === 'game').map(renderCaptureOption)),
                React.createElement("h2", null, $t('Capture Entire Screen')),
                React.createElement("div", { className: styles.captureList }, sourceApi.options.filter(opt => opt.type === 'screen').map(renderCaptureOption)),
                React.createElement("h2", null, $t('Capture Window')),
                React.createElement("div", { className: styles.captureList }, sourceApi.options.filter(opt => opt.type === 'window').map(renderCaptureOption))))),
        React.createElement(Modal, { footer: null, visible: modal, onCancel: () => setModal(false), getContainer: false },
            React.createElement("h2", null, "Additional Settings"),
            React.createElement(Form, null,
                React.createElement(CheckboxInput, { label: $t('Capture Cursor'), value: sourceApi.captureCursor, onChange: sourceApi.setCaptureCursor })))));
}
//# sourceMappingURL=ScreenCaptureProperties.js.map