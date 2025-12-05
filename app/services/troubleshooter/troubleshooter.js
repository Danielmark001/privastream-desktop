var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { mutation, ViewHandler } from '../core/stateful-service';
import { PersistentStatefulService } from 'services/core/persistent-stateful-service';
import { Inject } from '../core/injector';
import { $t } from 'services/i18n';
class TroubleshooterViews extends ViewHandler {
    get metadata() {
        return {
            skippedEnabled: {
                type: 'checkbox',
                label: $t('Detect skipped frames'),
                children: {
                    skippedThreshold: {
                        type: 'slider',
                        label: $t('Skipped frames threshold'),
                        min: 0,
                        max: 1,
                        step: 0.01,
                        usePercentages: true,
                        displayed: this.state.settings.skippedEnabled,
                    },
                },
            },
            laggedEnabled: {
                type: 'checkbox',
                label: $t('Detect lagged frames'),
                children: {
                    laggedThreshold: {
                        type: 'slider',
                        label: $t('Lagged frames threshold'),
                        min: 0,
                        max: 1,
                        step: 0.01,
                        usePercentages: true,
                        displayed: this.state.settings.laggedEnabled,
                    },
                },
            },
            droppedEnabled: {
                type: 'checkbox',
                label: $t('Detect dropped frames'),
                children: {
                    droppedThreshold: {
                        type: 'slider',
                        label: $t('Dropped frames threshold'),
                        min: 0,
                        max: 1,
                        step: 0.01,
                        usePercentages: true,
                        displayed: this.state.settings.droppedEnabled,
                    },
                },
            },
            dualOutputCpuEnabled: {
                type: 'checkbox',
                label: $t('Detect CPU usage in Dual Output mode'),
                children: {
                    dualOutputCpuThreshold: {
                        type: 'slider',
                        label: $t('CPU usage threshold in Dual Output mode'),
                        min: 0,
                        max: 1,
                        step: 0.01,
                        usePercentages: true,
                        displayed: this.state.settings.dualOutputCpuEnabled,
                    },
                },
            },
        };
    }
    get settings() {
        return this.state.settings;
    }
}
export class TroubleshooterService extends PersistentStatefulService {
    get views() {
        return new TroubleshooterViews(this.state);
    }
    setSettings(settingsPatch) {
        this.SET_SETTINGS(settingsPatch);
    }
    restoreDefaultSettings() {
        this.setSettings(TroubleshooterService.defaultState.settings);
    }
    showTroubleshooter(issueCode) {
        this.windowsService.showWindow({
            componentName: 'Troubleshooter',
            title: $t('Troubleshooter'),
            queryParams: { issueCode },
            size: {
                width: 500,
                height: 500,
            },
        });
    }
    SET_SETTINGS(settingsPatch) {
        this.state.settings = Object.assign(Object.assign({}, this.state.settings), settingsPatch);
    }
}
TroubleshooterService.defaultState = {
    settings: {
        skippedEnabled: true,
        skippedThreshold: 0.25,
        laggedEnabled: false,
        laggedThreshold: 0.25,
        droppedEnabled: true,
        droppedThreshold: 0.25,
        dualOutputCpuEnabled: true,
        dualOutputCpuThreshold: 0.3,
    },
};
__decorate([
    Inject()
], TroubleshooterService.prototype, "windowsService", void 0);
__decorate([
    mutation()
], TroubleshooterService.prototype, "SET_SETTINGS", null);
//# sourceMappingURL=troubleshooter.js.map