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
import { Component } from 'vue-property-decorator';
import { propertyComponentForType } from './Components';
import ValidatedForm from 'components/shared/inputs/ValidatedForm';
import TsxComponent, { createProps } from 'components/tsx-component';
class GenericFormProps {
    constructor() {
        this.value = [];
        this.onInput = () => { };
    }
}
let GenericForm = class GenericForm extends TsxComponent {
    constructor() {
        super(...arguments);
        this.propertyComponentForType = propertyComponentForType;
    }
    onInputHandler(value, index) {
        return __awaiter(this, void 0, void 0, function* () {
            const errors = yield this.$refs.form.validateAndGetErrors();
            this.emitValidate(errors);
            if (errors.length)
                return;
            const newValue = [].concat(this.props.value);
            newValue.splice(index, 1, value);
            this.$emit('input', newValue, index);
        });
    }
    emitValidate(errors) {
        this.$emit('validate', errors);
    }
    onBlurHandler(event) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const errors = yield this.$refs.form.validateAndGetErrors();
            for (const e of errors) {
                const inputs = this.$refs.form.getInputs();
                const inputWithError = inputs.find(input => {
                    return input.getOptions().uuid === e.field;
                });
                if (inputWithError) {
                    const name = (_a = inputWithError.getOptions()) === null || _a === void 0 ? void 0 : _a.name;
                    const errorPropIndex = this.props.value.findIndex(p => p.name === name);
                    if (errorPropIndex !== -1) {
                        const errorProp = this.props.value[errorPropIndex];
                        errorProp.value += ' ';
                        this.onInputHandler(errorProp, errorPropIndex);
                    }
                }
            }
        });
    }
    render() {
        return (<ValidatedForm ref="form" onBlur={(event) => this.onBlurHandler(event)}>
        {this.props.value.map((parameter, inputIndex) => {
                const Component = propertyComponentForType(parameter.type);
                return (<div key={parameter.name}>
              {parameter.visible && Component && (<Component value={this.props.value[inputIndex]} onInput={(value) => this.onInputHandler(value, inputIndex)}/>)}
            </div>);
            })}
      </ValidatedForm>);
    }
};
GenericForm = __decorate([
    Component({ props: createProps(GenericFormProps) })
], GenericForm);
export default GenericForm;
//# sourceMappingURL=GenericForm.jsx.map