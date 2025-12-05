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
import { Component, Prop } from 'vue-property-decorator';
import { ObsInput } from './ObsInput';
import HFormGroup from 'components/shared/inputs/HFormGroup.vue';
import { TextInput } from 'components/shared/inputs/inputs';
import * as remote from '@electron/remote';
let ObsPathInput = class ObsPathInput extends ObsInput {
    showFileDialog() {
        return __awaiter(this, void 0, void 0, function* () {
            const options = {
                defaultPath: this.value.value,
                filters: this.value.filters,
                properties: [],
            };
            if (this.value.type === 'OBS_PROPERTY_FILE') {
                options.properties.push('openFile');
            }
            if (this.value.type === 'OBS_PROPERTY_PATH') {
                options.properties.push('openDirectory');
            }
            const { filePaths } = yield remote.dialog.showOpenDialog(options);
            if (filePaths[0]) {
                this.handleChange(filePaths[0]);
            }
        });
    }
    handleChange(value) {
        this.emitInput(Object.assign(Object.assign({}, this.value), { value }));
    }
};
__decorate([
    Prop()
], ObsPathInput.prototype, "value", void 0);
ObsPathInput = __decorate([
    Component({ components: { HFormGroup, TextInput } })
], ObsPathInput);
ObsPathInput.obsType = ['OBS_PROPERTY_PATH', 'OBS_PROPERTY_FILE'];
export default ObsPathInput;
//# sourceMappingURL=ObsPathInput.vue.js.map