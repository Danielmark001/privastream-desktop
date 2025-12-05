import { DefaultManager } from './default-manager';
export class IconLibraryManager extends DefaultManager {
    applySettings(settings) {
        if (settings.activeIcon !== this.obsSource.settings.file) {
            this.obsSource.update({
                file: settings.activeIcon,
            });
            this.handleSettingsChange({ file: settings.activeIcon });
        }
        super.applySettings(Object.assign(Object.assign({}, this.settings), settings));
    }
}
//# sourceMappingURL=icon-library-manager.js.map