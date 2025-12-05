import { $t } from 'services/i18n';
export var ELayout;
(function (ELayout) {
    ELayout["Default"] = "Default";
    ELayout["TwoPane"] = "TwoPane";
    ELayout["Classic"] = "Classic";
    ELayout["FourByFour"] = "FourByFour";
    ELayout["Triplets"] = "Triplets";
    ELayout["OnePane"] = "OnePane";
    ELayout["OnePaneR"] = "OnePaneR";
    ELayout["Pyramid"] = "Pyramid";
})(ELayout || (ELayout = {}));
export const LAYOUT_DATA = {
    [ELayout.Default]: {
        resizeDefaults: { bar1: 0.2, bar2: 0.3 },
        className: 'default',
        component: 'Default',
    },
    [ELayout.TwoPane]: {
        resizeDefaults: { bar1: 0.5, bar2: 0.3 },
        className: 'twoPane',
        component: 'TwoPane',
    },
    [ELayout.Classic]: {
        resizeDefaults: { bar1: 0.4, bar2: 0 },
        className: 'classic',
        component: 'Classic',
    },
    [ELayout.FourByFour]: {
        resizeDefaults: { bar1: 0.25, bar2: 0.25 },
        className: 'fourByFour',
        component: 'FourByFour',
    },
    [ELayout.Triplets]: {
        resizeDefaults: { bar1: 0.6, bar2: 0.3 },
        className: 'triplets',
        component: 'Triplets',
    },
    [ELayout.OnePane]: {
        resizeDefaults: { bar1: 0.7, bar2: 0 },
        className: 'onePane',
        component: 'OnePane',
    },
    [ELayout.OnePaneR]: {
        resizeDefaults: { bar1: 0.3, bar2: 0 },
        className: 'onePaneR',
        component: 'OnePaneR',
    },
    [ELayout.Pyramid]: {
        resizeDefaults: { bar1: 0.4, bar2: 0 },
        className: 'pyramid',
        component: 'Pyramid',
    },
};
export var ELayoutElement;
(function (ELayoutElement) {
    ELayoutElement["Minifeed"] = "Minifeed";
    ELayoutElement["LegacyEvents"] = "LegacyEvents";
    ELayoutElement["Display"] = "Display";
    ELayoutElement["Mixer"] = "Mixer";
    ELayoutElement["Scenes"] = "Scenes";
    ELayoutElement["Sources"] = "Sources";
    ELayoutElement["StreamPreview"] = "StreamPreview";
    ELayoutElement["RecordingPreview"] = "RecordingPreview";
    ELayoutElement["Browser"] = "Browser";
})(ELayoutElement || (ELayoutElement = {}));
export const ELEMENT_DATA = () => ({
    [ELayoutElement.Display]: {
        title: $t('Editor Display'),
        component: 'Display',
    },
    [ELayoutElement.Minifeed]: {
        title: $t('Mini Feed'),
        component: 'Minifeed',
    },
    [ELayoutElement.Mixer]: {
        title: $t('Audio Mixer'),
        component: 'Mixer',
    },
    [ELayoutElement.Scenes]: {
        title: $t('Scene Selector'),
        component: 'Scenes',
    },
    [ELayoutElement.Sources]: {
        title: $t('Source Selector'),
        component: 'Sources',
    },
    [ELayoutElement.LegacyEvents]: {
        title: $t('Legacy Events'),
        component: 'LegacyEvents',
    },
    [ELayoutElement.StreamPreview]: {
        title: $t('Stream Preview'),
        component: 'StreamPreview',
    },
    [ELayoutElement.RecordingPreview]: {
        title: $t('Recording Preview'),
        component: 'RecordingPreview',
    },
    [ELayoutElement.Browser]: {
        title: $t('Website'),
        component: 'Browser',
    },
});
//# sourceMappingURL=layout-data.js.map