var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import React, { useEffect } from 'react';
import * as remote from '@electron/remote';
import { Services } from 'components-react/service-provider';
import { useVuex } from 'components-react/hooks';
import { $t } from 'services/i18n';
import Translate from 'components-react/shared/Translate';
import UploadProgress from './UploadProgress';
import styles from './ExportModal.m.less';
import { EPlatformCallResult } from 'services/platforms';
import { EUploadPlatform } from 'services/highlighter/models/highlighter.models';
import { Modal } from 'antd';
export default function StorageUpload(p) {
    const { UserService, HighlighterService, SharedStorageService } = Services;
    const { uploadInfo, hasSLID } = useVuex(() => {
        var _a, _b;
        return ({
            uploadInfo: HighlighterService.getUploadInfo(HighlighterService.views.uploadInfo, p.platform),
            hasSLID: !!((_b = (_a = UserService.views.auth) === null || _a === void 0 ? void 0 : _a.slid) === null || _b === void 0 ? void 0 : _b.id),
        });
    });
    const [showSlidLoginModal, setShowSlidLoginModal] = React.useState(false);
    function uploadStorage() {
        const existingUpload = HighlighterService.views.state.uploads.find(upload => [
            EUploadPlatform.CROSSCLIP,
            EUploadPlatform.TYPESTUDIO,
            EUploadPlatform.VIDEOEDITOR,
        ].includes(upload.platform) && upload.videoId);
        if (existingUpload === null || existingUpload === void 0 ? void 0 : existingUpload.videoId) {
            HighlighterService.SET_UPLOAD_INFO({
                platform: p.platform,
                videoId: existingUpload.videoId,
            });
        }
        else {
            HighlighterService.actions.uploadStorage(p.platform);
        }
    }
    useEffect(() => {
        if (uploadInfo === null || uploadInfo === void 0 ? void 0 : uploadInfo.videoId) {
            remote.shell.openExternal(SharedStorageService.views.getPlatformLink(p.platform, uploadInfo.videoId));
            p.onClose();
        }
    }, [uploadInfo === null || uploadInfo === void 0 ? void 0 : uploadInfo.videoId]);
    useEffect(() => {
        return () => HighlighterService.actions.dismissError();
    }, []);
    if ((uploadInfo === null || uploadInfo === void 0 ? void 0 : uploadInfo.uploading) && uploadInfo.platform === p.platform) {
        return <UploadProgress platform={p.platform} dense/>;
    }
    return (<>
      <Modal visible={showSlidLoginModal} onCancel={() => setShowSlidLoginModal(false)} closable={true} destroyOnClose={true} footer={null} title={$t('Sign in with Streamlabs ID')} width={400}>
        <GetSLID onLogin={uploadStorage}/>
      </Modal>

      {(uploadInfo === null || uploadInfo === void 0 ? void 0 : uploadInfo.videoId) ? (<button className={styles.uploadButton} onClick={() => {
                if (!uploadInfo.videoId) {
                    return;
                }
                remote.shell.openExternal(SharedStorageService.views.getPlatformLink(p.platform, uploadInfo.videoId));
            }}>
          {$t('Open')}
        </button>) : (<button disabled={uploadInfo === null || uploadInfo === void 0 ? void 0 : uploadInfo.uploading} className={styles.uploadButton} onClick={() => {
                if (!hasSLID) {
                    setShowSlidLoginModal(true);
                }
                else {
                    uploadStorage();
                }
            }}>
          {$t('Upload')}
        </button>)}
    </>);
}
export function GetSLID(p) {
    const { UserService, OnboardingService } = Services;
    function clickLink(signup) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            let resp;
            const platform = (_a = UserService.views.platform) === null || _a === void 0 ? void 0 : _a.type;
            if (UserService.views.isLoggedIn) {
                resp = yield UserService.actions.return.startSLMerge();
            }
            else {
                resp = yield UserService.actions.return.startSLAuth({ signup });
            }
            if (resp !== EPlatformCallResult.Success)
                return;
            if (platform) {
                UserService.actions.setPrimaryPlatform(platform);
            }
            else {
                OnboardingService.actions.start({ isLogin: true });
            }
            if (p.onLogin)
                p.onLogin();
        });
    }
    return (<div className={styles.crossclipContainer}>
      <h2 className={styles.signUpTitle}>{$t('This feature requires a Streamlabs ID')}</h2>
      <button className="button button--action" style={{ width: '300px', margin: '32px' }} onClick={() => clickLink(true)}>
        {$t('Sign up for Streamlabs ID')}
      </button>
      <span className={styles.login}>
        <Translate message="Already have a Streamlabs ID? <link>Login</link>">
          <a slot="link" onClick={() => clickLink()}/>
        </Translate>
      </span>
    </div>);
}
//# sourceMappingURL=StorageUpload.jsx.map