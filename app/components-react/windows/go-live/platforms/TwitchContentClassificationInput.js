import React from 'react';
import { Select } from 'antd';
import { useVuex } from 'components-react/hooks';
import { Services } from 'components-react/service-provider';
import { $t } from 'services/i18n';
import InputWrapper from 'components-react/shared/inputs/InputWrapper';
export default function TwitchContentClassificationInput({ value, onChange, layout, }) {
    const TwitchContentClassificationService = Services.TwitchContentClassificationService;
    const { options } = useVuex(() => ({
        options: TwitchContentClassificationService.options,
    }));
    return (React.createElement(InputWrapper, { label: $t('Content Classification'), layout: layout },
        React.createElement(Select, { mode: "multiple", options: options, placeholder: $t('Content classification'), value: value, onChange: onChange, size: "large" })));
}
//# sourceMappingURL=TwitchContentClassificationInput.js.map