var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { useChildWindowParams } from 'components-react/hooks';
import { Services } from 'components-react/service-provider';
import { TextInput } from 'components-react/shared/inputs';
import Form, { useForm } from 'components-react/shared/inputs/Form';
import { ModalLayout } from 'components-react/shared/ModalLayout';
import React, { useState } from 'react';
import { $t } from 'services/i18n';
import { assertIsDefined } from 'util/properties-type-guards';
export default function NameScene() {
    const { WindowsService, ScenesService, SourcesService, EditorCommandsService } = Services;
    const form = useForm();
    const options = useChildWindowParams();
    const [name, setName] = useState(() => {
        var _a, _b, _c, _d, _e, _f;
        if (options.rename) {
            return (_b = (_a = ScenesService.views.getScene(options.rename)) === null || _a === void 0 ? void 0 : _a.name) !== null && _b !== void 0 ? _b : '';
        }
        if (options.sceneToDuplicate) {
            return SourcesService.views.suggestName((_d = (_c = ScenesService.views.getScene(options.sceneToDuplicate)) === null || _c === void 0 ? void 0 : _c.name) !== null && _d !== void 0 ? _d : '');
        }
        if (options.itemsToGroup) {
            return SourcesService.views.suggestName((_f = (_e = ScenesService.views.activeScene) === null || _e === void 0 ? void 0 : _e.name) !== null && _f !== void 0 ? _f : '');
        }
        return SourcesService.views.suggestName($t('New Scene'));
    });
    function submit() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield form.validateFields();
            }
            catch (e) {
                return;
            }
            if (options.rename) {
                EditorCommandsService.actions.executeCommand('RenameSceneCommand', options.rename, name);
                WindowsService.actions.closeChildWindow();
            }
            else {
                const createOptions = {};
                if (options.sceneToDuplicate) {
                    createOptions.duplicateItemsFromScene = options.sceneToDuplicate;
                }
                if (options.itemsToGroup) {
                    createOptions.groupFromOrigin = {
                        originSceneId: ScenesService.views.activeSceneId,
                        originItemIds: options.itemsToGroup,
                    };
                }
                const newSceneId = yield EditorCommandsService.executeCommand('CreateSceneCommand', name, createOptions);
                const newScene = ScenesService.views.getScene(newSceneId);
                assertIsDefined(newScene);
                newScene.makeActive();
                WindowsService.actions.closeChildWindow();
            }
        });
    }
    return (React.createElement(ModalLayout, { onOk: submit, okText: $t('Done') },
        React.createElement(Form, { layout: "vertical", form: form, name: "nameSceneForm", onFinish: () => submit() },
            React.createElement(TextInput, { label: $t('Please enter the name of the scene'), name: "sceneName", value: name, onInput: v => setName(v), required: true, uncontrolled: false, autoFocus: true }))));
}
//# sourceMappingURL=NameScene.js.map