import React from 'react';
import { $t } from '../../../../services/i18n';
import * as moment from 'moment';
import { ListInput } from '../../../shared/inputs';
import { assertIsDefined } from '../../../../util/properties-type-guards';
import { Col, Row } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
const PlusIcon = PlusOutlined;
const textOverflowStyle = { overflow: 'hidden', textOverflow: 'ellipsis' };
export default function BroadcastInput(p) {
    const imageStyle = { width: '60px', minWidth: '60px', height: '44px', borderRadius: '2px' };
    const centerFlexStyle = { display: 'flex', alignItems: 'center', justifyContent: 'center' };
    const options = [
        {
            label: $t('Create New Event'),
            value: '',
        },
        ...p.broadcasts.map(b => ({ label: b.snippet.title, value: b.id })),
    ];
    function formatDate(isoDate) {
        return moment(new Date(isoDate)).format(moment.localeData().longDateFormat('ll'));
    }
    function getBroadcast(id) {
        return p.broadcasts.find(b => b.id === id);
    }
    function optionRender(opt) {
        if (!opt.value)
            return renderEmptyOption();
        const broadcast = getBroadcast(opt.value);
        assertIsDefined(broadcast);
        return (<Row style={{ height: '60px' }} gutter={8} wrap={false} align="middle">
        <Col>
          <img src={broadcast.snippet.thumbnails.default.url} style={imageStyle}/>
        </Col>
        <Col flex="auto">
          <div style={textOverflowStyle}>{broadcast.snippet.title}</div>
          <div style={textOverflowStyle}>{broadcast.snippet.description}</div>
        </Col>
        <Col flex="80px">
          <div>{formatDate(broadcast.snippet.scheduledStartTime)}</div>
          <div>&nbsp;</div>
        </Col>
      </Row>);
    }
    function renderEmptyOption() {
        return (<Row style={{ height: '60px' }} gutter={8} wrap={false} align="middle">
        <Col>
          <div style={Object.assign(Object.assign({}, imageStyle), centerFlexStyle)} className={'ant-upload ant-upload-select ant-upload-select-picture-card'}>
            <PlusIcon />
          </div>
        </Col>
        <Col flex="auto">{$t('Create New Event')}</Col>
      </Row>);
    }
    function labelRender(opt) {
        if (!opt.value)
            return opt.label;
        const broadcast = getBroadcast(opt.value);
        assertIsDefined(broadcast);
        return `${opt.label} (${formatDate(broadcast.snippet.scheduledStartTime)})`;
    }
    return (<ListInput {...p} onChange={p.onChange} options={options} placeholder={$t('Create New Event')} optionRender={optionRender} labelRender={labelRender} showSearch layout={p.layout} size="large"/>);
}
//# sourceMappingURL=BroadcastInput.jsx.map