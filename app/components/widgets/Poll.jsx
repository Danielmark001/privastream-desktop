var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Component } from 'vue-property-decorator';
import WidgetEditor from 'components/windows/WidgetEditor.vue';
import WidgetSettings from './WidgetSettings.vue';
import VFormGroup from 'components/shared/inputs/VFormGroup.vue';
import ValidatedForm from 'components/shared/inputs/ValidatedForm';
import { Services } from 'components-react/service-provider';
import { $t } from 'services/i18n';
let Poll = class Poll extends WidgetSettings {
    constructor() {
        super(...arguments);
        this.UserService = Services.UserService;
        this.TwitchService = Services.TwitchService;
        this.OnboardingService = Services.OnboardingService;
        this.WindowsService = Services.WindowsService;
    }
    get hasPollScopes() {
        if (!this.isTwitchAuthed)
            return;
        return this.TwitchService.state.hasPollsPermission;
    }
    get metadata() {
        return this.service.getMetadata();
    }
    get isTwitchAuthed() {
        return this.UserService.views.isTwitchAuthed;
    }
    get navItems() {
        return [
            { value: 'poll', label: $t('Manage Poll') },
            { value: 'font', label: $t('Font Settings') },
            { value: 'bar', label: $t('Bar Settings') },
            { value: 'source', label: $t('Source') },
        ];
    }
    reauth() {
        this.OnboardingService.actions.start({ isLogin: true });
        this.WindowsService.closeChildWindow();
    }
    render() {
        return (this.wData && (<WidgetEditor navItems={this.navItems}>
          <ValidatedForm slot="poll-properties" onInput={() => this.save()}>
            {this.isTwitchAuthed && !this.hasPollScopes && (<a onClick={() => this.reauth()} style="margin-bottom: 8px; display: block;">
                {$t('You need to re-login to access Twitch chat polls')}
              </a>)}
            {this.isTwitchAuthed && this.hasPollScopes && (<VFormGroup vModel={this.wData.settings.poll_type} metadata={this.metadata.pollType}/>)}
            <VFormGroup vModel={this.wData.settings.show_on_closed} metadata={this.metadata.showOnClosed}/>
            <VFormGroup vModel={this.wData.settings.background_color_primary} metadata={this.metadata.backgroundPrimary}/>
            <VFormGroup vModel={this.wData.settings.background_color_secondary} metadata={this.metadata.backgroundSecondary}/>
            <VFormGroup vModel={this.wData.settings.fade_time} metadata={this.metadata.fadeTime}/>
          </ValidatedForm>
          <ValidatedForm slot="font-properties" onInput={() => this.save()}>
            <VFormGroup vModel={this.wData.settings.font} metadata={this.metadata.font}/>
            <VFormGroup vModel={this.wData.settings.font_color_primary} metadata={this.metadata.fontPrimary}/>
            <VFormGroup vModel={this.wData.settings.font_color_secondary} metadata={this.metadata.fontSecondary}/>
            <VFormGroup vModel={this.wData.settings.title_font_size} metadata={this.metadata.titleSize}/>
            <VFormGroup vModel={this.wData.settings.option_font_size} metadata={this.metadata.optionSize}/>
            <VFormGroup vModel={this.wData.settings.title_font_weight} metadata={this.metadata.titleWeight}/>
            <VFormGroup vModel={this.wData.settings.option_font_weight} metadata={this.metadata.optionWeight}/>
          </ValidatedForm>
          <ValidatedForm slot="bar-properties" onInput={() => this.save()}>
            <VFormGroup metadata={this.metadata.thinBar} vModel={this.wData.settings.thin_bar}/>
            <VFormGroup vModel={this.wData.settings.bar_background_color} metadata={this.metadata.barBackground}/>
            <VFormGroup vModel={this.wData.settings.bar_color} metadata={this.metadata.barColor}/>
          </ValidatedForm>
        </WidgetEditor>));
    }
};
Poll = __decorate([
    Component({})
], Poll);
export default Poll;
//# sourceMappingURL=Poll.jsx.map