var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { message } from 'antd';
import { useVuex } from 'components-react/hooks';
import { Services } from 'components-react/service-provider';
import { SliderInput, SwitchInput } from 'components-react/shared/inputs';
import React, { useState } from 'react';
import { $t } from 'services/i18n/index';
export function GameOverlay() {
    const { GameOverlayService } = Services;
    const { opacity, enabled, previewMode, windowProperties } = useVuex(() => ({
        opacity: GameOverlayService.state.opacity,
        enabled: GameOverlayService.state.isEnabled,
        previewMode: GameOverlayService.state.previewMode,
        windowProperties: GameOverlayService.state.windowProperties,
    }));
    const [enabling, setEnabling] = useState(false);
    function enableGameOverlay(val) {
        return __awaiter(this, void 0, void 0, function* () {
            setEnabling(true);
            try {
                yield GameOverlayService.actions.return.setEnabled(val);
            }
            catch (e) {
                message.error($t('Please log in to use the in-game overlay.'), 3);
            }
            setEnabling(false);
        });
    }
    function togglePreviewMode() {
        GameOverlayService.actions.setPreviewMode(!previewMode);
    }
    function setOpacity(value) {
        GameOverlayService.actions.setOverlayOpacity(value);
    }
    function resetPosition() {
        GameOverlayService.actions.resetPosition();
    }
    const sliderMetadata = {
        label: $t('Overlay Opacity'),
        min: 0,
        max: 100,
        step: 10,
        tipFormatter: (val) => `${val}%`,
        debounce: 500,
    };
    function WindowEnableToggles() {
        const titles = { chat: $t('Show Chat'), recentEvents: $t('Show Recent Events') };
        const windows = Object.keys(windowProperties);
        return (React.createElement("div", null, windows.map(win => (React.createElement(React.Fragment, { key: titles[win] },
            React.createElement(SwitchInput, { label: titles[win], value: windowProperties[win].enabled, onInput: () => GameOverlayService.actions.toggleWindowEnabled(win) }))))));
    }
    function ExtraOptions() {
        return (React.createElement("div", null,
            React.createElement(SwitchInput, { value: previewMode, onInput: togglePreviewMode, label: $t('Toggle positioning mode') }),
            React.createElement(SliderInput, Object.assign({ value: opacity, onChange: setOpacity }, sliderMetadata)),
            React.createElement("button", { className: "button button--action", onClick: resetPosition, style: { marginBottom: '16px' } }, $t('Reset Overlay Position'))));
    }
    return (React.createElement("div", { className: "section" }, !enabling && (React.createElement("div", { className: "section-content" },
        React.createElement(SwitchInput, { value: enabled, onInput: enableGameOverlay, label: $t('Enable in-game overlay') }),
        enabled && React.createElement(WindowEnableToggles, null),
        enabled && React.createElement(ExtraOptions, null),
        React.createElement("div", { style: { marginBottom: '16px' } }, $t('Set a hotkey in Hotkey Settings to toggle the in-game overlay')),
        React.createElement("div", { style: { marginBottom: '16px' } }, $t('The in-game overlay is a new experimental feature that allows you to view chat and events ' +
            'overlayed on top of your game.  This overlay may not work with certain games running in exclusive ' +
            'fullscreen mode.  For best results, we recommend running your game in windowed-fullscreen mode.'))))));
}
//# sourceMappingURL=GameOverlay.js.map