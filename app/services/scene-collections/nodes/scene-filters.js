var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { ArrayNode } from './array-node';
import { Inject } from '../../core/injector';
export class SceneFiltersNode extends ArrayNode {
    constructor() {
        super(...arguments);
        this.schemaVersion = 1;
    }
    getItems(context) {
        const filters = [...this.sourceFiltersService.getFilters(context.sceneId)];
        const preset = this.sourceFiltersService.views.presetFilterBySourceId(context.sceneId);
        if (preset)
            filters.push(preset);
        return filters;
    }
    saveItem(filter, context) {
        return Promise.resolve(filter);
    }
    loadItem(filter, context) {
        if (filter.type === 'face_mask_filter')
            return Promise.resolve();
        this.sourceFiltersService.add(context.sceneId, filter.type, filter.name, filter.settings);
        this.sourceFiltersService.setVisibility(context.sceneId, filter.name, filter.visible);
        return Promise.resolve();
    }
}
__decorate([
    Inject()
], SceneFiltersNode.prototype, "sourceFiltersService", void 0);
//# sourceMappingURL=scene-filters.js.map