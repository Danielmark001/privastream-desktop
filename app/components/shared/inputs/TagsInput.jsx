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
import cx from 'classnames';
import { BaseInput } from 'components/shared/inputs/BaseInput';
import styles from './TagsInput.m.less';
import { modifiers as m } from 'vue-tsx-support';
import { Multiselect } from 'vue-multiselect';
import { $t } from 'services/i18n';
import { createProps } from 'components/tsx-component';
import { Spinner } from 'streamlabs-beaker';
import Utils from 'services/utils';
class Props {
    constructor() {
        this.handleOnSearch = () => null;
        this.handleOnSelect = () => null;
    }
}
let TagsInput = class TagsInput extends BaseInput {
    constructor() {
        super(...arguments);
        this.toggleFn = null;
        this.searchStr = '';
    }
    get multiselectValue() {
        return this.value && this.value.length ? this.value.map(val => ({ value: val })) : null;
    }
    toggle() {
        this.toggleFn && this.toggleFn();
    }
    onInputHandler(values) {
        this.emitInput(values.map(tag => tag.value));
        this.fixInput();
    }
    removeTag(e, val) {
        const newVal = this.value.filter(tag => tag !== val);
        this.emitInput(newVal);
    }
    get isEmpty() {
        return !this.value || !this.value.length;
    }
    onSearchChangeHandler(str) {
        this.searchStr = str;
        this.props.handleOnSearch && this.props.handleOnSearch(str);
    }
    onCloseHandler() {
        this.searchStr = '';
    }
    onOpenHandler() {
        return __awaiter(this, void 0, void 0, function* () {
            this.fixInput();
        });
    }
    fixInput() {
        return __awaiter(this, void 0, void 0, function* () {
            yield Utils.sleep(50);
            const input = this.$el.querySelector('input');
            input.style.width = '100%';
            input.style.position = 'absolute';
            input.style.zIndex = '9999';
        });
    }
    getOptions() {
        const options = super.getOptions();
        return Object.assign(Object.assign({}, options), { placeholder: options.placeholder != null ? options.placeholder : $t('Search tags') });
    }
    mounted() {
        this.$el.querySelector('input[type=text]').addEventListener('keyup', (e) => {
            this.onSearchChangeHandler(e.currentTarget.value);
        });
    }
    render() {
        const isEmpty = this.isEmpty;
        const el = this.$el;
        this.$nextTick().then(() => {
            if (!el)
                return;
            const tagEl = el.querySelector('[data-select="Add this as new tag"]');
            if (tagEl) {
                el.querySelector('li').style.display = 'none';
            }
            else {
                el.querySelector('li').style.display = 'inline-block';
            }
        });
        return (<div class={cx('input-wrapper', styles.container, {
                disabled: this.options.disabled,
                isEmpty,
                [styles.fullWidth]: this.options.fullWidth,
            })} data-role="input" data-type="tags" data-name={this.options.name}>
        <Multiselect value={this.multiselectValue} tagPlaceholder="Add this as new tag" placeholder="" label="title" trackBy="value" options={this.options.options} multiple={true} taggable={true} closeOnSelect={false} allowEmpty={true} disabled={this.options.disabled} onInput={(tags) => this.onInputHandler(tags)} onSelect={(option) => this.props.handleOnSelect(option)} onClose={() => this.onCloseHandler()} onOpen={() => this.onOpenHandler()} scopedSlots={{
                caret: (props) => {
                    this.toggleFn = props.toggle;
                    return (<div class={styles.tagsWrap}>
                  {this.isEmpty && this.options.placeholder}
                  {this.value && this.value.map(tag => this.renderTag(tag))}
                </div>);
                },
                option: (props) => (<div data-option-title={props.option.title} data-option-value={props.option.value}>
                {this.$scopedSlots.item ? this.$scopedSlots.item(props) : props.option.title}
              </div>),
                afterList: () => {
                    const listOptions = this.options.options;
                    const loading = this.options.loading;
                    const noResult = !loading &&
                        this.searchStr &&
                        (!listOptions.length ||
                            (!this.isEmpty && listOptions.length === this.value.length));
                    return (<div>
                  {loading && <Spinner />}
                  {noResult && this.options.noResult}
                </div>);
                },
            }}/>
      </div>);
    }
    renderTag(val) {
        const tag = this.options.options.find(option => option.value === val);
        const style = tag.data.bgColor ? { backgroundColor: tag.data.bgColor } : {};
        return (<span class={styles.tag} style={style}>
        {tag.title}
        <i class="fa fa-times" onClick={m.stop((e) => this.removeTag(e, val))}/>
      </span>);
    }
};
__decorate([
    Prop()
], TagsInput.prototype, "value", void 0);
__decorate([
    Prop()
], TagsInput.prototype, "title", void 0);
__decorate([
    Prop()
], TagsInput.prototype, "metadata", void 0);
TagsInput = __decorate([
    Component({ props: createProps(Props) })
], TagsInput);
export default TagsInput;
//# sourceMappingURL=TagsInput.jsx.map