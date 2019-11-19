// TypeScript 3.7 is required.

// Why do we need to use React and Vue.js? ;)

/// <reference path="utils.ts" />
/// <reference path="apidef.d.ts" />


var ui = {
    bottomBar: new class {
        container: HTMLElement = document.getElementById("bottombar");
        btnPin: HTMLElement = document.getElementById('btnPin');
        private autoHide = true;
        setPinned(val?: boolean) {
            val = val ?? !this.autoHide;
            this.autoHide = val;
            utils.toggleClass(document.body, 'bottompinned', !val);
            this.btnPin.textContent = !val ? 'Pinned' : 'Pin';
            if (val) this.toggle(true);
        }
        toggle(state?: boolean) {
            utils.toggleClass(this.container, 'show', state);
        }
        init() {
            var bar = this.container;
            var hideTimer = new utils.Timer(() => {
                this.toggle(false);
            });
            bar.addEventListener('mouseenter', () => {
                hideTimer.tryCancel();
                this.toggle(true);
            });
            bar.addEventListener('mouseleave', () => {
                hideTimer.tryCancel();
                if (this.autoHide) hideTimer.timeout(200);
            });
            this.btnPin.addEventListener('click', () => this.setPinned());
        }
    },
    progressBar: new class {
        container = document.getElementById('progressbar');
        fill = document.getElementById('progressbar-fill');
        labelCur = document.getElementById('progressbar-label-cur');
        labelTotal = document.getElementById('progressbar-label-total');

        setProg(cur: number, total: number) {
            var prog = cur / total;
            prog = utils.numLimit(prog, 0, 1);
            this.fill.style.width = (prog * 100) + '%';
            this.labelCur.textContent = utils.formatTime(cur);
            this.labelTotal.textContent = utils.formatTime(total);
        }
        setProgressChangedCallback(cb: (percent: number) => void) {
            var call = (e) => { cb(utils.numLimit(e.offsetX / this.container.clientWidth, 0, 1)); }
            this.container.addEventListener('mousedown', (e) => {
                if (e.buttons == 1) call(e);
            });
            this.container.addEventListener('mousemove', (e) => {
                if (e.buttons == 1) call(e);
            });
        }
    },
    trackinfo: new class {
        element = document.getElementById('bottombar-trackinfo');
        setTrack(track: Track) {
            if (track) {
                utils.replaceChild(this.element, utils.buildDOM({
                    tag: 'span',
                    child: [
                        'Now Playing: ',
                        { tag: 'span.name', textContent: track.name },
                        { tag: 'span.artist', textContent: track.artist },
                    ]
                }));
            } else {
                this.element.textContent = "";
            }
        }
    },
    sidebarList: new class {
        container = document.getElementById('sidebar-list');

    },
    content: new class {
        container = document.getElementById('content-outer');
        current: ContentView;
        removeCurrent() {
            const cur = this.current;
            if (!cur) return;
            if (cur.onRemove) cur.onRemove();
            if (cur.dom) this.container.removeChild(cur.dom);
        }
        setCurrent(arg: ContentView) {
            this.removeCurrent();
            this.container.appendChild(arg.dom);
            if (arg.onShow) arg.onShow();
            this.current = arg;
        }
        listCache: { [x: number]: TrackList } = {};
        openTracklist(id: number) {
            var list = this.listCache[id];
            if (!list) {
                list = new TrackList();
                list.fetch(id);
                this.listCache[id] = list;
            }
            this.setCurrent(list.createView());
        }
    }
};

interface ContentView {
    dom: HTMLElement,
    onShow?: Action,
    onRemove?: Action
}

ui.bottomBar.init();

