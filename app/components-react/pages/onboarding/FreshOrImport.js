var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { Tooltip } from 'antd';
import { useModule } from 'slap';
import KevinSvg from 'components-react/shared/KevinSvg';
import React from 'react';
import { $t } from 'services/i18n';
import { $i } from 'services/utils';
import styles from './FreshOrImport.m.less';
import commonStyles from './Common.m.less';
import ObsSvg from './ObsSvg';
import { OnboardingModule } from './Onboarding';
import PlatformLogo from 'components-react/shared/PlatformLogo';
import { Services } from 'components-react/service-provider';
export function FreshOrImport() {
    const { setImportFromObs, next, setImportFromTwitch } = useModule(OnboardingModule);
    const { TwitchStudioImporterService } = Services;
    const optionsMetadata = [
        {
            title: $t('Import from OBS Studio'),
            color: '--blue',
            description: $t('We import all of your settings, including scenes, output, configurations, and much more'),
            image: React.createElement(ObsSvg, null),
            onClick: () => {
                setImportFromObs();
                next();
            },
        },
        {
            title: $t('Import from Twitch Studio'),
            color: '--twitch',
            description: $t('Import your scenes and sources from Twitch Studio.'),
            image: React.createElement(PlatformLogo, { platform: "twitch", size: 150 }),
            onClick: () => __awaiter(this, void 0, void 0, function* () {
                setImportFromTwitch();
                next();
            }),
        },
        {
            title: $t('Start Fresh'),
            color: '--teal',
            description: $t('Start with a clean copy of Streamlabs Desktop and configure your settings from scratch'),
            image: React.createElement(KevinSvg, null),
            onClick: next,
        },
    ];
    return (React.createElement("div", { className: styles.container },
        React.createElement("div", { className: styles.footer },
            React.createElement(SvgBackground, null),
            React.createElement("img", { src: $i('images/onboarding/splash.png') })),
        React.createElement("div", { className: styles.contentContainer },
            React.createElement("h1", { className: styles.title }, $t('1-Click Import')),
            React.createElement("div", { className: styles.optionContainer }, optionsMetadata.map(data => (React.createElement(Tooltip, { title: data.description, placement: "bottom", key: data.title },
                React.createElement("div", { className: commonStyles.optionCard, onClick: () => data.onClick(), style: { background: `var(${data.color})` } },
                    data.image,
                    React.createElement("h2", { style: {
                            color: data.color === '--teal' ? 'var(--action-button-text)' : undefined,
                        } }, data.title)))))))));
}
const SvgBackground = () => (React.createElement("svg", { width: "100%", height: "100%", viewBox: "0 0 1083 720", xmlns: "http://www.w3.org/2000/svg" },
    React.createElement("path", { d: "M918.999 140.5C971.667 9.75951 1187.91 -68.6629 1230.5 -54.9996L1253.58 124.762L1253.58 819.511L-0.000563148 726C81.0237 473.471 374.649 724.719 519 457C604.999 297.5 776.499 494.238 918.999 140.5Z" })));
//# sourceMappingURL=FreshOrImport.js.map