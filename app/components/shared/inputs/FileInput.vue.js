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
import { BaseInput } from './BaseInput';
import { Component, Prop } from 'vue-property-decorator';
import * as remote from '@electron/remote';
let FileInput = class FileInput extends BaseInput {
    showFileDialog() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.metadata.save) {
                const options = {
                    defaultPath: this.value,
                    filters: this.metadata.filters,
                    properties: [],
                };
                const { filePath } = yield remote.dialog.showSaveDialog(options);
                if (filePath)
                    this.emitInput(filePath);
            }
            else {
                const options = {
                    defaultPath: this.value,
                    filters: this.metadata.filters,
                    properties: [],
                };
                if (this.metadata.directory) {
                    options.properties.push('openDirectory');
                }
                else {
                    options.properties.push('openFile');
                }
                const { filePaths } = yield remote.dialog.showOpenDialog(options);
                if (filePaths[0]) {
                    this.emitInput(filePaths[0]);
                }
            }
        });
    }
};
__decorate([
    Prop()
], FileInput.prototype, "value", void 0);
__decorate([
    Prop()
], FileInput.prototype, "metadata", void 0);
__decorate([
    Prop()
], FileInput.prototype, "title", void 0);
FileInput = __decorate([
    Component({})
], FileInput);
export default FileInput;
//# sourceMappingURL=FileInput.vue.js.map