class PlayerCore {
    audio: HTMLAudioElement;
    track: Track;
    onTrackChanged: Action;
    constructor() {
        this.audio = document.createElement('audio');
        this.audio.addEventListener('timeupdate', () => this.updateProgress());
        this.audio.addEventListener('canplay', () => this.updateProgress());
        this.audio.addEventListener('error', (e) => {
            console.log(e);
        });
        this.audio.addEventListener('ended', () => {
            this.next();
        });
        ui.progressBar.setProgressChangedCallback((x) => {
            this.audio.currentTime = x * this.audio.duration;
        });
        var ctx = new AudioContext();
        var analyzer = ctx.createAnalyser();
    }
    next() {
        if (this.track._bind && this.track._bind.next)
            this.playTrack(this.track._bind.next);
        else
            this.setTrack(null);
    }
    updateProgress() {
        ui.progressBar.setProg(this.audio.currentTime, this.audio.duration);
    }
    loadUrl(src: string) {
        this.audio.src = src;
    }
    setTrack(track: Track) {
        this.track = track;
        ui.trackinfo.setTrack(track);
        if (this.onTrackChanged) this.onTrackChanged();
        this.loadUrl(track ? track.url : "");
    }
    playTrack(track: Track) {
        if (track === this.track) return;
        this.setTrack(track);
        this.play();
    }
    play() {
        this.audio.play();
    }
    pause() {
        this.audio.pause();
    }
}

var playerCore = new PlayerCore();

var api = new class {
    baseUrl = 'api/';
    debugSleep = 500;
    async getJson(path, options?: { expectedOK?: boolean }): Promise<any> {
        options = options || {};
        if (this.debugSleep) await utils.sleepAsync(this.debugSleep - 400 + Math.random() * 800)
        var resp = await fetch(this.baseUrl + path);
        if (options.expectedOK !== false && resp.status != 200)
            throw new Error('Remote response HTTP status ' + resp.status);
        return await resp.json();
    }
    async getListAsync(id: number): Promise<Api.TrackList> {
        return await this.getJson('lists/' + id);
    }
    async getListIndexAsync(): Promise<Api.TrackListIndex> {
        return await this.getJson('lists/index');
    }
}

interface Track extends Api.Track {
    _bind?: {
        location?: number;
        list?: TrackList;
        next?: Track;
    };
}

class View {
    protected _dom: HTMLElement
    public get dom() {
        return this._dom = this._dom || this.createDom();
    }
    protected createDom(): HTMLElement {
        return document.createElement('div');
    }
    toggleClass(clsName: string, force?: boolean) {
        utils.toggleClass(this.dom, clsName, force);
    }
}

abstract class ListViewItem extends View {
}

class ListView<T extends ListViewItem> {
    container: HTMLElement;
    items: T[];
    onItemClicked: (item: T) => void;
    constructor(container: BuildDomExpr) {
        this.container = utils.buildDOM(container) as HTMLElement;
        this.items = [];
    }
    add(item: T) {
        item.dom.addEventListener('click', () => {
            if (this.onItemClicked) this.onItemClicked(item);
        });
        this.container.appendChild(item.dom);
        this.items.push(item);
    }
    clear() {
        utils.clearChilds(this.container);
        this.items = [];
    }
    get(idx: number) {
        return this.items[idx];
    }
    clearAndReplaceDom(dom: Node) {
        this.clear();
        this.container.appendChild(dom);
    }
}

class TrackList {
    name: string;
    tracks: Track[];
    contentView: ContentView;
    fetching: Promise<any>;
    curActive = new ItemActiveHelper<TrackViewItem>();
    listView: ListView<TrackViewItem>;
    loadIndicator = new LoadingIndicator();

    loadFromObj(obj: Api.TrackList) {
        this.name = obj.name;
        this.tracks = obj.tracks;
        var i = 0;
        var lastItem: Track;
        for (const item of this.tracks) {
            item._bind = { location: i++, list: this };
            if (lastItem) lastItem._bind.next = item;
            lastItem = item;
        }
        return this;
    }
    fetch(arg: number | (() => Promise<Api.TrackList>)): Promise<void> {
        var func: () => Promise<Api.TrackList>;
        if (typeof arg == 'number') func = () => api.getListAsync(arg as number);
        else func = arg;
        this.loadIndicator.reset();
        return this.fetching = (async () => {
            try {
                var obj = await func();
                this.loadFromObj(obj);
            } catch (err) {
                this.loadIndicator.status = 'error';
                this.loadIndicator.content = 'Oh no! Something just goes wrong:\n' + err
                    + '\nClick here to retry';
                this.loadIndicator.onclick = () => {
                    this.fetch(arg);
                };
            }
            if (this.listView) this.updateView();
        })();
    }
    createView(): ContentView {
        if (!this.contentView) {
            this.listView = new ListView({ tag: 'div.tracklist' });
            this.contentView = {
                dom: this.listView.container,
                onShow: () => {
                    playerCore.onTrackChanged = () => this.trackChanged();
                    this.updateView();
                },
                onRemove: () => { }
            };
            // this.updateView();
        }
        return this.contentView;
    }
    private trackChanged() {
        var track = playerCore.track;
        var item = (track?._bind.list === this) ? this.listView.get(track._bind.location) : null;
        this.curActive.set(item);
    }
    private updateView() {
        var listView = this.listView;
        if (!this.tracks) {
            listView.clearAndReplaceDom(this.loadIndicator.dom);
            return;
        }
        // Well... currently, we just rebuild the DOM.
        listView.clear();
        for (const t of this.tracks) {
            let item = new TrackViewItem(t);
            if (playerCore.track && t.id === playerCore.track.id)
                this.curActive.set(item);
            listView.add(item);
        }
    }
}

