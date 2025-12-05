var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Component } from 'vue-property-decorator';
import WidgetEditor from 'components/windows/WidgetEditor.vue';
import WidgetSettings from './WidgetSettings.vue';
import { inputComponents } from './inputs';
import VFormGroup from 'components/shared/inputs/VFormGroup.vue';
import { $t } from 'services/i18n';
import ValidatedForm from 'components/shared/inputs/ValidatedForm';
import uuid from 'uuid/v4';
let SpinWheel = class SpinWheel extends WidgetSettings {
    get metadata() {
        return this.service.getMetadata(this.sectionOptions);
    }
    get navItems() {
        return [
            { value: 'manage-wheel', label: $t('Manage Spin Wheel') },
            { value: 'categories', label: $t('Categories') },
            { value: 'section', label: $t('Section Weights') },
            { value: 'font', label: $t('Font Settings') },
            { value: 'border', label: $t('Border') },
            { value: 'ticker', label: $t('Ticker') },
            { value: 'image', label: $t('Center Image') },
            { value: 'source', label: $t('Source') },
        ];
    }
    clearCategories() {
        this.wData.settings.categories = [];
        this.save();
    }
    addCategory() {
        this.wData.settings.categories.push({ color: '#ffffff', prize: 'Donut', key: uuid() });
        this.save();
    }
    editCategory(key, patch) {
        this.wData.settings.categories = this.wData.settings.categories.map(cat => {
            if (cat.key === key)
                return Object.assign(Object.assign({}, cat), patch);
            return cat;
        });
        this.save();
    }
    removeCategory(key) {
        const catIdx = this.wData.settings.categories.findIndex(cat => cat.key === key);
        this.wData.settings.categories = this.wData.settings.categories.filter(cat => cat.key !== key);
        this.wData.settings.sections = this.wData.settings.sections.filter(sect => sect.category !== catIdx);
        this.wData.settings.sections.forEach(sect => {
            if (sect.category > catIdx)
                sect.category--;
        });
        this.save();
    }
    get sectionOptions() {
        return this.wData.settings.categories.map((cat, i) => ({ title: cat.prize, value: i }));
    }
    clearSections() {
        this.wData.settings.sections = [];
        this.save();
    }
    addSection() {
        this.wData.settings.sections.push({ category: 0, weight: 1, key: uuid() });
        this.save();
    }
    editSection(key, patch) {
        this.wData.settings.sections = this.wData.settings.sections.map(sect => {
            if (sect.key === key)
                return Object.assign(Object.assign({}, sect), patch);
            return sect;
        });
        this.save();
    }
    removeSection(key) {
        this.wData.settings.sections = this.wData.settings.sections.filter(sect => sect.key !== key);
        this.save();
    }
    moveSection(key, idxMod) {
        const sections = this.wData.settings.sections;
        const idx = sections.findIndex(sect => sect.key === key);
        if (idxMod > 0) {
            sections.splice(idx, 2, sections[idx + idxMod], sections[idx]);
        }
        else {
            sections.splice(idx + idxMod, 2, sections[idx], sections[idx + idxMod]);
        }
        this.save();
    }
};
SpinWheel = __decorate([
    Component({
        components: Object.assign({ WidgetEditor,
            VFormGroup,
            ValidatedForm }, inputComponents),
    })
], SpinWheel);
export default SpinWheel;
//# sourceMappingURL=SpinWheel.vue.js.map