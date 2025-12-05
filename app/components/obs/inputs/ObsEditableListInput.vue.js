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
import cloneDeep from 'lodash/cloneDeep';
import Selector from '../../Selector.vue';
import { Component, Prop } from 'vue-property-decorator';
import { ObsInput } from './ObsInput';
import { Menu } from '../../../util/menus/Menu';
import * as remote from '@electron/remote';
let ObsEditableListProperty = class ObsEditableListProperty extends ObsInput {
    constructor() {
        super(...arguments);
        this.activeItem = '';
        this.menu = new Menu();
    }
    created() {
        this.menu.append({
            label: 'Add Files',
            click: () => {
                this.showFileDialog();
            },
        });
        this.menu.append({
            label: 'Add Directory',
            click: () => {
                this.showDirDialog();
            },
        });
    }
    handleSelect(item) {
        this.activeItem = item;
    }
    handleSort(data) {
        this.setList(data.order);
    }
    handleRemove() {
        this.setList(this.list.filter(item => item !== this.activeItem));
    }
    handleEdit() {
        this.showReplaceFileDialog();
    }
    showReplaceFileDialog() {
        return __awaiter(this, void 0, void 0, function* () {
            const { filePaths } = yield remote.dialog.showOpenDialog({
                defaultPath: this.value.defaultPath,
                filters: this.value.filters,
                properties: ['openFile'],
            });
            if (filePaths) {
                const activeIndex = this.list.indexOf(this.activeItem);
                this.list[activeIndex] = filePaths[0];
                this.activeItem = this.list[activeIndex];
                this.setList(this.list);
            }
        });
    }
    showFileDialog() {
        return __awaiter(this, void 0, void 0, function* () {
            const { filePaths } = yield remote.dialog.showOpenDialog({
                defaultPath: this.value.defaultPath,
                filters: this.value.filters,
                properties: ['openFile', 'multiSelections'],
            });
            if (filePaths) {
                this.setList(this.list.concat(filePaths));
            }
        });
    }
    showDirDialog() {
        return __awaiter(this, void 0, void 0, function* () {
            const { filePaths } = yield remote.dialog.showOpenDialog({
                defaultPath: this.value.defaultPath,
                properties: ['openDirectory'],
            });
            if (filePaths) {
                this.setList(this.list.concat(filePaths));
            }
        });
    }
    setList(list) {
        this.emitInput(Object.assign(Object.assign({}, this.value), { value: list.map(item => ({ value: item })) }));
    }
    get list() {
        const items = this.value.value || [];
        return cloneDeep(items.map(item => item.value));
    }
};
__decorate([
    Prop()
], ObsEditableListProperty.prototype, "value", void 0);
ObsEditableListProperty = __decorate([
    Component({
        components: { Selector },
    })
], ObsEditableListProperty);
ObsEditableListProperty.obsType = 'OBS_PROPERTY_EDITABLE_LIST';
export default ObsEditableListProperty;
//# sourceMappingURL=ObsEditableListInput.vue.js.map