class TrackViewItem extends ListViewItem {
    track: Track;
    dom: HTMLDivElement;
    constructor(item: Track) {
        super();
        this.track = item;
    }
    createDom() {
        var track = this.track;
        return utils.buildDOM({
            tag: 'div.item.trackitem.no-selection',
            child: [
                { tag: 'span.name', textContent: track.name },
                { tag: 'span.artist', textContent: track.artist },
            ],
            onclick: () => {
                playerCore.playTrack(track);
            },
            _item: this
        }) as HTMLDivElement
    }
}

class ItemActiveHelper<T extends ListViewItem> {
    funcSetActive = (item: T, val: boolean) => item.toggleClass('active', val);
    current: T;
    set(item: T) {
        if (this.current) this.funcSetActive(this.current, false);
        this.current = item;
        if (this.current) this.funcSetActive(this.current, true);
    }
}

type LoadingIndicatorState = 'running' | 'error';

class LoadingIndicator extends View {
    private _status: LoadingIndicatorState = 'running';
    get status() { return this._status; }
    set status(val: LoadingIndicatorState) {
        this._status = val;
        this.toggleClass('running', val == 'running');
        this.toggleClass('error', val == 'error');
    }
    private _text: string;
    get content() { return this._text; }
    set content(val: string) { this._text = val; this.dom.textContent = val; }
    onclick: (e: MouseEvent) => void;
    reset() {
        this.status = 'running';
        this.content = 'Loading...';
    }
    createDom() {
        this._dom = utils.buildDOM({
            tag: 'div.loading-indicator',
            onclick: (e) => this.onclick && this.onclick(e)
        }) as HTMLElement;
        this.reset();
        return this._dom;
    }
}

class ListIndex {
    lists: Api.TrackListInfo[];
    listView: ListView<ListIndexViewItem>;
    curActive = new ItemActiveHelper<ListIndexViewItem>();
    dom = document.getElementById('sidebar-list');
    loadIndicator = new LoadingIndicator();
    async fetch() {
        this.listView = new ListView(this.dom);
        this.listView.onItemClicked = (item) => {
            this.curActive.set(item);
            ui.content.openTracklist(item.listInfo.id);
        }
        this.updateView();
        var index = await api.getListIndexAsync();
        this.lists = index.lists;
        this.updateView();
        if (this.lists.length > 0) this.listView.onItemClicked(this.listView.items[0]);
    }
    updateView() {
        this.listView.clear();
        if (!this.lists) {
            this.listView.clearAndReplaceDom(this.loadIndicator.dom);
            return;
        }
        for (const item of this.lists) {
            this.listView.add(new ListIndexViewItem(this, item))
        }
    }
}

class ListIndexViewItem extends ListViewItem {
    index: ListIndex;
    listInfo: Api.TrackListInfo;
    constructor(index: ListIndex, listInfo: Api.TrackListInfo) {
        super();
        this.index = index;
        this.listInfo = listInfo;
    }
    createDom() {
        return utils.buildDOM({
            tag: 'div.item.no-selection',
            textContent: this.listInfo.name,
        }) as HTMLElement;
    }
}

var listIndex = new ListIndex();
listIndex.fetch();
