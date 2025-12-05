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
import { useModule } from 'slap';
import { LoginModule } from './Connect';
import styles from './Connect.m.less';
import cx from 'classnames';
import PlatformLogo from 'components-react/shared/PlatformLogo';
import commonStyles from './Common.m.less';
import { $t } from 'services/i18n';
import { confirmAsync } from 'components-react/modals';
import Form from 'components-react/shared/inputs/Form';
import { ListInput } from 'components-react/shared/inputs';
import { Button } from 'antd';
import { Services } from 'components-react/service-provider';
import { useVuex } from 'components-react/hooks';
export function PrimaryPlatformSelect() {
    const { UserService, OnboardingService } = Services;
    const { linkedPlatforms, isLogin, isPrime } = useVuex(() => ({
        linkedPlatforms: UserService.views.linkedPlatforms,
        isLogin: OnboardingService.state.options.isLogin,
        isPrime: UserService.state.isPrime,
    }));
    const { loading, authInProgress, authPlatform, finishSLAuth } = useModule(LoginModule);
    const platforms = ['twitch', 'youtube', 'tiktok', 'kick', 'facebook', 'twitter', 'trovo'];
    const platformOptions = [
        {
            value: 'twitch',
            label: 'Twitch',
            image: <PlatformLogo platform="twitch"/>,
        },
        {
            value: 'youtube',
            label: 'YouTube',
            image: <PlatformLogo platform="youtube"/>,
        },
        {
            value: 'facebook',
            label: 'Facebook',
            image: <PlatformLogo platform="facebook"/>,
        },
        {
            value: 'trovo',
            label: 'Trovo',
            image: <PlatformLogo platform="trovo" size={14}/>,
        },
        {
            value: 'twitter',
            label: 'X (Twitter)',
            image: <PlatformLogo platform="twitter" size={14}/>,
        },
        {
            value: 'tiktok',
            label: 'TikTok',
            image: <PlatformLogo platform="tiktok" size={14}/>,
        },
        {
            value: 'kick',
            label: 'Kick',
            image: <PlatformLogo platform="kick" size={14}/>,
        },
    ].filter(opt => {
        return linkedPlatforms.includes(opt.value);
    });
    const [selectedPlatform, setSelectedPlatform] = useState(platformOptions.length ? platformOptions[0].value : '');
    useEffect(() => {
        if (UserService.views.linkedPlatforms.length) {
            selectPrimary(UserService.views.linkedPlatforms[0]);
            return;
        }
        if (linkedPlatforms.length) {
            setSelectedPlatform(linkedPlatforms[0]);
        }
    }, [linkedPlatforms.length, isPrime]);
    function afterLogin(platform) {
        return __awaiter(this, void 0, void 0, function* () {
            yield finishSLAuth(platform);
            if (isLogin)
                OnboardingService.actions.finish();
        });
    }
    function onSkip() {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield confirmAsync({
                title: $t('Log Out?'),
                content: $t('Streamlabs Desktop requires that you have a connected platform account in order to use all of its features. By skipping this step, you will be logged out and some features may be unavailable.'),
                okText: $t('Log Out'),
            });
            if (result) {
                yield finishSLAuth();
                if (isLogin)
                    OnboardingService.actions.finish();
            }
        });
    }
    function selectPrimary(primary) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!selectedPlatform && !primary)
                return;
            yield finishSLAuth(primary !== null && primary !== void 0 ? primary : selectedPlatform);
            if (isLogin)
                OnboardingService.actions.finish();
        });
    }
    if (linkedPlatforms.length) {
        return (<div className={styles.pageContainer}>
        <div className={styles.container}>
          <h1 className={commonStyles.titleContainer}>{$t('Select a Primary Platform')}</h1>
          <p style={{ marginBottom: 30, maxWidth: 400, textAlign: 'center' }}>
            {$t('Your Streamlabs account has multiple connected content platforms. Please select the primary platform you will be streaming to using Streamlabs Desktop.')}
          </p>
          <Form layout="inline" style={{ width: 300 }}>
            <ListInput style={{ width: '100%' }} onChange={setSelectedPlatform} allowClear={false} value={selectedPlatform} hasImage={true} options={platformOptions}/>
          </Form>
          <div style={{ width: 400, marginTop: 30, textAlign: 'center' }}>
            <Button type="primary" disabled={loading} onClick={() => selectPrimary()}>
              {loading && <i className="fas fa-spinner fa-spin"/>}
              {$t('Continue')}
            </Button>
          </div>
        </div>
      </div>);
    }
    return (<div className={styles.pageContainer}>
      <div className={styles.container}>
        <h1 className={commonStyles.titleContainer}>{$t('Connect a Content Platform')}</h1>
        <p style={{ marginBottom: 80 }}>
          {$t('Streamlabs Desktop requires you to connect a content platform to your Streamlabs account')}
        </p>
        <div className={styles.signupButtons}>
          {platforms.map((platform) => (<button className={cx(`button button--${platform}`, styles.loginButton)} disabled={loading || authInProgress} onClick={() => authPlatform(platform, () => afterLogin(platform), true)} key={platform}>
              {loading && <i className="fas fa-spinner fa-spin"/>}
              {!loading && (<PlatformLogo platform={platform} size="medium" color={['tiktok', 'trovo'].includes(platform) ? 'black' : 'white'}/>)}
            </button>))}
        </div>
        <p>
          <br />
          <span className={styles['link-button']} onClick={onSkip}>
            {$t('Skip')}
          </span>
        </p>
      </div>
    </div>);
}
//# sourceMappingURL=PrimaryPlatformSelect.jsx.map