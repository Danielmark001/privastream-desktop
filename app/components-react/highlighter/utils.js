import { useRef, useEffect, useCallback } from 'react';
import styles from './ClipsView.m.less';
import { EGame } from 'services/highlighter/models/ai-highlighter.models';
import { getContextEventTypes } from 'services/highlighter/models/game-config.models';
export const isAiClip = (clip) => clip.source === 'AiClip';
export function sortClipsByOrder(clips, streamId) {
    let sortedClips;
    if (streamId) {
        const clipsWithOrder = clips
            .filter(c => { var _a, _b; return ((_b = (_a = c.streamInfo) === null || _a === void 0 ? void 0 : _a[streamId]) === null || _b === void 0 ? void 0 : _b.orderPosition) !== undefined && c.deleted !== true; })
            .sort((a, b) => a.streamInfo[streamId].orderPosition - b.streamInfo[streamId].orderPosition);
        const clipsWithOutOrder = clips.filter(c => {
            var _a;
            return (c.streamInfo === undefined ||
                c.streamInfo[streamId] === undefined ||
                ((_a = c.streamInfo[streamId]) === null || _a === void 0 ? void 0 : _a.orderPosition) === undefined) &&
                c.deleted !== true;
        });
        sortedClips = [...clipsWithOrder, ...clipsWithOutOrder];
    }
    else {
        sortedClips = clips
            .filter(c => c.deleted !== true)
            .sort((a, b) => a.globalOrderPosition - b.globalOrderPosition);
    }
    return sortedClips;
}
export const useOptimizedHover = () => {
    const containerRef = useRef(null);
    const lastHoveredId = useRef(null);
    const handleHover = useCallback((event) => {
        const target = event.target;
        const clipElement = target.closest('[data-clip-id]');
        const clipId = clipElement === null || clipElement === void 0 ? void 0 : clipElement.getAttribute('data-clip-id');
        if (clipId === lastHoveredId.current)
            return;
        if (lastHoveredId.current) {
            document
                .querySelectorAll(`[data-clip-id="${lastHoveredId.current}"]`)
                .forEach(el => el instanceof HTMLElement && el.classList.remove(styles.highlighted));
        }
        if (clipId) {
            document
                .querySelectorAll(`[data-clip-id="${clipId}"]`)
                .forEach(el => el instanceof HTMLElement && el.classList.add(styles.highlighted));
            lastHoveredId.current = clipId;
        }
        else {
            lastHoveredId.current = null;
        }
    }, []);
    useEffect(() => {
        const container = containerRef.current;
        if (container) {
            container.addEventListener('mousemove', handleHover, { passive: true });
            container.addEventListener('mouseleave', handleHover, { passive: true });
            return () => {
                container.removeEventListener('mousemove', handleHover);
                container.removeEventListener('mouseleave', handleHover);
            };
        }
    }, [handleHover]);
    return containerRef;
};
export function aiFilterClips(clips, streamId, options) {
    const { rounds, targetDuration, includeAllEvents } = options;
    const selectedRounds = rounds.length === 1 && rounds[0] === 0
        ? [
            ...new Set(clips
                .filter(clip => clip.source === 'AiClip')
                .map(clip => { var _a; return (_a = clip.aiInfo.metadata) === null || _a === void 0 ? void 0 : _a.round; })),
        ]
        : rounds;
    const sortedRounds = selectedRounds.sort((a, b) => getRoundScore(b, clips) - getRoundScore(a, clips));
    let clipsFromRounds = [];
    let totalDuration = 0;
    for (let i = 0; i < sortedRounds.length; ++i) {
        if (totalDuration > targetDuration) {
            break;
        }
        else {
            const roundIndex = sortedRounds[i];
            const roundClips = sortClipsByOrder(getClipsOfRound(roundIndex, clips), streamId);
            clipsFromRounds = [...clipsFromRounds, ...roundClips];
            totalDuration = getCombinedClipsDuration(clipsFromRounds);
        }
    }
    const contextTypes = getContextEventTypes(EGame.FORTNITE);
    const clipsSortedByScore = clipsFromRounds
        .map(clip => {
        if (clip.aiInfo.inputs.some(input => contextTypes.includes(input.type))) {
            return Object.assign(Object.assign({}, clip), { aiInfo: { score: 999 } });
        }
        else {
            return clip;
        }
    })
        .sort((a, b) => a.aiInfo.score - b.aiInfo.score);
    const filteredClips = clipsFromRounds;
    let currentDuration = getCombinedClipsDuration(filteredClips);
    const BUFFER_SEC = 10;
    while (currentDuration > targetDuration + BUFFER_SEC) {
        if (clipsSortedByScore === undefined || clipsSortedByScore.length === 0) {
            break;
        }
        clipsSortedByScore.splice(0, 1);
        currentDuration = getCombinedClipsDuration(clipsSortedByScore);
    }
    return clipsSortedByScore;
}
export function getCombinedClipsDuration(clips) {
    return clips.reduce((sum, clip) => sum + (clip.duration ? clip.duration - (clip.startTrim + clip.endTrim) : 0), 0);
}
function getClipsOfRound(round, clips) {
    return clips.filter(clip => clip.source === 'AiClip' && clip.aiInfo.metadata.round === round);
}
function getRoundScore(round, clips) {
    return getClipsOfRound(round, clips).reduce((sum, clip) => { var _a; return sum + (((_a = clip.aiInfo) === null || _a === void 0 ? void 0 : _a.score) || 0); }, 0);
}
//# sourceMappingURL=utils.js.map