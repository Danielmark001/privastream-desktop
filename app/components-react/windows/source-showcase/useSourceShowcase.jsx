import React from 'react';
import omit from 'lodash/omit';
import { Services } from '../../service-provider';
import { WidgetType } from 'services/widgets';
import { byOS, OS } from 'util/operating-systems';
import { initStore, useController } from 'components-react/hooks/zustand';
export class SourceShowcaseController {
    constructor() {
        this.store = initStore({
            inspectedSource: (Services.UserService.views.isLoggedIn
                ? 'AlertBox'
                : 'ffmpeg_source'),
            inspectedAppId: '',
            inspectedAppSourceId: '',
        });
    }
    get sourcesService() {
        return Services.SourcesService;
    }
    get platformAppsService() {
        return Services.PlatformAppsService;
    }
    get availableAppSources() {
        return this.platformAppsService.views.enabledApps.reduce((sources, app) => {
            if (app.manifest.sources) {
                app.manifest.sources.forEach(source => {
                    sources.push({ source, appId: app.id });
                });
            }
            return sources;
        }, []);
    }
    inspectSource(source, appId, appSourceId) {
        this.store.setState(s => {
            s.inspectedSource = source;
            s.inspectedAppId = appId || '';
            s.inspectedAppSourceId = appSourceId || '';
        });
    }
    selectInspectedSource() {
        const inspectedSource = this.store.inspectedSource;
        if (WidgetType[inspectedSource] != null) {
            this.selectWidget(WidgetType[inspectedSource]);
        }
        else if (inspectedSource === 'streamlabel') {
            this.selectStreamlabel();
        }
        else if (inspectedSource === 'replay') {
            this.selectSource('ffmpeg_source', { propertiesManager: 'replay' });
        }
        else if (inspectedSource === 'icon_library') {
            this.selectSource('image_source', { propertiesManager: 'iconLibrary' });
        }
        else if (inspectedSource === 'app_source') {
            this.selectAppSource(this.store.inspectedAppId, this.store.inspectedAppSourceId);
        }
        else if (this.sourcesService.getAvailableSourcesTypes().includes(inspectedSource)) {
            this.selectSource(inspectedSource);
        }
    }
    selectSource(sourceType, options = {}) {
        const managerType = options.propertiesManager || 'default';
        const propertiesManagerSettings = Object.assign({}, omit(options, 'propertiesManager'));
        this.sourcesService.showAddSource(sourceType, {
            propertiesManagerSettings,
            propertiesManager: managerType,
        });
    }
    selectStreamlabel() {
        this.selectSource(byOS({ [OS.Windows]: 'text_gdiplus', [OS.Mac]: 'text_ft2_source' }), {
            propertiesManager: 'streamlabels',
        });
    }
    selectWidget(type) {
        this.selectSource('browser_source', {
            propertiesManager: 'widget',
            widgetType: type,
        });
    }
    selectAppSource(appId, appSourceId) {
        this.selectSource('browser_source', {
            appId,
            appSourceId,
            propertiesManager: 'platformApp',
        });
    }
}
export const SourceShowcaseControllerCtx = React.createContext(null);
export function useSourceShowcaseSettings() {
    return useController(SourceShowcaseControllerCtx);
}
//# sourceMappingURL=useSourceShowcase.jsx.map