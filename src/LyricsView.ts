import { View, ContainerView, ItemActiveHelper } from "./viewlib";
import { BuildDomExpr, utils, Callbacks, Action, I, Timer } from "./utils";
import { parse, Lyrics, Line, Span } from "./Lyrics";
import { playerCore } from "./PlayerCore";
import { Track } from "./Track";

export class LyricsView extends View {
    lines = new ContainerView<LineView>({ tag: 'div.lyrics' });
    lyrics: Lyrics;
    track: Track | null = null;
    curLine = new ItemActiveHelper<LineView>();
    onSpanClick = new Callbacks<Action<SpanView>>();
    onFontSizeChanged = new Callbacks<Action>();
    onLyricsChanged = new Callbacks<Action>();
    createDom(): BuildDomExpr {
        return {
            tag: 'div.lyricsview',
            tabIndex: 0,
            child: [
                this.lines
            ]
        };
    }
    postCreateDom() {
        var startFontSize: number;
        var distance: number;
        this.dom.addEventListener('touchstart', (ev) => {
            if (ev.touches.length >= 2) {
                ev.preventDefault();
                startFontSize = this.scale;
                distance = dist(ev.touches[0], ev.touches[1]);
            }
        });
        this.dom.addEventListener('touchmove', (ev) => {
            if (ev.touches.length >= 2) {
                ev.preventDefault();
                var newdist = dist(ev.touches[0], ev.touches[1]);
                var scale = utils.numLimit(startFontSize * newdist / distance, 20, 500);
                this.scale = scale;
            }
        });
        function dist(a: Touch, b: Touch) {
            var dx = a.screenX - b.screenX;
            var dy = a.screenY - b.screenY;
            return Math.sqrt(dx * dx + dy * dy);
        }
        this.dom.addEventListener('wheel', (ev) => {
            if (ev.ctrlKey && ev.deltaY) {
                ev.preventDefault();
                var scale = this.scale + (ev.deltaY > 0 ? -20 : 20);
                scale = utils.numLimit(scale, 20, 500);
                this.scale = scale;
            }
        });
    }
    setLyrics(lyrics: string | Lyrics) {
        try {
            if (typeof lyrics === 'string') lyrics = parse(lyrics);
        } catch (error) {
            console.error(error);
            lyrics = {
                lines: [{
                    orderTime: 0,
                    spans: [{
                        text: I`Error parsing lyrics`
                    }]
                }]
            } as any as Lyrics;
        }

        this.lyrics = lyrics;
        this.curLine.set(null);

        if (lyrics.lang) this.lines.dom.lang = lyrics.lang;
        else this.lines.dom.removeAttribute('lang');

        this.lines.removeAllView();
        lyrics.lines.forEach(l => {
            if (l.spans) {
                this.lines.addView(new LineView(l, this));
            }
        });

        this.onLyricsChanged.invoke();
        this.resize();
    }
    setCurrentTime(time: number, scroll?: boolean | 'smooth' | 'force') {
        if (!(time >= 0)) time = 0;
        var prev = this.curLine.current;
        var line = this.getLineByTime(time, prev);
        line?.setCurrentTime(time);
        this.curLine.set(line);
        if (scroll && line && (prev !== line || scroll === 'force')) {
            line.dom.scrollIntoView({
                behavior: scroll === 'smooth' ? 'smooth' : undefined,
                block: 'center'
            });
        }
    }
    resize() {
        if (this.domCreated) {
            const boxHeight = this.dom.offsetHeight;
            const contentHeight = this.lines.dom.scrollHeight;
            if (contentHeight > boxHeight / 2) {
                this.lines.dom.style.margin = (boxHeight / 2) + 'px 0';
            } else {
                this.lines.dom.style.margin = ((boxHeight - contentHeight) / 2) + 'px 0';
            }
        }
        this.centerLyrics();
    }

    private _fontSize: number = 100;
    public get scale(): number {
        return this._fontSize;
    }
    public set scale(v: number) {
        this._fontSize = v;
        this.lines.dom.style.fontSize = v + '%';
        this.onFontSizeChanged.invoke();
    }

