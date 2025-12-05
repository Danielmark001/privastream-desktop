var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import { Inject } from 'services/core/injector';
import HFormGroup from 'components/shared/inputs/HFormGroup.vue';
import debounce from 'lodash/debounce';
import pick from 'lodash/pick';
import { metadata } from 'components/widgets/inputs';
import { formMetadata } from 'components/shared/inputs';
import { $t } from 'services/i18n';
let StreamlabelProperties = class StreamlabelProperties extends Vue {
    constructor() {
        super(...arguments);
        this.currentlySelected = null;
        this.labelSettings = null;
        this.sampleItemData = [
            {
                name: 'Fishstickslol',
                months: '5',
                amount: '$4.98',
                message: 'I love you!',
                bits_amount: '498 Bits',
            },
            {
                name: 'ChocoPie',
                months: '2',
                amount: '$5',
                message: 'I love you!',
                bits_amount: '500 Bits',
            },
            {
                name: 'Beecreative',
                months: '3',
                amount: '$1.43',
                message: 'I love you!',
                bits_amount: '143 Bits',
            },
            {
                name: 'ActionBa5tard',
                months: '1',
                amount: '$13.37',
                message: 'Love your stream!',
                bits_amount: '1337 Bits',
            },
        ];
    }
    get statOptions() {
        if (!this.streamlabelsService.state.definitions)
            return;
        return Object.values(this.streamlabelsService.state.definitions);
    }
    created() {
        return __awaiter(this, void 0, void 0, function* () {
            this.refreshPropertyValues();
            this.debouncedSetSettings = debounce(() => this.setSettings(), 1000);
        });
    }
    refreshPropertyValues() {
        if (!this.statOptions)
            return;
        const settings = this.source.getPropertiesManagerSettings();
        this.statOptions.forEach(category => {
            category.files.forEach(file => {
                var _a, _b;
                if (file.name === settings.statname) {
                    this.currentlySelected = file;
                    let settingsStat = file.name;
                    if ((_a = file === null || file === void 0 ? void 0 : file.settings) === null || _a === void 0 ? void 0 : _a.settingsStat)
                        settingsStat = file.settings.settingsStat;
                    this.labelSettings = this.streamlabelsService.getSettingsForStat(settingsStat);
                    if ((_b = file === null || file === void 0 ? void 0 : file.settings) === null || _b === void 0 ? void 0 : _b.settingsWhitelist) {
                        this.labelSettings = pick(this.labelSettings, file.settings.settingsWhitelist);
                    }
                }
            });
        });
        if (!this.labelSettings)
            this.defaultToFirstLabel();
    }
    defaultToFirstLabel() {
        var _a, _b, _c;
        const file = (_a = this.statOptions[0]) === null || _a === void 0 ? void 0 : _a.files[0];
        this.currentlySelected = file;
        let settingsStat = file.name;
        if ((_b = file === null || file === void 0 ? void 0 : file.settings) === null || _b === void 0 ? void 0 : _b.settingsStat)
            settingsStat = file.settings.settingsStat;
        this.labelSettings = this.streamlabelsService.getSettingsForStat(settingsStat);
        if ((_c = file === null || file === void 0 ? void 0 : file.settings) === null || _c === void 0 ? void 0 : _c.settingsWhitelist) {
            this.labelSettings = pick(this.labelSettings, file.settings.settingsWhitelist);
        }
    }
    handleInput(value) {
        this.source.setPropertiesManagerSettings({ statname: value });
        this.refreshPropertyValues();
    }
    setSettings() {
        var _a, _b;
        if (this.labelSettings.limit) {
            this.labelSettings.limit = parseInt(this.labelSettings.limit, 10);
            if (isNaN(this.labelSettings.limit))
                this.labelSettings.limit = 0;
            if (this.labelSettings.limit < 0)
                this.labelSettings.limit = 0;
            if (this.labelSettings.limit > 100)
                this.labelSettings.limit = 100;
        }
        if (this.labelSettings.duration) {
            this.labelSettings.duration = parseInt(this.labelSettings.duration, 10);
            if (isNaN(this.labelSettings.duration))
                this.labelSettings.duration = 1;
            if (this.labelSettings.duration < 1)
                this.labelSettings.duration = 1;
        }
        this.streamlabelsService.setSettingsForStat(((_b = (_a = this.currentlySelected) === null || _a === void 0 ? void 0 : _a.settings) === null || _b === void 0 ? void 0 : _b.settingsStat)
            ? this.currentlySelected.settings.settingsStat
            : this.currentlySelected.name, this.labelSettings);
    }
    get splitPreview() {
        return this.preview.split('\\n');
    }
    get preview() {
        if (this.labelSettings.format == null)
            return '';
        const isBits = /cheer/.test(this.currentlySelected.name);
        let replaced = this.labelSettings.format
            .replace(/{name}/gi, 'Fishstickslol')
            .replace(/{title}/gi, 'New Computer')
            .replace(/{currentAmount}/gi, '$12')
            .replace(/{count}/gi, '123')
            .replace(/{goalAmount}/gi, '$47')
            .replace(/{amount}/gi, isBits ? '499 Bits' : '$4.99')
            .replace(/{months}/gi, '3')
            .replace(/{either_amount}/gi, ['$4.99', '499 Bits'][Math.floor(Math.random() * 2)]);
        if (this.labelSettings.item_format) {
            const itemStr = this.sampleItems.join(this.labelSettings.item_separator);
            replaced = replaced.replace(/{list}/gi, itemStr);
        }
        return replaced;
    }
    get sampleItems() {
        return this.sampleItemData.map(data => {
            return this.labelSettings.item_format
                .replace(/{name}/gi, data.name)
                .replace(/{months}/gi, data.months)
                .replace(/{amount}/gi, data.amount)
                .replace(/{either_amount}/gi, [data.amount, data.bits_amount][Math.floor(Math.random() * 2)])
                .replace(/{message}/gi, data.message);
        });
    }
    get metadata() {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
        return formMetadata({
            labelType: metadata.sectionedMultiselect({
                title: $t('Label Type'),
                options: (_a = this.statOptions) === null || _a === void 0 ? void 0 : _a.map(option => ({
                    label: option.label,
                    options: option.files.map(def => ({ label: def.label, value: def.name })),
                })),
                allowEmpty: false,
            }),
            format: metadata.text({
                title: $t('Label Template'),
                description: $t('Tokens: %{tokenList}', {
                    tokenList: (_d = (_c = (_b = this.currentlySelected) === null || _b === void 0 ? void 0 : _b.settings) === null || _c === void 0 ? void 0 : _c.format) === null || _d === void 0 ? void 0 : _d.tokens.join(' '),
                }),
            }),
            item_format: metadata.text({
                title: $t('Item Template'),
                description: $t('Tokens: %{tokenList}', {
                    tokenList: (_g = (_f = (_e = this.currentlySelected) === null || _e === void 0 ? void 0 : _e.settings) === null || _f === void 0 ? void 0 : _f.item_format) === null || _g === void 0 ? void 0 : _g.tokens.join(' '),
                }),
            }),
            item_separator: metadata.text({
                title: $t('Item Separator'),
                description: $t('Tokens: %{tokenList}', {
                    tokenList: (_k = (_j = (_h = this.currentlySelected) === null || _h === void 0 ? void 0 : _h.settings) === null || _j === void 0 ? void 0 : _j.item_separator) === null || _k === void 0 ? void 0 : _k.tokens.join(' '),
                }),
            }),
            limit: metadata.text({ title: $t('Item Limit') }),
            duration: metadata.number({
                title: $t('Duration'),
                isInteger: true,
            }),
            show_clock: metadata.list({
                title: $t('Show Clock'),
                options: [
                    { title: $t('Always, show 0:00 when inactive'), value: 'always' },
                    { title: $t('Hide when inactive'), value: 'active' },
                ],
                allowEmpty: false,
            }),
            show_count: metadata.list({
                title: $t('Show Count'),
                options: [
                    { title: $t('Always, show 0 when inactive'), value: 'always' },
                    { title: $t('Hide when inactive'), value: 'active' },
                ],
                allowEmpty: false,
            }),
            show_latest: metadata.list({
                title: $t('Show Latest'),
                options: [
                    { title: $t('Always, show last person when inactive'), value: 'always' },
                    { title: $t('Hide when inactive'), value: 'active' },
                ],
                allowEmpty: false,
            }),
            include_resubs: metadata.bool({ title: $t('Include Resubs') }),
        });
    }
    render() {
        return (this.labelSettings && (<div>
          <HFormGroup value={this.currentlySelected.name} onInput={(val) => this.handleInput(val)} metadata={this.metadata.labelType}/>
          {Object.keys(this.labelSettings).map((key) => (<HFormGroup key={key} vModel={this.labelSettings[key]} onInput={() => this.debouncedSetSettings()} metadata={this.metadata[key]}/>))}
          {this.labelSettings.format != null && (<HFormGroup title={$t('Preview')}>
              <div style="color: var(--title);">
                {this.splitPreview.map(line => (<div key={line}>{line}</div>))}
              </div>
              <div style="font-style: italic; opacity: 0.7;">
                {$t('Note: Actual label text may take up to 60 seconds to update')}
              </div>
            </HFormGroup>)}
        </div>));
    }
};
__decorate([
    Prop()
], StreamlabelProperties.prototype, "source", void 0);
__decorate([
    Inject()
], StreamlabelProperties.prototype, "userService", void 0);
__decorate([
    Inject()
], StreamlabelProperties.prototype, "streamlabelsService", void 0);
StreamlabelProperties = __decorate([
    Component({
        components: { HFormGroup },
    })
], StreamlabelProperties);
export default StreamlabelProperties;
//# sourceMappingURL=StreamlabelProperties.jsx.map