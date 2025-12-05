import React, { useMemo } from 'react';
import { Divider } from 'antd';
import { ListInput } from 'components-react/shared/inputs';
import Form from 'components-react/shared/inputs/Form';
import { getPlatformService } from 'services/platforms';
import PlatformLogo from 'components-react/shared/PlatformLogo';
import Tooltip from 'components-react/shared/Tooltip';
import { $t } from 'services/i18n';
import { Services } from 'components-react/service-provider';
import UltraIcon from 'components-react/shared/UltraIcon';
export default function PrimaryChatSwitcher({ enabledPlatforms, primaryChat, onSetPrimaryChat, style = {}, layout = 'vertical', className = undefined, suffixIcon = undefined, tooltip = undefined, size = undefined, logo = true, border = true, disabled = false, }) {
    const primaryChatOptions = useMemo(() => enabledPlatforms.map(platform => {
        const service = getPlatformService(platform);
        return {
            label: service.displayName,
            value: platform,
        };
    }), [enabledPlatforms]);
    return (<div data-name="primaryChat" style={style} className={className}>
      {border && <Divider style={{ marginBottom: '8px' }}/>}
      <Form layout={layout}>
        <ListInput name="primaryChat" label={tooltip ? (<div style={{ display: 'flex', alignItems: 'center' }}>
                {`${$t('Primary Chat')}:`}
                {!Services.UserService.views.isPrime &&
                !Services.DualOutputService.views.dualOutputMode ? (<UltraIcon type="badge" style={{ marginLeft: '10px' }}/>) : (<Tooltip title={tooltip} placement="top" lightShadow={true}>
                    <i className="icon-information" style={{ marginLeft: '10px' }}/>
                  </Tooltip>)}
              </div>) : (`${$t('Primary Chat')}:`)} options={primaryChatOptions} labelRender={opt => renderPrimaryChatOption(opt, logo)} optionRender={opt => renderPrimaryChatOption(opt, logo)} value={primaryChat} onChange={onSetPrimaryChat} suffixIcon={suffixIcon} size={size} disabled={disabled} dropdownMatchSelectWidth={false}/>
      </Form>
    </div>);
}
const renderPrimaryChatOption = (option, logo) => {
    return (<div style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: '8px',
        }}>
      {logo && <PlatformLogo platform={option.value} size={16}/>}
      <div>{option.label}</div>
    </div>);
};
//# sourceMappingURL=PrimaryChatSwitcher.jsx.map