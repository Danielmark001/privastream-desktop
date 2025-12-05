import React from 'react';
import styles from './SupportedGames.m.less';
import { supportedGames } from 'services/highlighter/models/game-config.models';
import { Tooltip } from 'antd';
export default function SupportedGames({ gamesVisible, emitClick, }) {
    const rotation = [
        '4.654deg',
        '-3.9deg',
        '5.24deg',
        '-2.58deg',
        '4.654deg',
        '-3.9deg',
        '5.24deg',
        '-2.58deg',
    ];
    gamesVisible = gamesVisible !== null && gamesVisible !== void 0 ? gamesVisible : 4;
    const games = [...supportedGames];
    const gamesSortedAlphabetical = [...supportedGames].sort((a, b) => a.label.localeCompare(b.label));
    return (React.createElement("div", { style: { display: 'flex' } },
        games.slice(0, gamesVisible).map((game, index) => (React.createElement("div", { key: game.value + index, onClick: e => emitClick && emitClick(game.value), className: styles.thumbnail, style: {
                '--rotation': rotation[index],
            } },
            React.createElement("img", { src: game.image, alt: game.label })))),
        games.length > gamesVisible && (React.createElement(Tooltip, { overlay: React.createElement("div", { style: {
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    justifyContent: 'flex-start',
                    padding: '16px',
                    marginTop: '8px',
                } },
                React.createElement("h1", { style: { marginBottom: '8px' } }, "Supported games"),
                gamesSortedAlphabetical.map((game, index) => (React.createElement("div", { onClick: e => emitClick && emitClick(game.value), key: game.value + index, style: {
                        cursor: 'pointer',
                        display: 'flex',
                        marginBottom: 8,
                        width: '100%',
                        alignItems: 'center',
                        justifyContent: 'flex-start',
                    } },
                    React.createElement("img", { width: '40px', height: '40px', className: styles.thumbnail, style: { marginRight: 0 }, src: game.image, alt: game.label }),
                    React.createElement("p", { style: { marginBottom: 0, marginLeft: 4 } }, game.label))))) },
            React.createElement("div", { className: styles.thumbnail, style: {
                    marginRight: '-8px',
                    fontSize: '12px',
                    color: 'white',
                    width: '40px',
                    height: '40px',
                    backgroundColor: 'gray',
                    display: 'grid',
                    placeContent: 'center',
                } }, "more")))));
}
//# sourceMappingURL=SupportedGames.js.map