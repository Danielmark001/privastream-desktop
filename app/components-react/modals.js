var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { Services } from './service-provider';
import { Modal, Button } from 'antd';
import Utils from '../services/utils';
import { $t } from '../services/i18n';
import { TextInput } from './shared/inputs/TextInput';
import Form, { useForm } from './shared/inputs/Form';
import React, { useEffect } from 'react';
import { Subject } from 'rxjs';
import { ModalLayout } from './shared/ModalLayout';
import styles from './shared/Modals.m.less';
export function confirmAsync(p) {
    const { WindowsService } = Services;
    const modalProps = typeof p === 'string' ? { title: p } : p;
    WindowsService.updateStyleBlockers(Utils.getWindowId(), true);
    return new Promise(resolve => {
        Modal.confirm(Object.assign(Object.assign({}, modalProps), { afterClose: () => {
                WindowsService.updateStyleBlockers(Utils.getWindowId(), false);
            }, onOk: () => resolve(true), onCancel: () => resolve(false) }));
        fixBodyWidth();
    });
}
export function alertAsync(p) {
    const modalProps = typeof p === 'string' ? { title: p } : p;
    const { WindowsService } = Services;
    WindowsService.updateStyleBlockers(Utils.getWindowId(), true);
    return new Promise(resolve => {
        Modal.confirm(Object.assign(Object.assign({ okText: $t('Close'), cancelButtonProps: { style: { display: 'none' } }, okButtonProps: { type: 'default' } }, modalProps), { afterClose: () => {
                WindowsService.updateStyleBlockers(Utils.getWindowId(), false);
                if (p === null || p === void 0 ? void 0 : p.afterCloseFn) {
                    p.afterCloseFn();
                }
                resolve();
            } }));
        fixBodyWidth();
    });
}
export function promptAsync(p, value = '') {
    const { WindowsService } = Services;
    const modalProps = typeof p === 'string' ? { title: p } : p;
    WindowsService.updateStyleBlockers(Utils.getWindowId(), true);
    return new Promise(resolve => {
        const formValues = { prompt: value };
        function onValuesChange(values) {
            Object.assign(formValues, values);
        }
        function onFinish() {
            resolve(formValues.prompt);
            dialog.destroy();
        }
        const submitEmitter = new Subject();
        const dialog = Modal.info(Object.assign(Object.assign({ centered: true, icon: null }, modalProps), { content: (React.createElement(DefaultPromptForm, { values: formValues, onValuesChange: onValuesChange, onFinish: onFinish, submitEmitter: submitEmitter })), afterClose: () => {
                WindowsService.updateStyleBlockers(Utils.getWindowId(), false);
            }, onOk: () => {
                submitEmitter.next();
                return true;
            } }));
        fixBodyWidth();
    });
}
export function promptAction(p) {
    return alertAsync({
        bodyStyle: { padding: '24px' },
        className: styles.actionModal,
        type: 'confirm',
        title: p.title,
        content: p.message,
        icon: p === null || p === void 0 ? void 0 : p.icon,
        closable: true,
        maskClosable: true,
        cancelButtonProps: { style: { display: 'none' } },
        okButtonProps: { style: { display: 'none' } },
        modalRender: node => {
            var _a, _b, _c;
            return (React.createElement(ModalLayout, { footer: React.createElement(Form, { layout: 'inline', className: styles.actionModalFooter },
                    !p.cancelBtnPosition ||
                        (p.cancelBtnPosition && p.cancelBtnPosition === 'left' && (React.createElement(Button, { onClick: () => submit(p === null || p === void 0 ? void 0 : p.cancelFn) }, (_a = p.cancelBtnText) !== null && _a !== void 0 ? _a : $t('Skip')))),
                    p.secondaryActionFn && p.secondaryActionText && (React.createElement(Button, { onClick: () => submit(p === null || p === void 0 ? void 0 : p.secondaryActionFn) }, p.secondaryActionText)),
                    React.createElement(Button, { type: (_b = p === null || p === void 0 ? void 0 : p.btnType) !== null && _b !== void 0 ? _b : 'primary', onClick: () => submit(p === null || p === void 0 ? void 0 : p.fn) }, p.btnText),
                    p.cancelBtnPosition && p.cancelBtnPosition === 'right' && (React.createElement(Button, { onClick: () => submit(p === null || p === void 0 ? void 0 : p.cancelFn) }, (_c = p.cancelBtnText) !== null && _c !== void 0 ? _c : $t('Skip')))) }, node));
        },
        width: 600,
    });
}
export function DefaultPromptForm(p) {
    const form = useForm();
    useEffect(() => {
        const subscription = p.submitEmitter.subscribe(() => {
            onFinish();
        });
        return () => subscription.unsubscribe();
    });
    function onChange(newVal) {
        const values = { prompt: newVal };
        p.onValuesChange && p.onValuesChange(values, values);
    }
    function onFinish() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield form.validateFields();
                p.onFinish && p.onFinish(p.values);
            }
            catch (e) { }
        });
    }
    return (React.createElement(Form, { name: "prompt", form: form },
        React.createElement(TextInput, { name: "prompt", value: p.values.prompt, onChange: onChange, nowrap: true })));
}
function fixBodyWidth() {
    setTimeout(() => {
        document.querySelector('body').setAttribute('style', '');
    });
}
function submit(fn) {
    Modal.destroyAll();
    if (fn) {
        fn();
    }
}
//# sourceMappingURL=modals.js.map