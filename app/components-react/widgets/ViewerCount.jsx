import React from 'react';
import { useWidget, WidgetModule } from './common/useWidget';
import { WidgetLayout } from './common/WidgetLayout';
import InputWrapper from '../shared/inputs/InputWrapper';
import { $t } from '../../services/i18n';
import { CheckboxInput, ColorInput, FontFamilyInput, FontSizeInput } from '../shared/inputs';
export function ViewerCount() {
    const { isLoading, bind } = useViewerCount();
    return (<WidgetLayout>
      {!isLoading && (<>
          <InputWrapper label={$t('Enabled Streams')}>
            <CheckboxInput label={$t('Twitch Viewers')} {...bind.twitch}/>
            <CheckboxInput label={$t('YouTube Viewers')} {...bind.youtube}/>
            <CheckboxInput label={$t('Facebook Viewers')} {...bind.facebook}/>
            <CheckboxInput label={$t('Trovo Viewers')} {...bind.trovo}/>
          </InputWrapper>

          <FontFamilyInput label={$t('Font')} {...bind.font}/>
          <ColorInput label={$t('Font Color')} {...bind.font_color}/>
          <FontSizeInput label={$t('Font Size')} {...bind.font_size} debounce={500}/>
        </>)}
    </WidgetLayout>);
}
export class ViewerCountModule extends WidgetModule {
    patchAfterFetch(data) {
        return Object.assign(Object.assign({}, data), { settings: Object.assign(Object.assign({}, data.settings), { twitch: data.settings.types.twitch.enabled, youtube: data.settings.types.youtube.enabled, facebook: data.settings.types.facebook.enabled, trovo: data.settings.types.trovo.enabled }) });
    }
    patchBeforeSend(settings) {
        return Object.assign(Object.assign({}, settings), { types: {
                youtube: { enabled: settings.youtube },
                twitch: { enabled: settings.twitch },
                facebook: { enabled: settings.facebook },
                trovo: { enabled: settings.trovo },
            } });
    }
}
function useViewerCount() {
    return useWidget();
}
//# sourceMappingURL=ViewerCount.jsx.map