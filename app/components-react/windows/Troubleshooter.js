import React, { useEffect } from 'react';
import moment from 'moment';
import { debounceTime, tap } from 'rxjs/operators';
import { Services } from 'components-react/service-provider';
import { ModalLayout } from 'components-react/shared/ModalLayout';
import { useVuex } from 'components-react/hooks';
import StartStreamingButton from 'components-react/root/StartStreamingButton';
import { $t } from 'services/i18n';
import { ObsFormGroup } from 'components-react/obs/ObsForm';
export default function Troubleshooter() {
    const { WindowsService, NotificationsService, SettingsService, StreamingService, CustomizationService, } = Services;
    const issueCode = WindowsService.getChildWindowQueryParams().issueCode;
    const { issue, outputSettings, streamingSettings, isStreaming } = useVuex(() => ({
        issue: NotificationsService.views.getAll().find(notify => notify.code === issueCode),
        streamingSettings: SettingsService.state.Stream.formData.map(hideParamsForCategory),
        outputSettings: SettingsService.state.Output.formData.map(hideParamsForCategory),
        isStreaming: StreamingService.views.isStreaming,
    }));
    useEffect(() => {
        SettingsService.actions.loadSettingsIntoStore();
        const subscription = StreamingService.streamingStatusChange
            .pipe(debounceTime(500), tap(SettingsService.actions.loadSettingsIntoStore))
            .subscribe();
        return subscription.unsubscribe;
    }, []);
    function hideParamsForCategory(category) {
        return Object.assign(Object.assign({}, category), { parameters: hideParams(category.parameters) });
    }
    function hideParams(parameters) {
        const paramsToShow = ['server', 'VBitrate', 'ABitrate'];
        return parameters.map(parameter => (Object.assign(Object.assign({}, parameter), { visible: paramsToShow.includes(parameter.name) })));
    }
    function showSettings() {
        SettingsService.actions.showSettings();
    }
    function saveOutputSettings() {
        if (!outputSettings)
            return;
        SettingsService.actions.setSettings('Output', outputSettings);
    }
    function saveStreamSettings() {
        if (!streamingSettings)
            return;
        SettingsService.actions.setSettings('Stream', streamingSettings);
    }
    function mom(time) {
        return moment(time).fromNow();
    }
    function enablePerformanceMode() {
        CustomizationService.actions.setSettings({
            performanceMode: true,
        });
    }
    const metadata = {
        FRAMES_DROPPED: {
            title: $t('Streamlabs has detected dropped frames'),
            meaning: [
                $t('Some frames have not been uploaded. This problem is usually related to a poor network connection.'),
            ],
            actionItems: [
                $t('Check the health of your Internet connection'),
                $t('Change your ingest server'),
                $t('If none of these worked, lower your bitrate'),
            ],
            actionControls: (React.createElement(React.Fragment, null,
                isStreaming && React.createElement("h4", null, $t('Stop streaming to access these controls:')),
                React.createElement(ObsFormGroup, { value: streamingSettings, onChange: saveStreamSettings }),
                React.createElement(ObsFormGroup, { value: outputSettings, onChange: saveOutputSettings }))),
        },
        FRAMES_SKIPPED: {
            title: $t('Streamlabs has detected skipped frames'),
            meaning: [
                $t('Some frames have not been encoded.'),
                $t('This problem is usually due to high CPU usage or unsuitable encoder settings.'),
            ],
            actionItems: [
                $t('Lower your encoder settings (preset)'),
                $t("Ensure that you don't have any other applications open that are heavy on your CPU"),
                $t('Enable performance mode in the Editor context menu'),
            ],
        },
        FRAMES_LAGGED: {
            title: $t('Streamlabs has detected lagged frames'),
            meaning: [
                $t('Some frames took too long to get rendered.'),
                $t('Usually the problem is related to your game using up too many GPU resources.'),
                $t('When this happens, Streamlabs does not have any resources left over to render frames.'),
            ],
            actionItems: [
                $t('Cap your in-game framerate'),
                $t('Enable VSync in your game'),
                $t('Disable FreeSync or GSync in your Driver'),
                $t('Lower graphics settings until you stop lagging frames'),
                $t('Disable hardware decoding under any media sources(This will slightly increase cpu over gpu)'),
            ],
        },
        HIGH_CPU_USAGE: {
            title: $t('Streamlabs has detected high CPU usage in Dual Output mode'),
            meaning: [
                $t('System resource overuse.'),
                $t('To mitigate hide one of outputs or right click in editor to enable Performance Mode.'),
                $t('This problem could also be due to high CPU usage from other applications or unsuitable encoder settings.'),
                $t('When this happens, Streamlabs does not have any resources left over.'),
            ],
            actionItems: [
                $t('Enable performance mode in the Editor context menu'),
                $t("Hide one or both of the displays in Editor's Scene section"),
                $t("Ensure that you don't have any other applications open that are heavy on your CPU"),
            ],
            actionControls: (React.createElement("button", { className: "button button--action", onClick: enablePerformanceMode }, $t('Enable Performance Mode'))),
        },
    };
    function ModalFooter() {
        return (React.createElement(React.Fragment, null,
            (issue === null || issue === void 0 ? void 0 : issue.code) === 'FRAMES_DROPPED' && React.createElement(StartStreamingButton, null),
            React.createElement("button", { className: "button button--action", onClick: showSettings }, $t('Open Settings'))));
    }
    if (!(issue === null || issue === void 0 ? void 0 : issue.code))
        return React.createElement(React.Fragment, null);
    const renderedData = metadata[issue.code];
    return (React.createElement(ModalLayout, { footer: React.createElement(ModalFooter, null), scrollable: true },
        React.createElement("h4", null,
            React.createElement("i", { className: "fa fa-warning", style: { color: 'var(--warning)' } }),
            (issue === null || issue === void 0 ? void 0 : issue.code) === 'HIGH_CPU_USAGE' ? issue.message.split(':')[0] : issue === null || issue === void 0 ? void 0 : issue.message),
        React.createElement("p", { style: { marginBottom: '16px' } },
            renderedData.title,
            " ",
            mom(issue === null || issue === void 0 ? void 0 : issue.date),
            ".",
            React.createElement("br", null)),
        React.createElement("h4", null, $t('What does this mean?')),
        React.createElement("p", { style: { marginBottom: '16px' } }, renderedData.meaning),
        React.createElement("h4", null, $t('What can I do?')),
        React.createElement("ul", { style: { marginBottom: '16px' } }, renderedData.actionItems.map(item => (React.createElement("li", { key: item }, item)))),
        renderedData.actionControls));
}
//# sourceMappingURL=Troubleshooter.js.map