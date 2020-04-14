import { Track } from './Track';
import { ContentView, ContentHeader, SidebarItem, ui, ActionBtn } from './UI';
import { I } from './I18n';
import { BuildDomExpr, Timer, utils } from './utils';
import { LyricsView, SpanView, LineView } from './LyricsView';
import { router } from './Router';
import { Span, Lyrics, serialize, parse } from './Lyrics';
import { playerCore } from './PlayerCore';
import { View } from './viewlib';
import { Toast } from '@yuuza/webfx/lib/viewlib';

export var lyricsEdit = new class {
    sidebarItem: SidebarItem;
    view: LyricsEditContentView;
    startEdit(track: Track, lyrics: string) {
        if (!this.view) {
            this.sidebarItem = new SidebarItem({ text: I`Edit Lyrics` });
            this.view = new LyricsEditContentView();
            ui.sidebarList.addFeatureItem(this.sidebarItem);
            router.addRoute({
                path: ['lyricsEdit'],
                contentView: () => this.view,
                sidebarItem: () => this.sidebarItem
            });
        }
        this.sidebarItem.hidden = false;
        this.view.setTrack(track, lyrics);
        router.nav('lyricsEdit');
    }
};

class LyricsEditContentView extends ContentView {
    header = new ContentHeader({ title: I`Edit Lyrics` });
    lyricsView = new EditableLyricsView();
    sourceView = new LyricsSourceView();
    currentView: LyricsSourceView | EditableLyricsView | null = null;
    btnLyrics: ActionBtn;
    btnSource: ActionBtn;

    _mode: 'lyrics' | 'source' = 'lyrics';
    get mode() { return this._mode; }
    set mode(val) { this.setMode(val); }

    track: Track | null = null;
    lyrics: string | null = null;
    originalLyrics: string | null = null;

    constructor() {
        super();
        this.header.actions.addView(this.btnLyrics = new ActionBtn({
            text: I`Lyrics View`,
            onclick: () => {
                this.setMode('lyrics');
            }
        }));
        this.header.actions.addView(this.btnSource = new ActionBtn({
            text: I`Source View`,
            onclick: () => {
                this.setMode('source');
            }
        }));
        this.header.actions.addView(new ActionBtn({
            text: I`Discard`,
            onclick: () => {
                this.lyrics = this.originalLyrics;
                this.close();
            }
        }));
        this.header.actions.addView(new ActionBtn({
            text: I`Done`,
            onclick: () => {
                this.getLyricsFromView();
                this.close();
            }
        }));
    }

    setMode(mode: this['mode'], init?: boolean) {
        if (!init && mode === this._mode) return;
        try {
            if (!init) this.getLyricsFromView();
            var view = this.currentView;
            if (mode === 'lyrics') {
                try {
                    var parsed = parse(this.lyrics!);
                } catch (error) {
                    throw new Error(I`Error parsing lyrics`);
                }
                this.lyricsView.setLyrics(parsed);
                view = this.lyricsView;
            } else if (mode === 'source') {
                this.sourceView.value = this.lyrics!;
                view = this.sourceView;
            } else {
                throw new Error("unknown mode");
            }
            this.setCurrentView(view);
        } catch (error) {
            Toast.show(I`Failed to switch view.` + '\n' + error, 3000);
            return;
        }
        this.btnLyrics.active = mode === 'lyrics';
        this.btnSource.active = mode === 'source';
        this._mode = mode;
    }

    setCurrentView(view: this['currentView']) {
        if (this.currentView) {
            this.currentView.onHide();
            this.currentView.dom.remove();
            this.currentView = null;
        }
        if (view) {
            this.currentView = view;
            this.appendView(view!);
            view.onShow();
        }
    }

    private getLyricsFromView() {
        if (this.mode === 'lyrics') {
            this.lyrics = serialize(this.lyricsView.lyrics);
        } else if (this.mode === 'source') {
            this.lyrics = this.sourceView.value;
        } else {
            throw new Error("unknown mode");
        }
    }

    close() {
        this.setCurrentView(null);
        lyricsEdit.sidebarItem.hidden = true;
        window.history.back();
        var trackDialog = this.track!.startEdit();
        trackDialog.inputLyrics.value = this.lyrics!;
    }

