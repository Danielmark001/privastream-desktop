import React from 'react';
import { ModalLayout } from '../../shared/ModalLayout';
import Form from '../../shared/inputs/Form';
import { CheckboxInput, DateInput, FileInput, ImageInput, ListInput, MediaUrlInput, NumberInput, SliderInput, SwitchInput, TagsInput, TextAreaInput, TextInput, } from '../../shared/inputs';
import { Alert, Button, Col, Row, Space, Tag, Timeline, Tabs, Menu } from 'antd';
import { Services } from '../../service-provider';
import InputWrapper from '../../shared/inputs/InputWrapper';
import Scrollable from '../../shared/Scrollable';
import PlatformLogo from '../../shared/PlatformLogo';
import { DownloadOutlined } from '@ant-design/icons';
import { alertAsync, confirmAsync } from '../../modals';
import { I18nService, WHITE_LIST } from '../../../services/i18n';
import pick from 'lodash/pick';
import { DemoForm } from './DemoForm';
import { CodeInput } from '../../shared/inputs/CodeInput';
import { injectState, merge, useModule, injectFormBinding } from 'slap';
const { TabPane } = Tabs;
export default function SharedComponentsLibrary() {
    return (React.createElement(ModalLayout, null,
        React.createElement(Row, { gutter: 16, style: { height: 'calc(100% + 24px)' } },
            React.createElement(Col, { flex: "auto", style: { height: '100%' } },
                React.createElement(Scrollable, { style: { height: '100%' } },
                    React.createElement(Tabs, { defaultActiveKey: "1" },
                        React.createElement(TabPane, { tab: "Shared Components", key: "1" },
                            React.createElement(Examples, null)),
                        React.createElement(TabPane, { tab: "Demo Form", key: "2" },
                            React.createElement(DemoForm, null))))),
            React.createElement(Col, { flex: '300px' },
                React.createElement(SettingsPanel, null)))));
}
function Examples() {
    const { layout, required, placeholder, hasTooltips, disabled, size, formState, } = useSharedComponentsLibrary().extend(module => {
        const formState = injectState({
            textVal: '',
            textAreaVal: '',
            switcherVal: false,
            numberVal: 0,
            sliderVal: 5,
            imageVal: '',
            galleryImage: '',
            galleryAudio: '',
            javascript: 'alert("Hello World!")',
            saveFilePathVal: '',
            checkboxVal: false,
            dateVal: undefined,
            listVal: 1,
            listOptions: [
                { value: 1, label: 'Red' },
                { value: 2, label: 'Green' },
                { value: 3, label: 'Blue' },
                { value: 4, label: 'Orange' },
            ],
            listVal2: '',
            listOptions2: [
                { value: '', label: 'Please Select the option' },
                { value: 'foo', label: 'Foo' },
                { value: 'bar', label: 'Bar' },
            ],
            tagsVal: [1, 2, 3],
            tagsOptions: [
                { value: 1, label: 'Red' },
                { value: 2, label: 'Green' },
                { value: 3, label: 'Blue' },
                { value: 4, label: 'Orange' },
            ],
        });
        return {
            formState,
        };
    });
    const s = formState;
    const bind = formState.bind;
    const globalProps = {};
    if (hasTooltips)
        globalProps.tooltip = 'This is tooltip';
    if (required)
        globalProps.required = true;
    if (placeholder)
        globalProps.placeholder = placeholder;
    if (disabled)
        globalProps.disabled = true;
    if (size)
        globalProps.size = size;
    return (React.createElement(Form, { layout: layout },
        React.createElement(Example, { title: "TextInput" },
            React.createElement(TextInput, Object.assign({ label: "Uncontrolled" }, globalProps, bind.textVal)),
            React.createElement(TextInput, Object.assign({ label: "Controlled", uncontrolled: false, placeholder: placeholder }, bind.textVal)),
            React.createElement(TextInput, Object.assign({ label: "Debounced", debounce: 500 }, globalProps, bind.textVal)),
            React.createElement(TextInput, Object.assign({ label: "Read Only", readOnly: true }, globalProps, bind.textVal)),
            React.createElement(TextInput, Object.assign({ label: "Password", isPassword: true }, globalProps, bind.textVal)),
            React.createElement(TextInput, Object.assign({ label: "With addons", addonBefore: "http://", addonAfter: ".com" }, globalProps, bind.textVal))),
        React.createElement(Example, { title: "Number Input" },
            React.createElement(NumberInput, Object.assign({ label: "Basic" }, globalProps, bind.numberVal)),
            React.createElement(NumberInput, Object.assign({ label: "Min = 0, Max = 10", min: 0, max: 10 }, globalProps, bind.numberVal))),
        React.createElement(Example, { title: "Textarea Input" },
            React.createElement(TextAreaInput, Object.assign({ label: "Basic" }, globalProps, bind.textAreaVal)),
            React.createElement(TextAreaInput, Object.assign({ label: "Show Count" }, globalProps, bind.textAreaVal, { showCount: true, maxLength: 50 })),
            React.createElement(TextAreaInput, Object.assign({ label: "Auto Size" }, globalProps, bind.textAreaVal, { autoSize: true }))),
        React.createElement(Example, { title: "List Input" },
            React.createElement(ListInput, Object.assign({ label: "Basic" }, globalProps, bind.listVal, { options: s.listOptions })),
            React.createElement(ListInput, Object.assign({ label: "With search" }, globalProps, bind.listVal, { options: s.listOptions, showSearch: true })),
            React.createElement(ListInput, Object.assign({ label: "Allow Clear" }, globalProps, bind.listVal, { options: s.listOptions, allowClear: true })),
            React.createElement(ListInput, Object.assign({ label: "Custom Empty" }, globalProps, bind.listVal2, { options: s.listOptions2 }))),
        React.createElement(Example, { title: "Tags Input" },
            React.createElement(TagsInput, Object.assign({ label: "Basic" }, globalProps, bind.tagsVal, { options: s.tagsOptions })),
            React.createElement(TagsInput, Object.assign({ label: "Custom Tag Render" }, globalProps, bind.tagsVal, { options: s.tagsOptions, tagRender: (tagProps, tag) => (React.createElement(Tag, Object.assign({}, tagProps, { color: tag.label.toLowerCase() }), tag.label)) })),
            React.createElement(TagsInput, Object.assign({ label: "Custom Option Render" }, globalProps, bind.tagsVal, { options: s.tagsOptions, optionRender: opt => (React.createElement(Row, { gutter: 16, style: { color: opt.label.toLowerCase() } },
                    React.createElement(Col, null, opt.value),
                    React.createElement(Col, null, opt.label))) }))),
        React.createElement(Example, { title: "SwitchInput" },
            React.createElement(SwitchInput, Object.assign({ label: "Default" }, globalProps, bind.switcherVal)),
            React.createElement(SwitchInput, Object.assign({ label: "Debounced", debounce: 500 }, globalProps, bind.switcherVal)),
            React.createElement(SwitchInput, Object.assign({ label: "Disabled", disabled: true }, globalProps, bind.switcherVal)),
            React.createElement(SwitchInput, Object.assign({ label: "With text" }, globalProps, bind.switcherVal, { checkedChildren: "Enabled", unCheckedChildren: "Disabled" }))),
        React.createElement(Example, { title: "Checkbox Input" },
            React.createElement(InputWrapper, { label: "Checkbox Group" },
                React.createElement(CheckboxInput, Object.assign({ label: "Default" }, globalProps, bind.checkboxVal)),
                React.createElement(CheckboxInput, Object.assign({ label: "Debounced", debounce: 500 }, globalProps, bind.checkboxVal)))),
        React.createElement(Example, { title: "Slider Input" },
            React.createElement(SliderInput, Object.assign({ label: "Basic", min: 0, max: 10 }, globalProps, bind.sliderVal)),
            React.createElement(SliderInput, Object.assign({ label: "Without Number Input", min: 0, max: 10, hasNumberInput: false }, bind.sliderVal)),
            React.createElement(SliderInput, Object.assign({ label: "Debounced", min: 0, max: 10, debounce: 300 }, globalProps, bind.sliderVal))),
        React.createElement(Example, { title: "Date Input" },
            React.createElement(DateInput, Object.assign({ label: "Default" }, globalProps, bind.dateVal))),
        React.createElement(Example, { title: "Image Input" },
            React.createElement(ImageInput, Object.assign({ label: "Basic", maxFileSize: 3000000 }, globalProps, bind.imageVal))),
        React.createElement(Example, { title: "File Input" },
            React.createElement(FileInput, Object.assign({ label: "Save As", save: true }, globalProps, bind.saveFilePathVal))),
        React.createElement(Example, { title: "Media Gallery" },
            React.createElement(MediaUrlInput, Object.assign({ label: "Image" }, globalProps, bind.galleryImage))),
        React.createElement(Example, { title: "Code Input" },
            React.createElement(CodeInput, Object.assign({ label: "javascript", lang: "js" }, globalProps, bind.javascript))),
        React.createElement(Example, { title: "Buttons" },
            React.createElement(Space, { direction: "vertical" },
                React.createElement(Button, { type: "primary", size: size }, "Primary"),
                React.createElement(Button, { size: size }, "Default"),
                React.createElement(Button, { type: "dashed", size: size }, "Dashed"),
                React.createElement("br", null),
                React.createElement(Button, { type: "link", size: size }, "Link"),
                React.createElement("br", null),
                React.createElement(Button, { type: "primary", icon: React.createElement(DownloadOutlined, null), size: size }),
                React.createElement(Button, { type: "primary", shape: "circle", icon: React.createElement(DownloadOutlined, null), size: size }),
                React.createElement(Button, { type: "primary", shape: "round", icon: React.createElement(DownloadOutlined, null), size: size }),
                React.createElement(Button, { type: "primary", shape: "round", icon: React.createElement(DownloadOutlined, null), size: size }, "Download"),
                React.createElement(Button, { type: "primary", icon: React.createElement(DownloadOutlined, null), size: size }, "Download"),
                React.createElement(Button, { type: "primary", loading: true }, "Loading"),
                React.createElement(Button, { type: "primary", ghost: true }, "Primary Ghost"),
                React.createElement(Button, { ghost: true }, "Default Ghost"),
                React.createElement(Button, { type: "dashed", ghost: true }, "Dashed Ghost"),
                React.createElement(Button, { type: "primary", danger: true }, "Primary Danger"),
                React.createElement(Button, { danger: true }, "Default Danger"),
                React.createElement(Button, { type: "dashed", danger: true }, "Dashed Danger"),
                React.createElement(Button, { type: "text", danger: true }, "Text Danger"),
                React.createElement(Button, { type: "link", danger: true }, "Link Danger"))),
        React.createElement(Example, { title: "Menu" },
            React.createElement(Menu, { theme: "light" },
                React.createElement(Menu.Item, { key: "1" }, "Item 1"),
                React.createElement(Menu.Item, { key: "2" }, "Item 2"),
                React.createElement(Menu.Item, { key: "3" }, "Item 4")),
            React.createElement(Menu, { theme: "dark" },
                React.createElement(Menu.Item, { key: "1" }, "Item 1"),
                React.createElement(Menu.Item, { key: "2" }, "Item 2"),
                React.createElement(Menu.Item, { key: "3" }, "Item 4"))),
        React.createElement(Example, { title: "Modals" },
            React.createElement(Space, null,
                React.createElement(Button, { onClick: () => alertAsync('This is Alert') }, "Show Alert"),
                React.createElement(Button, { onClick: () => confirmAsync('This is Alert').then(confirmed => alertAsync(confirmed ? 'Confirmed' : 'Not confirmed')) }, "Show Confirm"))),
        React.createElement(Example, { title: "Platform Logo" },
            React.createElement(PlatformLogo, { platform: "twitch" }),
            React.createElement(PlatformLogo, { platform: "youtube" }),
            React.createElement(PlatformLogo, { platform: "facebook" }),
            React.createElement(PlatformLogo, { platform: "streamlabs" }),
            React.createElement(PlatformLogo, { platform: "dlive" }),
            React.createElement(PlatformLogo, { platform: "nimotv" })),
        React.createElement(Example, { title: "Timeline" },
            React.createElement(Timeline, { pending: "Recording..." },
                React.createElement(Timeline.Item, null, "Create a services site 2015-09-01"),
                React.createElement(Timeline.Item, null, "Solve initial network problems 2015-09-01"),
                React.createElement(Timeline.Item, null, "Technical testing 2015-09-01")))));
}
export function Example(p) {
    const { background } = useSharedComponentsLibrary();
    return (React.createElement(Container, { background: background, title: p.title },
        background !== 'error' && (React.createElement(InputWrapper, null,
            React.createElement("h2", null, p.title))),
        p.children));
}
function Container(p) {
    return (React.createElement("div", null,
        p.background === 'none' && React.createElement("div", null, p.children),
        p.background === 'section' && React.createElement("div", { className: "section" }, p.children),
        p.background === 'section-alt' && React.createElement("div", { className: "section section-alt" }, p.children),
        p.background === 'error' && (React.createElement(Alert, { type: "error", message: p.title, description: p.children, style: { marginBottom: '24px' } }))));
}
function SettingsPanel() {
    const { bind, locales } = useSharedComponentsLibrary();
    function createOptions(opts) {
        return opts.map(opt => ({
            label: opt,
            value: opt,
        }));
    }
    return (React.createElement(Form, { layout: "vertical", style: {
            position: 'fixed',
            height: '100%',
            backgroundColor: 'var(--section)',
            overflow: 'hidden',
            width: '300px',
            right: '0',
            top: '30px',
            padding: '16px',
        } },
        React.createElement(ListInput, Object.assign({ label: "Theme", options: createOptions(['night-theme', 'day-theme', 'prime-dark', 'prime-light']) }, bind.theme)),
        React.createElement(ListInput, Object.assign({ label: "Layout", options: createOptions(['horizontal', 'vertical', 'inline']) }, bind.layout)),
        React.createElement(ListInput, Object.assign({ label: "Background", options: createOptions(['none', 'section', 'section-alt', 'error']) }, bind.background)),
        React.createElement(ListInput, Object.assign({ label: "Size", options: createOptions(['default', 'large', 'small']) }, bind.size)),
        React.createElement(ListInput, Object.assign({ label: "Language", options: createOptions(locales) }, bind.locale)),
        React.createElement(TextInput, Object.assign({ label: "Placeholder" }, bind.placeholder)),
        React.createElement(InputWrapper, { label: "Miscellaneous" },
            React.createElement(CheckboxInput, Object.assign({ label: 'Has tooltips' }, bind.hasTooltips)),
            React.createElement(CheckboxInput, Object.assign({ label: 'Required' }, bind.required)),
            React.createElement(CheckboxInput, Object.assign({ label: 'Disabled' }, bind.disabled)))));
}
export function useSharedComponentsLibrary() {
    return useModule(SharedComponentsModule);
}
class SharedComponentsModule {
    constructor() {
        this.state = injectState({
            layout: 'horizontal',
            hasTooltips: false,
            required: false,
            placeholder: 'Start typing',
            disabled: false,
            size: 'middle',
            background: 'section',
            locales: WHITE_LIST,
        });
        this.globalState = {
            get theme() {
                return Services.CustomizationService.currentTheme;
            },
            set theme(theme) {
                Services.CustomizationService.actions.setTheme(theme);
            },
            get locale() {
                return I18nService.instance.state.locale;
            },
            set locale(locale) {
                alert('Not implemented');
            },
        };
        this.bind = injectFormBinding(() => this.mergedState, statePatch => {
            const localStatePatch = pick(statePatch, Object.keys(this.state));
            this.state.update(localStatePatch);
            const globalStatePatch = pick(statePatch, Object.keys(this.globalState));
            Object.assign(this.globalState, globalStatePatch);
        });
    }
    get mergedState() {
        return merge(this.state.getters, this.globalState);
    }
}
//# sourceMappingURL=SharedComponentsLibrary.js.map