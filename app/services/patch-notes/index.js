var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { PersistentStatefulService, mutation, Service, Inject } from 'services';
import Util from 'services/utils';
import { notes } from './notes';
import { $t } from 'services/i18n';
import { ENotificationType } from 'services/notifications';
export class PatchNotesService extends PersistentStatefulService {
    init() {
        super.init();
        if (Util.isDevMode()) {
            window['showPatchNotes'] = () => {
                this.navigationService.navigate('PatchNotes');
            };
        }
    }
    showPatchNotesIfRequired(onboarded) {
        if (Util.isDevMode() || Util.isPreview() || Util.isIpc())
            return;
        const minorVersionRegex = /^(\d+\.\d+)\.\d+$/;
        const currentMinorVersion = Util.env.SLOBS_VERSION.match(minorVersionRegex);
        const patchNotesMinorVesion = notes.version.match(minorVersionRegex);
        const lastMinorVersionSeen = this.state.lastVersionSeen
            ? this.state.lastVersionSeen.match(minorVersionRegex)
            : null;
        if (!currentMinorVersion || !patchNotesMinorVesion)
            return;
        if (currentMinorVersion[1] !== patchNotesMinorVesion[1])
            return;
        if (lastMinorVersionSeen && lastMinorVersionSeen[1] === currentMinorVersion[1])
            return;
        this.SET_LAST_VERSION_SEEN(Util.env.SLOBS_VERSION, new Date().toISOString());
        if (!onboarded) {
            this.notificationsService.push({
                type: ENotificationType.SUCCESS,
                lifeTime: 30000,
                showTime: false,
                playSound: false,
                message: $t('Streamlabs Desktop has updated! Click here to see what changed.'),
                action: this.jsonrpcService.createRequest(Service.getResourceId(this.navigationService), 'navigate', 'PatchNotes'),
            });
        }
    }
    get notes() {
        return notes;
    }
    SET_LAST_VERSION_SEEN(version, timestamp) {
        this.state.lastVersionSeen = version;
        this.state.updateTimestamp = timestamp;
    }
}
PatchNotesService.defaultState = {
    lastVersionSeen: null,
    updateTimestamp: null,
};
__decorate([
    Inject()
], PatchNotesService.prototype, "navigationService", void 0);
__decorate([
    Inject()
], PatchNotesService.prototype, "notificationsService", void 0);
__decorate([
    Inject()
], PatchNotesService.prototype, "jsonrpcService", void 0);
__decorate([
    Inject()
], PatchNotesService.prototype, "windowsService", void 0);
__decorate([
    mutation()
], PatchNotesService.prototype, "SET_LAST_VERSION_SEEN", null);
//# sourceMappingURL=index.js.map