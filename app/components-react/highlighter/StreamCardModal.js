import { useVuex } from 'components-react/hooks';
import { Services } from 'components-react/service-provider';
import React, { useEffect, useState } from 'react';
import styles from './StreamView.m.less';
import { Modal, Alert, Button, Input } from 'antd';
import ExportModal from 'components-react/highlighter/Export/ExportModal';
import { $t } from 'services/i18n';
import PreviewModal from './PreviewModal';
import EducationCarousel from './EducationCarousel';
export default function StreamCardModal({ streamId, modal, game, onClose, }) {
    const { HighlighterService } = Services;
    const v = useVuex(() => ({
        exportInfo: HighlighterService.views.exportInfo,
        uploadInfo: HighlighterService.views.uploadInfo,
        error: HighlighterService.views.error,
    }));
    const [showModal, rawSetShowModal] = useState(null);
    const [modalWidth, setModalWidth] = useState('700px');
    useEffect(() => {
        if (modal) {
            setShowModal(modal);
        }
    }, [modal]);
    function setShowModal(modal) {
        rawSetShowModal(modal);
        if (modal) {
            setModalWidth({
                preview: '700px',
                export: 'fit-content',
                remove: '400px',
                requirements: 'fit-content',
                feedback: '700px',
            }[modal]);
        }
    }
    function closeModal() {
        if (v.exportInfo.exporting)
            return;
        if (v.uploadInfo.some(u => u.uploading))
            return;
        setShowModal(null);
        onClose();
        if (v.error)
            HighlighterService.actions.dismissError();
    }
    return (React.createElement(Modal, { getContainer: `.${styles.streamCardModalRoot}`, onCancel: closeModal, footer: null, width: modalWidth, closable: false, visible: !!showModal || !!v.error, destroyOnClose: true, keyboard: false },
        !!v.error && React.createElement(Alert, { message: v.error, type: "error", showIcon: true }),
        showModal === 'export' && React.createElement(ExportModal, { close: closeModal, streamId: streamId }),
        showModal === 'preview' && (React.createElement(PreviewModal, { close: closeModal, streamId: streamId, emitSetShowModal: modal => {
                setShowModal(modal);
            } })),
        showModal === 'remove' && React.createElement(RemoveStream, { close: closeModal, streamId: streamId }),
        showModal === 'feedback' && React.createElement(Feedback, { streamId: streamId, close: closeModal, game: game }),
        showModal === 'requirements' && React.createElement(EducationCarousel, { game: game })));
}
function RemoveStream(p) {
    const { HighlighterService } = Services;
    return (React.createElement("div", { style: { textAlign: 'center' } },
        React.createElement("h2", null,
            $t('Delete highlighted stream?'),
            " "),
        React.createElement("p", null, $t('Are you sure you want to delete this stream and all its associated clips? This action cannot be undone.')),
        React.createElement(Button, { style: { marginRight: 8 }, onClick: p.close }, $t('Cancel')),
        React.createElement(Button, { type: "primary", danger: true, onClick: () => {
                if (p.streamId === undefined) {
                    console.error('Cant remove stream, missing id');
                    return;
                }
                HighlighterService.actions.removeStream(p.streamId);
                p.close();
            } }, 'Delete')));
}
function Feedback(p) {
    const { UsageStatisticsService, HighlighterService } = Services;
    const { TextArea } = Input;
    const [feedback, setFeedback] = useState('');
    const leaveFeedback = () => {
        if (!feedback || feedback.length > 140) {
            return;
        }
        const clipAmount = HighlighterService.getClips(HighlighterService.views.clips, p.streamId)
            .length;
        UsageStatisticsService.recordAnalyticsEvent('AIHighlighter', {
            type: 'ThumbsDownFeedback',
            streamId: p.streamId,
            game: p.game,
            clips: clipAmount,
            feedback,
        });
        p.close();
    };
    return (React.createElement("div", null,
        React.createElement(TextArea, { rows: 4, maxLength: 140, showCount: true, placeholder: $t('Highlights not working? Let us know how we can improve.'), onChange: e => setFeedback(e.target.value) }),
        React.createElement("div", { style: { textAlign: 'right', marginTop: '24px' } },
            React.createElement(Button, { size: "large", type: "primary", style: { marginTop: '14px' }, disabled: !feedback, onClick: leaveFeedback }, $t('Submit')))));
}
//# sourceMappingURL=StreamCardModal.js.map