import { SwitchInput } from 'components-react/shared/inputs/SwitchInput';
import React, { useEffect, useState } from 'react';
import styles from './AiHighlighterToggle.m.less';
import { Services } from 'components-react/service-provider';
import { useDebounce, useVuex } from 'components-react/hooks';
import { DownOutlined, UpOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import { getConfigByGame, isGameSupported } from 'services/highlighter/models/game-config.models';
import { $t } from 'services/i18n';
import { DiscordLogo, InstagramLogo, TikTokLogo, YouTubeLogo, } from 'components-react/highlighter/ImportStream';
export default function AiHighlighterToggle({ game, cardIsExpanded, }) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
    const { HighlighterService } = Services;
    const { useHighlighter, highlighterVersion } = useVuex(() => {
        return {
            useHighlighter: HighlighterService.views.useAiHighlighter,
            highlighterVersion: HighlighterService.views.highlighterVersion,
        };
    });
    const [gameIsSupported, setGameIsSupported] = useState(false);
    const [gameConfig, setGameConfig] = useState(null);
    useEffect(() => {
        const supportedGame = isGameSupported(game);
        setGameIsSupported(!!supportedGame);
        if (supportedGame) {
            setIsExpanded(true);
            setGameConfig(getConfigByGame(supportedGame));
        }
        else {
            setGameConfig(null);
        }
    }, [game]);
    function getInitialExpandedState() {
        if (gameIsSupported) {
            return true;
        }
        else {
            if (useHighlighter) {
                return true;
            }
            else {
                return cardIsExpanded;
            }
        }
    }
    const initialExpandedState = getInitialExpandedState();
    const [isExpanded, setIsExpanded] = useState(initialExpandedState);
    const toggleHighlighter = useDebounce(300, HighlighterService.actions.toggleAiHighlighter);
    return (React.createElement("div", null, gameIsSupported ? (React.createElement("div", { key: 'aiSelector', style: {
            marginBottom: '24px',
            display: 'flex',
            justifyContent: 'flex-end',
            flexFlow: 'rowWrap',
            width: 'width: 100%',
            backgroundColor: 'var(--dark-background)',
            borderRadius: '8px',
        } },
        React.createElement("div", { style: { flexGrow: 0, backgroundColor: 'red' } }),
        React.createElement("div", { className: styles.aiHighlighterBox },
            React.createElement("div", { className: styles.coloredBlob, style: {
                    backgroundColor: `${(_a = gameConfig === null || gameConfig === void 0 ? void 0 : gameConfig.importModalConfig) === null || _a === void 0 ? void 0 : _a.accentColor}`,
                    opacity: isExpanded ? 0.5 : 1,
                    filter: isExpanded ? 'blur(74px)' : 'blur(44px)',
                } }),
            React.createElement("div", { className: styles.header },
                React.createElement("div", { className: styles.headlineWrapper },
                    React.createElement("div", { style: { display: 'flex', alignItems: 'center' } },
                        React.createElement("h3", { className: styles.headline, onClick: () => setIsExpanded(!isExpanded) }, $t('Get stream highlights!')),
                        highlighterVersion !== '' ? (React.createElement(SwitchInput, { style: { width: '80px', margin: 0, marginTop: '-2px' }, value: useHighlighter, label: "", onChange: toggleHighlighter })) : (React.createElement(Button, { style: { width: 'fit-content', marginLeft: '18px' }, size: "small", type: "primary", onClick: () => {
                                HighlighterService.installAiHighlighter(false, 'Go-live-flow', game);
                            } }, $t('Install AI Highlighter')))),
                    React.createElement("div", { onClick: () => setIsExpanded(!isExpanded), style: { cursor: 'pointer' } }, isExpanded ? (React.createElement(UpOutlined, { style: { color: '#BDC2C4' } })) : (React.createElement(DownOutlined, { style: { color: '#BDC2C4' } })))),
                React.createElement("div", { className: styles.headlineWrapper },
                    React.createElement("h2", { style: { fontSize: '14px', fontWeight: 300 } }, $t('Auto-generate game highlight reels of your stream')),
                    React.createElement("div", { className: styles.betaTag, style: { backgroundColor: `${(_b = gameConfig === null || gameConfig === void 0 ? void 0 : gameConfig.importModalConfig) === null || _b === void 0 ? void 0 : _b.accentColor}` } }, $t('Beta')))),
            isExpanded && (React.createElement(React.Fragment, null,
                React.createElement("div", { className: styles.expandedWrapper },
                    !useHighlighter ? (React.createElement("div", { style: { paddingTop: '88px', width: '100%', display: 'flex' } }, ((_c = gameConfig === null || gameConfig === void 0 ? void 0 : gameConfig.importModalConfig) === null || _c === void 0 ? void 0 : _c.horizontalExampleVideo) &&
                        ((_d = gameConfig === null || gameConfig === void 0 ? void 0 : gameConfig.importModalConfig) === null || _d === void 0 ? void 0 : _d.verticalExampleVideo) ? (React.createElement(React.Fragment, null,
                        React.createElement("div", { className: styles.plattformIcon, style: { top: '84px', left: '120px' } },
                            React.createElement(YouTubeLogo, null)),
                        React.createElement("div", { className: styles.plattformIcon, style: { top: '181px', left: '32px' } },
                            React.createElement(DiscordLogo, null)),
                        React.createElement("div", { className: styles.plattformIcon, style: { top: '85px', left: '283px' } },
                            React.createElement(TikTokLogo, null)),
                        React.createElement("div", { className: styles.plattformIcon, style: { top: '177px', left: '187px' } },
                            React.createElement(InstagramLogo, null)),
                        React.createElement("div", { className: styles.horizontalVideo, style: {
                                backgroundColor: (_e = gameConfig === null || gameConfig === void 0 ? void 0 : gameConfig.importModalConfig) === null || _e === void 0 ? void 0 : _e.backgroundColor,
                                borderColor: (_f = gameConfig === null || gameConfig === void 0 ? void 0 : gameConfig.importModalConfig) === null || _f === void 0 ? void 0 : _f.accentColor,
                                boxShadow: `0px 0px 42px -4px ${(_g = gameConfig === null || gameConfig === void 0 ? void 0 : gameConfig.importModalConfig) === null || _g === void 0 ? void 0 : _g.accentColor}30`,
                            } },
                            React.createElement("video", { muted: true, autoPlay: true, loop: true, style: { width: '100%' }, src: gameConfig.importModalConfig.horizontalExampleVideo })),
                        React.createElement("div", { className: styles.verticalVideo, style: {
                                backgroundColor: (_h = gameConfig === null || gameConfig === void 0 ? void 0 : gameConfig.importModalConfig) === null || _h === void 0 ? void 0 : _h.backgroundColor,
                                borderColor: (_j = gameConfig === null || gameConfig === void 0 ? void 0 : gameConfig.importModalConfig) === null || _j === void 0 ? void 0 : _j.accentColor,
                                boxShadow: `0px 0px 42px -4px ${(_k = gameConfig === null || gameConfig === void 0 ? void 0 : gameConfig.importModalConfig) === null || _k === void 0 ? void 0 : _k.accentColor}30`,
                            } },
                            ' ',
                            React.createElement("video", { muted: true, autoPlay: true, loop: true, style: { height: '100%' }, src: gameConfig.importModalConfig.verticalExampleVideo })))) : (React.createElement("div", { className: styles.image })))) : (React.createElement("div", { className: styles.educationSection },
                        React.createElement("div", null,
                            React.createElement("span", null, "\u26A0\uFE0F"),
                            React.createElement("span", null,
                                " ",
                                $t('Game language must be English'))),
                        ' ',
                        React.createElement("div", null,
                            ' ',
                            React.createElement("span", null, "\u26A0\uFE0F"),
                            React.createElement("span", null,
                                " ",
                                $t('Game must be fullscreen')),
                            ' '),
                        React.createElement("div", null,
                            ' ',
                            React.createElement("span", null, "\u26A0\uFE0F"),
                            React.createElement("span", null,
                                " ",
                                $t('Game mode must be supported'))),
                        React.createElement("div", { style: {
                                marginTop: '-10px',
                                marginLeft: '20px',
                                fontWeight: 400,
                            } },
                            React.createElement("span", { style: { fontSize: '12px' } }, (gameConfig === null || gameConfig === void 0 ? void 0 : gameConfig.gameModes) && `(${gameConfig === null || gameConfig === void 0 ? void 0 : gameConfig.gameModes})`)))),
                    React.createElement("img", { className: `${styles.artworkImage}`, src: (_l = gameConfig === null || gameConfig === void 0 ? void 0 : gameConfig.importModalConfig) === null || _l === void 0 ? void 0 : _l.artwork, alt: "" }))))))) : (React.createElement(React.Fragment, null))));
}
//# sourceMappingURL=AiHighlighterToggle.js.map