var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Menu } from './Menu';
import { Inject } from '../../services/core/injector';
import { $t } from 'services/i18n';
export class FiltersMenu extends Menu {
    constructor(sourceId) {
        super();
        this.sourceId = sourceId;
        this.appendMenuItems();
    }
    appendMenuItems() {
        this.append({
            label: $t('Edit Filters'),
            click: () => this.sourceFiltersService.showSourceFilters(this.sourceId),
        });
        this.append({
            label: $t('Copy Filters'),
            click: () => this.clipboardService.copyFilters(this.sourceId),
        });
        this.append({
            label: $t('Paste Filters'),
            click: () => this.clipboardService.pasteFilters(this.sourceId),
            enabled: this.clipboardService.views.hasFilters(),
        });
    }
}
__decorate([
    Inject()
], FiltersMenu.prototype, "sourceFiltersService", void 0);
__decorate([
    Inject()
], FiltersMenu.prototype, "clipboardService", void 0);
//# sourceMappingURL=FiltersMenu.js.map