import { useGoLiveSettings } from './useGoLiveSettings';
import css from './GoLiveChecklist.m.less';
import React, { useEffect } from 'react';
import { Services } from '../../service-provider';
import { $t } from '../../../services/i18n';
import cx from 'classnames';
import GoLiveError from './GoLiveError';
import MessageLayout from './MessageLayout';
import { Timeline } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, LoadingOutlined } from '@ant-design/icons';
import Utils from '../../../services/utils';
export default function GoLiveChecklist(p) {
    const { VideoEncodingOptimizationService, WindowsService } = Services;
    const { error, enabledPlatforms, lifecycle, isMultiplatformMode, isDualOutputMode, checklist, warning, getPlatformDisplayName, isUpdateMode, shouldShowOptimizedProfile, } = useGoLiveSettings().extend(module => ({
        get shouldShowOptimizedProfile() {
            return VideoEncodingOptimizationService.state.useOptimizedProfile && !module.isUpdateMode;
        },
    }));
    const success = lifecycle === 'live';
    useEffect(() => {
        if (lifecycle === 'live' && !warning) {
            Utils.sleep(1000).then(() => {
                if (WindowsService.state.child.componentName === 'GoLiveWindow') {
                    WindowsService.actions.closeChildWindow();
                }
            });
        }
    }, [lifecycle]);
    function render() {
        return (<div className={cx(css.container, p.className, { [css.success]: success })}>
        <h1 className={css.success}>{getHeaderText()}</h1>

        <Timeline>
          
          {enabledPlatforms.map(platform => renderCheck($t('Update settings for %{platform}', {
                platform: getPlatformDisplayName(platform),
            }), checklist[platform]))}

          
          {!isUpdateMode &&
                isMultiplatformMode &&
                !isDualOutputMode &&
                renderCheck($t('Configure the Multistream service'), checklist.setupMultistream)}

          
          {!isUpdateMode &&
                isDualOutputMode &&
                renderCheck($t('Configure the Dual Output service'), checklist.setupDualOutput)}

          
          {shouldShowOptimizedProfile &&
                renderCheck($t('Apply optimized settings'), checklist.applyOptimizedSettings)}

          
          {!isUpdateMode &&
                renderCheck($t('Start video transmission'), checklist.startVideoTransmission)}
        </Timeline>

        
        {warning === 'YT_AUTO_START_IS_DISABLED' && renderYtWarning()}

        
        <GoLiveError />
      </div>);
    }
    function getHeaderText() {
        if (error) {
            if (checklist.startVideoTransmission === 'done') {
                return $t('Your stream has started, but there were issues with other actions taken');
            }
            else {
                return $t('Something went wrong');
            }
        }
        if (lifecycle === 'live') {
            return $t("You're live!");
        }
        return $t('Working on your live stream') + '...';
    }
    function renderCheck(title, state) {
        let dot;
        let color;
        switch (state) {
            case 'not-started':
                dot = null;
                color = 'grey';
                break;
            case 'pending':
                color = 'orange';
                dot = <LoadingOutlined spin={false} color={color}/>;
                break;
            case 'done':
                color = 'green';
                dot = <CheckCircleOutlined color={color}/>;
                break;
            case 'failed':
                color = '#B14334';
                dot = <CloseCircleOutlined color={color}/>;
                break;
        }
        return (<Timeline.Item key={title} dot={dot} color={color} className={state === 'done' ? css.done : ''}>
        <span>{title}</span>
      </Timeline.Item>);
    }
    function renderYtWarning() {
        return (<MessageLayout>
        <p>
          {$t('Auto-start is disabled for your broadcast. You should manually publish your stream from Youtube Studio')}
        </p>
        <button className="button button--default" onClick={() => Services.YoutubeService.actions.openDashboard()}>
          {$t('Open Youtube Studio')}
        </button>
      </MessageLayout>);
    }
    return render();
}
//# sourceMappingURL=GoLiveChecklist.jsx.map