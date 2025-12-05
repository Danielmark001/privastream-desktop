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
    return (<div>
      {gameIsSupported ? (<div key={'aiSelector'} style={{
                marginBottom: '24px',
                display: 'flex',
                justifyContent: 'flex-end',
                flexFlow: 'rowWrap',
                width: 'width: 100%',
                backgroundColor: 'var(--dark-background)',
                borderRadius: '8px',
            }}>
          <div style={{ flexGrow: 0, backgroundColor: 'red' }}></div>

          <div className={styles.aiHighlighterBox}>
            <div className={styles.coloredBlob} style={{
                backgroundColor: `${(_a = gameConfig === null || gameConfig === void 0 ? void 0 : gameConfig.importModalConfig) === null || _a === void 0 ? void 0 : _a.accentColor}`,
                opacity: isExpanded ? 0.5 : 1,
                filter: isExpanded ? 'blur(74px)' : 'blur(44px)',
            }}></div>
            <div className={styles.header}>
              <div className={styles.headlineWrapper}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <h3 className={styles.headline} onClick={() => setIsExpanded(!isExpanded)}>
                    {$t('Get stream highlights!')}
                  </h3>

                  {highlighterVersion !== '' ? (<SwitchInput style={{ width: '80px', margin: 0, marginTop: '-2px' }} value={useHighlighter} label="" onChange={toggleHighlighter}/>) : (<Button style={{ width: 'fit-content', marginLeft: '18px' }} size="small" type="primary" onClick={() => {
                    HighlighterService.installAiHighlighter(false, 'Go-live-flow', game);
                }}>
                      {$t('Install AI Highlighter')}
                    </Button>)}
                </div>
                <div onClick={() => setIsExpanded(!isExpanded)} style={{ cursor: 'pointer' }}>
                  {isExpanded ? (<UpOutlined style={{ color: '#BDC2C4' }}/>) : (<DownOutlined style={{ color: '#BDC2C4' }}/>)}
                </div>
              </div>
              <div className={styles.headlineWrapper}>
                <h2 style={{ fontSize: '14px', fontWeight: 300 }}>
                  {$t('Auto-generate game highlight reels of your stream')}
                </h2>
                <div className={styles.betaTag} style={{ backgroundColor: `${(_b = gameConfig === null || gameConfig === void 0 ? void 0 : gameConfig.importModalConfig) === null || _b === void 0 ? void 0 : _b.accentColor}` }}>
                  {$t('Beta')}
                </div>
              </div>
            </div>
            {isExpanded && (<>
                <div className={styles.expandedWrapper}>
                  {!useHighlighter ? (<div style={{ paddingTop: '88px', width: '100%', display: 'flex' }}>
                      {((_c = gameConfig === null || gameConfig === void 0 ? void 0 : gameConfig.importModalConfig) === null || _c === void 0 ? void 0 : _c.horizontalExampleVideo) &&
                        ((_d = gameConfig === null || gameConfig === void 0 ? void 0 : gameConfig.importModalConfig) === null || _d === void 0 ? void 0 : _d.verticalExampleVideo) ? (<>
                          <div className={styles.plattformIcon} style={{ top: '84px', left: '120px' }}>
                            <YouTubeLogo />
                          </div>
                          <div className={styles.plattformIcon} style={{ top: '181px', left: '32px' }}>
                            <DiscordLogo />
                          </div>

                          <div className={styles.plattformIcon} style={{ top: '85px', left: '283px' }}>
                            <TikTokLogo />
                          </div>

                          <div className={styles.plattformIcon} style={{ top: '177px', left: '187px' }}>
                            <InstagramLogo />
                          </div>
                          <div className={styles.horizontalVideo} style={{
                            backgroundColor: (_e = gameConfig === null || gameConfig === void 0 ? void 0 : gameConfig.importModalConfig) === null || _e === void 0 ? void 0 : _e.backgroundColor,
                            borderColor: (_f = gameConfig === null || gameConfig === void 0 ? void 0 : gameConfig.importModalConfig) === null || _f === void 0 ? void 0 : _f.accentColor,
                            boxShadow: `0px 0px 42px -4px ${(_g = gameConfig === null || gameConfig === void 0 ? void 0 : gameConfig.importModalConfig) === null || _g === void 0 ? void 0 : _g.accentColor}30`,
                        }}>
                            <video muted autoPlay loop style={{ width: '100%' }} src={gameConfig.importModalConfig.horizontalExampleVideo}></video>
                          </div>
                          <div className={styles.verticalVideo} style={{
                            backgroundColor: (_h = gameConfig === null || gameConfig === void 0 ? void 0 : gameConfig.importModalConfig) === null || _h === void 0 ? void 0 : _h.backgroundColor,
                            borderColor: (_j = gameConfig === null || gameConfig === void 0 ? void 0 : gameConfig.importModalConfig) === null || _j === void 0 ? void 0 : _j.accentColor,
                            boxShadow: `0px 0px 42px -4px ${(_k = gameConfig === null || gameConfig === void 0 ? void 0 : gameConfig.importModalConfig) === null || _k === void 0 ? void 0 : _k.accentColor}30`,
                        }}>
                            {' '}
                            <video muted autoPlay loop style={{ height: '100%' }} src={gameConfig.importModalConfig.verticalExampleVideo}></video>
                          </div>
                        </>) : (<div className={styles.image}></div>)}
                    </div>) : (<div className={styles.educationSection}>
                      <div>
                        <span>⚠️</span>
                        <span> {$t('Game language must be English')}</span>
                      </div>{' '}
                      <div>
                        {' '}
                        <span>⚠️</span>
                        <span> {$t('Game must be fullscreen')}</span>{' '}
                      </div>
                      <div>
                        {' '}
                        <span>⚠️</span>
                        <span> {$t('Game mode must be supported')}</span>
                      </div>
                      <div style={{
                        marginTop: '-10px',
                        marginLeft: '20px',
                        fontWeight: 400,
                    }}>
                        <span style={{ fontSize: '12px' }}>
                          {(gameConfig === null || gameConfig === void 0 ? void 0 : gameConfig.gameModes) && `(${gameConfig === null || gameConfig === void 0 ? void 0 : gameConfig.gameModes})`}
                        </span>
                      </div>
                      
                    </div>)}
                  <img className={`${styles.artworkImage}`} src={(_l = gameConfig === null || gameConfig === void 0 ? void 0 : gameConfig.importModalConfig) === null || _l === void 0 ? void 0 : _l.artwork} alt=""/>
                </div>
              </>)}
          </div>
        </div>) : (<></>)}
    </div>);
}
//# sourceMappingURL=AiHighlighterToggle.jsx.map