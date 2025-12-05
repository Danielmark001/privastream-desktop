var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { getPropertiesFormData, setPropertiesFormData, } from 'components/obs/inputs/ObsInput';
import { metadata } from 'components/shared/inputs';
import path from 'path';
import { Inject } from './core/injector';
import { SourcesService } from './sources';
import * as obs from '../../obs-api';
import namingHelpers from '../util/NamingHelpers';
import { $t } from 'services/i18n';
import { Subject } from 'rxjs';
import { getSharedResource } from 'util/get-shared-resource';
import { mutation, StatefulService, ViewHandler } from 'services/core/stateful-service';
import Vue from 'vue';
import { InitAfter } from 'services';
import uuid from 'uuid/v4';
export var EFilterDisplayType;
(function (EFilterDisplayType) {
    EFilterDisplayType["Normal"] = "normal";
    EFilterDisplayType["Preset"] = "preset";
    EFilterDisplayType["Hidden"] = "hidden";
})(EFilterDisplayType || (EFilterDisplayType = {}));
class SourceFiltersViews extends ViewHandler {
    get presetFilterOptions() {
        return [
            { title: $t('None'), value: '' },
            { title: $t('Grayscale'), value: path.join('luts', 'grayscale.png') },
            { title: $t('Sepiatone'), value: path.join('luts', 'sepia.png') },
            { title: $t('Dramatic'), value: path.join('luts', 'gazing.png') },
            { title: $t('Flashback'), value: path.join('luts', 'muted.png') },
            { title: $t('Inverted'), value: path.join('luts', 'inverted.png') },
            { title: $t('Action Movie'), value: path.join('luts', 'cool_tone.png') },
            { title: $t('Hearth'), value: path.join('luts', 'warm_tone.png') },
            { title: $t('Wintergreen'), value: path.join('luts', 'green_tone.png') },
            { title: $t('Heat Map'), value: path.join('luts', 'heat_map.png') },
            { title: $t('Cel Shade'), value: path.join('luts', 'cel_shade.png') },
        ];
    }
    get presetFilterOptionsReact() {
        return this.presetFilterOptions.map(opt => ({
            label: opt.title,
            value: opt.value === '' ? 'none' : opt.value,
        }));
    }
    get presetFilterMetadata() {
        return metadata.list({
            options: this.presetFilterOptions,
            title: $t('Visual Presets'),
            optionsHeight: 230,
        });
    }
    parsePresetValue(path) {
        const match = path.match(/luts[\\\/][a-z_]+.png$/);
        return match ? match[0] : null;
    }
    filtersBySourceId(sourceId, includeHidden = false) {
        return this.state.filters[sourceId].filter(f => f.displayType === EFilterDisplayType.Normal || includeHidden);
    }
    getFilter(sourceId, filterName) {
        return this.filtersBySourceId(sourceId, true).find(f => f.name === filterName);
    }
    presetFilterBySourceId(sourceId) {
        return this.filtersBySourceId(sourceId, true).find(f => f.displayType === EFilterDisplayType.Preset);
    }
    getTypesForSource(sourceId) {
        const source = this.getServiceViews(SourcesService).getSource(sourceId);
        return this.state.types.filter(filterType => {
            if (filterType.type === 'face_mask_filter')
                return false;
            if (source.audio && filterType.audio) {
                return true;
            }
            if (!source.async && filterType.async) {
                return false;
            }
            if (source.video && filterType.video) {
                return true;
            }
            return false;
        });
    }
    suggestName(sourceId, filterName) {
        return namingHelpers.suggestName(filterName, (name) => !!this.state.filters[sourceId].find(f => f.name === name));
    }
}
let SourceFiltersService = class SourceFiltersService extends StatefulService {
    constructor() {
        super(...arguments);
        this.filterAdded = new Subject();
        this.filterRemoved = new Subject();
        this.filterUpdated = new Subject();
        this.filtersReordered = new Subject();
    }
    init() {
        this.sourcesService.sourceAdded.subscribe(s => {
            if (!this.state.filters[s.sourceId])
                this.SET_FILTERS(s.sourceId, []);
        });
        this.sourcesService.sourceRemoved.subscribe(s => {
            this.REMOVE_FILTERS(s.sourceId);
        });
        this.SET_TYPES(this.getTypes());
    }
    get views() {
        return new SourceFiltersViews(this.state);
    }
    getTypes() {
        const obsAvailableTypes = obs.FilterFactory.types();
        const allowlistedTypes = [
            { description: $t('Image Mask/Blend'), value: 'mask_filter' },
            { description: $t('Crop/Pad'), value: 'crop_filter' },
            { description: $t('Gain'), value: 'gain_filter' },
            { description: $t('Color Correction'), value: 'color_filter' },
            { description: $t('Scaling/Aspect Ratio'), value: 'scale_filter' },
            { description: $t('Scroll'), value: 'scroll_filter' },
            { description: $t('Render Delay'), value: 'gpu_delay' },
            { description: $t('Color Key'), value: 'color_key_filter' },
            { description: $t('Apply LUT'), value: 'clut_filter' },
            { description: $t('Sharpen'), value: 'sharpness_filter' },
            { description: $t('Chroma Key'), value: 'chroma_key_filter' },
            { description: $t('Video Delay (Async)'), value: 'async_delay_filter' },
            { description: $t('Noise Suppression'), value: 'noise_suppress_filter' },
            { description: $t('Noise Gate'), value: 'noise_gate_filter' },
            { description: $t('Compressor'), value: 'compressor_filter' },
            { description: $t('VST 2.x Plugin'), value: 'vst_filter' },
            { description: $t('Face Mask Plugin'), value: 'face_mask_filter' },
            { description: $t('Invert Polarity'), value: 'invert_polarity_filter' },
            { description: $t('Limiter'), value: 'limiter_filter' },
            { description: $t('Expander'), value: 'expander_filter' },
            { description: $t('Shader'), value: 'shader_filter' },
            { description: $t('HDR Tone Mapping (Override)'), value: 'hdr_tonemap_filter' },
            { description: $t('NVIDIA Background Removal'), value: 'nv_greenscreen_filter' },
        ];
        const allowedAvailableTypes = allowlistedTypes.filter(type => obsAvailableTypes.includes(type.value));
        return allowedAvailableTypes.map(type => {
            const flags = obs.Global.getOutputFlagsFromId(type.value);
            return {
                type: type.value,
                description: type.description,
                audio: !!(2 & flags),
                video: !!(1 & flags),
                async: !!(4 & flags),
            };
        });
    }
    add(sourceId, filterType, filterName, settings, displayType = EFilterDisplayType.Normal) {
        var _a;
        const source = this.sourcesService.views.getSource(sourceId);
        const obsFilter = obs.FilterFactory.create(filterType, filterName, settings || {});
        const obsSource = source.getObsInput();
        obsSource.addFilter(obsFilter);
        if (settings)
            obsFilter.update(settings);
        const filterReference = obsSource.findFilter(filterName);
        obsFilter.release();
        this.SET_FILTERS(sourceId, [
            ...((_a = this.state.filters[sourceId]) !== null && _a !== void 0 ? _a : []),
            {
                name: filterName,
                type: filterType,
                visible: true,
                settings: filterReference.settings,
                displayType,
            },
        ]);
        const numHiddenFilters = this.views
            .filtersBySourceId(sourceId, true)
            .filter(f => f.displayType === EFilterDisplayType.Hidden).length;
        const numPresetFilters = this.views
            .filtersBySourceId(sourceId, true)
            .filter(f => f.displayType === EFilterDisplayType.Preset).length;
        if (displayType === EFilterDisplayType.Normal) {
            this.setOrder(sourceId, filterName, -1 * (numHiddenFilters + numPresetFilters));
        }
        if (displayType === EFilterDisplayType.Preset) {
            this.setOrder(sourceId, filterName, -1 * numHiddenFilters);
            this.usageStatisticsService.recordFeatureUsage('PresetFilter');
        }
        this.filterAdded.next({ sourceId, name: filterName });
        if (filterType === 'vst_filter') {
            this.usageStatisticsService.recordFeatureUsage('VST');
        }
        return filterReference;
    }
    suggestName(sourceId, filterName) {
        return namingHelpers.suggestName(filterName, (name) => this.getObsFilter(sourceId, name));
    }
    remove(sourceId, filterName) {
        const obsFilter = this.getObsFilter(sourceId, filterName);
        const source = this.sourcesService.views.getSource(sourceId);
        this.SET_FILTERS(sourceId, this.state.filters[sourceId].filter(f => f.name !== filterName));
        source.getObsInput().removeFilter(obsFilter);
        this.filterRemoved.next({ sourceId, name: filterName });
    }
    setPropertiesFormData(sourceId, filterName, properties) {
        if (!filterName)
            return;
        const obsFilter = this.getObsFilter(sourceId, filterName);
        setPropertiesFormData(obsFilter, properties);
        this.UPDATE_FILTER(sourceId, { name: filterName, settings: obsFilter.settings });
        this.filterUpdated.next({ sourceId, name: filterName });
    }
    setSettings(sourceId, filterName, settings) {
        if (!filterName)
            return;
        const obsFilter = this.getObsFilter(sourceId, filterName);
        obsFilter.update(settings);
        this.UPDATE_FILTER(sourceId, { name: filterName, settings });
    }
    getFilters(sourceId) {
        return this.views.filtersBySourceId(sourceId);
    }
    loadFilterData(sourceId, filters) {
        this.SET_FILTERS(sourceId, filters);
    }
    addPresetFilter(sourceId, path) {
        const preset = this.views.presetFilterBySourceId(sourceId);
        if (preset) {
            this.setPropertiesFormData(sourceId, preset.name, [
                {
                    name: 'image_path',
                    value: getSharedResource(path),
                    options: null,
                    description: null,
                    type: 'OBS_PROPERTY_PATH',
                },
            ]);
        }
        else {
            this.add(sourceId, 'clut_filter', uuid(), { image_path: getSharedResource(path) }, EFilterDisplayType.Preset);
        }
    }
    removePresetFilter(sourceId) {
        const preset = this.views.presetFilterBySourceId(sourceId);
        if (preset)
            this.remove(sourceId, preset.name);
    }
    setVisibility(sourceId, filterName, visible) {
        this.getObsFilter(sourceId, filterName).enabled = visible;
        this.UPDATE_FILTER(sourceId, { name: filterName, visible });
        this.filterUpdated.next({ sourceId, name: filterName });
    }
    getPropertiesFormData(sourceId, filterName) {
        if (!filterName)
            return [];
        const formData = getPropertiesFormData(this.getObsFilter(sourceId, filterName));
        if (!formData)
            return [];
        formData.forEach(input => {
            if (input.name === 'sidechain_source') {
                input.options.forEach(option => {
                    if (option.value === 'none')
                        return;
                    const source = this.sourcesService.views.getSource(option.value);
                    if (source)
                        option.description = source.name;
                });
            }
        });
        return formData;
    }
    setOrder(sourceId, filterName, delta) {
        const from = this.state.filters[sourceId].findIndex(f => f.name === filterName);
        const to = from + delta;
        this.REORDER_FILTERS(sourceId, from, to);
        const obsFilter = this.getObsFilter(sourceId, filterName);
        const obsInput = this.sourcesService.views.getSource(sourceId).getObsInput();
        const movement = delta > 0 ? 1 : 0;
        let i = Math.abs(delta);
        while (i--) {
            obsInput.setFilterOrder(obsFilter, movement);
        }
        this.filtersReordered.next();
    }
    showSourceFilters(sourceId, selectedFilterName = '') {
        const source = this.sourcesService.views.getSource(sourceId);
        this.windowsService.showWindow({
            componentName: 'SourceFilters',
            title: $t('Filters for %{sourceName}', { sourceName: source.name }),
            queryParams: { sourceId, selectedFilterName },
            size: {
                width: 800,
                height: 800,
            },
        });
    }
    getObsFilter(sourceId, filterName) {
        return this.sourcesService.views.getSource(sourceId).getObsInput().findFilter(filterName);
    }
    SET_FILTERS(sourceId, filters) {
        Vue.set(this.state.filters, sourceId, [...filters]);
    }
    UPDATE_FILTER(sourceId, patch) {
        const filter = this.state.filters[sourceId].find(f => f.name === patch.name);
        Object.assign(filter, patch);
    }
    REMOVE_FILTERS(sourceId) {
        Vue.delete(this.state.filters, sourceId);
    }
    REORDER_FILTERS(sourceId, from, to) {
        const filter = this.state.filters[sourceId][from];
        this.state.filters[sourceId].splice(from, 1);
        this.state.filters[sourceId].splice(to, 0, filter);
    }
    SET_TYPES(types) {
        this.state.types = types;
    }
};
SourceFiltersService.initialState = { filters: {}, types: [] };
__decorate([
    Inject()
], SourceFiltersService.prototype, "sourcesService", void 0);
__decorate([
    Inject()
], SourceFiltersService.prototype, "windowsService", void 0);
__decorate([
    Inject()
], SourceFiltersService.prototype, "usageStatisticsService", void 0);
__decorate([
    mutation()
], SourceFiltersService.prototype, "SET_FILTERS", null);
__decorate([
    mutation()
], SourceFiltersService.prototype, "UPDATE_FILTER", null);
__decorate([
    mutation()
], SourceFiltersService.prototype, "REMOVE_FILTERS", null);
__decorate([
    mutation()
], SourceFiltersService.prototype, "REORDER_FILTERS", null);
__decorate([
    mutation()
], SourceFiltersService.prototype, "SET_TYPES", null);
SourceFiltersService = __decorate([
    InitAfter('SourcesService')
], SourceFiltersService);
export { SourceFiltersService };
//# sourceMappingURL=source-filters.js.map