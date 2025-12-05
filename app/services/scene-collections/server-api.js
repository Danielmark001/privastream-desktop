var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Service } from 'services/core/service';
import { Inject } from 'services/core/injector';
import { authorizedHeaders, jfetch } from 'util/requests';
export class SceneCollectionsServerApiService extends Service {
    fetchSceneCollections() {
        const url = `${this.baseUrl}/scene-collection`;
        const request = new Request(url, { headers: this.headers });
        return jfetch(request);
    }
    fetchSceneCollectionsById(ids) {
        const queryString = ids.map(id => `ids[]=${id}`).join('&');
        const url = `${this.baseUrl}/scene-collection/get-by-ids?${queryString}`;
        const request = new Request(url, { headers: this.headers });
        return jfetch(request);
    }
    fetchSceneCollection(id) {
        const url = `${this.baseUrl}/scene-collection/${id}`;
        const request = new Request(url, { headers: this.headers });
        return jfetch(request);
    }
    makeSceneCollectionActive(id) {
        const url = `${this.baseUrl}/active/scene-collection/${id}`;
        const request = new Request(url, { headers: this.headers, method: 'POST' });
        return jfetch(request);
    }
    createSceneCollection(collection) {
        const url = `${this.baseUrl}/scene-collection`;
        const headers = this.headers;
        headers.append('Content-Type', 'application/x-www-form-urlencoded');
        const body = this.formSerializeCollection(collection);
        const request = new Request(url, { headers, body, method: 'POST' });
        return jfetch(request);
    }
    updateSceneCollection(collection) {
        const url = `${this.baseUrl}/scene-collection/${collection.id}`;
        const headers = this.headers;
        headers.append('Content-Type', 'application/x-www-form-urlencoded');
        const body = this.formSerializeCollection(collection);
        const request = new Request(url, { headers, body, method: 'PUT' });
        return jfetch(request);
    }
    deleteSceneCollection(id) {
        const url = `${this.baseUrl}/scene-collection/${id}`;
        const request = new Request(url, { headers: this.headers, method: 'DELETE' });
        return jfetch(request);
    }
    formSerializeCollection(collection) {
        var _a;
        const bodyVars = [];
        bodyVars.push(`name=${encodeURIComponent(collection.name)}`);
        bodyVars.push(`data=${encodeURIComponent((_a = collection.data) !== null && _a !== void 0 ? _a : '')}`);
        bodyVars.push(`last_updated_at=${encodeURIComponent(collection.last_updated_at)}`);
        return bodyVars.join('&');
    }
    get headers() {
        return authorizedHeaders(this.userService.apiToken);
    }
    get baseUrl() {
        return `https://${this.hostsService.overlays}/api`;
    }
}
__decorate([
    Inject()
], SceneCollectionsServerApiService.prototype, "hostsService", void 0);
__decorate([
    Inject()
], SceneCollectionsServerApiService.prototype, "userService", void 0);
//# sourceMappingURL=server-api.js.map