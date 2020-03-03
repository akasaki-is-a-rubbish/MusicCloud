import { Dialog, ButtonView, View } from "./viewlib";
import { I, i18n } from "./I18n";
import { ui } from "./UI";

export var settingsUI = new class {
    openUI() {
        new SettingsDialog().show();
    }
};

class SettingsDialog extends Dialog {
    btnSwitchTheme = new ButtonView({ type: 'big' });
    btnSwitchLang = new ButtonView({ type: 'big' });
    bottom: View;
    constructor() {
        super();
        this.addContent(this.btnSwitchTheme);
        this.btnSwitchTheme.onclick = () => {
            ui.theme.set((ui.theme.current == 'light') ? 'dark' : 'light');
            this.updateDom();
        };
        this.addContent(this.btnSwitchLang);
        this.btnSwitchLang.onclick = () => {
            var origUsingLang = ui.lang.curLang;
            var curlang = ui.lang.siLang.data;
            var langs = ['', ...ui.lang.availableLangs];
            curlang = langs[(langs.indexOf(curlang) + 1) % langs.length];
            ui.lang.siLang.set(curlang);
            if (origUsingLang != ui.lang.curLang)
                this.showReload();
            this.updateDom();
        };
        this.addContent(this.bottom = new View({
            tag: 'div',
            style: 'margin: 5px 0;',
            child: [
                { tag: 'span', text: 'MusicCloud' },
                {
                    tag: 'a', style: 'float: right; color: inherit;',
                    text: () => I`Source code`, href: 'https://github.com/lideming/MusicCloud',
                    target: '_blank'
                },
            ]
        }));
    }
    reloadShown = false;
    showReload() {
        if (this.reloadShown) return;
        this.reloadShown = true;
        this.content.addView(new View({
            tag: 'div.clickable',
            style: 'color: var(--color-primary); text-align: center; margin: 10px 0;',
            text: () => I`Reload to fully apply changes`,
            onclick: () => {
                window.location.reload();
            }
        }), this.bottom.position);
    }
    updateDom() {
        this.title = I`Settings`;
        super.updateDom();
        this.btnSwitchTheme.text = I`Color theme: ${i18n.get('colortheme_' + ui.theme.current)}`;
        this.btnSwitchLang.text = I`Language: ${I`English`}`;
        if (!ui.lang.siLang.data) this.btnSwitchLang.text += I` (auto-detected)`;
        this.content.updateChildrenDom();
    }
}