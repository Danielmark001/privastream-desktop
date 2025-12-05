import React from 'react';
import { useWidget, WidgetModule } from './common/useWidget';
import { WidgetLayout } from './common/WidgetLayout';
import { $t } from '../../services/i18n';
import { ColorInput, FontFamilyInput, FontSizeInput, FontWeightInput, NumberInput, TextInput, SliderInput, } from '../shared/inputs';
export function DonationTicker() {
    const { isLoading, bind, tips } = useDonationTicker();
    return (<WidgetLayout>
      {!isLoading && (<>
          <TextInput label={$t('Message Format')} {...bind.message_format} tooltip={tips.messageFormatTooltip}/>
          <NumberInput label={$t('Max Donations')} {...bind.max_donations} min={0} max={1000} tooltip={tips.maxDonationsTooltip}/>
          <SliderInput label={$t('Text Scroll Speed')} {...bind.scroll_speed} max={10} tooltip={tips.scrollSpeedTooltip}/>
          <ColorInput label={$t('Background Color')} {...bind.background_color} tooltip={tips.backgroundColorTooltip}/>

          <FontFamilyInput label={$t('Font')} {...bind.font}/>
          <FontSizeInput label={$t('Font Size')} {...bind.font_size} tooltip={tips.fontSizeTooltip}/>
          <FontWeightInput label={$t('Font Weight')} {...bind.font_weight} tooltip={tips.fontWeightTooltip}/>
          <ColorInput label={$t('Text Color')} {...bind.font_color} tooltip={tips.textColorTooltip}/>
          <ColorInput label={$t('Name Text Color')} {...bind.font_color2} tooltip={tips.nameColorTooltip}/>
          <ColorInput label={$t('Amount Text Color')} {...bind.font_color3} tooltip={tips.amountColorTooltip}/>
        </>)}
    </WidgetLayout>);
}
export class DonationTickerModule extends WidgetModule {
    constructor() {
        super(...arguments);
        this.tips = {
            messageFormatTooltip: $t('Each donation that shows in the donation ticker will be in this format. Available tokens:') +
                ' {name} ' +
                $t('The name of the donator,') +
                ' {amount} ' +
                $t('The amount that was donated'),
            maxDonationsTooltip: $t('The maximum amount of donations to show in the ticker. Must be a number greater than 0.'),
            scrollSpeedTooltip: $t('How fast the ticker should scroll between 1 (fastest) and 10 (slowest). Set to 0 for no scrolling.'),
            backgroundColorTooltip: $t('A hex code for the widget background. This is for preview purposes only. It will not be shown in your stream.'),
            fontSizeTooltip: $t('The font size in pixels. Reasonable size typically ranges between 24px and 48px.'),
            fontWeightTooltip: $t('How thick to make the font. The value should range between 300 (thinnest) and 900 (thickest)'),
            textColorTooltip: $t('A hex code for the base text color.'),
            nameColorTooltip: $t('A hex color for the text of the') + ' {name} ' + $t('token'),
            amountColorTooltip: $t('A hex color for the text of the') + ' {amount} ' + $t('token'),
        };
    }
    patchAfterFetch(data) {
        data.settings.font_size = parseInt(data.settings.font_size, 10);
        data.settings.font_weight = parseInt(data.settings.font_weight, 10);
        return data;
    }
}
function useDonationTicker() {
    return useWidget();
}
//# sourceMappingURL=DonationTicker.jsx.map