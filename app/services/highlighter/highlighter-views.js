import url from 'url';
import { ViewHandler } from '../core';
import { AVAILABLE_TRANSITIONS } from './models/rendering.models';
export class HighlighterViews extends ViewHandler {
    get clips() {
        return Object.values(this.state.clips);
    }
    get clipsDictionary() {
        return this.state.clips;
    }
    get useAiHighlighter() {
        return this.state.useAiHighlighter;
    }
    get highlightedStreams() {
        return Object.values(this.state.highlightedStreamsDictionary);
    }
    get highlightedStreamsDictionary() {
        return this.state.highlightedStreamsDictionary;
    }
    get loaded() {
        return !this.clips.some(c => !c.loaded);
    }
    get loadedCount() {
        let count = 0;
        this.clips.forEach(c => {
            if (c.loaded)
                count++;
        });
        return count;
    }
    get exportInfo() {
        return this.state.export;
    }
    get uploadInfo() {
        return this.state.uploads;
    }
    get transition() {
        return this.state.transition;
    }
    get audio() {
        return this.state.audio;
    }
    get video() {
        return this.state.video;
    }
    get transitionDuration() {
        return this.transition.type === 'None' ? 0 : this.state.transition.duration;
    }
    get availableTransitions() {
        return AVAILABLE_TRANSITIONS;
    }
    get dismissedTutorial() {
        return this.state.dismissedTutorial;
    }
    get error() {
        return this.state.error;
    }
    get highlighterVersion() {
        return this.state.highlighterVersion;
    }
    get isUpdaterRunning() {
        return this.state.isUpdaterRunning;
    }
    get updaterProgress() {
        return this.state.updaterProgress;
    }
    get tempRecordingInfo() {
        return this.state.tempRecordingInfo;
    }
    getCacheBustingUrl(filePath) {
        return `${url.pathToFileURL(filePath).toString()}?time=${Date.now()}`;
    }
}
//# sourceMappingURL=highlighter-views.js.map