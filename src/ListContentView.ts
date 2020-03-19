// file: ListContentView.ts

import { ListViewItem, ListView, LoadingIndicator } from "./viewlib";
import { utils, I, EventRegistrations } from "./utils";
import { ContentView, ContentHeader, ActionBtn } from "./UI";

class DataBackedListViewItem extends ListViewItem {
    data: any;
    constructor(data: any) {
        super();
        this.data = data;
    }
}

class DataBackedListView<T extends DataBackedListViewItem, TData> extends ListView<T> {
    /** Do NOT modify this array directly, use {add,remove}Data methods instead. */
    dataList: Array<TData> = [];

    addData(data: TData) {
        this.dataList.push(data);
        if (this._dom) this.add(this.createListViewItem(data));
    }

    removeData(pos: number) {
        var [d] = this.dataList.splice(pos, 1);
        if (this._dom) this.remove(pos);
        return d;
    }

    protected createListViewItem(data: TData): T {
        return new DataBackedListViewItem(data) as any;
    }

    protected postCreateDom() {
        super.postCreateDom();
        this.dataList.forEach(data => this.add(this.createListViewItem(data)));
    }
}


export class ListContentView extends ContentView {
    dom: HTMLElement;

    header: ContentHeader;
    refreshBtn: ActionBtn;
    selectAllBtn: ActionBtn;
    selectBtn: ActionBtn;

    listView: ListView<ListViewItem>;
    loadingIndicator: LoadingIndicator;
    emptyIndicator: LoadingIndicator;

    get rendered() { return this.domCreated; }

    private _canMultiSelect: boolean;
    public get canMultiSelect(): boolean { return this._canMultiSelect; }
    public set canMultiSelect(v: boolean) {
        this._canMultiSelect = v;
        if (this.selectBtn) this.selectBtn.hidden = !this.canMultiSelect;
        if (this.listView) this.listView.selectionHelper.ctrlForceSelect = this.canMultiSelect;
    }

    createDom() {
        return utils.buildDOM({ tag: 'div' });
    }

    postCreateDom() {
        super.postCreateDom();
        this.appendHeader();
        this.appendListView();
    }

    title: string;
    protected createHeader(): ContentHeader {
        return new ContentHeader({ title: this.title });
    }

    protected appendHeader() {
        this.header = this.createHeader();
        this.header.actions.addView(this.refreshBtn = new ActionBtn({ text: I`Refresh` }));
        this.header.actions.addView(this.selectAllBtn = new ActionBtn({ text: I`Select all` }));
        this.header.actions.addView(this.selectBtn = new ActionBtn({ text: I`Select` }));
        this.selectBtn.onclick = () => {
            this.listView.selectionHelper.enabled = !this.listView.selectionHelper.enabled;
        };
        this.selectAllBtn.onclick = () => {
            this.listView.forEach(x => this.listView.selectionHelper.toggleItemSelection(x, true));
        };
        this.dom.appendView(this.header);
    }

    protected appendListView() {
        this.listView = new ListView({ tag: 'ul' });
        this.listView.selectionHelper.onEnabledChanged.add(() => {
            this.selectBtn.hidden = !this.canMultiSelect && !this.listView.selectionHelper.enabled;
            this.selectBtn.text = this.listView.selectionHelper.enabled ? I`Cancel` : I`Select`;
            this.selectAllBtn.hidden = !this.listView.selectionHelper.enabled;
        })();
        this.listView.selectionHelper.ctrlForceSelect = this.canMultiSelect;
        this.dom.appendView(this.listView);
    }

    onShow() {
        this.ensureDom();
    }
    onRemove() {
        super.onRemove();
    }

    useLoadingIndicator(li: LoadingIndicator) {
        if (li !== this.loadingIndicator) {
            if (this.rendered) {
                if (this.loadingIndicator) this.loadingIndicator.dom.remove();
                if (li) this.insertLoadingIndicator(li);
            }
            this.loadingIndicator = li;
        }
        this.updateView();
    }

    protected insertLoadingIndicator(li: LoadingIndicator) {
        this.dom.insertBefore(li.dom, this.listView.dom);
    }

    updateView() {
        if (!this.rendered) return;
        if (this.listView.length == 0) {
            if (!this.loadingIndicator) {
                this.emptyIndicator = this.emptyIndicator || new LoadingIndicator({ state: 'normal', content: I`(Empty)` });
                this.useLoadingIndicator(this.emptyIndicator);
            }
        } else {
            if (this.emptyIndicator && this.loadingIndicator == this.emptyIndicator) {
                this.useLoadingIndicator(null);
            }
        }
    }

    async loadingAction(func: () => Promise<void>) {
        var li = this.loadingIndicator || new LoadingIndicator();
        this.useLoadingIndicator(li);
        try {
            await func();
        } catch (error) {
            li.error(error, () => this.loadingAction(func));
            throw error;
        }
        this.useLoadingIndicator(null);
    }
};