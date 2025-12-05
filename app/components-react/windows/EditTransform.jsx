var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import React, { useEffect, useState } from 'react';
import { ModalLayout } from 'components-react/shared/ModalLayout';
import { Services } from 'components-react/service-provider';
import InputWrapper from 'components-react/shared/inputs/InputWrapper';
import { $t } from 'services/i18n';
import { AnchorPositions, AnchorPoint } from 'util/ScalableRectangle';
import { useVuex } from 'components-react/hooks';
import { NumberInput } from 'components-react/shared/inputs';
import Form, { useForm } from 'components-react/shared/inputs/Form';
const dirMap = (dir) => ({
    left: $t('Left'),
    right: $t('Right'),
    top: $t('Top'),
    bottom: $t('Bottom'),
}[dir]);
export default function EditTransform() {
    const { SelectionService, WindowsService, EditorCommandsService, SourcesService } = Services;
    const { selection } = useVuex(() => ({ selection: SelectionService.views.globalSelection }));
    const [rect, setRect] = useState(Object.assign({}, selection.getBoundingRect()));
    const transform = selection.getItems()[0].transform;
    const form = useForm();
    useEffect(() => {
        const subscription = SourcesService.sourceRemoved.subscribe(cancel);
        return subscription.unsubscribe;
    }, []);
    function invalidForm() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield form.validateFields();
            }
            catch (errorInfo) {
                return true;
            }
            return false;
        });
    }
    function setCrop(cropEdge) {
        return (value) => __awaiter(this, void 0, void 0, function* () {
            if (yield invalidForm())
                return;
            EditorCommandsService.actions.executeCommand('CropItemsCommand', selection, {
                [cropEdge]: Number(value),
            });
        });
    }
    function setPos(dir) {
        return (value) => __awaiter(this, void 0, void 0, function* () {
            if (yield invalidForm())
                return;
            const delta = Number(value) - Math.round(rect[dir]);
            EditorCommandsService.actions.executeCommand('MoveItemsCommand', selection, {
                [dir]: delta,
            });
            const newValue = rect[dir] + delta;
            setRect(Object.assign(Object.assign({}, rect), { [dir]: newValue }));
        });
    }
    function setScale(dir) {
        return (value) => __awaiter(this, void 0, void 0, function* () {
            if (yield invalidForm())
                return;
            if (Number(value) === rect[dir])
                return;
            const scale = Number(value) / rect[dir];
            const scaleX = dir === 'width' ? scale : 1;
            const scaleY = dir === 'height' ? scale : 1;
            const scaleDelta = { x: scaleX, y: scaleY };
            EditorCommandsService.actions.executeCommand('ResizeItemsCommand', selection, scaleDelta, AnchorPositions[AnchorPoint.NorthWest]);
            setRect(Object.assign(Object.assign({}, rect), { [dir]: Number(value) }));
        });
    }
    function rotate(deg) {
        EditorCommandsService.actions.executeCommand('RotateItemsCommand', selection, deg);
    }
    function reset() {
        EditorCommandsService.actions.executeCommand('ResetTransformCommand', selection);
        setRect(selection.getBoundingRect());
    }
    function cancel() {
        WindowsService.actions.closeChildWindow();
    }
    return (<ModalLayout footer={<Footer reset={reset} cancel={cancel}/>}>
      <Form form={form} layout="horizontal">
        <CoordinateInput title={$t('Position')} datapoints={['x', 'y']} rect={rect} handleInput={setPos}/>
        <CoordinateInput title={$t('Size')} datapoints={['width', 'height']} rect={rect} handleInput={setScale}/>
        <RotateInput handleInput={rotate}/>
        <CropInput transform={transform} handleInput={setCrop}/>
      </Form>
    </ModalLayout>);
}
function CoordinateInput(p) {
    if (p.datapoints.some(dir => isNaN(Math.round(p.rect[dir]))))
        return <></>;
    return (<InputWrapper label={p.title}>
      <div style={{ display: 'flex' }}>
        {p.datapoints.map((dir) => (<div style={{ marginLeft: '8px' }} key={dir}>
            <NumberInput value={Math.floor(p.rect[dir])} step={1} onInput={p.handleInput(dir)} min={['width', 'height'].includes(dir) ? 1 : undefined} nowrap/>
          </div>))}
      </div>
    </InputWrapper>);
}
function RotateInput(p) {
    return (<InputWrapper label={$t('Rotation')}>
      <button className="button button--default" onClick={() => p.handleInput(90)}>
        {$t('Rotate 90 Degrees CW')}
      </button>
      <button className="button button--default" style={{ marginLeft: '8px' }} onClick={() => p.handleInput(-90)}>
        {$t('Rotate 90 Degrees CCW')}
      </button>
    </InputWrapper>);
}
function CropInput(p) {
    return (<InputWrapper label={$t('Crop')}>
      <div>
        {['left', 'right', 'top', 'bottom'].map((dir) => (<div style={{
                marginBottom: '8px',
                marginLeft: '8px',
            }} key={dir}>
            <NumberInput value={p.transform.crop[dir]} onInput={p.handleInput(dir)} min={0} step={1} nowrap/>
            <span style={{ marginLeft: '8px' }}>{dirMap(dir)}</span>
          </div>))}
      </div>
    </InputWrapper>);
}
function Footer(p) {
    return (<>
      <button className="button button--default" onClick={p.reset}>
        {$t('Reset')}
      </button>
      <button className="button button--action" style={{ marginLeft: '8px' }} onClick={p.cancel}>
        {$t('Done')}
      </button>
    </>);
}
//# sourceMappingURL=EditTransform.jsx.map