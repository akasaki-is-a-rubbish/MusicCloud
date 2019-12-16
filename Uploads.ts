// file: Uploads.ts

class UploadTrack extends Track {
    constructor(init: Partial<UploadTrack>) {
        super(init);
    }
    _upload: {
        view?: UploadViewItem;
        state: 'pending' | 'uploading' | 'error' | 'done';
        // With prefix "uploads_", these are i18n keys 
    };
}

var uploads = new class {
    tracks: UploadTrack[] = [];
    state: false | 'fetching' | 'fetched' = false;
    init() {
        ui.sidebarList.container.insertBefore(this.sidebarItem.dom, ui.sidebarList.container.firstChild);
        user.onSwitchedUser.add(() => {
            if (this.state != false) {
                this.tracks = [];
                this.state = false;
                if (this.view.rendered) {
                    this.view.listView.removeAll();
                    this.view.updateView();
                }
                setTimeout(() => this.fetch(), 1);
            }
        });
    }
    sidebarItem = new class extends ListViewItem {
        protected createDom(): BuildDomExpr {
            return {
                tag: 'div.item.no-selection',
                textContent: I`My Uploads`,
                onclick: (ev) => {
                    ui.sidebarList.setActive(uploads.sidebarItem);
                    ui.content.setCurrent(uploads.view);
                }
            };
        }
    };
    view = new class extends ListContentView {
        uploadArea: UploadArea;
        listView: ListView<UploadViewItem>;
        title = I`My Uploads`;

        protected appendHeader() {
            super.appendHeader();
            this.uploadArea = new UploadArea({ onfile: (file) => uploads.uploadFile(file) });
            this.dom.appendView(this.uploadArea);
        }
        protected insertLoadingIndicator(li) {
            this.dom.insertBefore(li.dom, this.uploadArea.dom.nextSibling);
        }
        protected listviewCreated() {
            uploads.tracks.forEach(t => this.addTrack(t));
            if (!uploads.state) uploads.fetch();
        }
        addTrack(t: UploadTrack, pos?: number) {
            var lvi = new UploadViewItem(t);
            lvi.dragging = true;
            this.listView.add(lvi, pos);
            this.updateView();
        }
    };
    private prependTrack(t: UploadTrack) {
        this.tracks.unshift(t);
        if (this.view.rendered) {
            this.view.addTrack(t, 0);
        }
    }
    private appendTrack(t: UploadTrack) {
        this.tracks.push(t);
        if (this.view.rendered) this.view.addTrack(t);
    }
    async fetch() {
        this.state = 'fetching';
        var li = new LoadingIndicator();
        this.view.useLoadingIndicator(li);
        try {
            await user.waitLogin(true);
            var fetched = ((await api.getJson('my/uploads'))['tracks'] as any[])
                .reverse()
                .map(t => {
                    t._upload = { state: 'done' };
                    return new UploadTrack(t);
                });
            this.state = 'fetched';
        } catch (error) {
            li.error(error, () => this.fetch());
            return;
        }
        this.tracks = this.tracks.filter(t => {
            if (t._upload.state == 'done') {
                t._upload.view?.remove();
                return false;
            }
            return true;
        });
        this.view.useLoadingIndicator(null);
        fetched.forEach(t => this.appendTrack(t));
        this.view.updateView();
    }
    async uploadFile(file: File) {
        var apitrack: Api.Track = {
            id: undefined, url: undefined,
            artist: 'Unknown', name: file.name
        };
        var track = new UploadTrack({
            ...apitrack,
            _upload: {
                state: 'uploading'
            }
        });
        this.prependTrack(track);
        var jsonBlob = new Blob([JSON.stringify(apitrack)]);
        var finalBlob = new Blob([
            BlockFormat.encodeBlock(jsonBlob),
            BlockFormat.encodeBlock(file)
        ]);
        var resp = await api.postJson({
            path: 'tracks/newfile',
            method: 'POST',
            mode: 'raw',
            obj: finalBlob,
            headers: { 'Content-Type': 'application/x-mcloud-upload' }
        }) as Api.Track;
        track.id = resp.id;
        track.url = resp.url;
        track._upload.state = 'done';
        track._upload.view?.updateDom();
    }
};


class UploadViewItem extends TrackViewItem {
    track: UploadTrack;
    domstate: HTMLElement;
    _lastUploadState: string;
    constructor(track: UploadTrack) {
        super(track);
        track._upload.view = this;
    }
    postCreateDom() {
        super.postCreateDom();
        this.dom.classList.add('uploads-item');
        this.dom.appendChild(this.domstate = utils.buildDOM<HTMLElement>({ tag: 'span.uploads-state' }));
    }
    updateDom() {
        super.updateDom();
        var newState = this.track._upload.state;
        if (this._lastUploadState != newState) {
            if (this._lastUploadState) this.dom.classList.remove('state-' + this._lastUploadState);
            if (newState) this.dom.classList.add('state-' + newState);
            this.domstate.textContent = i18n.get('uploads_' + newState);
        }
    }
}

class UploadArea extends View {
    onfile: (file: File) => void;
    constructor(init: Partial<UploadArea>) {
        super();
        utils.objectApply(this, init);
    }
    createDom() {
        return {
            tag: 'div.upload-area',
            child: [
                { tag: 'div.text.no-selection', textContent: I`Drag files to this zone...` }
            ]
        };
    }
    postCreateDom() {
        this.dom.addEventListener('dragover', (ev) => {
            if (ev.dataTransfer.types.indexOf('Files') >= 0) {
                ev.preventDefault();
                ev.dataTransfer.dropEffect = 'copy';
            }
        });
        this.dom.addEventListener('drop', (ev) => {
            ev.preventDefault();
            if (ev.dataTransfer.types.indexOf('Files') >= 0) {
                var files = ev.dataTransfer.files;
                for (let i = 0; i < files.length; i++) {
                    const file = files[i];
                    console.log('drop file', { name: file.name, size: file.size });
                    this.onfile?.(file);
                }
            }
        });
    }
}

var BlockFormat = {
    encodeBlock(blob: Blob): Blob {
        return new Blob([BlockFormat.encodeLen(blob.size), blob]);
    },
    encodeLen(len: number): string {
        var str = '';
        for (var i = 0; i < 8; i++) {
            str = '0123456789aBcDeF'[(len >> (i * 4)) & 0x0f] + str;
        }
        str += '\r\n';
        return str;
    }
};