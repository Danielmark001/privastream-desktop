import { $t } from '../../i18n';
export var EExportStep;
(function (EExportStep) {
    EExportStep["AudioMix"] = "audio";
    EExportStep["FrameRender"] = "frames";
})(EExportStep || (EExportStep = {}));
export const AVAILABLE_TRANSITIONS = [
    {
        get displayName() {
            return $t('None');
        },
        type: 'None',
    },
    {
        get displayName() {
            return $t('Random');
        },
        type: 'Random',
    },
    {
        get displayName() {
            return $t('Fade');
        },
        type: 'fade',
    },
    {
        get displayName() {
            return $t('Slide');
        },
        type: 'Directional',
        params: { direction: [1, 0] },
    },
    {
        get displayName() {
            return $t('Cube');
        },
        type: 'cube',
    },
    {
        get displayName() {
            return $t('Warp');
        },
        type: 'crosswarp',
    },
    {
        get displayName() {
            return $t('Wind');
        },
        type: 'wind',
    },
    {
        get displayName() {
            return $t("90's Game");
        },
        type: 'DoomScreenTransition',
        params: { bars: 100 },
    },
    {
        get displayName() {
            return $t('Grid Flip');
        },
        type: 'GridFlip',
    },
    {
        get displayName() {
            return $t('Dreamy');
        },
        type: 'Dreamy',
    },
    {
        get displayName() {
            return $t('Zoom');
        },
        type: 'SimpleZoom',
    },
    {
        get displayName() {
            return $t('Pixelize');
        },
        type: 'pixelize',
    },
];
export const transitionParams = AVAILABLE_TRANSITIONS.reduce((params, transition) => {
    return Object.assign(Object.assign({}, params), { [transition.type]: transition.params });
}, {});
//# sourceMappingURL=rendering.models.js.map