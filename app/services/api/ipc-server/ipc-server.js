var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Service } from 'services/core/service';
import electron from 'electron';
import { Inject } from 'services/core/injector';
const { ipcRenderer } = electron;
export class IpcServerService extends Service {
    listen() {
        this.requestHandler = (event, request) => {
            const response = this.exec(request);
            if (!request.params.noReturn) {
                try {
                    ipcRenderer.send('services-response', response);
                }
                catch (e) {
                    console.error('Failed to send services response', e, {
                        request,
                        response,
                    });
                }
            }
        };
        ipcRenderer.on('services-request', this.requestHandler);
        ipcRenderer.send('services-ready');
        this.servicesEventsSubscription = this.internalApiService.serviceEvent.subscribe(event => {
            try {
                this.sendEvent(event);
            }
            catch (e) {
                console.error('Failed to send event to an IPC client. Make sure the object is serializable', e, event);
            }
        });
    }
    exec(request) {
        return this.internalApiService.executeServiceRequest(request);
    }
    stopListening() {
        ipcRenderer.removeListener('services-request', this.requestHandler);
        this.servicesEventsSubscription.unsubscribe();
    }
    sendEvent(event) {
        ipcRenderer.send('services-message', event);
    }
}
__decorate([
    Inject()
], IpcServerService.prototype, "internalApiService", void 0);
//# sourceMappingURL=ipc-server.js.map