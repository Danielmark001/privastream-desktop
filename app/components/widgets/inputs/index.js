import * as widgetInputComponents from './inputs';
import { inputComponents as sharedInputComponents, InputMetadata, } from 'components/shared/inputs';
export * from './inputs';
export const inputComponents = Object.assign(Object.assign({}, sharedInputComponents), widgetInputComponents);
export var EWInput;
(function (EWInput) {
    EWInput["animation"] = "animation";
    EWInput["frequency"] = "frequency";
    EWInput["sectionedMultiselect"] = "sectionedMultiselect";
    EWInput["numberList"] = "numberList";
    EWInput["spamSecurity"] = "spamSecurity";
})(EWInput || (EWInput = {}));
class WidgetInputMetadata extends InputMetadata {
    constructor() {
        super(...arguments);
        this.animation = (options) => (Object.assign({ type: EWInput.animation }, options));
        this.frequency = (options) => (Object.assign({ type: EWInput.frequency }, options));
        this.sectionedMultiselect = (options) => (Object.assign({ type: EWInput.sectionedMultiselect }, options));
        this.numberList = (options) => (Object.assign({ type: EWInput.numberList }, options));
        this.spamSecurity = (options) => (Object.assign({ type: EWInput.spamSecurity }, options));
    }
}
export const metadata = new WidgetInputMetadata();
//# sourceMappingURL=index.js.map