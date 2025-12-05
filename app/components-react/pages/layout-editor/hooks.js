var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import cloneDeep from 'lodash/cloneDeep';
import { Services } from 'components-react/service-provider';
import { ELayoutElement, ELayout } from 'services/layout';
import { injectState, mutation, useModule } from 'slap';
class LayoutEditorModule {
    constructor() {
        var _a;
        this.state = injectState({
            currentLayout: this.layoutService.views.currentTab.currentLayout || ELayout.Default,
            slottedElements: (cloneDeep(this.layoutService.views.currentTab.slottedElements) ||
                {}),
            browserUrl: ((_a = this.layoutService.views.currentTab.slottedElements[ELayoutElement.Browser]) === null || _a === void 0 ? void 0 : _a.src) || '',
            showModal: false,
        });
    }
    get layoutService() {
        return Services.LayoutService;
    }
    get currentTab() {
        return this.layoutService.state.currentTab;
    }
    setCurrentTab(tab) {
        this.layoutService.actions.setCurrentTab(tab);
        this.state.setCurrentLayout(this.layoutService.state.tabs[tab].currentLayout);
        this.setSlottedElements(cloneDeep(this.layoutService.state.tabs[tab].slottedElements));
    }
    setSlottedElements(elements) {
        var _a;
        this.state.slottedElements = elements;
        if (!elements[ELayoutElement.Browser])
            return;
        this.state.setBrowserUrl(((_a = elements[ELayoutElement.Browser]) === null || _a === void 0 ? void 0 : _a.src) || '');
    }
    handleElementDrag(event, el) {
        var _a;
        const htmlElement = document.elementFromPoint(event.clientX, event.clientY);
        if (!el)
            return;
        if (!htmlElement) {
            this.setSlottedElements(Object.assign(Object.assign({}, this.state.slottedElements), { [el]: { slot: null } }));
            return;
        }
        const id = htmlElement.id || ((_a = htmlElement === null || htmlElement === void 0 ? void 0 : htmlElement.parentElement) === null || _a === void 0 ? void 0 : _a.id);
        let existingEl;
        if (id && ['1', '2', '3', '4', '5', '6'].includes(id)) {
            existingEl = Object.keys(this.state.slottedElements).find((existing) => { var _a; return ((_a = this.state.slottedElements[existing]) === null || _a === void 0 ? void 0 : _a.slot) === id; });
            if (existingEl && this.state.slottedElements[el]) {
                this.setSlottedElements(Object.assign(Object.assign({}, this.state.slottedElements), { [existingEl]: this.state.slottedElements[el] }));
            }
            else if (existingEl) {
                this.setSlottedElements(Object.assign(Object.assign({}, this.state.slottedElements), { [existingEl]: { slot: null } }));
            }
            this.setSlottedElements(Object.assign(Object.assign({}, this.state.slottedElements), { [el]: { slot: id } }));
        }
        else {
            this.setSlottedElements(Object.assign(Object.assign({}, this.state.slottedElements), { [el]: { slot: null } }));
        }
    }
}
__decorate([
    mutation()
], LayoutEditorModule.prototype, "setSlottedElements", null);
export function useLayoutEditor() {
    return useModule(LayoutEditorModule);
}
//# sourceMappingURL=hooks.js.map