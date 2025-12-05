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
var ValidatedForm_1;
import { Component } from 'vue-property-decorator';
import uuid from 'uuid';
import { BaseInput } from './BaseInput';
import { Subject } from 'rxjs';
import TsxComponent, { createProps } from 'components/tsx-component';
class ValidatedFormProps {
    constructor() {
        this.name = '';
        this.handleExtraValidation = null;
    }
}
let ValidatedForm = ValidatedForm_1 = class ValidatedForm extends TsxComponent {
    constructor() {
        super(...arguments);
        this.validated = new Subject();
        this.validationScopeId = uuid();
    }
    getInputs(propChildren) {
        const children = propChildren || this.$children;
        const inputs = [];
        children.forEach(child => {
            if (child instanceof BaseInput)
                inputs.push(child);
            if (child.$children.length)
                inputs.push(...this.getInputs(child.$children));
        });
        return inputs;
    }
    getForms(propChildren) {
        const children = propChildren || this.$children;
        const forms = [];
        children.forEach(child => {
            if (child instanceof ValidatedForm_1) {
                forms.push(child, ...child.getForms());
                return;
            }
            if (child.$children.length)
                forms.push(...this.getForms(child.$children));
        });
        return forms;
    }
    validate() {
        return __awaiter(this, void 0, void 0, function* () {
            const inputs = this.getInputs();
            for (let i = 0; i < inputs.length; i++) {
                yield inputs[i].$validator.validateAll(inputs[i].form.validationScopeId);
            }
            const nestedForms = this.getForms();
            nestedForms.forEach(form => form.validate());
            this.validated.next(this.$validator.errors.items.concat(...nestedForms.map(form => form.$validator.errors.items)));
            const errors = this.$validator.errors.items;
            if (this.props.handleExtraValidation) {
                return this.props.handleExtraValidation(this, errors) && !errors.length;
            }
            return !errors.length;
        });
    }
    validateAndGetErrors() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.validate();
            return this.$validator.errors.items;
        });
    }
    validateAndGetErrorsCount() {
        return __awaiter(this, void 0, void 0, function* () {
            const errors = yield this.validateAndGetErrors();
            return errors.length;
        });
    }
    emitInput(data, event) {
        this.$emit('input', data, event);
    }
    emitBlur(event) {
        return __awaiter(this, void 0, void 0, function* () {
            this.$emit('blur', event);
        });
    }
    handleSubmit(event) {
        event.preventDefault();
        this.$emit('submit');
    }
    render() {
        return (<form data-vv-scope={this.validationScopeId} onSubmit={this.handleSubmit} name={this.props.name}>
        {this.$slots.default}
      </form>);
    }
};
ValidatedForm = ValidatedForm_1 = __decorate([
    Component({ props: createProps(ValidatedFormProps) })
], ValidatedForm);
export default ValidatedForm;
//# sourceMappingURL=ValidatedForm.jsx.map