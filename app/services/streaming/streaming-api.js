export var EStreamingState;
(function (EStreamingState) {
    EStreamingState["Offline"] = "offline";
    EStreamingState["Starting"] = "starting";
    EStreamingState["Live"] = "live";
    EStreamingState["Ending"] = "ending";
    EStreamingState["Reconnecting"] = "reconnecting";
})(EStreamingState || (EStreamingState = {}));
export var ERecordingState;
(function (ERecordingState) {
    ERecordingState["Offline"] = "offline";
    ERecordingState["Starting"] = "starting";
    ERecordingState["Recording"] = "recording";
    ERecordingState["Stopping"] = "stopping";
    ERecordingState["Start"] = "start";
    ERecordingState["Wrote"] = "wrote";
})(ERecordingState || (ERecordingState = {}));
export var EReplayBufferState;
(function (EReplayBufferState) {
    EReplayBufferState["Running"] = "running";
    EReplayBufferState["Stopping"] = "stopping";
    EReplayBufferState["Offline"] = "offline";
    EReplayBufferState["Saving"] = "saving";
    EReplayBufferState["Wrote"] = "wrote";
})(EReplayBufferState || (EReplayBufferState = {}));
//# sourceMappingURL=streaming-api.js.map