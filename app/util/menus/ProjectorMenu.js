var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Menu } from './Menu';
import { Inject } from '../../services/core/injector';
import { $t } from 'services/i18n';
export class ProjectorMenu extends Menu {
    constructor() {
        super();
        this.appendMenuItems();
    }
    appendMenuItems() {
        const selectedItem = this.selectionService.views.globalSelection.getItems()[0];
        if (selectedItem) {
            this.append({
                label: $t('Create Source Projector'),
                click: () => {
                    this.projectorService.createProjector(0, selectedItem.sourceId);
                },
            });
        }
        this.append({
            label: $t('Create Output Projector'),
            click: () => this.projectorService.createProjector(0),
        });
        if (this.streamingService.state.selectiveRecording) {
            this.append({
                label: $t('Create Stream Output Projector'),
                click: () => this.projectorService.createProjector(1),
            });
            this.append({
                label: $t('Create Recording Output Projector'),
                click: () => this.projectorService.createProjector(2),
            });
        }
    }
}
__decorate([
    Inject()
], ProjectorMenu.prototype, "projectorService", void 0);
__decorate([
    Inject()
], ProjectorMenu.prototype, "streamingService", void 0);
__decorate([
    Inject()
], ProjectorMenu.prototype, "selectionService", void 0);
//# sourceMappingURL=ProjectorMenu.js.map