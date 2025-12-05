var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Component, Prop } from 'vue-property-decorator';
import { BaseInput } from './BaseInput';
import 'codemirror/mode/javascript/javascript.js';
import 'codemirror/mode/css/css.js';
import 'codemirror/mode/htmlmixed/htmlmixed.js';
import 'codemirror/keymap/sublime';
import { Inject } from 'services';
import CodeMirror from 'codemirror';
let CodeInput = class CodeInput extends BaseInput {
    constructor() {
        super(...arguments);
        this.editorOptions = {
            html: {
                mode: 'htmlmixed',
                keyMap: 'sublime',
                lineNumbers: true,
                autofocus: true,
                tabSize: 2,
                theme: this.theme,
                autoRefresh: true,
                autoCloseBrackets: true,
                matchBrackets: true,
                autoCloseTags: true,
                extraKeys: {
                    Tab: 'emmetExpandAbbreviation',
                    Enter: 'emmetInsertLineBreak',
                },
            },
            css: {
                mode: 'text/css',
                keyMap: 'sublime',
                lineNumbers: true,
                autofocus: true,
                tabSize: 2,
                theme: this.theme,
                autoRefresh: true,
                autoCloseBrackets: true,
                matchBrackets: true,
                autoCloseTags: true,
                extraKeys: {
                    Tab: 'emmetExpandAbbreviation',
                    Enter: 'emmetInsertLineBreak',
                },
            },
            js: {
                mode: 'javascript',
                keyMap: 'sublime',
                lineNumbers: true,
                autofocus: true,
                tabSize: 2,
                theme: this.theme,
                autoRefresh: true,
                autoCloseBrackets: true,
                matchBrackets: true,
                autoCloseTags: true,
            },
        };
    }
    get theme() {
        return this.customizationService.isDarkTheme ? 'material' : 'xq-light';
    }
    mounted() {
        const $textarea = this.$el.querySelector('textarea');
        const editorOptions = this.editorOptions;
        const options = Object.assign(Object.assign({}, editorOptions[this.metadata.type]), { theme: this.theme });
        const codemirror = CodeMirror.fromTextArea($textarea, options);
        codemirror.setSize('100%', '100%');
        codemirror.on('changes', (cm, changeObj) => {
            this.emitInput(cm.getValue());
        });
        codemirror.setValue(this.value);
    }
    unmounted() {
        this.codemirror.getWrapperElement().remove();
    }
};
__decorate([
    Prop({ default: '' })
], CodeInput.prototype, "value", void 0);
__decorate([
    Prop()
], CodeInput.prototype, "title", void 0);
__decorate([
    Prop({ default: () => ({ type: 'html' }) })
], CodeInput.prototype, "metadata", void 0);
__decorate([
    Inject()
], CodeInput.prototype, "customizationService", void 0);
CodeInput = __decorate([
    Component({})
], CodeInput);
export default CodeInput;
//# sourceMappingURL=CodeInput.vue.js.map