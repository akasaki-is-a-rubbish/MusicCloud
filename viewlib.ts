// file: viewlib.ts

type ViewArg = View | HTMLElement;

class View {
    constructor(dom?: BuildDomExpr) {
        if (dom) this._dom = utils.buildDOM(dom) as HTMLElement;
    }
    protected _dom: HTMLElement;
    public get dom() {
        this.ensureDom();
        return this._dom;
    }
    public ensureDom() {
        if (!this._dom) {
            this._dom = utils.buildDOM(this.createDom()) as HTMLElement;
            this.postCreateDom(this._dom);
        }
    }
    protected createDom(): BuildDomExpr {
        return document.createElement('div');
    }
    /** Will be called when the dom is created */
    protected postCreateDom(element: HTMLElement) {
    }
    toggleClass(clsName: string, force?: boolean) {
        utils.toggleClass(this.dom, clsName, force);
    }
    static getDOM(view: HTMLElement | View): HTMLElement {
        if (!view) throw new Error('view is undefined or null');
        if (view instanceof View) return view.dom;
        if (view instanceof HTMLElement) return view;
        console.error('getDOM(): unknown type: ', view);
        throw new Error('Cannot get DOM: unknown type');
    }
}

/** DragManager is used to help exchange infomation between views */
var dragManager = new class DragManager {
    /** The item being draging */
    _currentItem: any;
    get currentItem() { return this._currentItem; };
    start(item: any) {
        this._currentItem = item;
    }
    end(item: any) {
        this._currentItem = null;
    }
};

abstract class ListViewItem extends View {
    _listView: ListView;
    _position: number;
    get listview() { return this._listView; }
    get position() { return this._position; }

    get dragData() { return this.dom.textContent; }

    protected postCreateDom(element: HTMLElement) {
        super.postCreateDom(element);
        this.dom.addEventListener('click', () => {
            this._listView?.onItemClicked?.(this);
        });
        this.dom.addEventListener('dragstart', (ev) => {
            if (!this._listView?.dragging) return;
            dragManager.start(this);
            ev.dataTransfer.setData('text/plain', this.dragData);
        });
        this.dom.addEventListener('dragend', (ev) => {
            dragManager.end(this);
            ev.preventDefault();
        });
        this.dom.addEventListener('dragover', (ev) => {
            var item = dragManager.currentItem;
            if (item instanceof ListViewItem && item.listview === this.listview) {
                ev.preventDefault();
                ev.dataTransfer.dropEffect = 'move';
            }
        });
        this.dom.addEventListener('drop', (ev) => {
            var item = dragManager.currentItem;
            if (item instanceof ListViewItem && item.listview === this.listview) {
                ev.preventDefault();
                if (item === this) return;
                console.log('move pre', item.position, this.position);
                this.listview.move(item, this.position);
                console.log('move post', item.position, this.position);
            }
        });
    }
}

