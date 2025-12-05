import cx from 'classnames';
import path from 'path';
import fs from 'fs';
import { ModalLayout } from '../shared/ModalLayout';
import { $t } from '../../services/i18n';
import React, { useEffect, useState } from 'react';
import { Services } from '../service-provider';
import { FileInput } from '../shared/inputs';
import Scrollable from '../shared/Scrollable';
import styles from './IconLibraryProperties.m.less';
import { useChildWindowParams } from 'components-react/hooks';
export default () => {
    const { SourcesService, WindowsService, CustomizationService } = Services;
    const sourceId = useChildWindowParams('sourceId');
    const source = SourcesService.views.getSource(sourceId);
    const [folderPath, setFolderPath] = useState('');
    const [folderImages, setFolderImages] = useState([]);
    const [selectedIcon, setSelectedIcon] = useState('');
    const [errorState, setErrorState] = useState(false);
    useEffect(lifecycle, []);
    function lifecycle() {
        if (source) {
            const settings = source.getPropertiesManagerSettings();
            if (settings.folder) {
                const { folder, activeIcon } = settings;
                setFolderPath(folder);
                fs.readdir(folder, (err, files) => {
                    if (err)
                        return setErrorState(true);
                    setFolderImages(files.map((file) => path.join(folder, file)));
                });
                setSelectedIcon(activeIcon);
            }
        }
    }
    function selectFolder(folder) {
        if (!source)
            return;
        setFolderPath(folder);
        fs.readdir(folder, (err, files) => {
            if (err)
                return setErrorState(true);
            setFolderImages(files.map((file) => path.join(folder, file)));
            const activeIconPath = path.join(folder, files[0]);
            selectIcon(activeIconPath);
            source.setPropertiesManagerSettings({
                folder,
                activeIcon: activeIconPath,
            });
        });
    }
    function selectIcon(iconPath) {
        if (!source)
            return;
        setSelectedIcon(iconPath);
        source.setPropertiesManagerSettings({ activeIcon: iconPath });
    }
    const filters = [{ name: 'Images', extensions: ['jpg', 'png', 'gif'] }];
    function PreviewImage() {
        if (!selectedIcon)
            return React.createElement("div", null);
        return React.createElement(ImageCell, { path: selectedIcon, isSelected: false, large: true, handleClick: () => { } });
    }
    return (React.createElement(ModalLayout, { fixedChild: React.createElement(PreviewImage, null), onOk: () => WindowsService.closeChildWindow() },
        React.createElement("div", { style: { display: 'flex', flexDirection: 'column', height: '100%' } },
            CustomizationService.state.designerMode && (React.createElement(FileInput, { onChange: selectFolder, value: folderPath, directory: true, filters: filters })),
            React.createElement(Scrollable, { snapToWindowEdge: true, isResizable: false, style: { height: '100%' } },
                React.createElement("div", { className: styles.cellContainer }, errorState ? (React.createElement("div", null, $t('An error has occured, please try re-opening this window'))) : (folderImages.map(image => (React.createElement(ImageCell, { path: image, isSelected: image === selectedIcon, handleClick: selectIcon, key: image })))))))));
};
const ImageCell = (p) => (React.createElement("div", { className: cx(styles.imageCell, {
        [styles.selected]: p.isSelected,
        [styles.large]: p.large,
    }), onClick: () => p.handleClick(p.path) },
    React.createElement("img", { src: p.path })));
//# sourceMappingURL=IconLibraryProperties.js.map