    scrollPos = 0;
    reset() {
        this.scrollPos = 0;
    }
    onShow() {
        this.dom.scrollTop = this.scrollPos;
        if (this.isTrackPlaying()) this.setCurrentTime(playerCore.currentTime);
        requestAnimationFrame(this._resize);
        window.addEventListener('resize', this._resize);
    }
    onHide() {
        this.scrollPos = this.dom.scrollTop;
        window.removeEventListener('resize', this._resize);
        this.timer.tryCancel();
    }
    centerLyrics() {
        if (playerCore.state === 'playing' && this.isTrackPlaying())
            this.setCurrentTime(playerCore.currentTime, 'force');
    }
    private _resize = () => {
        this.resize();
    };
    timer = new Timer(() => this.onProgressChanged());
    lastTime = 0;
    lastChangedRealTime = 0;
    onProgressChanged = () => {
        if (!this.isTrackPlaying()) return;
        var time = playerCore.currentTime;
        var realTime = new Date().getTime();
        if (time != this.lastTime) {
            this.lastChangedRealTime = realTime;
            this.setCurrentTime(time, 'smooth');
        }
        if (realTime - this.lastChangedRealTime < 500) this.timer.timeout(16);
    };
    private isTrackPlaying() {
        return playerCore.track && playerCore.track === this.track && playerCore.track.id === this.track.id;
    }


    getLineByTime(time: number, hint?: LineView | null) {
        var line: LineView | null;
        if (hint && time >= hint.line.startTime!) {
            line = hint;
            for (let i = hint.position! + 1; i < this.lines.length; i++) {
                let x = this.lines.get(i);
                if (x.line.startTime != null) {
                    if (x.line.startTime <= time) {
                        line = x;
                    } else {
                        break;
                    }
                }
            }
        } else {
            line = null;
            this.lines.forEach(x => {
                if (x.line.startTime != null && x.line.startTime <= time) line = x;
            });
        }
        return line;
    }
}

export class LineView extends ContainerView<SpanView> {
    line: Line;
    get spans() { return this.items; }
    lyricsView: LyricsView;
    constructor(line: Line, lyricsView: LyricsView) {
        super({ tag: 'p.line' });
        this.line = line;
        this.lyricsView = lyricsView;
        this.line.spans!.forEach(s => {
            this.addView(new SpanView(s, this));
        });
        if (this.line.translation) {
            var lyrics = this.lyricsView?.lyrics;
            var tlang = lyrics && lyrics.translationLang || lyrics.lang;
            this.dom.appendChild(utils.buildDOM({
                tag: 'div.trans',
                lang: tlang,
                text: this.line.translation
            }));
        }
    }
    setCurrentTime(time: number) {
        this.spans.forEach(s => {
            s.toggleClass('active', s.span.startTime! <= time);
        });
    }
}

export class SpanView extends View {
    span: Span;
    lineView: LineView;
    get timeStamp() { return this.span.timeStamp; }
    set timeStamp(val) { this.span.timeStamp = val; }
    get startTime() { return this.span.startTime; }
    set startTime(val) { this.span.startTime = val; }
    get isNext() { return this.dom.classList.contains('next'); }
    set isNext(val) { this.toggleClass('next', val); }

    constructor(span: Span, lineView: LineView) {
        super();
        this.span = span;
        this.lineView = lineView;
    }
    createDom() {
        var s = this.span;
        if (!s.ruby) {
            return utils.buildDOM({
                tag: 'span.span', text: s.text
            });
        } else {
            return utils.buildDOM({
                tag: 'span.span',
                child: {
                    tag: 'ruby',
                    child: [
                        s.text,
                        { tag: 'rp', text: '(' },
                        { tag: 'rt', text: s.ruby },
                        { tag: 'rp', text: ')' }
                    ]
                }
            });
        }
    }
    postCreateDom() {
        super.postCreateDom();
        var startX, startY;
        this.dom.addEventListener('mousedown', (ev) => {
            startX = ev.offsetX;
            startY = ev.offsetY;
        });
        this.dom.addEventListener('click', (ev) => {
            if (Math.abs(ev.offsetX - startX) <= 3 && Math.abs(ev.offsetY - startY) <= 3) {
                ev.preventDefault();
                this.lineView.lyricsView.onSpanClick.invoke(this);
            }
        });
    }
}