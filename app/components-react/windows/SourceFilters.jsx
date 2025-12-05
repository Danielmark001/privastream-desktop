import { Services } from 'components-react/service-provider';
import React, { forwardRef, useEffect, useState } from 'react';
import Display from 'components-react/shared/Display';
import { ModalLayout } from 'components-react/shared/ModalLayout';
import { Button, Menu, Modal } from 'antd';
import Scrollable from 'components-react/shared/Scrollable';
import { ListInput, TextInput } from 'components-react/shared/inputs';
import { useChildWindowParams, useVuex } from 'components-react/hooks';
import Form, { useForm } from 'components-react/shared/inputs/Form';
import { ObsForm } from 'components-react/obs/ObsForm';
import widgetsCss from 'components-react/widgets/common/WidgetLayout.m.less';
import css from './SourceFilters.m.less';
import { ReactSortable } from 'react-sortablejs';
import cx from 'classnames';
import { $t } from 'services/i18n';
const FilterMenuContainer = forwardRef((props, ref) => {
    return (<ul className="ant-menu ant-menu-root ant-menu-vertical ant-menu-dark" ref={ref}>
      {props.children}
    </ul>);
});
export default function SourceFilters() {
    const { WindowsService, SourceFiltersService, SourcesService, EditorCommandsService } = Services;
    const sourceId = useChildWindowParams('sourceId');
    const { filters, isVisual, preset } = useVuex(() => {
        var _a;
        return ({
            filters: SourceFiltersService.views.filtersBySourceId(sourceId),
            isVisual: !!((_a = SourcesService.views.getSource(sourceId)) === null || _a === void 0 ? void 0 : _a.video),
            preset: SourceFiltersService.views.presetFilterBySourceId(sourceId),
        });
    });
    const presetValue = preset
        ? SourceFiltersService.views.parsePresetValue(preset.settings.image_path)
        : 'none';
    const [selectedFilter, setSelectedFilter] = useState(filters && filters.length > 0 ? filters[0].name : null);
    const [formData, setFormData] = useState();
    const [modal, setModal] = useState(false);
    if (selectedFilter && !(filters === null || filters === void 0 ? void 0 : filters.find(f => f.name === selectedFilter))) {
        if (filters === null || filters === void 0 ? void 0 : filters.length) {
            setSelectedFilter(filters[0].name);
        }
        else {
            setSelectedFilter(null);
        }
    }
    function setPreset(val) {
        if (val === 'none') {
            SourceFiltersService.actions.removePresetFilter(sourceId);
        }
        else {
            SourceFiltersService.actions.addPresetFilter(sourceId, val);
        }
    }
    function loadFormData(filterName) {
        if (selectedFilter) {
            setFormData(SourceFiltersService.getPropertiesFormData(sourceId, filterName));
        }
    }
    useEffect(() => {
        if (!selectedFilter)
            return;
        loadFormData(selectedFilter);
        const subscription = SourceFiltersService.filterUpdated.subscribe(filter => {
            if (filter.name === selectedFilter) {
                loadFormData(selectedFilter);
            }
        });
        return () => subscription.unsubscribe();
    }, [sourceId, selectedFilter]);
    useEffect(() => {
        const subscription = SourcesService.sourceRemoved.subscribe(s => {
            if (s.sourceId === sourceId) {
                WindowsService.actions.closeChildWindow();
            }
        });
        return () => subscription.unsubscribe();
    }, [sourceId]);
    const addFilterKey = '__AddNewFilter';
    return (<ModalLayout fixedChild={modal ? <div /> : <Display sourceId={sourceId}/>} bodyStyle={{ padding: 0 }}>
      <div style={{ display: 'flex', borderTop: '1px solid var(--border)', height: '100%' }} className={widgetsCss.widgetLayout}>
        <div style={{
            width: 270,
            borderRight: '1px solid var(--border)',
            height: '100%',
            background: 'var(--section)',
            display: 'flex',
            flexDirection: 'column',
        }}>
          {isVisual && (<div style={{ padding: '20px 20px 0' }}>
              <Form layout="vertical">
                <ListInput label="Visual Preset" options={SourceFiltersService.views.presetFilterOptionsReact} value={presetValue} onChange={setPreset} allowClear={false}></ListInput>
              </Form>
            </div>)}
          <Menu theme="dark" selectable={false} onClick={() => setModal(true)}>
            {isVisual && <Menu.Divider />}
            <Menu.Item key={addFilterKey}>
              <i className="icon-add" style={{ marginRight: 8 }}/>
              Add Filter
            </Menu.Item>
            <Menu.Divider />
          </Menu>
          <Scrollable style={{ flexGrow: 1 }}>
            <ReactSortable list={filters === null || filters === void 0 ? void 0 : filters.map(f => {
            return { id: f.name };
        })} setList={() => { }} onEnd={e => {
            if (!filters)
                return;
            const filterName = filters[e.oldIndex].name;
            EditorCommandsService.executeCommand('ReorderFiltersCommand', sourceId, filterName, e.newIndex - e.oldIndex);
        }} tag={FilterMenuContainer} animation={200}>
              {filters === null || filters === void 0 ? void 0 : filters.map(filter => {
            return (<li key={filter.name} className={cx(css.filterMenuItem, 'ant-menu-item', {
                    ['ant-menu-item-selected']: filter.name === selectedFilter,
                })} onClick={() => setSelectedFilter(filter.name)}>
                    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                      <span style={{
                    flexGrow: 1,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                }}>
                        {filter.name}
                      </span>
                      <i className={`${filter.visible ? 'icon-view' : 'icon-hide'} icon-button icon-button--lg`} onClick={e => {
                    e.stopPropagation();
                    EditorCommandsService.actions.executeCommand('ToggleFilterCommand', sourceId, filter.name);
                }}/>
                      <i className="icon-trash icon-button icon-button--lg" onClick={e => {
                    e.stopPropagation();
                    EditorCommandsService.actions.executeCommand('RemoveFilterCommand', sourceId, filter.name);
                }}/>
                    </div>
                  </li>);
        })}
            </ReactSortable>
          </Scrollable>
        </div>
        <div style={{ flexGrow: 1 }}>
          <Scrollable style={{ height: '100%' }}>
            {selectedFilter && formData && !!formData.length && (<ObsForm value={formData} onChange={newData => {
                EditorCommandsService.actions.executeCommand('EditFilterPropertiesCommand', sourceId, selectedFilter, newData);
            }} layout="horizontal" style={{ padding: 20 }} key={selectedFilter}/>)}
            {selectedFilter && !(formData === null || formData === void 0 ? void 0 : formData.length) && (<div style={{ padding: 20 }}>{$t('No settings are available for this filter')}</div>)}
          </Scrollable>
        </div>
      </div>
      <Modal footer={null} visible={modal} onCancel={() => setModal(false)} getContainer={false}>
        <CreateFilterForm sourceId={sourceId} onSubmit={name => {
            setModal(false);
            setSelectedFilter(name);
        }}/>
      </Modal>
    </ModalLayout>);
}
function CreateFilterForm(p) {
    const { SourceFiltersService, EditorCommandsService } = Services;
    const types = SourceFiltersService.views.getTypesForSource(p.sourceId).map(t => {
        return {
            value: t.type,
            label: t.description,
        };
    });
    const [type, setTypeState] = useState(types[0].value);
    const [name, setName] = useState(SourceFiltersService.views.suggestName(p.sourceId, types[0].label));
    const form = useForm();
    function setType(type) {
        var _a;
        setName(SourceFiltersService.views.suggestName(p.sourceId, (_a = types.find(t => t.value === type)) === null || _a === void 0 ? void 0 : _a.label));
        setTypeState(type);
    }
    function submit() {
        EditorCommandsService.actions.return
            .executeCommand('AddFilterCommand', p.sourceId, type, name)
            .then(() => {
            p.onSubmit(name);
        });
    }
    function uniqueNameValidator(rule, value, callback) {
        const suggested = SourceFiltersService.views.suggestName(p.sourceId, value);
        if (value === suggested) {
            callback();
        }
        else {
            callback($t('That name is already taken'));
        }
    }
    return (<>
      <h2>Add New Filter</h2>
      <Form onFinish={submit} form={form} name="addFilterForm">
        <ListInput value={type} onChange={v => setType(v)} options={types} label={$t('Filter type')} name="filterType"/>
        <TextInput value={name} onChange={v => setName(v)} label={$t('Filter name')} rules={[
            { required: true },
            { type: 'string', min: 1 },
            { validator: uniqueNameValidator },
        ]} uncontrolled={false} name="filterName"/>
        <div style={{ textAlign: 'right' }}>
          <Button type="primary" htmlType="submit">
            {$t('Add')}
          </Button>
        </div>
      </Form>
    </>);
}
//# sourceMappingURL=SourceFilters.jsx.map