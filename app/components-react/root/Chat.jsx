import * as remote from '@electron/remote';
import React, { useEffect, useRef } from 'react';
import { Services } from '../service-provider';
import styles from './Chat.m.less';
import { OS, getOS } from '../../util/operating-systems';
import { onUnload } from 'util/unload';
import { debounce } from 'lodash';
export default function Chat(props) {
    const { ChatService, RestreamService } = Services;
    const chatEl = useRef(null);
    let currentPosition;
    let currentSize;
    let leaveFullScreenTrigger;
    useEffect(() => {
        const service = props.restream ? RestreamService : ChatService;
        const cancelUnload = onUnload(() => service.actions.unmountChat(remote.getCurrentWindow().id));
        window.addEventListener('resize', debounce(checkResize, 100));
        if (getOS() === OS.Mac) {
            leaveFullScreenTrigger = () => {
                setTimeout(() => {
                    setupChat();
                    checkResize();
                }, 1000);
            };
            remote.getCurrentWindow().on('leave-full-screen', leaveFullScreenTrigger);
        }
        setupChat();
        setTimeout(checkResize, 100);
        return () => {
            window.removeEventListener('resize', debounce(checkResize, 100));
            if (getOS() === OS.Mac) {
                remote.getCurrentWindow().removeListener('leave-full-screen', leaveFullScreenTrigger);
            }
            service.actions.unmountChat(remote.getCurrentWindow().id);
            cancelUnload();
        };
    }, [props.restream]);
    function setupChat() {
        const service = props.restream ? RestreamService : ChatService;
        const windowId = remote.getCurrentWindow().id;
        ChatService.actions.unmountChat();
        RestreamService.actions.unmountChat(windowId);
        service.actions.mountChat(windowId);
        currentPosition = null;
        currentSize = null;
    }
    function checkResize() {
        const service = props.restream ? RestreamService : ChatService;
        if (!chatEl.current)
            return;
        const rect = chatEl.current.getBoundingClientRect();
        if (currentPosition == null || currentSize == null || rectChanged(rect)) {
            currentPosition = { x: rect.left, y: rect.top };
            currentSize = { x: rect.width, y: rect.height };
            service.actions.setChatBounds(currentPosition, currentSize);
        }
    }
    function rectChanged(rect) {
        return (rect.left !== (currentPosition === null || currentPosition === void 0 ? void 0 : currentPosition.x) ||
            rect.top !== (currentPosition === null || currentPosition === void 0 ? void 0 : currentPosition.y) ||
            rect.width !== (currentSize === null || currentSize === void 0 ? void 0 : currentSize.x) ||
            rect.height !== (currentSize === null || currentSize === void 0 ? void 0 : currentSize.y));
    }
    return <div className={styles.chat} ref={chatEl}/>;
}
//# sourceMappingURL=Chat.jsx.map