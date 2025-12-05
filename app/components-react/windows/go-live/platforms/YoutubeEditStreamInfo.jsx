var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { CommonPlatformFields } from '../CommonPlatformFields';
import { CheckboxInput, createBinding, ImageInput, InputComponent, ListInput, } from '../../../shared/inputs';
import React, { useEffect } from 'react';
import { Services } from '../../../service-provider';
import { $t } from '../../../../services/i18n';
import BroadcastInput from './BroadcastInput';
import InputWrapper from '../../../shared/inputs/InputWrapper';
import Form from '../../../shared/inputs/Form';
import { YoutubeService } from '../../../../services/platforms/youtube';
import PlatformSettingsLayout from './PlatformSettingsLayout';
import { assertIsDefined } from '../../../../util/properties-type-guards';
import { inject, injectQuery, useModule } from 'slap';
import styles from './YoutubeEditStreamInfo.m.less';
import cx from 'classnames';
export const YoutubeEditStreamInfo = InputComponent((p) => {
    const { StreamingService } = Services;
    const { isScheduleMode, isUpdateMode } = p;
    const isMidStreamMode = StreamingService.views.isMidStreamMode;
    function updateSettings(patch) {
        p.onChange(Object.assign(Object.assign({}, ytSettings), patch));
    }
    const ytSettings = p.value;
    const is360video = ytSettings.projection === '360';
    const shouldShowSafeForKidsWarn = ytSettings.selfDeclaredMadeForKids;
    const broadcastId = ytSettings.broadcastId;
    const bind = createBinding(ytSettings, newYtSettings => updateSettings(newYtSettings), fieldName => ({ disabled: fieldIsDisabled(fieldName) }));
    const { broadcastsQuery } = useModule(() => {
        const youtube = inject(YoutubeService);
        function fetchBroadcasts() {
            return __awaiter(this, void 0, void 0, function* () {
                const broadcasts = yield youtube.actions.return.fetchEligibleBroadcasts();
                const shouldFetchSelectedBroadcast = broadcastId && !broadcasts.find(b => b.id === broadcastId);
                if (shouldFetchSelectedBroadcast) {
                    assertIsDefined(broadcastId);
                    const selectedBroadcast = yield youtube.actions.return.fetchBroadcast(broadcastId);
                    broadcasts.push(selectedBroadcast);
                }
                return broadcasts;
            });
        }
        const broadcastsQuery = injectQuery([], fetchBroadcasts);
        return { broadcastsQuery };
    });
    useEffect(() => {
        if (!broadcastId)
            return;
        Services.YoutubeService.actions.return
            .fetchStartStreamOptionsForBroadcast(broadcastId)
            .then(newYtSettings => {
            updateSettings(newYtSettings);
        });
    }, [broadcastId]);
    function fieldIsDisabled(fieldName) {
        if (broadcastId && fieldName === 'selfDeclaredMadeForKids') {
            return true;
        }
        if (!isMidStreamMode)
            return false;
        return !Services.YoutubeService.updatableSettings.includes(fieldName);
    }
    function projectionChangeHandler(enable360) {
        updateSettings({ projection: enable360 ? '360' : 'rectangular' });
    }
    function renderCommonFields() {
        return (<CommonPlatformFields key="common" platform="youtube" layoutMode={p.layoutMode} value={ytSettings} onChange={updateSettings} layout={p.layout}/>);
    }
    function renderBroadcastInput() {
        return (<div key={'broadcast'}>
        {!isScheduleMode && (<BroadcastInput label={$t('Event')} loading={broadcastsQuery.isLoading} broadcasts={broadcastsQuery.data} disabled={isUpdateMode} {...bind.broadcastId} layout={p.layout}/>)}
      </div>);
    }
    function renderOptionalFields() {
        return (<div key="optional">
        {!isMidStreamMode && (<>
            <ListInput {...bind.privacyStatus} label={$t('Privacy')} options={[
                    {
                        value: 'public',
                        label: $t('Public'),
                        description: $t('Anyone can search for and view'),
                    },
                    {
                        value: 'unlisted',
                        label: $t('Unlisted'),
                        description: $t('Anyone with the link can view'),
                    },
                    { value: 'private', label: $t('Private'), description: $t('Only you can view') },
                ]} layout={p.layout} size="large"/>
            <ListInput {...bind.categoryId} label={$t('Category')} showSearch options={Services.YoutubeService.state.categories.map(category => ({
                    value: category.id,
                    label: category.snippet.title,
                }))} layout={p.layout} size="large"/>
            <ImageInput label={$t('Thumbnail')} maxFileSize={2 * 1024 * 1024} {...bind.thumbnail} layout={p.layout}/>

            <ListInput label={$t('Stream Latency')} tooltip={$t('latencyTooltip')} options={[
                    { value: 'normal', label: $t('Normal Latency') },
                    { value: 'low', label: $t('Low-latency') },
                    {
                        value: 'ultraLow',
                        label: $t('Ultra low-latency'),
                        description: $t('Does not support: Closed captions, 1440p, and 4k resolutions'),
                    },
                ]} layout={p.layout} size="large" {...bind.latencyPreference}/>
          </>)}
        <InputWrapper label={$t('Additional Settings')} layout={p.layout} className={cx(styles.youtubeCheckbox, { [styles.hideLabel]: p.layout === 'vertical' })}>
          {!isScheduleMode && !isMidStreamMode && (<CheckboxInput {...bind.enableAutoStart} label={$t('Enable Auto-start')} tooltip={$t('Enabling auto-start will automatically start the stream when you start sending data from your streaming software')}/>)}
          {!isScheduleMode && (<CheckboxInput {...bind.enableAutoStop} label={$t('Enable Auto-stop')} tooltip={$t('Enabling auto-stop will automatically stop the stream when you stop sending data from your streaming software')}/>)}
          <CheckboxInput {...bind.enableDvr} label={$t('Enable DVR')} tooltip={$t('DVR controls enable the viewer to control the video playback experience by pausing, rewinding, or fast forwarding content')}/>
          {!isMidStreamMode && (<>
              <CheckboxInput label={$t('360° video')} value={is360video} onChange={projectionChangeHandler}/>
              <CheckboxInput label={$t('Made for kids')} {...bind.selfDeclaredMadeForKids}/>
              {shouldShowSafeForKidsWarn && (<p>
                  {$t("Features like personalized ads and live chat won't be available on live streams made for kids.")}
                </p>)}
            </>)}
        </InputWrapper>
      </div>);
    }
    return (<Form name="youtube-settings">
      <PlatformSettingsLayout layoutMode={p.layoutMode} commonFields={renderCommonFields()} requiredFields={<div key={'empty-youtube'}/>} optionalFields={renderOptionalFields()} essentialOptionalFields={renderBroadcastInput()}/>
    </Form>);
});
//# sourceMappingURL=YoutubeEditStreamInfo.jsx.map