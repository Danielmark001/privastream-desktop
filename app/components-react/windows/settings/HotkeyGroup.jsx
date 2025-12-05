import React, { useMemo, useState } from 'react';
import { Collapse } from 'antd';
import cx from 'classnames';
import Hotkey from './Hotkey';
import Tabs from 'components-react/shared/Tabs';
import { $t } from 'services/i18n';
const { Panel } = Collapse;
const getHotkeyUniqueId = (hotkey) => {
    return hotkey.actionName + hotkey.sceneId + hotkey.sceneItemId + hotkey.sourceId;
};
function Header({ title }) {
    return (<h2 className="section-title section-title--dropdown" style={{ display: 'inline-block', verticalAlign: '-2px' }}>
      {title}
    </h2>);
}
export default function HotkeyGroup(props) {
    const { hotkeys, title, isSearch, isDualOutputMode, isDualOutputScene, hasSceneHotkeys } = props;
    const isCollapsible = !!(title && !isSearch);
    const headerProps = { title };
    const [display, setDisplay] = useState('horizontal');
    const [expanded, setExpanded] = useState(false);
    const showTabs = hasSceneHotkeys && isDualOutputMode && isDualOutputScene && expanded;
    const renderedHotKeys = useMemo(() => {
        if (!hasSceneHotkeys)
            return hotkeys;
        if (isDualOutputMode && hasSceneHotkeys && expanded) {
            return hotkeys
                .filter(hotkey => (hotkey === null || hotkey === void 0 ? void 0 : hotkey.display) === display || (hotkey === null || hotkey === void 0 ? void 0 : hotkey.actionName) === 'SWITCH_TO_SCENE')
                .map(hotkey => hotkey);
        }
        else if (isDualOutputMode) {
            return hotkeys;
        }
        else {
            return hotkeys
                .filter(hotkey => {
                if (!(hotkey === null || hotkey === void 0 ? void 0 : hotkey.display) || ((hotkey === null || hotkey === void 0 ? void 0 : hotkey.display) && hotkey.display === 'horizontal')) {
                    return hotkey;
                }
            })
                .map(hotkey => hotkey);
        }
    }, [hotkeys, hasSceneHotkeys, isDualOutputMode, display, expanded]);
    const header = <Header {...headerProps}/>;
    const hotkeyContent = useMemo(() => (<div className={cx({ 'section-content--opened': !!title }, 'section-content')}>
        {renderedHotKeys.map(hotkey => (<div key={getHotkeyUniqueId(hotkey)} className={hasSceneHotkeys ? 'scene-hotkey' : undefined}>
            <Hotkey hotkey={hotkey}/>
          </div>))}
      </div>), [renderedHotKeys, display]);
    return (<div className="section">
      {!isCollapsible ? (hotkeyContent) : (<Collapse onChange={() => setExpanded(!expanded)} expandIcon={({ isActive }) => (<i className={cx('fa', 'section-title-icon', {
                    'fa-minus': isActive,
                    'fa-plus': !isActive,
                })}/>)}>
          <Panel header={header} key="1">
            {isDualOutputScene && showTabs && <Tabs onChange={setDisplay}/>}
            {isDualOutputMode &&
                !showTabs &&
                $t('This scene has not been converted for Dual Output. Please make the scene active to add vertical sources.')}
            {hotkeyContent}
          </Panel>
        </Collapse>)}
    </div>);
}
//# sourceMappingURL=HotkeyGroup.jsx.map