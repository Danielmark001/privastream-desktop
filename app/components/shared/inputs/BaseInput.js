import cloneDeep from 'lodash/cloneDeep';
import uuid from 'uuid/v4';
import ValidatedForm from './ValidatedForm';
import TsxComponent from 'components/tsx-component';
export class BaseInput extends TsxComponent {
    constructor() {
        super();
        this.onInput = null;
        this.onBlur = null;
        this.delegateChildrenEvents = true;
        this.uuid = uuid();
        this.form = null;
        this.parentInput = null;
        let comp = this;
        do {
            comp = comp.$parent;
            if (!this.parentInput && comp instanceof BaseInput) {
                this.parentInput = comp;
            }
        } while (comp && !(comp instanceof ValidatedForm));
        if (!comp)
            return;
        this.form = comp;
    }
    emitInput(eventData, event) {
        this.$emit('input', eventData, event);
        if (this.onInput)
            this.onInput(eventData);
        const needToSendEventToForm = (this.form && !this.parentInput) ||
            (this.parentInput && !this.parentInput.delegateChildrenEvents);
        if (needToSendEventToForm)
            this.form.emitInput(eventData, event);
    }
    emitBlur(event) {
        this.$emit('blur', event);
        if (this.onBlur)
            this.onBlur();
        this.form.emitBlur(event);
    }
    getValidations() {
        return { required: this.options.required };
    }
    get validate() {
        const validations = this.getValidations();
        Object.keys(validations).forEach((key) => {
            if (validations[key] == null)
                delete validations[key];
        });
        return validations;
    }
    getOptions() {
        const metadata = this.metadata || {};
        const options = cloneDeep(metadata);
        options.title = this.title || metadata.title;
        options.uuid = metadata.uuid || this.uuid;
        return options;
    }
    get options() {
        return this.getOptions();
    }
}
//# sourceMappingURL=BaseInput.js.map