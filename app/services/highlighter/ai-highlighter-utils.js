import { AiHighlighterUpdater } from './ai-highlighter-updater';
import kill from 'tree-kill';
const START_TOKEN = '>>>>';
const END_TOKEN = '<<<<';
class MessageBufferHandler {
    constructor() {
        this.buffer = '';
    }
    hasCompleteMessage() {
        const hasStart = this.buffer.includes(START_TOKEN);
        const hasEnd = this.buffer.includes(END_TOKEN);
        return hasStart && hasEnd;
    }
    isMessageComplete(message) {
        const combined = this.buffer + message;
        const hasStart = combined.includes(START_TOKEN);
        const hasEnd = combined.includes(END_TOKEN);
        return hasStart && hasEnd;
    }
    appendToBuffer(message) {
        this.buffer += message;
    }
    extractCompleteMessages() {
        const messages = [];
        while (this.hasCompleteMessage()) {
            const start = this.buffer.indexOf(START_TOKEN);
            const end = this.buffer.indexOf(END_TOKEN);
            if (start !== -1 && end !== -1 && start < end) {
                const completeMessage = this.buffer.substring(start, end + END_TOKEN.length);
                this.buffer = this.buffer.substring(end + END_TOKEN.length);
                messages.push(completeMessage);
            }
            else {
            }
        }
        return messages;
    }
    clear() {
        this.buffer = '';
    }
}
export function getHighlightClips(videoUri, userId, renderHighlights, cancelSignal, progressUpdate, milestonesPath, milestoneUpdate, game) {
    return new Promise((resolve, reject) => {
        var _a, _b;
        console.log(`Get highlight clips for ${videoUri}`);
        const partialInputsRendered = false;
        console.log('Start Ai analysis');
        const childProcess = AiHighlighterUpdater.startHighlighterProcess(videoUri, userId, milestonesPath, game);
        const messageBuffer = new MessageBufferHandler();
        if (cancelSignal) {
            cancelSignal.addEventListener('abort', () => {
                console.log('ending highlighter process');
                messageBuffer.clear();
                kill(childProcess.pid, 'SIGINT');
                reject(new Error('Highlight generation canceled'));
            });
        }
        (_a = childProcess.stdout) === null || _a === void 0 ? void 0 : _a.on('data', (data) => {
            const message = data.toString();
            messageBuffer.appendToBuffer(message);
            const completeMessages = messageBuffer.extractCompleteMessages();
            for (const completeMessage of completeMessages) {
                const aiHighlighterMessage = parseAiHighlighterMessage(completeMessage);
                if (typeof aiHighlighterMessage === 'string' || aiHighlighterMessage instanceof String) {
                    console.log('message type of string', aiHighlighterMessage);
                }
                else if (aiHighlighterMessage) {
                    switch (aiHighlighterMessage.type) {
                        case 'progress':
                            progressUpdate === null || progressUpdate === void 0 ? void 0 : progressUpdate(aiHighlighterMessage.json.progress);
                            break;
                        case 'highlights':
                            if (!partialInputsRendered) {
                                console.log('call Render highlights:');
                                renderHighlights === null || renderHighlights === void 0 ? void 0 : renderHighlights(aiHighlighterMessage.json);
                            }
                            resolve(aiHighlighterMessage.json);
                            break;
                        case 'milestone':
                            milestoneUpdate === null || milestoneUpdate === void 0 ? void 0 : milestoneUpdate(aiHighlighterMessage.json);
                            break;
                        default:
                            break;
                    }
                }
            }
        });
        (_b = childProcess.stderr) === null || _b === void 0 ? void 0 : _b.on('data', (data) => {
            console.log('Debug logs:', data.toString());
        });
        childProcess.on('error', error => {
            messageBuffer.clear();
            reject(new Error(`Child process threw an error. Error message: ${error.message}.`));
        });
        childProcess.on('exit', (code, signal) => {
            messageBuffer.clear();
            reject({
                message: `Child process exited with code ${code} and signal ${signal}`,
                signal,
                code,
            });
        });
    });
}
function parseAiHighlighterMessage(messageString) {
    try {
        if (messageString.includes(START_TOKEN) && messageString.includes(END_TOKEN)) {
            const start = messageString.indexOf(START_TOKEN);
            const end = messageString.indexOf(END_TOKEN);
            const jsonString = messageString.substring(start, end).replace(START_TOKEN, '');
            const aiHighlighterMessage = JSON.parse(jsonString);
            return aiHighlighterMessage;
        }
        else {
            return messageString;
        }
    }
    catch (error) {
        console.log('Error parsing ai highlighter message:', error);
        return null;
    }
}
export class ProgressTracker {
    constructor(onChange = (progress) => { }) {
        this.PRE_DURATION = 10;
        this.POST_DURATION = 10;
        this.progress = 0;
        this.postStarted = false;
        this.startPreTimer();
        this.onChangeCallback = onChange;
    }
    startPreTimer() {
        this.progress = 0;
        this.preInterval = this.addOnePerSecond(this.PRE_DURATION);
    }
    startPostTimer() {
        if (!this.postStarted) {
            this.postInterval = this.addOnePerSecond(this.POST_DURATION);
            this.postStarted = true;
        }
    }
    destroy() {
        this.preInterval && clearInterval(this.preInterval);
        this.postInterval && clearInterval(this.postInterval);
    }
    updateProgressFromHighlighter(highlighterProgress) {
        this.preInterval && clearInterval(this.preInterval);
        const adjustedProgress = highlighterProgress * ((100 - this.PRE_DURATION - this.POST_DURATION) / 100) +
            this.PRE_DURATION;
        this.progress = adjustedProgress;
        this.onChangeCallback(this.progress);
        if (highlighterProgress === 100) {
            this.startPostTimer();
        }
    }
    addOnePerSecond(duration) {
        let passedSeconds = 0;
        const interval = setInterval(() => {
            passedSeconds += 1;
            this.progress += 1;
            this.onChangeCallback(this.progress);
            if (passedSeconds >= duration) {
                clearInterval(interval);
            }
        }, 1000);
        return interval;
    }
}
//# sourceMappingURL=ai-highlighter-utils.js.map