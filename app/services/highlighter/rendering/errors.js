import { $t } from 'services/i18n';
export class HighlighterError extends Error {
}
export class FrameWriteError extends HighlighterError {
    get userMessage() {
        return $t('An error occurred while writing the video file');
    }
}
export class FrameReadError extends HighlighterError {
    constructor(file) {
        super();
        this.file = file;
    }
    get userMessage() {
        return $t('An error occurred while reading %{file}', { file: this.file });
    }
}
export class AudioReadError extends HighlighterError {
    constructor(file) {
        super();
        this.file = file;
    }
    get userMessage() {
        return $t('An error occurred while reading audio from %{file}', { file: this.file });
    }
}
export class AudioMixError extends HighlighterError {
    get userMessage() {
        return $t('An error occurred while mixing audio');
    }
}
//# sourceMappingURL=errors.js.map