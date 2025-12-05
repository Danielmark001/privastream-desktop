var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import React, { useState } from 'react';
import Form, { useForm } from '../shared/inputs/Form';
import { TextInput } from 'components-react/shared/inputs';
import { Services } from '../service-provider';
import { ModalLayout } from '../shared/ModalLayout';
import { $t } from '../../services/i18n';
import { useChildWindowParams } from 'components-react/hooks';
export default function RenameSource() {
    const { SourcesService, WindowsService, EditorCommandsService } = Services;
    const form = useForm();
    const options = useChildWindowParams();
    const [name, setName] = useState(() => { var _a; return ((_a = SourcesService.views.getSource(options.sourceId)) === null || _a === void 0 ? void 0 : _a.name) || ''; });
    function submit(e) {
        return __awaiter(this, void 0, void 0, function* () {
            if (e)
                e.preventDefault();
            try {
                yield form.validateFields();
            }
            catch (err) {
                return;
            }
            EditorCommandsService.executeCommand('RenameSourceCommand', options.sourceId, name);
            WindowsService.closeChildWindow();
        });
    }
    return (React.createElement(ModalLayout, { onOk: submit, okText: $t('Done') },
        React.createElement(Form, { layout: "vertical", form: form, name: "renameSourceForm", onFinish: () => submit() },
            React.createElement(TextInput, { label: $t('Please enter the name of the source'), name: "sourceName", "data-role": "input", "data-type": "text", value: name, onInput: setName, uncontrolled: false, required: true, autoFocus: true }))));
}
//# sourceMappingURL=RenameSource.js.map