var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import SettingsView from 'components-react/highlighter/SettingsView';
import { useVuex } from 'components-react/hooks';
import React, { useEffect, useState } from 'react';
import { EHighlighterView, } from 'services/highlighter/models/highlighter.models';
import { Services } from 'components-react/service-provider';
import StreamView from 'components-react/highlighter/StreamView';
import ClipsView from 'components-react/highlighter/ClipsView';
import UpdateModal from 'components-react/highlighter/UpdateModal';
export default function Highlighter(props) {
    var _a, _b, _c;
    const { HighlighterService, UsageStatisticsService } = Services;
    const aiHighlighterFeatureEnabled = HighlighterService.aiHighlighterFeatureEnabled;
    const v = useVuex(() => ({
        useAiHighlighter: HighlighterService.views.useAiHighlighter,
    }));
    const clipsAmount = HighlighterService.views.clips.length;
    const streamAmount = HighlighterService.views.highlightedStreams.length;
    let initialViewState;
    if ((_a = props.params) === null || _a === void 0 ? void 0 : _a.view) {
        const view = ((_b = props.params) === null || _b === void 0 ? void 0 : _b.view) === 'settings' ? EHighlighterView.SETTINGS : EHighlighterView.STREAM;
        initialViewState = { view };
    }
    else if (streamAmount > 0 && clipsAmount > 0 && aiHighlighterFeatureEnabled) {
        initialViewState = { view: EHighlighterView.STREAM };
    }
    else if (clipsAmount > 0) {
        initialViewState = { view: EHighlighterView.CLIPS, id: undefined };
    }
    else {
        initialViewState = { view: EHighlighterView.SETTINGS };
    }
    useEffect(() => {
        function shouldUpdate() {
            return __awaiter(this, void 0, void 0, function* () {
                if (!HighlighterService.aiHighlighterUpdater)
                    return false;
                const versionAvailable = yield HighlighterService.aiHighlighterUpdater.isNewVersionAvailable();
                return versionAvailable && aiHighlighterFeatureEnabled && v.useAiHighlighter;
            });
        }
        shouldUpdate().then(shouldUpdate => {
            if (shouldUpdate)
                HighlighterService.actions.startUpdater();
        });
    }, []);
    const [viewState, setViewState] = useState(initialViewState);
    useEffect(() => {
        UsageStatisticsService.recordShown('HighlighterTab', viewState.view);
    }, [viewState]);
    const updaterModal = <UpdateModal />;
    switch (viewState.view) {
        case EHighlighterView.STREAM:
            return (<>
          {aiHighlighterFeatureEnabled && updaterModal}
          <StreamView emitSetView={data => {
                    setViewFromEmit(data);
                }}/>
        </>);
        case EHighlighterView.CLIPS:
            return (<>
          {aiHighlighterFeatureEnabled && updaterModal}
          <ClipsView emitSetView={data => {
                    setViewFromEmit(data);
                }} props={{
                    id: viewState.id,
                    streamTitle: viewState.id
                        ? (_c = HighlighterService.views.highlightedStreamsDictionary[viewState.id]) === null || _c === void 0 ? void 0 : _c.title
                        : '',
                }}/>
        </>);
        default:
            return (<>
          {aiHighlighterFeatureEnabled && updaterModal}
          <SettingsView close={() => {
                    HighlighterService.actions.dismissTutorial();
                }} emitSetView={data => setViewFromEmit(data)}/>
        </>);
    }
    function setViewFromEmit(data) {
        if (data.view === EHighlighterView.CLIPS) {
            setView({
                view: data.view,
                id: data.id,
            });
        }
        else {
            setView({
                view: data.view,
            });
        }
    }
    function setView(view) {
        setViewState(view);
    }
}
//# sourceMappingURL=Highlighter.jsx.map