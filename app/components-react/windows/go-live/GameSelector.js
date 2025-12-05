var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import React, { useEffect } from 'react';
import { getPlatformService, } from '../../../services/platforms';
import { ListInput } from '../../shared/inputs';
import { $t } from '../../../services/i18n';
import { Services } from '../../service-provider';
import { injectState, useModule } from 'slap';
export default function GameSelector(p) {
    const { platform } = p;
    const platformService = getPlatformService(platform);
    const selectedGameId = platformService.state.settings.game;
    let selectedGameName = selectedGameId;
    const isTwitch = platform === 'twitch';
    const isTrovo = platform === 'trovo';
    const isTikTok = platform === 'tiktok';
    const isKick = platform === 'kick';
    if (isTrovo) {
        selectedGameName = Services.TrovoService.state.channelInfo.gameName;
    }
    if (isTikTok) {
        selectedGameName = Services.TikTokService.state.gameName;
    }
    if (isKick) {
        selectedGameName = Services.KickService.state.gameName;
    }
    const { isSearching, setIsSearching, games, setGames } = useModule(() => {
        const selectedGameOptions = isTikTok && selectedGameId.toLowerCase() !== Services.TikTokService.defaultGame.id
            ? [
                { label: selectedGameName, value: selectedGameId },
                {
                    label: Services.TikTokService.defaultGame.name,
                    value: Services.TikTokService.defaultGame.id,
                },
            ]
            : [{ label: selectedGameName, value: selectedGameId }];
        return {
            state: injectState({
                isSearching: false,
                games: selectedGameId ? selectedGameOptions : [],
            }),
        };
    });
    function fetchGames(query) {
        return platformService.searchGames(query);
    }
    useEffect(() => {
        loadImageForSelectedGame();
    }, []);
    function loadImageForSelectedGame() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!['twitch', 'trovo', 'kick'].includes(platform))
                return;
            if (!selectedGameName)
                return;
            const game = yield platformService.fetchGame(selectedGameName);
            if (!game || game.name !== selectedGameName)
                return;
            setGames(games.map(opt => (opt.value === selectedGameId ? Object.assign(Object.assign({}, opt), { image: game.image }) : opt)));
        });
    }
    function onSearch(searchString) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            if (searchString.length < 2 && platform !== 'tiktok')
                return;
            const games = (_b = (_a = (yield fetchGames(searchString))) === null || _a === void 0 ? void 0 : _a.map(g => ({
                value: ['trovo', 'tiktok', 'kick'].includes(platform) ? g.id : g.name,
                label: g.name,
                image: g === null || g === void 0 ? void 0 : g.image,
            }))) !== null && _b !== void 0 ? _b : [];
            setGames(games);
            setIsSearching(false);
        });
    }
    function onBeforeSearchHandler(searchString) {
        if (searchString.length < 2)
            return;
        setIsSearching(true);
    }
    function onSelect(searchString) {
        const game = games.find(game => game.label === searchString);
        if (isTikTok) {
            Services.TikTokService.actions.setGameName(searchString);
        }
        if (!game)
            return;
        setGames([game]);
    }
    const label = {
        twitch: $t('Twitch Category'),
        facebook: $t('Facebook Game'),
        trovo: $t('Trovo Category'),
        tiktok: $t('TikTok Category'),
        kick: $t('Kick Category'),
    }[platform];
    const filterOption = (input, option) => {
        var _a, _b;
        if (isTikTok) {
            return ((option === null || option === void 0 ? void 0 : option.label) === 'Other' ||
                ((_a = option === null || option === void 0 ? void 0 : option.label) !== null && _a !== void 0 ? _a : '').toLowerCase().includes(input.toLowerCase()));
        }
        return ((_b = option === null || option === void 0 ? void 0 : option.label) !== null && _b !== void 0 ? _b : '').toLowerCase().includes(input.toLowerCase());
    };
    return (React.createElement(ListInput, { label: label, name: `${p.platform}Game`, value: selectedGameId, extra: p.extra, onChange: p.onChange, placeholder: $t('Start typing to search'), options: games, showSearch: true, onSearch: onSearch, onSelect: (val, opts) => {
            onSelect(opts.labelrender);
        }, filterOption: filterOption, debounce: 500, required: isTwitch || isTrovo || isKick, hasImage: isTwitch || isTrovo || isKick, onBeforeSearch: onBeforeSearchHandler, imageSize: platformService.gameImageSize, loading: isSearching, notFoundContent: isSearching ? $t('Searching...') : $t('No matching game(s) found.'), allowClear: true, layout: p.layout, size: "large" }));
}
//# sourceMappingURL=GameSelector.js.map