class ListView<T extends ListViewItem = ListViewItem> extends View implements Iterable<T> {
    private items: Array<T> = [];
    onItemClicked: (item: T) => void;
    /**
     * Allow user to drag an item.
     */
    dragging = false;
    /**
     * Allow user to drag an item and change its position.
     */
    moveByDragging = false;
    onItemMoved: (item: T, from: number) => void;
    constructor(container?: BuildDomExpr) {
        super(container);
    }
    add(item: T, pos?: number) {
        if (item._listView) throw new Error('the item is already in a listview');
        item._listView = this;
        if (pos === undefined || pos >= this.items.length) {
            this.dom.appendChild(item.dom);
            item._position = this.items.length;
            this.items.push(item);
        } else {
            this.dom.insertBefore(item.dom, this.get(pos).dom);
            this.items.splice(pos, 0, item);
            for (let i = pos; i < this.items.length; i++) {
                this.items[i]._position = i;
            }
        }
        if (this.dragging) item.dom.draggable = true;
    }
    remove(item: T | number) {
        item = this._ensureItem(item);
        item.dom.remove();
        this.items.splice(item._position, 1);
        var pos = item.position;
        item._listView = item._position = null;
        for (let i = pos; i < this.items.length; i++) {
            this.items[i]._position = i;
        }
    }
    move(item: T | number, newpos: number) {
        item = this._ensureItem(item);
        this.remove(item);
        this.add(item, newpos);
        this.onItemMoved(item, item.position);
    }
    clear() {
        utils.clearChilds(this.dom);
        this.items = [];
    }
    [Symbol.iterator]() { return this.items[Symbol.iterator](); }
    get length() { return this.items.length; }
    get(idx: number) {
        return this.items[idx];
    }
    map<TRet>(func: (lvi: T) => TRet) { return utils.arrayMap(this, func); }
    private _ensureItem(item: T | number) {
        if (typeof item === 'number') item = this.get(item);
        else if (!item) throw new Error('item is null or undefined.');
        else if (item._listView !== this) throw new Error('the item is not in this listview.');
        return item;
    }
    ReplaceChild(dom: ViewArg) {
        this.clear();
        this.dom.appendChild(View.getDOM(dom));
    }
}

type SectionActionOptions = { text: string, onclick: Action; };

class Section extends View {
    titleDom: HTMLSpanElement;
    constructor(arg?: { title?: string, content?: ViewArg, actions?: SectionActionOptions[]; }) {
        super();
        this.ensureDom();
        if (arg) {
            if (arg.title) this.setTitle(arg.title);
            if (arg.content) this.setContent(arg.content);
            if (arg.actions) arg.actions.forEach(x => this.addAction(x));
        }
    }
    createDom() {
        return {
            tag: 'div.section',
            child: [
                {
                    tag: 'div.section-header',
                    child: [
                        this.titleDom = utils.buildDOM({ tag: 'span.section-title' }) as HTMLSpanElement
                    ]
                }
                // content element(s) here
            ]
        };
    }
    setTitle(text: string) {
        this.titleDom.textContent = text;
    }
    setContent(view: ViewArg) {
        var dom = this.dom;
        var firstChild = dom.firstChild;
        while (dom.lastChild !== firstChild) dom.removeChild(dom.lastChild);
        dom.appendChild(View.getDOM(view));
    }
    addAction(arg: SectionActionOptions) {
        this.titleDom.parentElement.appendChild(utils.buildDOM({
            tag: 'div.section-action.clickable',
            textContent: arg.text,
            onclick: arg.onclick
        }));
    }
}

type LoadingIndicatorState = 'normal' | 'running' | 'error';

class LoadingIndicator extends View {
    constructor(arg?: { status?: LoadingIndicatorState, content?: string, onclick?: Action<MouseEvent>; }) {
        super();
        this.reset();
        if (arg) {
            if (arg.status) this.state = arg.status;
            if (arg.content) this.content = arg.content;
            if (arg.onclick) this.onclick = arg.onclick;
        }
    }
    private _status: LoadingIndicatorState = 'running';
    get state() { return this._status; }
    set state(val: LoadingIndicatorState) {
        this._status = val;
        this.toggleClass('running', val == 'running');
        this.toggleClass('error', val == 'error');
    }
    private _text: string;
    get content() { return this._text; }
    set content(val: string) { this._text = val; this.dom.textContent = val; }
    onclick: (e: MouseEvent) => void;
    reset() {
        this.state = 'running';
        this.content = 'Loading...';
        this.onclick = null;
    }
    error(err, retry: Action) {
        this.state = 'error';
        this.content = 'Oh no! Something just goes wrong:\n' + err;
        if (retry) {
            this.content += '\n[Click here to retry]';
        }
        this.onclick = retry as any;
    }
    createDom() {
        this._dom = utils.buildDOM({
            tag: 'div.loading-indicator',
            onclick: (e) => this.onclick && this.onclick(e)
        }) as HTMLElement;
        return this._dom;
    }
}

// TODO: class ContextMenu
