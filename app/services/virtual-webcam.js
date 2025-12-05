var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { ExecuteInWorkerProcess, StatefulService, ViewHandler, mutation } from 'services/core';
import * as obs from '../../obs-api';
import path from 'path';
import { getChecksum } from 'util/requests';
import { byOS, OS } from 'util/operating-systems';
import { Inject } from 'services/core/injector';
import * as remote from '@electron/remote';
import { Subject } from 'rxjs';
import os from 'os';
import { $t } from 'services/i18n';
const PLUGIN_PLIST_PATH = '/Library/CoreMediaIO/Plug-Ins/DAL/vcam-plugin.plugin/Contents/Info.plist';
const INTERNAL_PLIST_PATH = 'node_modules/obs-studio-node/data/obs-plugins/slobs-virtual-cam/Info.plist';
export var EVirtualWebcamPluginInstallStatus;
(function (EVirtualWebcamPluginInstallStatus) {
    EVirtualWebcamPluginInstallStatus["Installed"] = "installed";
    EVirtualWebcamPluginInstallStatus["NotPresent"] = "notPresent";
    EVirtualWebcamPluginInstallStatus["Outdated"] = "outdated";
})(EVirtualWebcamPluginInstallStatus || (EVirtualWebcamPluginInstallStatus = {}));
var InstallationErrorCodes;
(function (InstallationErrorCodes) {
    InstallationErrorCodes[InstallationErrorCodes["OSSystemExtensionErrorUnknown"] = 1] = "OSSystemExtensionErrorUnknown";
    InstallationErrorCodes[InstallationErrorCodes["OSSystemExtensionErrorMissingEntitlement"] = 2] = "OSSystemExtensionErrorMissingEntitlement";
    InstallationErrorCodes[InstallationErrorCodes["OSSystemExtensionErrorUnsupportedParentBundleLocation"] = 3] = "OSSystemExtensionErrorUnsupportedParentBundleLocation";
    InstallationErrorCodes[InstallationErrorCodes["OSSystemExtensionErrorExtensionNotFound"] = 4] = "OSSystemExtensionErrorExtensionNotFound";
    InstallationErrorCodes[InstallationErrorCodes["OSSystemExtensionErrorExtensionMissingIdentifier"] = 5] = "OSSystemExtensionErrorExtensionMissingIdentifier";
    InstallationErrorCodes[InstallationErrorCodes["OSSystemExtensionErrorDuplicateExtensionIdentifer"] = 6] = "OSSystemExtensionErrorDuplicateExtensionIdentifer";
    InstallationErrorCodes[InstallationErrorCodes["OSSystemExtensionErrorUnknownExtensionCategory"] = 7] = "OSSystemExtensionErrorUnknownExtensionCategory";
    InstallationErrorCodes[InstallationErrorCodes["OSSystemExtensionErrorCodeSignatureInvalid"] = 8] = "OSSystemExtensionErrorCodeSignatureInvalid";
    InstallationErrorCodes[InstallationErrorCodes["OSSystemExtensionErrorValidationFailed"] = 9] = "OSSystemExtensionErrorValidationFailed";
    InstallationErrorCodes[InstallationErrorCodes["OSSystemExtensionErrorForbiddenBySystemPolicy"] = 10] = "OSSystemExtensionErrorForbiddenBySystemPolicy";
    InstallationErrorCodes[InstallationErrorCodes["OSSystemExtensionErrorRequestCanceled"] = 11] = "OSSystemExtensionErrorRequestCanceled";
    InstallationErrorCodes[InstallationErrorCodes["OSSystemExtensionErrorRequestSuperseded"] = 12] = "OSSystemExtensionErrorRequestSuperseded";
    InstallationErrorCodes[InstallationErrorCodes["OSSystemExtensionErrorAuthorizationRequired"] = 13] = "OSSystemExtensionErrorAuthorizationRequired";
    InstallationErrorCodes[InstallationErrorCodes["RebootRequired"] = 100] = "RebootRequired";
    InstallationErrorCodes[InstallationErrorCodes["UserApprovalRequired"] = 101] = "UserApprovalRequired";
    InstallationErrorCodes[InstallationErrorCodes["MacOS13Unavailable"] = 102] = "MacOS13Unavailable";
    InstallationErrorCodes[InstallationErrorCodes["UnknownError"] = 999] = "UnknownError";
})(InstallationErrorCodes || (InstallationErrorCodes = {}));
export class VirtualWebcamService extends StatefulService {
    constructor() {
        super(...arguments);
        this.runningChanged = new Subject();
        this.installStatusChanged = new Subject();
        this.signalInfoChanged = new Subject();
    }
    init() {
        byOS({
            [OS.Windows]: () => {
                this.setInstallStatus();
            },
            [OS.Mac]: () => {
                const result = obs.NodeObs.OBS_service_isVirtualCamPluginInstalled();
                if (result === 2) {
                    this.signalsService.addCallback(this.handleSignalOutput);
                    obs.NodeObs.OBS_service_createVirtualCam();
                    this.signalInfoChanged.subscribe((signalInfo) => {
                        console.log(`virtual cam init signalInfo: ${signalInfo.signal}`);
                        this.setInstallStatus();
                    });
                }
            },
        });
    }
    handleSignalOutput(info) {
        this.signalInfoChanged.next(info);
    }
    get views() {
        return new VirtualWebcamViews(this.state);
    }
    handleUnknownVirtualCamError(error) {
        console.error('Caught OBS_service_startVirtualCam error:', error);
        let errorMessage = '';
        const darwinVersion = os.release().split('.')[0];
        const isMacOS15OrGreater = Number(darwinVersion) >= 15;
        if (isMacOS15OrGreater) {
            errorMessage = $t('Unable to start virtual camera.\n\nYou may need to enable permissions. To do this, go to System Settings → General → Login Items & Extensions → Camera Extensions.');
        }
        else {
            errorMessage = $t('Unable to start virtual camera.\n\nYou may need to enable permissions. To do this, go to System Settings → Privacy & Security → Security.');
        }
        remote.dialog.showErrorBox($t('Virtual Webcam'), errorMessage);
    }
    tryInstallSystemExtension() {
        const errorCode = obs.NodeObs.OBS_service_installVirtualCamPlugin();
        if (errorCode > 0) {
            const errorMessage = this.getInstallErrorMessage(errorCode);
            remote.dialog.showErrorBox($t('Virtual Webcam'), errorMessage);
        }
        return errorCode === 0;
    }
    getInstallErrorMessage(errorCode) {
        const codeName = InstallationErrorCodes[errorCode];
        console.log(`User experienced virtual cam installation error ${errorCode} value ${codeName}`);
        let errorMessage = '';
        switch (errorCode) {
            case InstallationErrorCodes.OSSystemExtensionErrorUnsupportedParentBundleLocation:
                errorMessage = $t("Streamlabs Desktop cannot install the virtual camera if it's not in Applications. Please move Streamlabs Desktop to the Applications directory.");
                break;
            case InstallationErrorCodes.RebootRequired:
                errorMessage = $t('The installation of the virtual camera will complete after a system reboot.');
                break;
            case InstallationErrorCodes.UserApprovalRequired:
                {
                    const darwinVersion = os.release().split('.')[0];
                    const isMacOS15OrGreater = Number(darwinVersion) >= 15;
                    if (isMacOS15OrGreater) {
                        errorMessage = $t('The virtual camera is not installed.\n\nPlease allow Streamlabs Desktop to install the camera system extension in System Settings → General → Login Items & Extensions → Camera Extensions.\n\nYou may need to restart Streamlabs Desktop if this message still appears afterward.');
                    }
                    else {
                        errorMessage = $t('The virtual camera is not installed.\n\nPlease allow Streamlabs Desktop to install system software in System Settings → Privacy & Security → Security.\n\nYou may need to restart Streamlabs Desktop if this message still appears afterward.');
                    }
                }
                break;
            case InstallationErrorCodes.MacOS13Unavailable:
                errorMessage = $t('Streamlabs Virtual Webcam feature requires macOS 13 or later.');
                break;
            default:
                errorMessage = $t('An error has occured while installing the virtual camera');
                break;
        }
        return errorMessage;
    }
    setInstallStatus() {
        try {
            const installStatus = this.getInstallStatus();
            this.SET_INSTALL_STATUS(installStatus);
        }
        catch (error) {
            console.error('Error resolving install status:', error);
            this.SET_INSTALL_STATUS(EVirtualWebcamPluginInstallStatus.NotPresent);
        }
        this.installStatusChanged.next(this.state.installStatus);
    }
    getInstallStatus() {
        const result = obs.NodeObs.OBS_service_isVirtualCamPluginInstalled();
        if (result === 2) {
            return EVirtualWebcamPluginInstallStatus.Installed;
        }
        else if (result === 1) {
            return EVirtualWebcamPluginInstallStatus.Outdated;
        }
        else {
            return EVirtualWebcamPluginInstallStatus.NotPresent;
        }
    }
    install() {
        byOS({
            [OS.Windows]: () => {
                obs.NodeObs.OBS_service_installVirtualCamPlugin();
                this.setInstallStatus();
            },
            [OS.Mac]: () => {
                this.signalsService.addCallback(this.handleSignalOutput);
                if (this.tryInstallSystemExtension()) {
                    this.signalInfoChanged.subscribe((signalInfo) => {
                        console.log(`virtual cam install signalInfo: ${signalInfo.signal}`);
                        this.setInstallStatus();
                        obs.NodeObs.OBS_service_createVirtualCam();
                    });
                }
            },
        });
    }
    uninstall() {
        const errorCode = obs.NodeObs.OBS_service_uninstallVirtualCamPlugin();
        if (errorCode > 0) {
            const codeName = InstallationErrorCodes[errorCode];
            console.log(`uninstalling virtual camera plugin error: ${errorCode} code: ${codeName}`);
            remote.dialog.showErrorBox($t('Virtual Webcam'), $t('An error has occured while uninstalling the virtual camera'));
            return;
        }
        this.SET_INSTALL_STATUS(EVirtualWebcamPluginInstallStatus.NotPresent);
        this.SET_OUTPUT_TYPE(3);
        this.settingsService.setSettingValue('Virtual Webcam', 'OutputSelection', '');
    }
    start() {
        if (this.state.running)
            return;
        try {
            obs.NodeObs.OBS_service_startVirtualCam();
        }
        catch (error) {
            this.handleUnknownVirtualCamError(error);
            return;
        }
        this.SET_RUNNING(true);
        this.runningChanged.next(true);
        this.usageStatisticsService.recordFeatureUsage('VirtualWebcam');
    }
    stop() {
        if (!this.state.running)
            return;
        obs.NodeObs.OBS_service_stopVirtualCam();
        this.SET_RUNNING(false);
        this.runningChanged.next(false);
    }
    getCurrentChecksum() {
        const internalPlistPath = path.join(remote.app.getAppPath(), INTERNAL_PLIST_PATH);
        return getChecksum(internalPlistPath);
    }
    update(type, name) {
        obs.NodeObs.OBS_service_updateVirtualCam(type, name);
        const outputSelection = type === 3 ? '' : name;
        if (type !== this.state.outputType) {
            this.SET_OUTPUT_TYPE(type);
            this.SET_OUTPUT_SELECTION(outputSelection);
        }
    }
    SET_RUNNING(running) {
        this.state.running = running;
    }
    SET_OUTPUT_TYPE(type) {
        this.state.outputType = type;
    }
    SET_OUTPUT_SELECTION(selection) {
        this.state.outputSelection = selection;
    }
    SET_INSTALL_STATUS(installStatus) {
        this.state.installStatus = installStatus;
    }
}
VirtualWebcamService.initialState = {
    running: false,
    outputType: 3,
    outputSelection: '',
    installStatus: EVirtualWebcamPluginInstallStatus.NotPresent,
};
__decorate([
    Inject()
], VirtualWebcamService.prototype, "usageStatisticsService", void 0);
__decorate([
    Inject()
], VirtualWebcamService.prototype, "sourcesService", void 0);
__decorate([
    Inject()
], VirtualWebcamService.prototype, "settingsService", void 0);
__decorate([
    Inject()
], VirtualWebcamService.prototype, "signalsService", void 0);
__decorate([
    ExecuteInWorkerProcess()
], VirtualWebcamService.prototype, "setInstallStatus", null);
__decorate([
    ExecuteInWorkerProcess()
], VirtualWebcamService.prototype, "getInstallStatus", null);
__decorate([
    ExecuteInWorkerProcess()
], VirtualWebcamService.prototype, "install", null);
__decorate([
    ExecuteInWorkerProcess()
], VirtualWebcamService.prototype, "uninstall", null);
__decorate([
    ExecuteInWorkerProcess()
], VirtualWebcamService.prototype, "start", null);
__decorate([
    ExecuteInWorkerProcess()
], VirtualWebcamService.prototype, "stop", null);
__decorate([
    ExecuteInWorkerProcess()
], VirtualWebcamService.prototype, "update", null);
__decorate([
    mutation()
], VirtualWebcamService.prototype, "SET_RUNNING", null);
__decorate([
    mutation()
], VirtualWebcamService.prototype, "SET_OUTPUT_TYPE", null);
__decorate([
    mutation()
], VirtualWebcamService.prototype, "SET_OUTPUT_SELECTION", null);
__decorate([
    mutation()
], VirtualWebcamService.prototype, "SET_INSTALL_STATUS", null);
class VirtualWebcamViews extends ViewHandler {
    get running() {
        return this.state.running;
    }
    get outputType() {
        return this.state.outputType.toString();
    }
    get outputSelection() {
        return this.state.outputSelection;
    }
    get installStatus() {
        return this.state.installStatus;
    }
}
//# sourceMappingURL=virtual-webcam.js.map