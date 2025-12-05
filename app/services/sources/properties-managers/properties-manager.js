var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import * as input from 'components/obs/inputs/ObsInput';
import compact from 'lodash/compact';
import { Inject } from 'services/core';
export class PropertiesManager {
    constructor(obsSource, settings, sourceId) {
        this.obsSource = obsSource;
        this.sourceId = sourceId;
        this.destroyed = false;
        this.displayOrder = [];
        this.settings = {};
        this.applySettings(settings);
        this.init();
    }
    init() { }
    destroy() {
        this.destroyed = true;
    }
    get denylist() {
        return [];
    }
    applySettings(settings) {
        this.settings = Object.assign(Object.assign({}, this.settings), settings);
        if (this.sourceId) {
            this.sourcesService.updatePropertiesManagerSettingsInStore(this.sourceId, this.settings);
        }
    }
    getPropertiesFormData() {
        const obsProperties = input.getPropertiesFormData(this.obsSource);
        let propsArray = [];
        this.displayOrder.forEach(name => {
            const obsIndex = obsProperties.findIndex(prop => prop.name === name);
            if (obsIndex !== -1) {
                propsArray.push(obsProperties[obsIndex]);
                obsProperties.splice(obsIndex, 1);
            }
        });
        propsArray = propsArray.concat(obsProperties);
        propsArray = compact(propsArray).filter(prop => !this.denylist.includes(prop.name));
        return propsArray;
    }
    setPropertiesFormData(properties) {
        this.handleSettingsChange(input.setPropertiesFormData(this.obsSource, properties));
    }
    handleSettingsChange(settings) { }
}
__decorate([
    Inject()
], PropertiesManager.prototype, "sourcesService", void 0);
//# sourceMappingURL=properties-manager.js.map