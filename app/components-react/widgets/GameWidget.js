import React from 'react';
import { useWidget, WidgetModule } from './common/useWidget';
import { WidgetLayout } from './common/WidgetLayout';
import { $t } from 'services/i18n';
import { metadata } from 'components-react/shared/inputs/metadata';
import { TextInput, SliderInput, ListInput } from 'components-react/shared/inputs';
import Form from 'components-react/shared/inputs/Form';
import componentMap from './games';
import { Menu } from 'antd';
function gameOption(key) {
    const optionTable = {
        'tic-tac-toe': $t('Tic Tac Toe'),
        'chat-word': $t('Chat Word'),
    };
    return { label: optionTable[key], value: key };
}
export function GameWidget() {
    var _a;
    const { isLoading, bind, selectedTab, setSelectedTab, settings } = useGameWidget();
    const availableGames = (_a = settings.available_games) === null || _a === void 0 ? void 0 : _a.map(gameOption);
    return (React.createElement(WidgetLayout, null,
        React.createElement(Menu, { onClick: e => setSelectedTab(e.key), selectedKeys: [selectedTab] },
            React.createElement(Menu.Item, { key: "general" }, $t('General Settings')),
            React.createElement(Menu.Item, { key: "game" }, $t('Game Settings'))),
        React.createElement(Form, null,
            !isLoading && selectedTab === 'general' && (React.createElement(React.Fragment, null,
                React.createElement(ListInput, Object.assign({ label: $t('Current Game') }, bind.current_game, { options: availableGames })),
                React.createElement(SliderInput, Object.assign({ label: $t('Chat Decision Time'), tooltip: {
                        title: $t("The duration in seconds to collect chat's responses before passing them to the game"),
                        placement: 'bottom',
                    } }, bind.decision_poll_timer, metadata.seconds({ min: 3000, max: 15000 }))),
                React.createElement(TextInput, Object.assign({ label: $t('Trigger Command'), tooltip: $t('Command used by the chat to provide their response') }, bind.trigger_command)),
                React.createElement(TextInput, Object.assign({ label: $t('No Input Recieved'), tooltip: $t("Message displayed to let the chat know they didn't provide any input") }, bind.no_input_received_message)),
                React.createElement(TextInput, Object.assign({ label: $t('Restarting Game'), tooltip: $t('Message displayed to let the chat know the game is restarting') }, bind.restarting_game_message)))),
            !isLoading && selectedTab === 'game' && React.createElement(GameOptions, { game: settings.current_game }))));
}
export class GameWidgetModule extends WidgetModule {
}
function useGameWidget() {
    return useWidget();
}
function GameOptions(p) {
    const { settings, updateSettings } = useGameWidget();
    function updateGameOption(key) {
        return (value) => {
            updateSettings({ game_options: { [p.game]: { [key]: value } } });
        };
    }
    const GameSettings = componentMap[p.game];
    return (React.createElement(GameSettings, { gameSettings: settings.game_options[p.game], updateGameOption: updateGameOption }));
}
//# sourceMappingURL=GameWidget.js.map