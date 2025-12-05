var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { Button } from 'antd';
import React, { useState } from 'react';
import { $t } from 'services/i18n';
import { $i } from 'services/utils';
import styles from './StreamingOrRecording.m.less';
import { OnboardingModule } from './Onboarding';
import cx from 'classnames';
import { confirmAsync } from 'components-react/modals';
import { useModule } from 'slap';
export function StreamingOrRecording() {
    const { next, setRecordingMode, UsageStatisticsService, isRecordingModeEnabled } = useModule(OnboardingModule);
    const [active, setActive] = useState(null);
    function onContinue() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!active)
                return;
            if (active === 'recording') {
                const result = yield confirmAsync({
                    title: $t('Streamlabs will be optimized for recording'),
                    content: (React.createElement("p", null, $t('Certain features related to live streaming will be hidden. If you would like to enable these features in the future, you can disable Recording Mode in the application settings.'))),
                    okText: $t('Continue'),
                });
                if (!result)
                    return;
                setRecordingMode(true);
            }
            if (active === 'streaming' && isRecordingModeEnabled) {
                setRecordingMode(false);
            }
            UsageStatisticsService.actions.recordClick('StreamingOrRecording', active);
            next();
        });
    }
    const shouldShowContinue = active === 'streaming' || active === 'recording';
    return (React.createElement("div", null,
        React.createElement("div", { className: styles.footer },
            React.createElement(SvgBackground, null),
            React.createElement("img", { src: $i('images/onboarding/splash.png') })),
        React.createElement("div", { className: styles.titleContainer },
            React.createElement("h1", { className: styles.title }, $t('Welcome to Streamlabs!')),
            React.createElement("div", null,
                React.createElement("h3", { className: styles.subtitle }, $t('How do you plan to use Streamlabs Desktop?')),
                React.createElement("div", { className: styles.optionContainer },
                    React.createElement("div", { className: cx(styles.option, { [styles.active]: active === 'streaming' }), onClick: () => setActive('streaming') },
                        React.createElement("i", { className: "icon-broadcast" }),
                        React.createElement("h2", null, $t('Live Streaming'))),
                    React.createElement("div", { className: cx(styles.option, { [styles.active]: active === 'recording' }), onClick: () => setActive('recording') },
                        React.createElement("i", { className: "icon-studio" }),
                        React.createElement("h2", null, $t('Recording Only'))))),
            React.createElement("div", { className: cx(styles.buttonContainer, { [styles.active]: shouldShowContinue }) },
                React.createElement(Button, { type: "primary", shape: "round", style: { width: 200, height: 60, fontSize: 16 }, disabled: !active, onClick: onContinue }, $t('Continue'))))));
}
const SvgBackground = () => (React.createElement("svg", { width: "100%", height: "100%", viewBox: "0 0 900 720", xmlns: "http://www.w3.org/2000/svg" },
    React.createElement("path", { d: "M918.999 140.5C971.667 9.75951 1187.91 -68.6629 1230.5 -54.9996L1253.58 124.762L1253.58 819.511L-0.000563148 726C81.0237 473.471 374.649 724.719 519 457C604.999 297.5 776.499 494.238 918.999 140.5Z" })));
//# sourceMappingURL=StreamingOrRecording.js.map