var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { Node } from './node';
import { Inject } from 'services/core/injector';
import { $t } from 'services/i18n';
export class TransitionsNode extends Node {
    constructor() {
        super(...arguments);
        this.schemaVersion = 2;
    }
    save() {
        return __awaiter(this, void 0, void 0, function* () {
            this.data = {
                transitions: this.transitionsService.state.transitions.map(transition => {
                    return {
                        id: transition.id,
                        name: transition.name,
                        type: transition.type,
                        duration: transition.duration,
                        settings: this.transitionsService.getSettings(transition.id),
                        propertiesManagerSettings: this.transitionsService.getPropertiesManagerSettings(transition.id),
                    };
                }),
                connections: this.transitionsService.state.connections.map(connection => {
                    return {
                        fromSceneId: connection.fromSceneId,
                        toSceneId: connection.toSceneId,
                        transitionId: connection.transitionId,
                    };
                }),
                defaultTransitionId: this.transitionsService.state.defaultTransitionId,
            };
        });
    }
    load() {
        return __awaiter(this, void 0, void 0, function* () {
            this.transitionsService.deleteAllTransitions();
            this.data.transitions.forEach(transition => {
                this.transitionsService.createTransition(transition.type, transition.name, {
                    id: transition.id,
                    duration: transition.duration,
                    settings: transition.settings,
                    propertiesManagerSettings: transition.propertiesManagerSettings,
                });
            });
            this.transitionsService.deleteAllConnections();
            this.data.connections.forEach(connection => {
                this.transitionsService.addConnection(connection.fromSceneId, connection.toSceneId, connection.transitionId);
            });
            if (this.data.defaultTransitionId) {
                this.transitionsService.setDefaultTransition(this.data.defaultTransitionId);
            }
        });
    }
    migrate(version) {
        if (version === 1) {
            const transition = {
                id: null,
                name: $t('Global Transition'),
                type: this.data['type'],
                duration: this.data['duration'],
                settings: this.data['settings'],
                propertiesManagerSettings: this.data['propertiesManagerSettings'],
            };
            this.data.transitions = [transition];
            this.data.connections = [];
        }
    }
}
__decorate([
    Inject()
], TransitionsNode.prototype, "transitionsService", void 0);
//# sourceMappingURL=transitions.js.map