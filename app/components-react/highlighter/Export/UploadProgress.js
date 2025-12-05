import React from 'react';
import { Progress } from 'antd';
import { Services } from 'components-react/service-provider';
import { useVuex } from 'components-react/hooks';
import { $t } from 'services/i18n';
import styles from './ExportModal.m.less';
function humanFileSize(bytes, si) {
    const thresh = si ? 1000 : 1024;
    if (Math.abs(bytes) < thresh) {
        return bytes + ' B';
    }
    const units = si
        ? ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
        : ['KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
    let u = -1;
    do {
        bytes /= thresh;
        ++u;
    } while (Math.abs(bytes) >= thresh && u < units.length - 1);
    return bytes.toFixed(1) + ' ' + units[u];
}
export default function UploadProgress({ platform, dense, }) {
    const { HighlighterService } = Services;
    const { uploadInfo } = useVuex(() => ({
        uploadInfo: HighlighterService.getUploadInfo(HighlighterService.views.uploadInfo, platform),
    }));
    if (uploadInfo === undefined) {
        return React.createElement("div", null, $t('Something went wrong. Please contact support if the issue persists'));
    }
    return (React.createElement("div", { style: { marginTop: dense ? '0' : '16px' } },
        !dense && React.createElement("h2", null, $t('Upload Progress')),
        React.createElement(Progress, { percent: Math.round((uploadInfo.uploadedBytes / uploadInfo.totalBytes) * 100), trailColor: "var(--section)", status: uploadInfo.cancelRequested ? 'exception' : 'normal', style: { marginTop: dense ? '0' : '16px' } }),
        !uploadInfo.cancelRequested && (React.createElement("div", { style: { fontSize: dense ? '12px' : 'inherit' } }, $t('Uploading: %{uploadedBytes}/%{totalBytes}', {
            uploadedBytes: humanFileSize(uploadInfo.uploadedBytes, false),
            totalBytes: humanFileSize(uploadInfo.totalBytes, false),
        }))),
        uploadInfo.cancelRequested && React.createElement("span", null, $t('Canceling...')),
        dense ? (React.createElement("button", { className: styles.uploadButton, onClick: () => HighlighterService.actions.cancelUpload(platform), disabled: uploadInfo.cancelRequested, style: { color: 'var(--warning)' } }, $t('Cancel'))) : (React.createElement(React.Fragment, null,
            React.createElement("br", null),
            React.createElement("button", { className: "button button--soft-warning", onClick: () => HighlighterService.actions.cancelUpload(platform), style: { marginTop: dense ? '0' : '16px' }, disabled: uploadInfo.cancelRequested }, $t('Cancel'))))));
}
//# sourceMappingURL=UploadProgress.js.map