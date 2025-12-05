var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { Inject } from '../../services/core/injector';
import ModalLayout from '../ModalLayout.vue';
let FFZSettings = class FFZSettings extends Vue {
    constructor() {
        super(...arguments);
        this.nightMode = false;
    }
    mounted() {
        const webview = this.$refs.ffzSettings;
        const settings = this.customizationService.state;
        this.nightMode = this.customizationService.isDarkTheme;
        webview.addEventListener('dom-ready', () => {
            webview.setZoomFactor(settings.chatZoomFactor);
            webview.executeJavaScript(`
        var ffzscript1 = document.createElement('script');
        ffzscript1.setAttribute('src','https://cdn.frankerfacez.com/script/script.min.js');
        document.head.appendChild(ffzscript1);
        0;
      `, true);
        });
    }
    get partition() {
        return this.userService.isLoggedIn ? this.userService.views.auth.partition : undefined;
    }
    get popoutURL() {
        return `https://www.twitch.tv/popout/frankerfacez/chat?ffz-settings${this.nightMode ? '&darkpopout' : ''}`;
    }
};
__decorate([
    Inject()
], FFZSettings.prototype, "customizationService", void 0);
__decorate([
    Inject()
], FFZSettings.prototype, "windowsService", void 0);
__decorate([
    Inject()
], FFZSettings.prototype, "userService", void 0);
FFZSettings = __decorate([
    Component({
        components: {
            ModalLayout,
        },
    })
], FFZSettings);
export default FFZSettings;
//# sourceMappingURL=FFZSettings.vue.js.map