    createDom(): BuildDomExpr {
        return {
            tag: 'div.lyricsedit',
            child: [
                this.header
            ]
        };
    }
    setTrack(track: Track, lyrics: string) {
        this.track = track;
        this.originalLyrics = lyrics;
        this.lyrics = lyrics;
        this.lyricsView.reset();
        this.lyricsView.track = track;
        this.sourceView.reset();
        this.setMode(lyrics ? this.mode : 'source', true);
    }
    onShow() {
        this.ensureDom();
        this.shownEvents.add(playerCore.onProgressChanged, () => {
            if (this.currentView === this.lyricsView) {
                this.lyricsView.onProgressChanged();
            }
        });
    }
    onDomInserted() {
        super.onDomInserted();
        this.currentView?.onShow();
    }
    onRemove() {
        super.onRemove();
        this.currentView?.onHide();
    }
}

class EditableLyricsView extends LyricsView {
    nextSpans: SpanView[] = [];
    constructor() {
        super();
        this.onLyricsChanged.add(() => {
            this.lines.forEach(l => {
                if (l.spans?.length) {
                    let firstSpan = l.spans[0].span;
                    if (!firstSpan.timeStamp) {
                        firstSpan.timeStamp = { time: -1, beats: null, beatsDiv: null };
                    }
                    l.spans.forEach(s => {
                        s.timeStamp && s.toggleClass('ts', true);
                    });
                }
            });
            this.nextSpans = [];
            this.setNextSpans(this.getSpans());
        });
        this.onSpanClick.add((s) => {
            if (s.span.startTime != null && s.span.startTime >= 0)
                playerCore.currentTime = utils.numLimit(s.span.startTime! - 3, 0, Infinity);
            this.setNextSpans(this.getSpans(s, 'here'));
        });
        this.dom.addEventListener('keydown', (ev) => {
            if (ev.code == 'ArrowRight' || ev.code == 'F' || ev.code == 'D') {
                ev.preventDefault();
                if (this.nextSpans.length) {
                    const now = playerCore.currentTime;
                    this.nextSpans[0].timeStamp!.time = now;
                    this.nextSpans.forEach(s => {
                        s.startTime = now;
                    });
                    if (this.nextSpans[0].position === 0) {
                        this.nextSpans[0].lineView.line.startTime = now;
                    }
                }
                let spans = this.getSpans(null, 'forward');
                if (spans.length) this.setNextSpans(spans);
            } else if (ev.code == 'ArrowLeft') {
                ev.preventDefault();
                let spans = this.getSpans(null, 'backward');
                if (spans.length) this.setNextSpans(spans);
            }
        });
        this.toggleClass('edit', true);
    }
    getSpans(span?: SpanView | null, go?: 'here' | 'forward' | 'backward') {
        if (!span) {
            if (this.nextSpans.length) {
                span = this.nextSpans[go === 'backward' ? 0 : this.nextSpans.length - 1];
            } else if (this.lines.length) {
                span = this.lines.get(0).spans[0];
            } else {
                return [];
            }
        }
        var colPos = span.position!;
        var line = span.lineView!;

        if (go == null || go === 'here') {
            while (line.spans && !line.spans[colPos].timeStamp) {
                if (colPos-- === 0) {
                    line = this.lines.get(line.position! - 1);
                    colPos = line.length - 1;
                }
            }
        } else if (go === 'forward') {
            do {
                if (line && ++colPos === line.length) {
                    line = this.lines.get(line.position! + 1);
                    colPos = 0;
                }
            } while (line && (line.spans && !line.spans[colPos].timeStamp));
        } else if (go === 'backward') {
            do {
                if (line && colPos-- === 0) {
                    line = this.lines.get(line.position! - 1);
                    colPos = line.length - 1;
                }
            } while (line && (line.spans && !line.spans[colPos].timeStamp));
        }

        var spans: SpanView[] = [];
        if (line) {
            do {
                spans.push(line.spans[colPos]);
                colPos++;
            } while (colPos < line.length && !line.spans[colPos].timeStamp);
        }
        return spans;
    }
    setNextSpans(spans: SpanView[]) {
        while (this.nextSpans.length) {
            this.nextSpans.pop()!.isNext = false;
        }
        spans.forEach(s => {
            s.isNext = true;
            this.nextSpans.push(s);
        });
    }
}

class LyricsSourceView extends View {
    dom: HTMLTextAreaElement;
    get value() { return this.dom.value; }
    set value(val) { this.dom.value = val; }
    createDom(): BuildDomExpr {
        return {
            tag: 'textarea',
            style: 'height: 100%; overflow: auto; border: none; padding: 10px;'
        };
    }
    scrollPos = 0;
    reset() {
        this.scrollPos = 0;
    }
    onShow() {
        this.dom.scrollTop = this.scrollPos;
    }
    onHide() {
        this.scrollPos = this.dom.scrollTop;
    }
}
