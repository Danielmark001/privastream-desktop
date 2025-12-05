import React from 'react';
import { useOnCreate } from 'slap';
import { ModalLayout } from '../../shared/ModalLayout';
import { Services } from '../../service-provider';
import { AlertBox } from '../AlertBox';
import { AlertBoxModule } from '../useAlertBox';
import { useWidgetRoot } from './useWidget';
import { ChatBox, ChatBoxModule } from '../ChatBox';
import { DonationTicker, DonationTickerModule } from '../DonationTicker';
import { EmoteWall, EmoteWallModule } from '../EmoteWall';
import { SponsorBanner, SponsorBannerModule } from '../SponsorBanner';
import { GameWidget, GameWidgetModule } from '../GameWidget';
import { ViewerCount, ViewerCountModule } from '../ViewerCount';
import { CustomWidget, CustomWidgetModule } from '../CustomWidget';
import { useSubscription } from '../../hooks/useSubscription';
import { useChildWindowParams } from 'components-react/hooks';
export const components = {
    AlertBox: [AlertBox, AlertBoxModule],
    ChatBox: [ChatBox, ChatBoxModule],
    DonationTicker: [DonationTicker, DonationTickerModule],
    EmoteWall: [EmoteWall, EmoteWallModule],
    SponsorBanner: [SponsorBanner, SponsorBannerModule],
    ViewerCount: [ViewerCount, ViewerCountModule],
    GameWidget: [GameWidget, GameWidgetModule],
    CustomWidget: [CustomWidget, CustomWidgetModule],
};
export function WidgetWindow() {
    const { WidgetsService } = Services;
    const { sourceId, widgetType } = useChildWindowParams();
    const { Module, WidgetSettingsComponent } = useOnCreate(() => {
        const [WidgetSettingsComponent, Module] = components[widgetType];
        return { sourceId, Module, WidgetSettingsComponent };
    });
    const { reload } = useWidgetRoot(Module, { sourceId });
    useSubscription(WidgetsService.settingsInvalidated, reload);
    return (React.createElement(ModalLayout, { bodyStyle: { padding: '0px' }, hideFooter: true },
        React.createElement(WidgetSettingsComponent, null)));
}
//# sourceMappingURL=WidgetWindow.js.map