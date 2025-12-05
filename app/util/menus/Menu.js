import * as remote from '@electron/remote';
export class Menu {
    constructor() {
        this.menu = new remote.Menu();
    }
    popup(opts) {
        if (opts) {
            this.menu.popup(opts);
        }
        else {
            this.menu.popup({ window: remote.getCurrentWindow() });
        }
    }
    append(options) {
        this.menu.append(new remote.MenuItem(options));
    }
    destroy() {
        this.menu.items.forEach((item) => {
            if (item.submenu && item.submenu.destroy)
                item.submenu.destroy();
        });
        this.menu.destroy();
    }
}
//# sourceMappingURL=Menu.js.map