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
import { $t } from 'services/i18n';
let ChatHighlight = class ChatHighlight extends WidgetSettings {
    get metadata() {
        return this.service.getMetadata();
    }
    get navItems() {
        return [
            { value: 'highlight', label: $t('Highlight Settings') },
            { value: 'message', label: $t('Message Settings') },
            { value: 'name', label: $t('Name Settings') },
            { value: 'source', label: $t('Source') },
        ];
    }
    render() {
        return (this.wData && (<WidgetEditor navItems={this.navItems}>
          <ValidatedForm slot="highlight-properties" key="highlight" onInput={() => this.save()}>
            <span style="margin-bottom: 16px; display: block;">
              {$t('Use this widget by hovering over the right side of a chat message to see a thumbtack icon. Clicking the icon will pin the message to the widget for its duration, or until you click the unpin button.')}
            </span>
            <VFormGroup vModel={this.wData.settings.highlight_duration} metadata={this.metadata.duration}/>
            <VFormGroup vModel={this.wData.settings.font_family} metadata={this.metadata.fontFamily}/>
          </ValidatedForm>
          <ValidatedForm slot="message-properties" key="message" onInput={() => this.save()}>
            <VFormGroup vModel={this.wData.settings.message_font_size} metadata={this.metadata.messageFontSize}/>
            <VFormGroup vModel={this.wData.settings.message_font_weight} metadata={this.metadata.messageFontWeight}/>
            <VFormGroup vModel={this.wData.settings.message_text_color} metadata={this.metadata.messageTextColor}/>
            <VFormGroup vModel={this.wData.settings.message_background_color} metadata={this.metadata.messageBackgroundColor}/>
          </ValidatedForm>
          <ValidatedForm slot="name-properties" key="name" onInput={() => this.save()}>
            <VFormGroup vModel={this.wData.settings.name_font_size} metadata={this.metadata.nameFontSize}/>
            <VFormGroup vModel={this.wData.settings.name_font_weight} metadata={this.metadata.nameFontWeight}/>
            <VFormGroup vModel={this.wData.settings.name_text_color} metadata={this.metadata.nameTextColor}/>
            <VFormGroup vModel={this.wData.settings.name_background_color} metadata={this.metadata.nameBackgroundColor}/>
          </ValidatedForm>
        </WidgetEditor>));
    }
};
ChatHighlight = __decorate([
    Component({})
], ChatHighlight);
export default ChatHighlight;
//# sourceMappingURL=ChatHighlight.jsx.map