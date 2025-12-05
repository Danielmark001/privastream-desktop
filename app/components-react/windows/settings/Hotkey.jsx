import React, { useState, useEffect } from 'react';
import cx from 'classnames';
import styles from './Hotkey.m.less';
import HotkeyBinding from 'components-react/shared/HotkeyBinding';
function createBindingWithKey(binding) {
    return {
        binding,
        key: Math.random().toString(36).substring(2, 15),
    };
}
function getBlankBinding() {
    return {
        key: '',
        modifiers: {
            alt: false,
            ctrl: false,
            shift: false,
            meta: false,
        },
    };
}
function addEmptyBindingAt(index) {
    return (bindings) => {
        const newBindings = [...bindings];
        newBindings.splice(index + 1, 0, createBindingWithKey(getBlankBinding()));
        return newBindings;
    };
}
function removeBindingAt(index) {
    return (bindings) => {
        const newBindings = [...bindings];
        if (newBindings.length === 1) {
            newBindings[0].binding = getBlankBinding();
        }
        else {
            newBindings.splice(index, 1);
        }
        return newBindings;
    };
}
function setBindingAtIndex(index, binding) {
    return (bindings) => {
        const newBindings = [...bindings];
        newBindings.splice(index, 1, createBindingWithKey(binding));
        return newBindings;
    };
}
export default function Hotkey(props) {
    const { hotkey } = props;
    const [bindings, setBindings] = useState(() => {
        const initialBindings = hotkey.bindings.length ? hotkey.bindings : [getBlankBinding()];
        return initialBindings.map(createBindingWithKey);
    });
    function addBinding(index) {
        return setBindings(addEmptyBindingAt(index));
    }
    function removeBinding(index) {
        return setBindings(removeBindingAt(index));
    }
    useEffect(() => {
        hotkey.bindings = bindings.map(b => b.binding);
    }, [bindings]);
    function HotkeyBindings({ bindings }) {
        const setBinding = (index, binding) => {
            setBindings(setBindingAtIndex(index, binding)(bindings));
        };
        return (<div className={styles.hotkeyBindings}>
        {bindings.map((binding, index) => (<div key={binding.key} className={styles.hotkeyBinding}>
            <HotkeyBinding hotkey={hotkey} binding={binding.binding} onBind={(binding) => {
                    setBinding(index, binding);
                }}/>
            <div className={styles.hotkeyControls}>
              <i data-testid="add-binding" className={cx(styles.hotkeyControl, 'fa', 'fa-plus')} onClick={() => addBinding(index)}/>
              <i data-testid="remove-binding" className={cx(styles.hotkeyControl, 'fa', 'fa-minus')} onClick={() => removeBinding(index)}/>
            </div>
          </div>))}
      </div>);
    }
    const description = hotkey.description || '';
    const testId = description.replace(/\s+/, '_');
    return (<div className={styles.hotkey} data-testid={testId}>
      <HotkeyBindings bindings={bindings}/>
    </div>);
}
//# sourceMappingURL=Hotkey.jsx.map