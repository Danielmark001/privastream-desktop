var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import React, { useEffect, useState } from 'react';
import { Layout, Tooltip } from 'antd';
import Fuse from 'fuse.js';
import moment from 'moment';
import cx from 'classnames';
import { ModalLayout } from 'components-react/shared/ModalLayout';
import { Services } from 'components-react/service-provider';
import { confirmAsync, promptAsync } from 'components-react/modals';
import Scrollable from 'components-react/shared/Scrollable';
import { $t } from 'services/i18n';
import { getOS, OS } from 'util/operating-systems';
import styles from './ManageSceneCollections.m.less';
import { TextInput } from 'components-react/shared/inputs';
import { useVuex } from 'components-react/hooks';
import Translate from 'components-react/shared/Translate';
import UltraIcon from 'components-react/shared/UltraIcon';
import ButtonHighlighted from 'components-react/shared/ButtonHighlighted';
import * as remote from '@electron/remote';
const { Sider, Content } = Layout;
export default function ManageSceneCollections() {
    const { WindowsService, SceneCollectionsService, ObsImporterService, TwitchStudioImporterService, MagicLinkService, NavigationService, UsageStatisticsService, UserService, } = Services;
    const [query, setQuery] = useState('');
    const { collections, isLoggedIn, isPrime } = useVuex(() => ({
        collections: SceneCollectionsService.collections,
        isLoggedIn: UserService.views.isLoggedIn,
        isPrime: UserService.views.isPrime,
    }));
    function close() {
        SceneCollectionsService.stateService.flushManifestFile();
        WindowsService.actions.closeChildWindow();
    }
    function create() {
        return __awaiter(this, void 0, void 0, function* () {
            const name = yield promptAsync({ title: $t('Enter a Scene Collection Name'), closable: true }, SceneCollectionsService.suggestName('Scenes'));
            SceneCollectionsService.actions.create({ name });
        });
    }
    function importFromObs() {
        ObsImporterService.actions.import();
    }
    function importFromTwitch() {
        TwitchStudioImporterService.actions.import();
    }
    function filteredCollections() {
        const list = collections.sort((a, b) => (a.modified > b.modified ? -1 : 1));
        if (query) {
            const fuse = new Fuse(list, { shouldSort: true, keys: ['name'] });
            return fuse.search(query);
        }
        return list;
    }
    function goToThemes() {
        if (isLoggedIn) {
            NavigationService.actions.navigate('BrowseOverlays');
            WindowsService.actions.closeChildWindow();
        }
    }
    function upgradeToPrime() {
        UsageStatisticsService.actions.recordClick('ManageSceneCollections', 'prime');
        if (isLoggedIn) {
            MagicLinkService.linkToPrime('slobs-scene-collections');
        }
        else {
            remote.shell.openExternal('https://streamlabs.com/ultra?checkout=1&refl=slobs-scene-collections');
        }
    }
    return (React.createElement(ModalLayout, { onCancel: close },
        React.createElement(Layout, { style: { height: '100%' } },
            React.createElement(Sider, { width: 300 },
                React.createElement("div", null, $t('Your Scene Collections:')),
                React.createElement("div", { style: { width: '96%', marginTop: '8px', marginBottom: '8px' } },
                    React.createElement(TextInput, { placeholder: $t('Search Scene Collections'), onChange: setQuery, uncontrolled: false, prefix: React.createElement("i", { className: "icon-search" }), nowrap: true })),
                React.createElement(Scrollable, { style: { height: 'calc(100% - 48px)' } }, filteredCollections().map((collection, i) => (React.createElement(CollectionNode, { collection: collection, recentlyUpdated: i < 2, key: collection.id }))))),
            React.createElement(Content, { style: { paddingLeft: '16px' } },
                React.createElement("div", null, $t('Add New Scene Collection:')),
                React.createElement("div", { className: styles.buttonContainer },
                    React.createElement("button", { onClick: create, className: cx('button', styles.button) },
                        React.createElement("i", { className: "fa fa-solid fa-file" }),
                        React.createElement("strong", null, $t('Start Fresh')),
                        React.createElement("p", null, $t('Start fresh and build from scratch'))),
                    React.createElement("button", { disabled: !isLoggedIn, onClick: goToThemes, className: cx('button', styles.button) },
                        React.createElement("i", { className: "fa fa-solid fa-brush" }),
                        React.createElement("strong", null, $t('Overlays')),
                        React.createElement("p", null, isLoggedIn
                            ? $t('Choose a template from our overlay library')
                            : $t('Log in to choose a template from our overlay library'))),
                    !isPrime && (React.createElement("div", { onClick: upgradeToPrime, className: cx('button', styles.button, styles.lg) },
                        React.createElement("div", { className: styles.ultra },
                            React.createElement("strong", null, $t('Ultra')),
                            React.createElement("p", null,
                                React.createElement(Translate, { message: "Upgrade your stream with premium overlays with <ultra>Streamlabs Ultra</ultra>." },
                                    React.createElement("u", { slot: "ultra" }))),
                            React.createElement(ButtonHighlighted, { onClick: upgradeToPrime, filled: true, text: $t('Upgrade to Ultra'), icon: React.createElement(UltraIcon, { type: "simple", style: {
                                        color: 'var(--black)',
                                        fontSize: '12px',
                                        marginRight: '5px',
                                    } }), style: { margin: 'auto' } })))),
                    React.createElement("button", { onClick: importFromObs, className: cx('button', styles.button, { [styles.lg]: isPrime }) },
                        React.createElement("i", { className: "icon-cloud-backup" }),
                        React.createElement("strong", null, $t('Import from OBS')),
                        React.createElement("p", null, $t('Load existing scenes from OBS'))),
                    React.createElement("button", { onClick: importFromTwitch, className: cx('button', styles.button, { [styles.lg]: isPrime }) },
                        React.createElement("i", { className: "icon-cloud-backup" }),
                        React.createElement("strong", null, isPrime ? $t('Import from Twitch Studio') : $t('Import from Twitch')),
                        React.createElement("p", null, $t('Load existing scenes from Twitch Studio'))))))));
}
function CollectionNode(p) {
    var _a;
    const { SceneCollectionsService } = Services;
    const [duplicating, setDuplicating] = useState(false);
    const modified = moment(p.collection.modified).fromNow();
    const isActive = p.collection.id === ((_a = SceneCollectionsService.activeCollection) === null || _a === void 0 ? void 0 : _a.id);
    useEffect(onNeedsRenamedChanged, [p.collection.needsRename]);
    function onNeedsRenamedChanged() {
        if (p.collection.needsRename)
            rename();
    }
    function makeActive() {
        return __awaiter(this, void 0, void 0, function* () {
            if (p.collection.operatingSystem !== getOS())
                return;
            SceneCollectionsService.actions.load(p.collection.id);
        });
    }
    function duplicate() {
        setDuplicating(true);
        setTimeout(() => {
            SceneCollectionsService.actions.return
                .duplicate(p.collection.name, p.collection.id)
                .finally(() => setDuplicating(false));
        }, 500);
    }
    function rename() {
        return __awaiter(this, void 0, void 0, function* () {
            const newName = yield promptAsync({ title: $t('Enter a Scene Collection Name'), closable: true }, p.collection.name);
            SceneCollectionsService.actions.rename(newName, p.collection.id);
        });
    }
    function remove() {
        return __awaiter(this, void 0, void 0, function* () {
            const deleteConfirmed = yield confirmAsync($t('Are you sure you want to remove %{collectionName}?', {
                collectionName: p.collection.name,
            }));
            if (deleteConfirmed)
                SceneCollectionsService.actions.delete(p.collection.id);
        });
    }
    return (React.createElement("div", { onDoubleClick: makeActive, className: cx(styles.collectionNode, { [styles.active]: isActive }) },
        React.createElement("span", null,
            React.createElement("i", { className: cx('fab', p.collection.operatingSystem === OS.Windows ? 'fa-windows' : 'fa-apple') }),
            p.collection.name),
        p.recentlyUpdated && React.createElement("span", { className: styles.whisper },
            "Updated ",
            modified),
        React.createElement("div", { className: styles.editIcons },
            React.createElement(Tooltip, { title: $t('Rename') },
                React.createElement("i", { className: "icon-edit", onClick: rename })),
            !duplicating && (React.createElement(Tooltip, { title: $t('Duplicate') },
                React.createElement("i", { className: "icon-copy", onClick: duplicate }))),
            duplicating && React.createElement("i", { className: "fa fa-spinner fa-pulse" }),
            React.createElement(Tooltip, { title: $t('Delete') },
                React.createElement("i", { className: "icon-trash", onClick: remove })))));
}
//# sourceMappingURL=ManageSceneCollections.js.map