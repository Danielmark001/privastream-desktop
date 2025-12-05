var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { PersistentStatefulService, mutation } from 'services/core';
export class TwitchContentClassificationService extends PersistentStatefulService {
    load() {
        this.SET_LABELS_LOADED(true);
    }
    setLabels(labels) {
        const labelsMap = labels.data.reduce((acc, label) => {
            if (label.id === 'MatureGame') {
                return acc;
            }
            acc[label.id] = { id: label.id, name: label.name, description: label.description };
            return acc;
        }, {});
        this.SET_LABELS(labelsMap);
        this.SET_LABELS_LOADED(true);
    }
    get areLabelsLoaded() {
        return this.state.labelsLoaded;
    }
    get labels() {
        return this.state.contentClassificationOptions;
    }
    get options() {
        return Object.values(this.state.contentClassificationOptions).map(label => ({
            value: label.id,
            label: label.name,
        }));
    }
    SET_LABELS(labels) {
        this.state.contentClassificationOptions = labels;
    }
    SET_LABELS_LOADED(loaded) {
        this.state.labelsLoaded = loaded;
    }
}
TwitchContentClassificationService.defaultState = {
    contentClassification: null,
    contentClassificationOptions: {},
    labelsLoaded: false,
};
__decorate([
    mutation()
], TwitchContentClassificationService.prototype, "SET_LABELS", null);
__decorate([
    mutation()
], TwitchContentClassificationService.prototype, "SET_LABELS_LOADED", null);
//# sourceMappingURL=content-classification.js.map