import { BaseInput } from './BaseInput';
export default class BaseFormGroup extends BaseInput {
    constructor() {
        super(...arguments);
        this.inputErrors = [];
    }
    created() {
        if (!this.form)
            return;
        if (!this.options.type)
            this.delegateChildrenEvents = false;
        this.form.validated.subscribe(errors => {
            this.inputErrors = errors.filter(error => error.field === this.options.uuid);
        });
    }
    get formInputMetadata() {
        const options = this.options;
        if (!options.type)
            return {};
        const inputMetadata = options;
        if (options.type === 'bool') {
            delete inputMetadata.title;
            delete inputMetadata.tooltip;
            delete inputMetadata.description;
        }
        return inputMetadata;
    }
    getOptions() {
        const options = super.getOptions();
        options.type = this.type || options.type;
        return options;
    }
}
//# sourceMappingURL=BaseFormGroup.js.map