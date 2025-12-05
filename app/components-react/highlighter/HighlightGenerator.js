import React, { useEffect, useRef, useState } from 'react';
import { Button, Select, Checkbox } from 'antd';
import { DownOutlined } from '@ant-design/icons';
import styles from './HighlightGenerator.m.less';
import { formatSecondsToHMS } from './ClipPreview';
import { $t } from 'services/i18n';
import Translate from 'components-react/shared/Translate';
import { getEventConfig } from 'services/highlighter/models/game-config.models';
const { Option } = Select;
const selectStyles = {
    width: '220px',
    borderRadius: '8px',
};
const dropdownStyles = {
    borderRadius: '10px',
    padding: '4px 4px',
};
const checkboxStyles = {
    borderRadius: '8px',
    width: '100%',
};
export default function HighlightGenerator({ combinedClipsDuration, game, roundDetails, emitSetFilter, }) {
    const [selectedRounds, setSelectedRounds] = useState([0]);
    const [filterType, setFilterType] = useState('duration');
    const [targetDuration, setTargetDuration] = useState(combinedClipsDuration + 100);
    const options = [
        {
            value: 1,
            label: $t('%{duration} minute', { duration: 1 }),
        },
        ...[2, 5, 10, 12, 15, 20, 30].map(value => ({
            value,
            label: $t('%{duration} minutes', { duration: value }),
        })),
    ];
    const filteredOptions = options.filter(option => option.value * 60 <= combinedClipsDuration);
    const isFirstRender = useRef(true);
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }
        emitSetFilter({
            rounds: selectedRounds,
            targetDuration: filterType === 'duration' ? targetDuration * 60 : 9999,
            includeAllEvents: true,
        });
    }, [selectedRounds, filterType, targetDuration]);
    function roundDropdownDetails(roundDetails, game) {
        const eventTypeCounts = {};
        roundDetails.inputs.forEach(input => {
            const inputTypes = getEventConfig(game, input.type);
            if (inputTypes === null || inputTypes === void 0 ? void 0 : inputTypes.includeInDropdown) {
                if (eventTypeCounts[input.type]) {
                    eventTypeCounts[input.type] += 1;
                }
                else {
                    eventTypeCounts[input.type] = 1;
                }
            }
        });
        return (React.createElement("div", { style: { display: 'flex', flexDirection: 'column', gap: '8px' } },
            React.createElement("div", { style: { fontWeight: 'bold' } },
                "Round ",
                roundDetails.round,
                " "),
            React.createElement("div", { style: { display: 'flex', flexWrap: 'wrap', gap: '4px' } },
                Object.entries(eventTypeCounts).map(([type, count]) => (React.createElement("div", { className: styles.infoTag },
                    count,
                    getEventConfig(game, type).emoji))),
                React.createElement("div", { className: styles.infoTag }, `${roundDetails.hypeScore} 🔥`),
                React.createElement("div", { className: styles.infoTag }, `${formatSecondsToHMS(roundDetails.duration)}`))));
    }
    return (React.createElement("h3", { className: styles.wrapper, style: {
            color: '#FFFFFF',
            margin: 0,
            fontWeight: 400,
        } },
        "\uD83E\uDD16",
        ' ',
        React.createElement(Translate, { message: $t('Create highlight video of <roundSelect></roundSelect> with a duration of <minutesSelect></minutesSelect>'), renderSlots: {
                roundSelect: () => (React.createElement(Select, { style: selectStyles, mode: "multiple", value: selectedRounds, maxTagCount: 2, suffixIcon: React.createElement(DownOutlined, { style: { color: '#FFFFFF', fontSize: '12px' } }), tagRender: ({ value }) => (React.createElement("span", { className: styles.tag }, value === 0
                        ? $t('All Rounds')
                        : $t('Round %{roundNumber}', { roundNumber: value }))), dropdownStyle: dropdownStyles },
                    React.createElement("div", { key: "all-rounds", className: styles.option },
                        React.createElement(Checkbox, { style: checkboxStyles, checked: selectedRounds.includes(0), onChange: e => {
                                setSelectedRounds(e.target.checked ? [0] : []);
                            } }, $t('All Rounds'))),
                    roundDetails.map(roundDetails => (React.createElement("div", { key: 'in-wrapper-round' + roundDetails.round, className: styles.option },
                        React.createElement(Checkbox, { style: checkboxStyles, checked: selectedRounds.includes(roundDetails.round), onChange: e => {
                                if (e.target.checked) {
                                    const newSelection = [
                                        ...selectedRounds.filter(r => r !== 0),
                                        roundDetails.round,
                                    ];
                                    setSelectedRounds(newSelection);
                                }
                                else {
                                    const newSelection = selectedRounds.filter(r => r !== roundDetails.round);
                                    setSelectedRounds(newSelection.length === 0 ? [0] : newSelection);
                                }
                            } }, roundDropdownDetails(roundDetails, game))))))),
                minutesSelect: () => (React.createElement(Select, { style: { width: '116px' }, value: targetDuration, onChange: value => setTargetDuration(value), dropdownStyle: dropdownStyles },
                    filteredOptions.map(option => (React.createElement(Option, { key: option.value, value: option.value, className: styles.option }, option.label))),
                    React.createElement(Option, { value: combinedClipsDuration + 100, className: styles.option }, $t('unlimited')))),
            } }),
        React.createElement(Button, { type: "text", onClick: () => {
                setSelectedRounds([0]);
                setFilterType('duration');
                setTargetDuration(combinedClipsDuration + 100);
            }, icon: React.createElement("span", { style: { color: '#666666', fontSize: '20px' } }, "\u00D7"), className: styles.resetButton })));
}
//# sourceMappingURL=HighlightGenerator.js.map