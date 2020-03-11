import { View, ContainerView, ItemActiveHelper } from "./viewlib";
import { BuildDomExpr, utils, Callbacks, Action } from "./utils";
import { parse, Parsed, Line, Span } from "./Lyrics";


export class LyricsView extends View {
    lyrics = new ContainerView<LineView>({ tag: 'div.lyrics' });
    curLine = new ItemActiveHelper<LineView>();
    onSpanClick = new Callbacks<Action<Span>>();
    createDom(): BuildDomExpr {
        return {
            tag: 'div.lyricsview',
            child: [
                this.lyrics.dom
            ]
        };
    }
    setLyrics(lyrics: string | Parsed) {
        if (typeof lyrics === 'string') lyrics = parse(lyrics);
        this.curLine.set(null);
        this.lyrics.removeAllView();
        lyrics.lines.forEach(l => {
            this.lyrics.addView(new LineView(l, this));
        });
    }
    setCurrentTime(time: number, scroll?: true | 'smooth') {
        if (!(time >= 0)) time = 0;
        var prev = this.curLine.current;
        var line = this.getLineByTime(time, prev);
        line?.setCurrentTime(time);
        this.curLine.set(line);
        if (scroll && line && prev !== line) {
            line.dom.scrollIntoView({
                behavior: scroll === 'smooth' ? 'smooth' : undefined,
                block: 'center'
            });
        }
    }

    getLineByTime(time: number, hint?: LineView) {
        var line: LineView;
        if (hint && time >= hint.line.startTime) {
            line = hint;
            for (let i = hint.position + 1; i < this.lyrics.length; i++) {
                let x = this.lyrics.get(i);
                if (x.line.startTime >= 0) {
                    if (x.line.startTime <= time) {
                        line = x;
                    } else {
                        break;
                    }
                }
            }
        } else {
            line = null;
            this.lyrics.forEach(x => {
                if (x.line.startTime >= 0 && x.line.startTime <= time) line = x;
            });
        }
        return line;
    }
}

class LineView extends View {
    line: Line;
    spans: SpanView[];
    lyricsView: LyricsView;
    constructor(line: Line, lyricsView: LyricsView) {
        super();
        this.line = line;
        this.lyricsView = lyricsView;
        this.spans = this.line.spans.map(s => new SpanView(s, this));
    }
    createDom() {
        return {
            tag: 'p.line',
            child: this.spans.map(x => x.dom)
        };
    }
    setCurrentTime(time: number) {
        this.spans.forEach(s => {
            s.toggleClass('active', s.span.startTime <= time);
        });
    }
}

class SpanView extends View {
    span: Span;
    lineView: LineView;
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
        this.dom.addEventListener('click', () => {
            this.lineView.lyricsView.onSpanClick.invoke(this.span);
        });
    }
}