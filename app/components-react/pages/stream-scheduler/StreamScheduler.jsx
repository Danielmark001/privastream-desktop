var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import React, { useEffect, useMemo } from 'react';
import moment from 'moment';
import css from './StreamScheduler.m.less';
import cx from 'classnames';
import { Button, Calendar, Modal, Row, Col, Spin } from 'antd';
import { YoutubeEditStreamInfo } from '../../windows/go-live/platforms/YoutubeEditStreamInfo';
import { $t } from '../../../services/i18n';
import FacebookEditStreamInfo from '../../windows/go-live/platforms/FacebookEditStreamInfo';
import { ListInput, TimeInput } from '../../shared/inputs';
import Form, { useForm } from '../../shared/inputs/Form';
import { confirmAsync } from '../../modals';
import { StreamSchedulerController, StreamSchedulerCtx, useStreamScheduler, } from './useStreamScheduler';
import Scrollable from '../../shared/Scrollable';
import { getDefined } from '../../../util/properties-type-guards';
export default function StreamSchedulerPage() {
    const controller = useMemo(() => new StreamSchedulerController(), []);
    return (<StreamSchedulerCtx.Provider value={controller}>
      <StreamScheduler />
    </StreamSchedulerCtx.Provider>);
}
function StreamScheduler() {
    const { store } = useStreamScheduler();
    const isEventsLoaded = store.useState(s => s.isEventsLoaded);
    return (<Scrollable className={cx(css.streamSchedulerPage)}>
      <Spin tip="Loading..." spinning={!isEventsLoaded}>
        <SchedulerCalendar />
      </Spin>
      <EventSettingsModal />
    </Scrollable>);
}
function SchedulerCalendar() {
    const { showEditEventModal, showNewEventModal, store } = useStreamScheduler();
    const { selectedPlatform, events } = store.useState(s => ({
        selectedPlatform: s.selectedPlatform,
        events: s.events,
    }));
    function dateCellRender(date) {
        const start = moment(date).startOf('day');
        const end = moment(date).endOf('day');
        const dayEvents = events
            .filter(ev => {
            return moment(ev.date).isBetween(start, end);
        })
            .sort((ev1, ev2) => ev1.date - ev2.date);
        return (<div data-role="day" onClick={() => showNewEventModal(selectedPlatform, date.valueOf())}>
        {dayEvents.map(renderEvent)}
      </div>);
    }
    function renderEvent(event) {
        const time = moment(event.date).format('hh:mma');
        return (<p key={event.id} title={event.title} className={cx({
                [css.event]: true,
                [css.eventFacebook]: event.platform === 'facebook',
                [css.eventYoutube]: event.platform === 'youtube',
            })} onClick={ev => {
                ev.stopPropagation();
                showEditEventModal(event.id);
            }}>
        <span className={css.eventTime}>{time}</span> &nbsp;
        <span className={css.eventTitle}>{event.title}</span>
      </p>);
    }
    function onCalendarClick(event) {
        const $td = event.target['closest']('td');
        if (!$td)
            return;
        $td.querySelector('[data-role="day"]')['click']();
    }
    const minDate = moment().subtract(12, 'month');
    const maxDate = moment().add(1, 'month');
    useEffect(() => {
        const $dayCells = document.querySelectorAll('.ant-picker-calendar-date-value');
        $dayCells.forEach(($cell) => ($cell.innerText = String(Number($cell.innerText))));
    });
    return (<div onClick={onCalendarClick}>
      <Calendar dateCellRender={dateCellRender} validRange={[minDate, maxDate]}/>
    </div>);
}
function EventSettingsModal() {
    const { submit, closeModal, setForm, getPlatformDisplayName, showNewEventModal, setTime, updatePlatform, platforms, isUpdateMode, store, } = useStreamScheduler();
    const { time, isModalVisible, isLoading, selectedPlatform, ytSettings, fbSettings, } = store.useState(s => ({
        time: s.time,
        isModalVisible: s.isModalVisible,
        isLoading: s.isLoading,
        selectedPlatform: s.selectedPlatform,
        ytSettings: getDefined(s.platformSettings.youtube),
        fbSettings: getDefined(s.platformSettings.facebook),
    }));
    const form = useForm();
    setForm(form);
    const canChangePlatform = !isUpdateMode;
    const formattedDate = moment(time).calendar();
    const title = isUpdateMode
        ? $t('Update Scheduled Stream for %{formattedDate}', { formattedDate })
        : $t('Schedule Stream for %{formattedDate}', { formattedDate });
    return (<Modal title={title} visible={isModalVisible} onOk={submit} onCancel={closeModal} afterClose={closeModal} destroyOnClose={true} footer={<ModalButtons />} getContainer={`.${css.streamSchedulerPage}`}>
      <Form form={form}>
        <Spin spinning={isLoading}>
          
          {canChangePlatform && (<>
              <ListInput label={$t('Platform')} name="platform" value={selectedPlatform} options={platforms.map(platform => ({
                value: platform,
                label: getPlatformDisplayName(platform),
            }))} onChange={platform => showNewEventModal(platform)}/>
              {selectedPlatform === 'facebook' && (<span className="whisper">
                  {$t('Please note that while you can schedule streams to Facebook, some will not appear on this calendar due to API limitations')}
                </span>)}
            </>)}

          
          <TimeInput name="time" label={$t('Time')} value={time} onChange={setTime}/>

          
          {selectedPlatform === 'youtube' && (<YoutubeEditStreamInfo layoutMode="singlePlatform" isUpdateMode={isUpdateMode} isScheduleMode={true} value={ytSettings} onChange={newSettings => updatePlatform('youtube', newSettings)}/>)}

          
          {selectedPlatform === 'facebook' && (<FacebookEditStreamInfo layoutMode="singlePlatform" isUpdateMode={isUpdateMode} isScheduleMode={true} value={fbSettings} onChange={newSettings => updatePlatform('facebook', newSettings)}/>)}
        </Spin>
      </Form>
    </Modal>);
}
function ModalButtons() {
    const controller = useStreamScheduler();
    const { selectedEvent, remove, submit, goLive, primaryPlatform, store } = controller;
    const { isLoading } = store.useState(s => ({
        isLoading: s.isLoading,
    }));
    const shouldShowSave = !!selectedEvent;
    const shouldShowSchedule = !selectedEvent;
    const shouldShowGoLive = selectedEvent &&
        selectedEvent.platform === primaryPlatform &&
        selectedEvent.status === 'scheduled';
    const shouldShowRemove = selectedEvent && selectedEvent.status === 'scheduled';
    function onDeleteClick() {
        return __awaiter(this, void 0, void 0, function* () {
            if (yield confirmAsync($t('Delete the event?')))
                remove();
        });
    }
    return (<Row>
      <Col flex={'50%'} style={{ textAlign: 'left' }}>
        
        {shouldShowRemove && (<Button danger onClick={onDeleteClick}>
            {$t('Delete')}
          </Button>)}
      </Col>
      <Col flex={'50%'}>
        
        {shouldShowGoLive && (<Button onClick={goLive} type="primary">
            {$t('Go Live')}
          </Button>)}

        
        {shouldShowSave && (<Button type="primary" onClick={submit} disabled={isLoading}>
            {$t('Save')}
          </Button>)}

        
        {shouldShowSchedule && (<Button type="primary" onClick={submit} disabled={isLoading}>
            {$t('Schedule')}
          </Button>)}
      </Col>
    </Row>);
}
//# sourceMappingURL=StreamScheduler.jsx.map