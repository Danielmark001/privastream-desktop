import React from 'react';
import { WidgetModule } from './common/useWidget';
import { WidgetLayout } from './common/WidgetLayout';
export function CustomWidget() {
    return (React.createElement(WidgetLayout, null,
        React.createElement(React.Fragment, null)));
}
export class CustomWidgetModule extends WidgetModule {
}
//# sourceMappingURL=CustomWidget.js.map