import { useVuex } from 'components-react/hooks';
import { Services } from 'components-react/service-provider';
import React, { useEffect, useState } from 'react';
import styles from './ClipsView.m.less';
import ClipTrimmer from 'components-react/highlighter/ClipTrimmer';
import { Modal, Alert } from 'antd';
import ExportModal from 'components-react/highlighter/Export/ExportModal';
import PreviewModal from './PreviewModal';
import RemoveModal from './RemoveModal';
import ExportMarkersModal from './ExportMarkersModal';
export default function ClipsViewModal({ streamId, modal, onClose, deleteClip, }) {
    const { HighlighterService } = Services;
    const v = useVuex(() => ({
        exportInfo: HighlighterService.views.exportInfo,
        uploadInfo: HighlighterService.views.uploadInfo,
        error: HighlighterService.views.error,
    }));
    const [showModal, rawSetShowModal] = useState(null);
    const [modalWidth, setModalWidth] = useState('700px');
    const [inspectedClip, setInspectedClip] = useState(null);
    useEffect(() => {
        if (modal === null || modal === void 0 ? void 0 : modal.inspectedPathId) {
            setInspectedClip(HighlighterService.views.clipsDictionary[modal.inspectedPathId]);
        }
        if (modal === null || modal === void 0 ? void 0 : modal.modal) {
            setShowModal(modal.modal);
        }
    }, [modal]);
    function setShowModal(modal) {
        var _a;
        rawSetShowModal(modal);
        if (modal) {
            setModalWidth((_a = {
                trim: '60%',
                preview: '700px',
                export: 'fit-content',
                remove: '280px',
                exportMarkers: 'fit-content',
            }[modal]) !== null && _a !== void 0 ? _a : '700px');
        }
    }
    function closeModal() {
        if (v.exportInfo.exporting)
            return;
        if (v.uploadInfo.some(u => u.uploading))
            return;
        setInspectedClip(null);
        setShowModal(null);
        onClose();
        if (v.error)
            HighlighterService.actions.dismissError();
    }
    return (<Modal getContainer={`.${styles.clipsViewRoot}`} onCancel={closeModal} footer={null} width={modalWidth} closable={false} visible={!!showModal || !!v.error} destroyOnClose={true} keyboard={false}>
      {!!v.error && <Alert message={v.error} type="error" showIcon/>}
      {inspectedClip && showModal === 'trim' && (<ClipTrimmer clip={inspectedClip} streamId={streamId}/>)}
      {showModal === 'export' && <ExportModal close={closeModal} streamId={streamId}/>}
      {showModal === 'preview' && (<PreviewModal close={closeModal} streamId={streamId} emitSetShowModal={modal => {
                setShowModal(modal);
            }}/>)}
      {showModal === 'exportMarkers' && streamId && (<ExportMarkersModal close={closeModal} streamId={streamId}/>)}
      {inspectedClip && showModal === 'remove' && (<RemoveModal key={`remove-${inspectedClip.path}`} close={closeModal} clip={inspectedClip} streamId={streamId} deleteClip={deleteClip} removeType={'clip'}/>)}
    </Modal>);
}
//# sourceMappingURL=ClipsViewModal.jsx.map