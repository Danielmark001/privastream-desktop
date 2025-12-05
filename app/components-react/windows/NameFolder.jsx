var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { ModalLayout } from '../shared/ModalLayout';
import { $t } from '../../services/i18n';
import React, { useState } from 'react';
import { Services } from '../service-provider';
import { useOnCreate } from 'slap';
import { assertIsDefined } from '../../util/properties-type-guards';
import { TextInput } from '../shared/inputs/TextInput';
import Form, { useForm } from '../shared/inputs/Form';
export default function NameFolder() {
    const { ScenesService, EditorCommandsService, WindowsService } = Services;
    const [name, setName] = useState('');
    const form = useForm();
    const options = useOnCreate(() => {
        const options = WindowsService.state.child.queryParams;
        const scene = ScenesService.views.getScene(options.sceneId);
        assertIsDefined(scene);
        const name = options.renameId
            ? scene.getFolder(options.renameId).name
            : ScenesService.suggestName('New Folder');
        setName(name);
        return options;
    });
    function submit() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield form.validateFields();
            }
            catch (e) {
                return;
            }
            if (options.renameId) {
                EditorCommandsService.executeCommand('RenameFolderCommand', options.sceneId, options.renameId, name);
                WindowsService.actions.closeChildWindow();
            }
            else {
                const scene = ScenesService.views.getScene(options.sceneId);
                assertIsDefined(scene);
                EditorCommandsService.executeCommand('CreateFolderCommand', options.sceneId, name, (options === null || options === void 0 ? void 0 : options.itemsToGroup) && options.itemsToGroup.length > 0
                    ? scene.getSelection(options.itemsToGroup)
                    : void 0);
                WindowsService.actions.closeChildWindow();
            }
        });
    }
    return (<ModalLayout onOk={submit}>
      <Form layout="vertical" form={form} onFinish={submit}>
        <TextInput name="name" value={name} onInput={v => setName(v)} label={$t('Please enter the name of the folder')} required={true} uncontrolled={false} autoFocus/>
      </Form>
    </ModalLayout>);
}
//# sourceMappingURL=NameFolder.jsx.map