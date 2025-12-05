var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Service } from 'services/core/service';
import { Inject } from 'services/core/injector';
import { $t } from './i18n';
export class ProjectorService extends Service {
    createProjector(renderingMode, sourceId) {
        let title = sourceId ? this.sourcesService.views.getSource(sourceId).name : $t('Output');
        if (renderingMode === 1)
            title = $t('Streaming Output');
        if (renderingMode === 2)
            title = $t('Recording Output');
        this.windowsService.createOneOffWindow({
            componentName: 'Projector',
            title: $t('Projector: ') + title,
            queryParams: { sourceId, renderingMode },
            size: {
                width: 640,
                height: 400,
                minWidth: 640,
                minHeight: 400,
            },
        });
    }
}
__decorate([
    Inject()
], ProjectorService.prototype, "windowsService", void 0);
__decorate([
    Inject()
], ProjectorService.prototype, "sourcesService", void 0);
//# sourceMappingURL=projector.js.map