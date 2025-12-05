import React from 'react';
import styles from './UpdateModal.m.less';
import { useVuex } from 'components-react/hooks';
import { Services } from 'components-react/service-provider';
export default function Modal() {
    const { HighlighterService } = Services;
    const v = useVuex(() => ({
        isUpdaterRunning: HighlighterService.views.isUpdaterRunning,
        highlighterVersion: HighlighterService.views.highlighterVersion,
        progress: HighlighterService.views.updaterProgress,
    }));
    if (!v.isUpdaterRunning)
        return null;
    let subtitle;
    if (v.progress >= 100) {
        subtitle = React.createElement("h3", { className: styles.subtitle }, "Installing...");
    }
    else {
        subtitle = React.createElement("h3", { className: styles.subtitle },
            Math.round(v.progress),
            "% complete");
    }
    return (React.createElement("div", { className: styles.overlay },
        React.createElement("div", { className: styles.modal },
            React.createElement("h2", { className: styles.title },
                "Downloading version ",
                v.highlighterVersion),
            subtitle,
            React.createElement("div", { className: styles.progressBarContainer },
                React.createElement("div", { className: styles.progressBar, style: { width: `${Math.min(Math.max(v.progress, 0), 100)}%` } })))));
}
//# sourceMappingURL=UpdateModal.js.map