import { getEventConfig } from 'services/highlighter/models/game-config.models';
import styles from './ClipPreview.m.less';
import React from 'react';
export default function ClipPreviewInfo({ clip, game, }) {
    var _a;
    if (!clip || !clip.aiInfo) {
        return <span>No event data</span>;
    }
    const uniqueInputTypes = new Set();
    if (clip.aiInfo.inputs && Array.isArray(clip.aiInfo.inputs)) {
        clip.aiInfo.inputs.forEach(input => {
            if (input.type) {
                uniqueInputTypes.add(input.type);
            }
        });
    }
    const eventDisplays = Array.from(uniqueInputTypes).map(type => {
        const eventInfo = getEventConfig(game, type);
        if (eventInfo) {
            return {
                emoji: eventInfo.emoji,
                description: eventInfo.description.singular,
                type,
            };
        }
        return {
            emoji: '⚡',
            description: type,
            type,
        };
    });
    return (<div style={{
            display: 'flex',
            gap: '4px',
            alignItems: 'center',
        }}>
      {eventDisplays.map((event, index) => {
            return <React.Fragment key={index}>{event.emoji}</React.Fragment>;
        })}
      {((_a = clip.aiInfo.metadata) === null || _a === void 0 ? void 0 : _a.round) && (<div className={styles.roundTag}>{`Round: ${clip.aiInfo.metadata.round}`}</div>)}{' '}
    </div>);
}
//# sourceMappingURL=ClipPreviewInfo.jsx.map