var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import React from 'react';
import cx from 'classnames';
import { Tooltip } from 'antd';
import { Services } from 'components-react/service-provider';
import { useVuex } from 'components-react/hooks';
import { ListInput } from 'components-react/shared/inputs';
import { ELayoutElement } from 'services/layout';
import { $t } from 'services/i18n';
import styles from './LayoutEditor.m.less';
import { useLayoutEditor } from './hooks';
import Form from '../../shared/inputs/Form';
export default function TopBar() {
    const { LayoutService, NavigationService, SideNavService } = Services;
    const { slottedElements, browserUrl, currentLayout, setShowModal, setCurrentTab, currentTab, } = useLayoutEditor();
    const { tabOptions } = useVuex(() => ({
        tabOptions: Object.keys(LayoutService.state.tabs).map(tab => ({
            value: tab,
            label: LayoutService.state.tabs[tab].name,
        })),
    }));
    function removeCurrentTab() {
        return __awaiter(this, void 0, void 0, function* () {
            if (currentTab === 'default')
                return;
            yield LayoutService.actions.return.removeCurrentTab();
            setCurrentTab('default');
        });
    }
    function save() {
        return __awaiter(this, void 0, void 0, function* () {
            if (currentLayout !== LayoutService.views.currentTab.currentLayout) {
                yield LayoutService.actions.return.changeLayout(currentLayout);
            }
            yield LayoutService.actions.return.setSlots(slottedElements);
            if (browserUrl && slottedElements[ELayoutElement.Browser]) {
                yield LayoutService.actions.return.setUrl(browserUrl);
            }
            SideNavService.actions.setCurrentMenuItem(LayoutService.state.currentTab);
            NavigationService.actions.navigate('Studio');
        });
    }
    return (React.createElement(Form, { className: styles.topBar },
        React.createElement("img", { className: styles.arrow, src: require('../../../../media/images/chalk-arrow.png') }),
        React.createElement("button", { className: "button button--action", style: { margin: '0 16px' }, onClick: () => setShowModal(true) }, $t('Add Tab')),
        React.createElement(ListInput, { label: "", style: { width: '150px', marginBottom: 0 }, value: currentTab, onChange: setCurrentTab, options: tabOptions, tooltip: { title: $t('Current Tab'), placement: 'bottom' } }),
        currentTab !== 'default' && (React.createElement(Tooltip, { title: $t('Delete Current Tab'), placement: "bottom" },
            React.createElement("button", { className: cx('button button--warn', styles.removeButton), onClick: removeCurrentTab },
                React.createElement("i", { className: "icon-trash" })))),
        React.createElement("button", { className: "button button--action", onClick: save }, $t('Save Changes'))));
}
//# sourceMappingURL=TopBar.js.map