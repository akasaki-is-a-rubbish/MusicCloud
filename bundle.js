(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
// file: I18n.ts
Object.defineProperty(exports, "__esModule", { value: true });
/** Internationalization (aka i18n) helper class */
class I18n {
    constructor() {
        this.data = {};
        this.curLang = 'en';
        this.missing = new Map();
    }
    /** Get i18n string for `key`, return `key` when not found. */
    get(key, arg) {
        return this.get2(key, arg) || key;
    }
    /** Get i18n string for `key`, return `null` when not found. */
    get2(key, arg, lang) {
        lang = lang || this.curLang;
        var langObj = this.data[lang];
        if (!langObj) {
            console.log('i18n missing lang: ' + lang);
            return null;
        }
        var r = langObj[key];
        if (!r) {
            if (!this.missing.has(key)) {
                this.missing.set(key, 1);
                console.log('i18n missing key: ' + key);
            }
            return null;
        }
        if (arg) {
            for (const key in arg) {
                if (arg.hasOwnProperty(key)) {
                    const val = arg[key];
                    r = r.replace('{' + key + '}', val);
                    // Note that it only replaces the first occurrence.
                }
            }
        }
        return r;
    }
    /** Fills data with an 2darray */
    add2dArray(array) {
        const langObjs = [];
        const langs = array[0];
        for (const lang of langs) {
            langObjs.push(this.data[lang] = this.data[lang] || {});
        }
        for (let i = 1; i < array.length; i++) {
            const line = array[i];
            const key = line[0];
            for (let j = 0; j < line.length; j++) {
                const val = line[j];
                langObjs[j][key] = val;
            }
        }
    }
    renderElements(elements) {
        console.log('i18n elements rendering');
        elements.forEach(x => {
            for (const node of x.childNodes) {
                if (node.nodeType === Node.TEXT_NODE) {
                    // console.log('node', node);
                    var r = this.get2(node.beforeI18n || node.textContent);
                    if (r) {
                        node.beforeI18n = node.beforeI18n || node.textContent;
                        node.textContent = r;
                    }
                    else {
                        if (node.beforeI18n) {
                            node.textContent = node.beforeI18n;
                        }
                        console.log('missing key for node', node);
                    }
                }
            }
        });
    }
    /**
     * Detect the best available language using
     * the user language preferences provided by the browser.
     * @param langs Available languages
     */
    static detectLanguage(langs) {
        var cur = null;
        var curIdx = -1;
        var languages = [];
        // ['en-US'] -> ['en-US', 'en']
        (navigator.languages || [navigator.language]).forEach(lang => {
            languages.push(lang);
            if (lang.indexOf('-') > 0)
                languages.push(lang.substr(0, lang.indexOf('-')));
        });
        langs.forEach((l) => {
            var idx = languages.indexOf(l);
            if (!cur || (idx !== -1 && idx < curIdx)) {
                cur = l;
                curIdx = idx;
            }
        });
        return cur || langs[0];
    }
}
exports.I18n = I18n;
function createStringBuilder(i18n) {
    return function (literals, ...placeholders) {
        if (placeholders.length === 0) {
            return i18n.get(literals[0]);
        }
        // Generate format string from template string:
        var formatString = '';
        for (var i = 0; i < literals.length; i++) {
            var lit = literals[i];
            formatString += lit;
            if (i < placeholders.length) {
                formatString += '{' + i + '}';
            }
        }
        var r = i18n.get(formatString);
        for (var i = 0; i < placeholders.length; i++) {
            r = r.replace('{' + i + '}', placeholders[i]);
        }
        return r;
    };
}
exports.createStringBuilder = createStringBuilder;
exports.i18n = new I18n();
exports.I = createStringBuilder(exports.i18n);

},{}],2:[function(require,module,exports){
"use strict";
// file: utils.ts
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const I18n_1 = require("./I18n");
exports.i18n = I18n_1.i18n;
exports.I = I18n_1.I;
const _object_assign = Object.assign;
const _object_hasOwnProperty = Object.prototype.hasOwnProperty;
/** The name "utils" tells it all. */
exports.utils = new class Utils {
    constructor() {
        // Time & formatting utils:
        this.fileSizeUnits = ['B', 'KB', 'MB', 'GB'];
    }
    strPadLeft(str, len, ch = ' ') {
        while (str.length < len) {
            str = ch + str;
        }
        return str;
    }
    formatTime(sec) {
        if (typeof sec !== 'number' || isNaN(sec))
            return '--:--';
        sec = Math.round(sec);
        var min = Math.floor(sec / 60);
        sec %= 60;
        return this.strPadLeft(min.toString(), 2, '0') + ':' + this.strPadLeft(sec.toString(), 2, '0');
    }
    formatFileSize(size) {
        if (typeof size !== "number" || isNaN(size))
            return 'NaN';
        var unit = 0;
        while (unit < this.fileSizeUnits.length - 1 && size >= 1024) {
            unit++;
            size /= 1024;
        }
        return size.toFixed(2) + ' ' + this.fileSizeUnits[unit];
    }
    formatDateTime(date) {
        var now = new Date();
        var sameday = date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate();
        return sameday ? date.toLocaleTimeString() : date.toLocaleString();
    }
    numLimit(num, min, max) {
        return (num < min || typeof num != 'number' || isNaN(num)) ? min :
            (num > max) ? max : num;
    }
    createName(nameFunc, existsFunc) {
        for (let num = 0;; num++) {
            let str = nameFunc(num);
            if (!existsFunc(str))
                return str;
        }
    }
    /**
     * btoa, but supports Unicode and uses UTF-8 encoding.
     * @see https://stackoverflow.com/questions/30106476
     */
    base64EncodeUtf8(str) {
        return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function toSolidBytes(match, p1) {
            return String.fromCharCode(('0x' + p1));
        }));
    }
    sleepAsync(time) {
        return new Promise((resolve) => {
            setTimeout(resolve, time);
        });
    }
    /** Remove all children from the node */
    clearChildren(node) {
        while (node.lastChild)
            node.removeChild(node.lastChild);
    }
    /** Remove all children from the node (if needed) and append one (if present) */
    replaceChild(node, newChild) {
        this.clearChildren(node);
        if (newChild)
            node.appendChild(newChild);
    }
    /** Add or remove a classname for the element
     * @param force - true -> add; false -> remove; undefined -> toggle.
     */
    toggleClass(element, clsName, force) {
        var clsList = element.classList;
        if (clsList.toggle)
            return clsList.toggle(clsName, force);
        if (force === undefined)
            force = !clsList.contains(clsName);
        if (force)
            clsList.add(clsName);
        else
            clsList.remove(clsName);
        return force;
    }
    /** Fade out the element and remove it */
    fadeout(element) {
        element.classList.add('fading-out');
        var cb = null;
        var end = () => {
            if (!end)
                return; // use a random variable as flag ;)
            end = null;
            element.removeEventListener('transitionend', onTransitionend);
            element.classList.remove('fading-out');
            element.remove();
            cb && cb();
        };
        var onTransitionend = function (e) {
            if (e.eventPhase === Event.AT_TARGET)
                end();
        };
        element.addEventListener('transitionend', onTransitionend);
        setTimeout(end, 350); // failsafe
        return {
            get finished() { return !end; },
            onFinished(callback) {
                if (!end)
                    callback();
                else
                    cb = callback;
            },
            cancel() { end === null || end === void 0 ? void 0 : end(); }
        };
    }
    listenPointerEvents(element, callback) {
        element.addEventListener('mousedown', function (e) {
            if (callback({ type: 'mouse', ev: e, point: e, action: 'down' }) === 'track') {
                var mousemove = function (e) {
                    callback({ type: 'mouse', ev: e, point: e, action: 'move' });
                };
                var mouseup = function (e) {
                    document.removeEventListener('mousemove', mousemove, true);
                    document.removeEventListener('mouseup', mouseup, true);
                    callback({ type: 'mouse', ev: e, point: e, action: 'up' });
                };
                document.addEventListener('mousemove', mousemove, true);
                document.addEventListener('mouseup', mouseup, true);
            }
        });
        var touchDown = false;
        element.addEventListener('touchstart', function (e) {
            var ct = e.changedTouches[0];
            var ret = callback({
                type: 'touch', touch: 'start', ev: e, point: ct,
                action: touchDown ? 'move' : 'down'
            });
            if (!touchDown && ret === 'track') {
                touchDown = true;
                var touchmove = function (e) {
                    var ct = e.changedTouches[0];
                    callback({ type: 'touch', touch: 'move', ev: e, point: ct, action: 'move' });
                };
                var touchend = function (e) {
                    if (e.touches.length === 0) {
                        touchDown = false;
                        element.removeEventListener('touchmove', touchmove);
                        element.removeEventListener('touchend', touchend);
                    }
                    var ct = e.changedTouches[0];
                    callback({
                        type: 'touch', touch: 'end', ev: e, point: ct,
                        action: touchDown ? 'move' : 'up'
                    });
                };
                element.addEventListener('touchmove', touchmove);
                element.addEventListener('touchend', touchend);
            }
        });
    }
    addEvent(element, event, handler) {
        element.addEventListener(event, handler);
        return {
            remove: () => element.removeEventListener(event, handler)
        };
    }
    arrayRemove(array, val) {
        for (let i = 0; i < array.length; i++) {
            if (array[i] === val) {
                array.splice(i, 1);
                i--;
            }
        }
    }
    arrayInsert(array, val, pos) {
        if (pos === undefined)
            array.push(val);
        else
            array.splice(pos, 0, val);
    }
    arrayMap(arr, func) {
        if (arr instanceof Array)
            return arr.map(func);
        var idx = 0;
        var ret = new Array(arr.length);
        for (var item of arr) {
            ret[idx] = (func(item, idx));
            idx++;
        }
        return ret;
    }
    arrayForeach(arr, func) {
        var idx = 0;
        for (var item of arr) {
            func(item, idx++);
        }
    }
    arrayFind(arr, func) {
        if (arr instanceof Array)
            return arr.find(func);
        var idx = 0;
        for (var item of arr) {
            if (func(item, idx++))
                return item;
        }
        return null;
    }
    arraySum(arr, func) {
        var sum = 0;
        this.arrayForeach(arr, (x) => {
            var val = func(x);
            if (val)
                sum += val;
        });
        return sum;
    }
    objectApply(obj, kv, keys) {
        if (kv) {
            if (!keys)
                return _object_assign(obj, kv);
            for (const key in kv) {
                if (_object_hasOwnProperty.call(kv, key) && (!keys || keys.indexOf(key) >= 0)) {
                    const val = kv[key];
                    obj[key] = val;
                }
            }
        }
        return obj;
    }
    mod(a, b) {
        if (a < 0)
            a = b + a;
        return a % b;
    }
    readBlobAsDataUrl(blob) {
        return new Promise((resolve, reject) => {
            var reader = new FileReader();
            reader.onload = (ev) => {
                resolve(reader.result);
            };
            reader.onerror = (ev) => reject();
            reader.readAsDataURL(blob);
        });
    }
};
Array.prototype.remove = function (item) {
    exports.utils.arrayRemove(this, item);
};
class Timer {
    constructor(callback) {
        this.callback = callback;
        this.cancelFunc = undefined;
    }
    timeout(time) {
        this.tryCancel();
        var handle = setTimeout(this.callback, time);
        this.cancelFunc = () => window.clearTimeout(handle);
    }
    interval(time) {
        this.tryCancel();
        var handle = setInterval(this.callback, time);
        this.cancelFunc = () => window.clearInterval(handle);
    }
    tryCancel() {
        if (this.cancelFunc) {
            this.cancelFunc();
            this.cancelFunc = undefined;
        }
    }
}
exports.Timer = Timer;
exports.utils.Timer = Timer;
class BuildDOMCtx {
    constructor(dict) {
        this.dict = dict !== null && dict !== void 0 ? dict : {};
    }
    static EnsureCtx(ctxOrDict, origctx) {
        var ctx;
        if (ctxOrDict instanceof BuildDOMCtx)
            ctx = ctxOrDict;
        else
            ctx = new BuildDOMCtx(ctxOrDict);
        if (origctx) {
            if (!origctx.actions)
                origctx.actions = [];
            ctx.actions = origctx.actions;
        }
        return ctx;
    }
    setDict(key, node) {
        if (!this.dict)
            this.dict = {};
        this.dict[key] = node;
    }
    addUpdateAction(action) {
        if (!this.actions)
            this.actions = [];
        this.actions.push(action);
        // BuildDOMCtx.executeAction(action);
    }
    update() {
        if (!this.actions)
            return;
        for (const a of this.actions) {
            BuildDOMCtx.executeAction(a);
        }
    }
    static executeAction(a) {
        switch (a[0]) {
            case 'text':
                a[1].textContent = a[2]();
                break;
            case 'hidden':
                a[1].hidden = a[2]();
                break;
            case 'update':
                a[2](a[1]);
                break;
            default:
                console.warn('unknown action', a);
                break;
        }
    }
}
exports.BuildDOMCtx = BuildDOMCtx;
exports.utils.buildDOM = (() => {
    var createElementFromTag = function (tag) {
        var reg = /[#\.^]?[\w\-]+/y;
        var match;
        var ele;
        while (match = reg.exec(tag)) {
            var val = match[0];
            var ch = val[0];
            if (ch === '.') {
                ele.classList.add(val.substr(1));
            }
            else if (ch === '#') {
                ele.id = val.substr(1);
            }
            else {
                if (ele)
                    throw new Error('unexpected multiple tags');
                ele = document.createElement(val);
            }
        }
        return ele;
    };
    var buildDomCore = function (obj, ttl, ctx) {
        if (ttl-- < 0)
            throw new Error('ran out of TTL');
        if (typeof (obj) === 'string') {
            return document.createTextNode(obj);
        }
        if (Node && obj instanceof Node)
            return obj;
        if ('getDOM' in obj)
            return obj.getDOM();
        const tag = obj.tag;
        if (!tag)
            throw new Error('no tag');
        var node = createElementFromTag(tag);
        if (obj['_ctx'])
            ctx = BuildDOMCtx.EnsureCtx(obj['_ctx'], ctx);
        for (var key in obj) {
            if (obj.hasOwnProperty(key)) {
                var val = obj[key];
                if (key === 'child') {
                    if (val instanceof Array) {
                        val.forEach(function (x) {
                            node.appendChild(buildDomCore(x, ttl, ctx));
                        });
                    }
                    else {
                        node.appendChild(buildDomCore(val, ttl, ctx));
                    }
                }
                else if (key === '_key') {
                    ctx.setDict(val, node);
                }
                else if (key === 'text') {
                    if (typeof val === 'function') {
                        ctx.addUpdateAction(['text', node, val]);
                    }
                    else {
                        node.textContent = val;
                    }
                }
                else if (key === 'hidden' && typeof val === 'function') {
                    ctx.addUpdateAction(['hidden', node, val]);
                }
                else if (key === 'update' && typeof val === 'function') {
                    ctx.addUpdateAction(['update', node, val]);
                }
                else if (key === 'init') {
                    // no-op
                }
                else {
                    node[key] = val;
                }
            }
            const init = obj['init'];
            if (init)
                init(node);
        }
        return node;
    };
    return function (obj, ctx) {
        return buildDomCore(obj, 32, ctx);
    };
})();
class SettingItem {
    constructor(key, type, initial) {
        this.key = key;
        type = this.type = typeof type === 'string' ? SettingItem.types[type] : type;
        if (!type || !type.serialize || !type.deserialize)
            throw new Error("invalid 'type' arugment");
        this.readFromStorage(initial);
    }
    readFromStorage(initial) {
        var str = this.key ? localStorage.getItem(this.key) : null;
        this.isInitial = !str;
        this.set(str ? this.type.deserialize(str) : initial, true);
    }
    render(fn, dontRaiseNow) {
        if (!dontRaiseNow)
            fn(this.data);
        var oldFn = this.onRender;
        var newFn = fn;
        if (oldFn)
            fn = function (x) { oldFn(x); newFn(x); };
        this.onRender = fn;
        return this;
    }
    ;
    bindToBtn(btn, prefix) {
        if (this.type !== SettingItem.types.bool)
            throw new Error('only for bool type');
        var span = document.createElement('span');
        btn.insertBefore(span, btn.firstChild);
        this.render(function (x) {
            btn.classList.toggle('disabled', !x);
            prefix = prefix || ["❌", "✅"];
            span.textContent = prefix[+x];
        });
        var thiz = this;
        btn.addEventListener('click', function () { thiz.toggle(); });
        return this;
    }
    ;
    remove() {
        localStorage.removeItem(this.key);
    }
    save() {
        this.isInitial = false;
        localStorage.setItem(this.key, this.type.serialize(this.data));
    }
    set(data, dontSave) {
        this.data = data;
        this.isInitial = false;
        this.onRender && this.onRender(data);
        if (!dontSave && this.key)
            this.save();
    }
    ;
    get() {
        return this.data;
    }
    ;
    toggle() {
        if (this.type !== SettingItem.types.bool)
            throw new Error('only for bool type');
        this.set((!this.data));
    }
    ;
    loop(arr) {
        var curData = this.data;
        var oldIndex = arr.findIndex(function (x) { return x === curData; });
        var newData = arr[(oldIndex + 1) % arr.length];
        this.set(newData);
    }
    ;
}
exports.SettingItem = SettingItem;
SettingItem.types = {
    bool: {
        serialize: function (data) { return data ? 'true' : 'false'; },
        deserialize: function (str) { return str === 'true' ? true : str === 'false' ? false : undefined; }
    },
    str: {
        serialize: function (x) { return x; },
        deserialize: function (x) { return x; }
    },
    json: {
        serialize: function (x) { return JSON.stringify(x); },
        deserialize: function (x) { return JSON.parse(x); }
    }
};
class Callbacks {
    constructor() {
        this.list = [];
    }
    invoke(...args) {
        this.list.forEach((x) => x.apply(this, args));
    }
    add(callback) {
        this.list.push(callback);
        return callback;
    }
    remove(callback) {
        this.list.remove(callback);
    }
}
exports.Callbacks = Callbacks;
class Lazy {
    constructor(func) {
        if (typeof func != 'function')
            throw new Error('func is not a function');
        this._func = func;
        this._value = undefined;
    }
    get computed() { return !this._func; }
    get rawValue() { return this._value; }
    get value() {
        if (this._func) {
            this._value = this._func();
            this._func = undefined;
        }
        return this._value;
    }
}
exports.Lazy = Lazy;
class Semaphore {
    constructor(init) {
        this.queue = new Array();
        this.maxCount = 1;
        this.runningCount = 0;
        exports.utils.objectApply(this, init);
    }
    enter() {
        if (this.runningCount === this.maxCount) {
            var resolve;
            var prom = new Promise((res) => { resolve = res; });
            this.queue.push(resolve);
            return prom;
        }
        else {
            this.runningCount++;
            return Promise.resolve();
        }
    }
    exit() {
        if (this.runningCount === this.maxCount && this.queue.length) {
            if (window.queueMicrotask) {
                window.queueMicrotask(this.queue.shift());
            }
            else {
                setTimeout(this.queue.shift(), 0);
            }
        }
        else {
            this.runningCount--;
        }
    }
    run(func) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.enter();
            try {
                yield func();
            }
            finally {
                this.exit();
            }
        });
    }
}
exports.Semaphore = Semaphore;
/** Just like CancellationToken[Source] on .NET */
class CancelToken {
    constructor() {
        this.cancelled = false;
        this.onCancelled = new Callbacks();
    }
    cancel() {
        if (this.cancelled)
            return;
        this.cancelled = true;
        this.onCancelled.invoke();
    }
    throwIfCancelled() {
        if (this.cancelled)
            throw new Error("operation cancelled.");
    }
}
exports.CancelToken = CancelToken;
class DataUpdatingHelper {
    update(newData) {
        const oldData = this.items;
        var dataDict = {};
        for (const n of newData) {
            dataDict[this.dataSelectId(n)] = n;
        }
        var itemDict = {};
        var removed = [];
        for (const d of oldData) {
            const id = this.selectId(d);
            if (dataDict[id] !== undefined) {
                itemDict[id] = d;
            }
            else {
                removed.push(d);
            }
        }
        for (let i = removed.length - 1; i >= 0; i--)
            this.removeItem(removed[i]);
        var pos = 0;
        for (const n of newData) {
            const d = itemDict[this.dataSelectId(n)];
            if (d !== undefined) {
                this.updateItem(d, n);
            }
            else {
                this.addItem(n, pos);
            }
            pos++;
        }
    }
    selectId(obj) { return obj.id; }
    dataSelectId(obj) { return obj.id; }
    addItem(obj, pos) { }
    updateItem(old, data) { }
    removeItem(obj) { }
}
exports.DataUpdatingHelper = DataUpdatingHelper;
class EventRegistrations {
    constructor() {
        this.list = [];
    }
    add(event, func) {
        this.list.push({ event, func });
        event.add(func);
        return func;
    }
    removeAll() {
        while (this.list.length) {
            var r = this.list.pop();
            r.event.remove(r.func);
        }
    }
}
exports.EventRegistrations = EventRegistrations;
class TextCompositionWatcher {
    constructor(dom) {
        this.isCompositing = false;
        this.dom = dom.getDOM();
        this.dom.addEventListener('compositionstart', (ev) => {
            this.isCompositing = true;
        });
        this.dom.addEventListener('compositionend', (ev) => {
            this.isCompositing = false;
        });
    }
}
exports.TextCompositionWatcher = TextCompositionWatcher;

},{"./I18n":1}],3:[function(require,module,exports){
"use strict";
// file: viewlib.ts
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("./utils");
const I18n_1 = require("./I18n");
class View {
    constructor(dom) {
        this.parentView = undefined;
        this._position = undefined;
        this.domctx = new utils_1.BuildDOMCtx();
        this._dom = undefined;
        this._onactive = undefined;
        this._onActiveCbs = undefined;
        if (dom)
            this.domExprCreated(dom);
    }
    static getView(obj) { return obj instanceof View ? obj : new View(obj); }
    get position() { return this._position; }
    get domCreated() { return !!this._dom; }
    get dom() {
        this.ensureDom();
        return this._dom;
    }
    get hidden() { return this.dom.hidden; }
    set hidden(val) { this.dom.hidden = val; }
    ensureDom() {
        if (!this._dom) {
            var r = this.createDom();
            this.domExprCreated(r);
        }
    }
    domExprCreated(r) {
        this._dom = utils_1.utils.buildDOM(r, this.domctx);
        this.postCreateDom();
        this.updateDom();
    }
    createDom() {
        return document.createElement('div');
    }
    /** Will be called when the dom is created */
    postCreateDom() {
    }
    /** Will be called when the dom is created, after postCreateDom() */
    updateDom() {
        this.domctx.update();
    }
    /** Assign key-values and call `updateDom()` */
    updateWith(kv) {
        utils_1.utils.objectApply(this, kv);
        this.updateDom();
    }
    toggleClass(clsName, force) {
        utils_1.utils.toggleClass(this.dom, clsName, force);
    }
    appendView(view) { return this.dom.appendView(view); }
    getDOM() { return this.dom; }
    get onactive() { return this._onactive; }
    set onactive(val) {
        if (!!this._onactive !== !!val) {
            if (val) {
                this._onActiveCbs = [
                    (e) => {
                        this._onactive();
                    },
                    (e) => {
                        this.handleKeyDown(e, this._onactive);
                    }
                ];
                this.dom.addEventListener('click', this._onActiveCbs[0]);
                this.dom.addEventListener('keydown', this._onActiveCbs[1]);
            }
            else {
                this.dom.removeEventListener('click', this._onActiveCbs[0]);
                this.dom.removeEventListener('keydown', this._onActiveCbs[1]);
                this._onActiveCbs = undefined;
            }
        }
        this._onactive = val;
    }
    handleKeyDown(e, onactive) {
        if (e.code === 'Enter') {
            onactive();
            e.preventDefault();
        }
    }
}
exports.View = View;
HTMLElement.prototype.getDOM = function () { return this; };
Node.prototype.appendView = function (view) {
    this.appendChild(view.dom);
};
class ContainerView extends View {
    constructor() {
        super(...arguments);
        this.items = [];
    }
    appendView(view) {
        this.addView(view);
    }
    addView(view, pos) {
        var _a;
        const items = this.items;
        if (view.parentView)
            throw new Error('the view is already in a container view');
        view.parentView = this;
        if (pos === undefined) {
            view._position = items.length;
            items.push(view);
            this.dom.appendChild(view.dom);
        }
        else {
            items.splice(pos, 0, view);
            this.dom.insertBefore(view.dom, ((_a = items[pos + 1]) === null || _a === void 0 ? void 0 : _a.dom) || null);
            for (let i = pos; i < items.length; i++) {
                items[i]._position = i;
            }
        }
    }
    removeView(view) {
        view = this._ensureItem(view);
        view.dom.remove();
        var pos = view._position;
        view.parentView = view._position = undefined;
        this.items.splice(pos, 1);
        for (let i = pos; i < this.items.length; i++) {
            this.items[i]._position = i;
        }
    }
    removeAllView() {
        while (this.length)
            this.removeView(this.length - 1);
    }
    updateChildrenDom() {
        for (const item of this.items) {
            item.updateDom();
        }
    }
    _ensureItem(item) {
        if (typeof item === 'number')
            item = this.items[item];
        else if (!item)
            throw new Error('item is null or undefined.');
        else if (item.parentView !== this)
            throw new Error('the item is not in this listview.');
        return item;
    }
    [Symbol.iterator]() { return this.items[Symbol.iterator](); }
    get length() { return this.items.length; }
    get(idx) {
        return this.items[idx];
    }
    map(func) { return utils_1.utils.arrayMap(this, func); }
    find(func) { return utils_1.utils.arrayFind(this, func); }
    forEach(func) { return utils_1.utils.arrayForeach(this, func); }
}
exports.ContainerView = ContainerView;
/** DragManager is used to help exchange information between views */
exports.dragManager = new class DragManager {
    constructor() {
        /** The item being dragged */
        this._currentItem = null;
        this._currentArray = null;
        this.onDragStart = new utils_1.Callbacks();
        this.onDragEnd = new utils_1.Callbacks();
    }
    get currentItem() { var _a, _b, _c; return (_c = (_a = this._currentItem) !== null && _a !== void 0 ? _a : (_b = this._currentArray) === null || _b === void 0 ? void 0 : _b[0]) !== null && _c !== void 0 ? _c : null; }
    ;
    get currentArray() {
        if (this._currentItem)
            return [this._currentItem];
        return this._currentArray;
    }
    start(item) {
        this._currentItem = item;
        console.log('drag start', item);
        this.onDragStart.invoke();
    }
    startArray(arr) {
        this._currentArray = arr;
        console.log('drag start array', arr);
        this.onDragStart.invoke();
    }
    end() {
        this._currentItem = null;
        console.log('drag end');
        this.onDragEnd.invoke();
    }
};
class ListViewItem extends View {
    constructor() {
        super(...arguments);
        this._selected = false;
        this.onSelectedChanged = new utils_1.Callbacks();
        // https://stackoverflow.com/questions/7110353
        this.enterctr = 0;
        this.dragoverPlaceholder = null;
    }
    get listview() { return this.parentView; }
    get selectionHelper() { return this.listview.selectionHelper; }
    get dragData() { return this.dom.textContent; }
    get selected() { return this._selected; }
    set selected(v) {
        this._selected = v;
        this.domCreated && this.updateDom();
        this.onSelectedChanged.invoke();
    }
    remove() {
        if (!this.listview)
            return;
        this.listview.remove(this);
    }
    postCreateDom() {
        super.postCreateDom();
        this.dom.setAttribute('role', 'listitem');
        this.dom.addEventListener('click', (ev) => {
            var _a, _b, _c;
            if ((_a = this.listview) === null || _a === void 0 ? void 0 : _a.selectionHelper.handleItemClicked(this, ev))
                return;
            (_c = (_b = this.listview) === null || _b === void 0 ? void 0 : _b.onItemClicked) === null || _c === void 0 ? void 0 : _c.call(_b, this);
        });
        this.dom.addEventListener('keydown', (ev) => {
            var _a, _b, _c, _d, _e, _f;
            if (ev.code === 'Enter') {
                if (ev.altKey) {
                    const rect = this.dom.getBoundingClientRect();
                    const mouseev = new MouseEvent('contextmenu', {
                        clientX: rect.left, clientY: rect.top,
                        relatedTarget: this.dom
                    });
                    (_c = ((_a = this.onContextMenu) !== null && _a !== void 0 ? _a : (_b = this.listview) === null || _b === void 0 ? void 0 : _b.onContextMenu)) === null || _c === void 0 ? void 0 : _c(this, mouseev);
                }
                else {
                    if ((_d = this.listview) === null || _d === void 0 ? void 0 : _d.selectionHelper.handleItemClicked(this, ev))
                        return;
                    (_f = (_e = this.listview) === null || _e === void 0 ? void 0 : _e.onItemClicked) === null || _f === void 0 ? void 0 : _f.call(_e, this);
                }
                ev.preventDefault();
            }
            else if (this.listview && (ev.code === 'ArrowUp' || ev.code === 'ArrowDown')) {
                var offset = ev.code === 'ArrowUp' ? -1 : 1;
                var item = this.listview.get(this.position + offset);
                if (item) {
                    item.dom.focus();
                    ev.preventDefault();
                }
            }
        });
        this.dom.addEventListener('contextmenu', (ev) => {
            var _a, _b, _c;
            (_c = ((_a = this.onContextMenu) !== null && _a !== void 0 ? _a : (_b = this.listview) === null || _b === void 0 ? void 0 : _b.onContextMenu)) === null || _c === void 0 ? void 0 : _c(this, ev);
        });
        this.dom.addEventListener('dragstart', (ev) => {
            var _a, _b;
            if (!((_a = this.dragging) !== null && _a !== void 0 ? _a : (_b = this.listview) === null || _b === void 0 ? void 0 : _b.dragging)) {
                ev.preventDefault();
                return;
            }
            var arr = [];
            if (this.selected) {
                arr = [...this.selectionHelper.selectedItems];
                arr.sort((a, b) => a.position - b.position); // remove this line to get a new feature!
            }
            else {
                arr = [this];
            }
            exports.dragManager.startArray(arr);
            ev.dataTransfer.setData('text/plain', arr.map(x => x.dragData).join('\r\n'));
            arr.forEach(x => x.dom.style.opacity = '.5');
        });
        this.dom.addEventListener('dragend', (ev) => {
            var arr = exports.dragManager.currentArray;
            exports.dragManager.end();
            ev.preventDefault();
            arr.forEach(x => x.dom.style.opacity = '');
        });
        this.dom.addEventListener('dragover', (ev) => {
            this.dragHandler(ev, 'dragover');
        });
        this.dom.addEventListener('dragenter', (ev) => {
            this.dragHandler(ev, 'dragenter');
        });
        this.dom.addEventListener('dragleave', (ev) => {
            this.dragHandler(ev, 'dragleave');
        });
        this.dom.addEventListener('drop', (ev) => {
            this.dragHandler(ev, 'drop');
        });
    }
    dragHandler(ev, type) {
        var _a, _b, _c, _d, _e;
        const item = exports.dragManager.currentItem;
        let items = exports.dragManager.currentArray;
        const drop = type === 'drop';
        const arg = {
            source: item, target: this,
            sourceItems: items,
            event: ev, drop: drop,
            accept: false
        };
        if (item instanceof ListViewItem) {
            if (((_a = this.listview) === null || _a === void 0 ? void 0 : _a.moveByDragging) && item.listview === this.listview) {
                ev.preventDefault();
                if (!drop) {
                    ev.dataTransfer.dropEffect = 'move';
                    arg.accept = (items.indexOf(this) === -1) ? 'move' : true;
                    if (arg.accept === 'move' && this.position > item.position)
                        arg.accept = 'move-after';
                }
                else {
                    if (items.indexOf(this) === -1) {
                        if (this.position >= item.position)
                            items = [...items].reverse();
                        for (const it of items) {
                            if (it !== this) {
                                this.listview.move(it, this.position);
                            }
                        }
                    }
                }
            }
        }
        const onDragover = (_b = this.onDragover) !== null && _b !== void 0 ? _b : (_c = this.listview) === null || _c === void 0 ? void 0 : _c.onDragover;
        if (!arg.accept && onDragover) {
            onDragover(arg);
            if (drop || arg.accept)
                ev.preventDefault();
        }
        const onContextMenu = (_d = this.onContextMenu) !== null && _d !== void 0 ? _d : (_e = this.listview) === null || _e === void 0 ? void 0 : _e.onContextMenu;
        if (!arg.accept && item === this && onContextMenu) {
            if (drop)
                onContextMenu(this, ev);
            else
                ev.preventDefault();
        }
        if (type === 'dragenter' || type === 'dragleave' || drop) {
            if (type === 'dragenter') {
                this.enterctr++;
            }
            else if (type === 'dragleave') {
                this.enterctr--;
            }
            else {
                this.enterctr = 0;
            }
            let hover = this.enterctr > 0;
            this.toggleClass('dragover', hover);
            let placeholder = hover && !!arg && (arg.accept === 'move' || arg.accept === 'move-after');
            if (placeholder != !!this.dragoverPlaceholder) {
                if (placeholder) {
                    this.dragoverPlaceholder = utils_1.utils.buildDOM({ tag: 'div.dragover-placeholder' });
                    var before = this.dom;
                    if (arg.accept === 'move-after')
                        before = before.nextElementSibling;
                    this.dom.parentElement.insertBefore(this.dragoverPlaceholder, before);
                }
                else {
                    this.dragoverPlaceholder.remove();
                    this.dragoverPlaceholder = null;
                }
            }
        }
    }
    ;
}
exports.ListViewItem = ListViewItem;
class ListView extends ContainerView {
    constructor(container) {
        super(container);
        /**
         * Allow user to drag an item.
         */
        this.dragging = false;
        /**
         * Allow user to drag an item and change its position.
         */
        this.moveByDragging = false;
        this.selectionHelper = new SelectionHelper();
        this.selectionHelper.itemProvider = this.get.bind(this);
    }
    postCreateDom() {
        super.postCreateDom();
        this.dom.setAttribute('role', 'list');
    }
    add(item, pos) {
        this.addView(item, pos);
        if (this.dragging)
            item.dom.draggable = true;
    }
    remove(item, keepSelected) {
        item = this._ensureItem(item);
        if (!keepSelected && item.selected)
            this.selectionHelper.toggleItemSelection(item);
        this.removeView(item);
    }
    move(item, newpos) {
        item = this._ensureItem(item);
        this.remove(item, true);
        this.add(item, newpos);
        this.onItemMoved(item, item.position);
    }
    /** Remove all items */
    removeAll() {
        while (this.length)
            this.remove(this.length - 1);
    }
    /** Remove all items and all DOM children */
    clear() {
        this.removeAll();
        utils_1.utils.clearChildren(this.dom);
    }
    ReplaceChild(dom) {
        this.clear();
        this.dom.appendChild(dom.getDOM());
    }
}
exports.ListView = ListView;
class SelectionHelper {
    constructor() {
        this._enabled = false;
        this.onEnabledChanged = new utils_1.Callbacks();
        this.itemProvider = null;
        this.ctrlForceSelect = false;
        this.selectedItems = [];
        this.onSelectedItemsChanged = new utils_1.Callbacks();
        /** For shift-click */
        this.lastToggledItem = null;
    }
    get enabled() { return this._enabled; }
    set enabled(val) {
        if (!!val === !!this._enabled)
            return;
        this._enabled = val;
        while (this.selectedItems.length)
            this.toggleItemSelection(this.selectedItems[0], false);
        this.lastToggledItem = null;
        this.onEnabledChanged.invoke();
    }
    get count() { return this.selectedItems.length; }
    /** Returns true if it's handled by the helper. */
    handleItemClicked(item, ev) {
        if (!this.enabled) {
            if (!this.ctrlForceSelect || !ev.ctrlKey)
                return false;
            this.enabled = true;
        }
        if (ev.shiftKey && this.lastToggledItem && this.itemProvider) {
            var toSelect = !!this.lastToggledItem.selected;
            var start = item.position, end = this.lastToggledItem.position;
            if (start > end)
                [start, end] = [end, start];
            for (let i = start; i <= end; i++) {
                this.toggleItemSelection(this.itemProvider(i), toSelect);
            }
            this.lastToggledItem = item;
        }
        else {
            this.toggleItemSelection(item);
        }
        return true;
    }
    toggleItemSelection(item, force) {
        if (force !== undefined && force === !!item.selected)
            return;
        if (item.selected) {
            item.selected = false;
            this.selectedItems.remove(item);
            this.onSelectedItemsChanged.invoke('remove', item);
        }
        else {
            item.selected = true;
            this.selectedItems.push(item);
            this.onSelectedItemsChanged.invoke('add', item);
        }
        this.lastToggledItem = item;
        if (this.count === 0 && this.ctrlForceSelect)
            this.enabled = false;
    }
}
exports.SelectionHelper = SelectionHelper;
class ItemActiveHelper {
    constructor(init) {
        this.funcSetActive = (item, val) => item.toggleClass('active', val);
        this.current = null;
        utils_1.utils.objectApply(this, init);
    }
    set(item) {
        if (this.current)
            this.funcSetActive(this.current, false);
        this.current = item;
        if (this.current)
            this.funcSetActive(this.current, true);
    }
}
exports.ItemActiveHelper = ItemActiveHelper;
class Section extends View {
    constructor(arg) {
        super();
        this.ensureDom();
        if (arg) {
            if (arg.title)
                this.setTitle(arg.title);
            if (arg.content)
                this.setContent(arg.content);
            if (arg.actions)
                arg.actions.forEach(x => this.addAction(x));
        }
    }
    createDom() {
        return {
            _ctx: this,
            tag: 'div.section',
            child: [
                {
                    tag: 'div.section-header',
                    child: [
                        { tag: 'span.section-title', _key: 'titleDom' }
                    ]
                }
                // content element(s) here
            ]
        };
    }
    setTitle(text) {
        this.titleDom.textContent = text;
    }
    setContent(view) {
        var dom = this.dom;
        var firstChild = dom.firstChild;
        while (dom.lastChild !== firstChild)
            dom.removeChild(dom.lastChild);
        dom.appendChild(view.getDOM());
    }
    addAction(arg) {
        var view = new View({
            tag: 'div.section-action.clickable',
            text: arg.text,
            tabIndex: 0
        });
        view.onactive = arg.onclick;
        this.titleDom.parentElement.appendChild(view.dom);
    }
}
exports.Section = Section;
class LoadingIndicator extends View {
    constructor(init) {
        super();
        this._status = 'running';
        this.onclick = null;
        if (init)
            utils_1.utils.objectApply(this, init);
    }
    get state() { return this._status; }
    set state(val) {
        this._status = val;
        ['running', 'error', 'normal'].forEach(x => this.toggleClass(x, val === x));
    }
    get content() { return this._text; }
    set content(val) { this._text = val; this.ensureDom(); this._textdom.textContent = val; }
    reset() {
        this.state = 'running';
        this.content = utils_1.I `Loading`;
        this.onclick = null;
    }
    error(err, retry) {
        this.state = 'error';
        this.content = utils_1.I `Oh no! Something just goes wrong:` + '\r\n' + err;
        if (retry) {
            this.content += '\r\n' + utils_1.I `[Click here to retry]`;
        }
        this.onclick = retry;
    }
    action(func) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield func();
            }
            catch (error) {
                this.error(error, () => this.action(func));
            }
        });
    }
    createDom() {
        return {
            _ctx: this,
            tag: 'div.loading-indicator',
            child: [{
                    tag: 'div.loading-indicator-inner',
                    child: [{ tag: 'div.loading-indicator-text', _key: '_textdom' }]
                }],
            onclick: (e) => this.onclick && this.onclick(e)
        };
    }
    postCreateDom() {
        this.reset();
    }
}
exports.LoadingIndicator = LoadingIndicator;
class Overlay extends View {
    createDom() {
        return { tag: 'div.overlay' };
    }
    setCenterChild(centerChild) {
        this.toggleClass('centerchild', centerChild);
        return this;
    }
    setNoBg(nobg) {
        this.toggleClass('nobg', nobg);
        return this;
    }
}
exports.Overlay = Overlay;
class EditableHelper {
    constructor(element) {
        this.editing = false;
        this.beforeEdit = null;
        this.onComplete = null;
        this.element = element;
    }
    startEdit(onComplete) {
        if (this.editing)
            return;
        this.editing = true;
        var ele = this.element;
        var beforeEdit = this.beforeEdit = ele.textContent;
        utils_1.utils.toggleClass(ele, 'editing', true);
        var input = utils_1.utils.buildDOM({
            tag: 'input', type: 'text', value: beforeEdit
        });
        while (ele.firstChild)
            ele.removeChild(ele.firstChild);
        ele.appendChild(input);
        input.select();
        input.focus();
        var stopEdit = () => {
            var _a;
            this.editing = false;
            utils_1.utils.toggleClass(ele, 'editing', false);
            events.forEach(x => x.remove());
            input.remove();
            (_a = this.onComplete) === null || _a === void 0 ? void 0 : _a.call(this, input.value);
            onComplete === null || onComplete === void 0 ? void 0 : onComplete(input.value);
        };
        var events = [
            utils_1.utils.addEvent(input, 'keydown', (evv) => {
                if (evv.code === 'Enter') {
                    stopEdit();
                    evv.preventDefault();
                }
            }),
            utils_1.utils.addEvent(input, 'focusout', (evv) => { stopEdit(); }),
        ];
    }
    startEditAsync() {
        return new Promise((resolve) => this.startEdit(resolve));
    }
}
exports.EditableHelper = EditableHelper;
class MenuItem extends ListViewItem {
    constructor(init) {
        super();
        this.text = '';
        this.cls = 'normal';
        utils_1.utils.objectApply(this, init);
    }
    createDom() {
        return {
            tag: 'div.item.no-selection',
            tabIndex: 0
        };
    }
    postCreateDom() {
        super.postCreateDom();
        this.onactive = () => {
            var _a;
            if (this.parentView instanceof ContextMenu) {
                if (!this.parentView.keepOpen)
                    this.parentView.close();
            }
            (_a = this.onclick) === null || _a === void 0 ? void 0 : _a.call(this);
        };
    }
    updateDom() {
        this.dom.textContent = this.text;
        if (this.cls !== this._lastcls) {
            if (this._lastcls)
                this.dom.classList.remove(this._lastcls);
            if (this.cls)
                this.dom.classList.add(this.cls);
        }
    }
}
exports.MenuItem = MenuItem;
class MenuLinkItem extends MenuItem {
    constructor(init) {
        super(init);
        this.link = '';
        this.download = '';
        utils_1.utils.objectApply(this, init);
    }
    createDom() {
        var dom = super.createDom();
        dom.tag = 'a.item.no-selection';
        dom.target = "_blank";
        return dom;
    }
    updateDom() {
        super.updateDom();
        this.dom.href = this.link;
        this.dom.download = this.download;
    }
}
exports.MenuLinkItem = MenuLinkItem;
class MenuInfoItem extends MenuItem {
    constructor(init) {
        super(init);
        this.text = '';
        utils_1.utils.objectApply(this, init);
    }
    createDom() {
        return {
            tag: 'div.menu-info'
        };
    }
    updateDom() {
        super.updateDom();
        this.dom.textContent = this.text;
    }
}
exports.MenuInfoItem = MenuInfoItem;
class ContextMenu extends ListView {
    constructor(items) {
        super({ tag: 'div.context-menu', tabIndex: 0 });
        this.keepOpen = false;
        this.useOverlay = true;
        this._visible = false;
        this.overlay = null;
        this._onclose = null;
        this._originalFocused = null;
        items === null || items === void 0 ? void 0 : items.forEach(x => this.add(x));
    }
    get visible() { return this._visible; }
    ;
    show(arg) {
        if ('ev' in arg)
            arg = {
                x: arg.ev.pageX,
                y: arg.ev.pageY
            };
        this.close();
        this._visible = true;
        if (this.useOverlay) {
            if (!this.overlay) {
                this.overlay = new Overlay();
                this.overlay.dom.style.background = 'rgba(0, 0, 0, .1)';
                this.overlay.dom.addEventListener('mousedown', (ev) => {
                    ev.preventDefault();
                    this.close();
                });
            }
            this.overlay.appendView(this);
            document.body.appendChild(this.overlay.dom);
        }
        else {
            document.body.appendChild(this.dom);
        }
        this._originalFocused = document.activeElement;
        this.dom.focus();
        var onfocusout = (e) => {
            !this.dom.contains(e.relatedTarget) && this.close();
        };
        var onkeydown = (e) => {
            if (e.code === 'Escape') {
                e.preventDefault();
                this.close();
            }
        };
        this.dom.addEventListener('focusout', onfocusout);
        this.dom.addEventListener('keydown', onkeydown);
        this._onclose = () => {
            this.dom.removeEventListener('focusout', onfocusout);
            this.dom.removeEventListener('keydown', onkeydown);
        };
        var width = this.dom.offsetWidth, height = this.dom.offsetHeight;
        if (arg.x + width > document.body.offsetWidth)
            arg.x -= width;
        if (arg.y + height > document.body.offsetHeight)
            arg.y -= height;
        if (arg.x < 0)
            arg.x = 0;
        if (arg.y < 0)
            arg.y = 0;
        this.dom.style.left = arg.x + 'px';
        this.dom.style.top = arg.y + 'px';
    }
    close() {
        var _a, _b, _c;
        if (this._visible) {
            this._visible = false;
            (_a = this._onclose) === null || _a === void 0 ? void 0 : _a.call(this);
            this._onclose = null;
            (_c = (_b = this._originalFocused) === null || _b === void 0 ? void 0 : _b['focus']) === null || _c === void 0 ? void 0 : _c.call(_b);
            this._originalFocused = null;
            if (this.overlay)
                utils_1.utils.fadeout(this.overlay.dom);
            utils_1.utils.fadeout(this.dom);
        }
    }
}
exports.ContextMenu = ContextMenu;
class Dialog extends View {
    constructor() {
        super();
        this.content = new ContainerView({ tag: 'div.dialog-content' });
        this.shown = false;
        this.btnTitle = new TabBtn({ active: true, clickable: false });
        this.btnClose = new TabBtn({ text: utils_1.I `Close`, right: true });
        this.title = 'Dialog';
        this.allowClose = true;
        this.showCloseButton = true;
        this.onShown = new utils_1.Callbacks();
        this.onClose = new utils_1.Callbacks();
        this.focusTrap = new View({ tag: 'div.focustrap', tabIndex: 0 });
        this.btnClose.onClick.add(() => this.allowClose && this.close());
    }
    get width() { return this.dom.style.width; }
    set width(val) { this.dom.style.width = val; }
    get contentFlex() { return this.content.dom.classList.contains('flex'); }
    set contentFlex(val) { this.content.toggleClass('flex', !!val); }
    get resizable() { return this.dom.classList.contains('resize'); }
    set resizable(val) { this.toggleClass('resize', !!val); }
    createDom() {
        return {
            _ctx: this,
            _key: 'dialog',
            tag: 'div.dialog',
            tabIndex: 0,
            style: 'width: 300px',
            child: [
                {
                    _key: 'domheader',
                    tag: 'div.dialog-title',
                    child: [
                        { tag: 'div', style: 'clear: both;' }
                    ]
                },
                this.content,
                this.focusTrap
            ]
        };
    }
    postCreateDom() {
        super.postCreateDom();
        this.addBtn(this.btnTitle);
        this.addBtn(this.btnClose);
        this.overlay = new Overlay().setCenterChild(true).setNoBg(true);
        this.overlay.dom.appendView(this);
        this.overlay.dom.addEventListener('mousedown', (ev) => {
            if (this.allowClose && ev.button === 0 && ev.target === this.overlay.dom) {
                ev.preventDefault();
                this.close();
            }
        });
        this.overlay.dom.addEventListener('keydown', (ev) => {
            if (this.allowClose && ev.keyCode === 27) { // ESC
                ev.preventDefault();
                this.close();
            }
            else if (ev.target === this.dom && ev.code === 'Tab' && ev.shiftKey) {
                ev.preventDefault();
                let tabables = this.dom.querySelectorAll('a, [tabindex]');
                if (tabables.length >= 2 && tabables[tabables.length - 2]['focus']) {
                    // the last tabable is `focusTrap`, so the index used here is `length - 2`
                    tabables[tabables.length - 2]['focus']();
                }
            }
        });
        // title bar pointer event handler:
        {
            let offset;
            utils_1.utils.listenPointerEvents(this.domheader, (e) => {
                if (e.action === 'down') {
                    if (e.ev.target !== this.domheader && e.ev.target !== this.btnTitle.dom)
                        return;
                    e.ev.preventDefault();
                    const rectOverlay = this.overlay.dom.getBoundingClientRect();
                    const rect = this.dom.getBoundingClientRect();
                    offset = {
                        x: e.point.pageX - rectOverlay.x - rect.x,
                        y: e.point.pageY - rectOverlay.y - rect.y
                    };
                    return 'track';
                }
                else if (e.action === 'move') {
                    e.ev.preventDefault();
                    const rect = this.overlay.dom.getBoundingClientRect();
                    const pageX = utils_1.utils.numLimit(e.point.pageX, rect.left, rect.right);
                    const pageY = utils_1.utils.numLimit(e.point.pageY, rect.top, rect.bottom);
                    this.setOffset(pageX - offset.x, pageY - offset.y);
                }
            });
        }
        this.dom.addEventListener('resize', () => {
            if (this.dom.style.width)
                this.width = this.dom.style.width;
        });
        this.focusTrap.dom.addEventListener('focus', (ev) => {
            this.dom.focus();
        });
    }
    updateDom() {
        this.btnTitle.updateWith({ text: this.title });
        this.btnTitle.hidden = !this.title;
        this.btnClose.hidden = !(this.allowClose && this.showCloseButton);
    }
    addBtn(btn) {
        this.ensureDom();
        this.domheader.insertBefore(btn.dom, this.domheader.lastChild);
    }
    addContent(view, replace) {
        this.ensureDom();
        if (replace)
            this.content.removeAllView();
        this.content.appendView(View.getView(view));
    }
    setOffset(x, y) {
        this.dom.style.left = x ? x + 'px' : '';
        this.dom.style.top = y ? y + 'px' : '';
        this.overlay.setCenterChild(false);
    }
    getOffset() {
        var x = this.dom.style.left ? parseFloat(this.dom.style.left) : 0;
        var y = this.dom.style.top ? parseFloat(this.dom.style.top) : 0;
        return { x, y };
    }
    center() {
        this.setOffset(0, 0);
        this.overlay.setCenterChild(true);
    }
    show() {
        var _a;
        if (this.shown)
            return;
        this.shown = true;
        (_a = this._cancelFadeout) === null || _a === void 0 ? void 0 : _a.call(this);
        this.ensureDom();
        Dialog.defaultParent.onDialogShowing(this);
        this.dom.focus();
        (this.autoFocus || this).dom.focus();
        this.onShown.invoke();
    }
    close() {
        if (!this.shown)
            return;
        this.shown = false;
        this.onClose.invoke();
        this._cancelFadeout = utils_1.utils.fadeout(this.overlay.dom).cancel;
        Dialog.defaultParent.onDialogClosing(this);
    }
    waitClose() {
        return new Promise((resolve) => {
            var cb = this.onClose.add(() => {
                this.onClose.remove(cb);
                resolve();
            });
        });
    }
}
exports.Dialog = Dialog;
class DialogParent extends View {
    constructor(dom) {
        super(dom !== null && dom !== void 0 ? dom : document.body);
        this.bgOverlay = new Overlay();
        this.dialogCount = 0;
    }
    onDialogShowing(dialog) {
        var _a;
        if (this.dialogCount++ === 0) {
            (_a = this._cancelFadeout) === null || _a === void 0 ? void 0 : _a.call(this);
            this.appendView(this.bgOverlay);
        }
        this.appendView(dialog.overlay);
    }
    onDialogClosing(dialog) {
        if (--this.dialogCount === 0) {
            this._cancelFadeout = utils_1.utils.fadeout(this.bgOverlay.dom).cancel;
        }
    }
}
exports.DialogParent = DialogParent;
class TabBtn extends View {
    constructor(init) {
        super();
        this.text = '';
        this.clickable = true;
        this.active = false;
        this.right = false;
        this.onClick = new utils_1.Callbacks();
        utils_1.utils.objectApply(this, init);
    }
    createDom() {
        return {
            tag: 'span.tab.no-selection'
        };
    }
    postCreateDom() {
        this.onactive = () => {
            var _a;
            (_a = this.onclick) === null || _a === void 0 ? void 0 : _a.call(this);
            this.onClick.invoke();
        };
    }
    updateDom() {
        this.dom.textContent = this.text;
        this.dom.tabIndex = this.clickable ? 0 : -1;
        this.toggleClass('clickable', this.clickable);
        this.toggleClass('active', this.active);
        this.dom.style.float = this.right ? 'right' : 'left';
    }
}
exports.TabBtn = TabBtn;
class InputView extends View {
    constructor(init) {
        super();
        this.multiline = false;
        this.type = 'text';
        this.placeholder = '';
        utils_1.utils.objectApply(this, init);
    }
    get value() { return this.dom.value; }
    set value(val) { this.dom.value = val; }
    createDom() {
        return this.multiline ? { tag: 'textarea.input-text' } : { tag: 'input.input-text' };
    }
    updateDom() {
        super.updateDom();
        if (!this.multiline)
            this.dom.type = this.type;
        this.dom.placeholder = this.placeholder;
    }
}
exports.InputView = InputView;
class TextView extends View {
    get text() { return this.dom.textContent; }
    set text(val) { this.dom.textContent = val; }
}
exports.TextView = TextView;
class ButtonView extends TextView {
    constructor(init) {
        super();
        this.disabled = false;
        this.type = 'normal';
        utils_1.utils.objectApply(this, init);
        this.updateDom();
    }
    get onclick() { return this.onactive; }
    set onclick(val) { this.onactive = val; }
    createDom() {
        return { tag: 'div.btn', tabIndex: 0 };
    }
    updateDom() {
        super.updateDom();
        this.toggleClass('disabled', this.disabled);
        this.toggleClass('btn-big', this.type === 'big');
    }
}
exports.ButtonView = ButtonView;
class LabeledInput extends View {
    constructor(init) {
        super();
        this.label = '';
        this.type = 'text';
        this.input = new InputView();
        utils_1.utils.objectApply(this, init);
    }
    get dominput() { return this.input.dom; }
    get value() { return this.dominput.value; }
    set value(val) { this.dominput.value = val; }
    createDom() {
        return {
            _ctx: this,
            tag: 'div.labeled-input',
            child: [
                { tag: 'div.input-label', text: () => this.label },
                this.input
            ]
        };
    }
    updateDom() {
        super.updateDom();
        this.input.type = this.type;
        this.input.domCreated && this.input.updateDom();
    }
}
exports.LabeledInput = LabeledInput;
class ToastsContainer extends View {
    constructor() {
        super(...arguments);
        this.parentDom = null;
        this.toasts = [];
    }
    createDom() {
        return { tag: 'div.toasts-container' };
    }
    addToast(toast) {
        if (this.toasts.length === 0)
            this.show();
        this.toasts.push(toast);
    }
    removeToast(toast) {
        this.toasts.remove(toast);
        if (this.toasts.length === 0)
            this.remove();
    }
    show() {
        var parent = this.parentDom || document.body;
        parent.appendChild(this.dom);
    }
    remove() {
        this.dom.remove();
    }
}
exports.ToastsContainer = ToastsContainer;
ToastsContainer.default = new ToastsContainer();
class Toast extends View {
    constructor(init) {
        super();
        this.text = '';
        this.shown = false;
        this.timer = new utils_1.Timer(() => this.close());
        utils_1.utils.objectApply(this, init);
        if (!this.container)
            this.container = ToastsContainer.default;
    }
    show(timeout) {
        if (!this.shown) {
            this.container.addToast(this);
            this.container.appendView(this);
            this.shown = true;
        }
        if (timeout)
            this.timer.timeout(timeout);
        else
            this.timer.tryCancel();
    }
    close() {
        if (!this.shown)
            return;
        this.shown = false;
        utils_1.utils.fadeout(this.dom)
            .onFinished(() => this.container.removeToast(this));
    }
    createDom() {
        return { tag: 'div.toast' };
    }
    updateDom() {
        this.dom.textContent = this.text;
    }
    static show(text, timeout) {
        var toast = new Toast({ text });
        toast.show(timeout);
        return toast;
    }
}
exports.Toast = Toast;
class MessageBox extends Dialog {
    constructor() {
        super(...arguments);
        this.allowClose = false;
        this.title = 'Message';
        this.result = 'none';
    }
    addResultBtns(results) {
        for (const r of results) {
            this.addBtnWithResult(new TabBtn({ text: I18n_1.i18n.get('msgbox_' + r), right: true }), r);
        }
        return this;
    }
    setTitle(title) {
        this.title = title;
        if (this.domCreated)
            this.updateDom();
        return this;
    }
    addText(text) {
        this.addContent(new TextView({ tag: 'div.messagebox-text', textContent: text }));
        return this;
    }
    allowCloseWithResult(result, showCloseButton) {
        this.result = result;
        this.allowClose = true;
        this.showCloseButton = !!showCloseButton;
        if (this.domCreated)
            this.updateDom();
        return this;
    }
    addBtnWithResult(btn, result) {
        btn.onClick.add(() => { this.result = result; this.close(); });
        this.addBtn(btn);
        return this;
    }
    showAndWaitResult() {
        return __awaiter(this, void 0, void 0, function* () {
            this.show();
            yield this.waitClose();
            return this.result;
        });
    }
}
exports.MessageBox = MessageBox;

},{"./I18n":1,"./utils":2}],4:[function(require,module,exports){
"use strict";
// file: Api.ts
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
	function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
	return new (P || (P = Promise))(function (resolve, reject) {
		function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
		function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
		function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
		step((generator = generator.apply(thisArg, _arguments || [])).next());
	});
};
Object.defineProperty(exports, "__esModule", { value: true });
const main_1 = require("./main");
const utils_1 = require("./utils");
/** API 操作 */
exports.api = new class {
	constructor() {
		this.storageUrlBase = '';
		this.debugSleep = main_1.settings.debug ? main_1.settings.apiDebugDelay : 0;
		this.defaultAuth = null;
		this.onTrackInfoChanged = new utils_1.Callbacks();
		this.onTrackDeleted = new utils_1.Callbacks();
	}
	get baseUrl() { return main_1.settings.apiBaseUrl; }
	_fetch(input, init) {
		return __awaiter(this, void 0, void 0, function* () {
			if (this.debugSleep)
				yield utils_1.utils.sleepAsync(this.debugSleep * (Math.random() + 1));
			return yield fetch(input, Object.assign({ credentials: 'same-origin' }, init));
		});
	}
	getHeaders(arg) {
		var _a;
		arg = arg || {};
		var headers = {};
		var auth = (_a = arg.auth) !== null && _a !== void 0 ? _a : this.defaultAuth;
		if (auth)
			headers['Authorization'] = auth;
		return headers;
	}
	get(path, options) {
		return __awaiter(this, void 0, void 0, function* () {
			options = options || {};
			var resp = yield this._fetch(this.baseUrl + path, {
				headers: Object.assign({}, this.getHeaders(options))
			});
			yield this.checkResp(options, resp);
			return yield resp.json();
		});
	}
	post(arg) {
		var _a;
		return __awaiter(this, void 0, void 0, function* () {
			var body = arg.obj;
			if (arg.mode === undefined)
				arg.mode = body !== undefined ? 'json' : 'empty';
			if (arg.mode === 'json')
				body = body !== undefined ? JSON.stringify(body) : undefined;
			else if (arg.mode === 'raw')
				void 0; // noop
			else if (arg.mode === 'empty')
				body = null;
			else
				throw new Error('Unknown arg.mode');
			var headers = this.getHeaders(arg);
			if (arg.mode === 'json')
				headers['Content-Type'] = 'application/json';
			headers = Object.assign(Object.assign({}, headers), arg.headers);
			var resp = yield this._fetch(this.baseUrl + arg.path, {
				body: body,
				method: (_a = arg.method) !== null && _a !== void 0 ? _a : 'POST',
				headers: headers
			});
			yield this.checkResp(arg, resp);
			var contentType = resp.headers.get('Content-Type');
			if (contentType && /^application\/json;?/.test(contentType))
				return yield resp.json();
			return null;
		});
	}
	put(arg) {
		return this.post(Object.assign(Object.assign({}, arg), { method: 'PUT' }));
	}
	delete(arg) {
		return this.post(Object.assign(Object.assign({}, arg), { method: 'DELETE' }));
	}
	upload(arg) {
		const ct = arg.cancelToken;
		if (ct) {
			var cb = ct.onCancelled.add(function () {
				xhr.abort();
			});
		}
		const xhr = new XMLHttpRequest();
		const whenXhrComplete = new Promise((resolve, reject) => {
			xhr.onload = ev => resolve();
			xhr.onerror = ev => reject("XHR error");
			xhr.onabort = ev => reject("XHR abort");
		});
		xhr.upload.onprogress = arg.onprogerss || null;
		xhr.open(arg.method, this.processUrl(arg.url));
		if (arg.auth)
			xhr.setRequestHeader('Authorization', arg.auth);
		if (arg.contentType)
			xhr.setRequestHeader('Content-Type', arg.contentType);
		xhr.send(arg.body);
		const complete = (function (checkStatus) {
			return __awaiter(this, void 0, void 0, function* () {
				try {
					yield whenXhrComplete;
				}
				finally {
					if (ct) {
						ct.onCancelled.remove(cb);
						ct.throwIfCancelled();
					}
				}
				if (checkStatus === undefined || checkStatus)
					if (xhr.status < 200 || xhr.status >= 300)
						throw new Error("HTTP status " + xhr.status);
				return xhr;
			});
		})();
		return {
			xhr,
			complete
		};
	}
	checkResp(options, resp) {
		return __awaiter(this, void 0, void 0, function* () {
			if (options.status !== false &&
				((options.status !== undefined && resp.status != options.status)
					|| resp.status >= 400)) {
				if (resp.status === 450) {
					try {
						var resperr = (yield resp.json()).error;
					}
					catch (_a) { }
					if (resperr)
						throw new Error(resperr);
				}
				throw new Error('HTTP status ' + resp.status);
			}
		});
	}
	getListAsync(id) {
		return __awaiter(this, void 0, void 0, function* () {
			return yield this.get('lists/' + id);
		});
	}
	getListIndexAsync() {
		return __awaiter(this, void 0, void 0, function* () {
			return yield this.get('lists/index');
		});
	}
	putListAsync(list, creating = false) {
		return __awaiter(this, void 0, void 0, function* () {
			return yield this.post({
				path: 'lists/' + list.id,
				method: creating ? 'POST' : 'PUT',
				obj: list,
			});
		});
	}
	getTrack(id) { return this.get('tracks/' + id); }
	getList(id) { return this.get('lists/' + id); }
	processUrl(url) {
		if (url.match('^(https?:/)?/'))
			return url;
		if (this.storageUrlBase && url.startsWith('storage/'))
			return this.storageUrlBase + url.substr(8);
		return this.baseUrl + url;
	}
};

},{"./main":24,"./utils":25}],5:[function(require,module,exports){
"use strict";
// file: discussion.ts
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
	function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
	return new (P || (P = Promise))(function (resolve, reject) {
		function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
		function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
		function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
		step((generator = generator.apply(thisArg, _arguments || [])).next());
	});
};
Object.defineProperty(exports, "__esModule", { value: true });
const UI_1 = require("./UI");
const Api_1 = require("./Api");
const viewlib_1 = require("./viewlib");
const utils_1 = require("./utils");
const User_1 = require("./User");
const ListContentView_1 = require("./ListContentView");
const Router_1 = require("./Router");
const MessageClient_1 = require("./MessageClient");
class CommentsView {
	constructor() {
		this.lazyView = new utils_1.Lazy(() => this.createContentView());
		this.state = false;
	}
	get view() { return this.lazyView.value; }
	fetch(slient) {
		return __awaiter(this, void 0, void 0, function* () {
			if (this.state === 'fetching' || this.state === 'waiting') {
				console.warn('another fetch task is running.');
				return;
			}
			this.state = 'waiting';
			var li = new viewlib_1.LoadingIndicator();
			if (!slient)
				this.view.useLoadingIndicator(li);
			try {
				yield User_1.user.waitLogin(true);
				this.state = 'fetching';
				var resp = yield Api_1.api.get(this.endpoint + '?reverse=1');
				this.view.useLoadingIndicator(null);
			}
			catch (error) {
				this.state = 'error';
				li.error(error, () => this.fetch());
				this.view.useLoadingIndicator(li);
				throw error;
			}
			const thiz = this;
			new class extends utils_1.DataUpdatingHelper {
				constructor() {
					super(...arguments);
					this.items = thiz.view.listView;
				}
				addItem(c, pos) { thiz.addItem(c, pos); }
				updateItem(view, c) { view.comment = c; }
				removeItem(view) { view.remove(); }
			}().update(resp.comments);
			this.view.updateView();
			this.state = 'fetched';
			if (this.eventName && !this.eventRegistered) {
				MessageClient_1.msgcli.listenEvent(this.eventName, () => {
					this.fetch(true);
				}, true);
				this.eventRegistered = true;
			}
		});
	}
	addItem(c, pos) {
		const comm = new CommentViewItem(c);
		if (c.uid === User_1.user.info.id || User_1.user.isAdmin)
			comm.onremove = () => {
				this.ioAction(() => Api_1.api.delete({
					path: this.endpoint + '/' + comm.comment.id
				}));
			};
		return this.view.listView.add(comm, pos);
	}
	ioAction(func) {
		return __awaiter(this, void 0, void 0, function* () {
			var li = new viewlib_1.LoadingIndicator({ content: utils_1.I `Submitting` });
			this.view.useLoadingIndicator(li);
			yield li.action(() => __awaiter(this, void 0, void 0, function* () {
				yield func();
				yield this.fetch();
			}));
		});
	}
	post(content) {
		return __awaiter(this, void 0, void 0, function* () {
			yield this.ioAction(() => Api_1.api.post({
				path: this.endpoint + '/new',
				obj: {
					content: content
				}
			}));
		});
	}
	createContentView() {
		var _a;
		var view = new CommentsContentView(this);
		view.title = (_a = this.title) !== null && _a !== void 0 ? _a : utils_1.I `Comments`;
		return view;
	}
}
class CommentsContentView extends ListContentView_1.ListContentView {
	constructor(comments) {
		super();
		this.comments = comments;
	}
	appendHeader() {
		super.appendHeader();
		this.dom.appendView(this.editorNew = new CommentEditor());
		this.editorNew.dom.classList.add('comment-editor-new');
		this.editorNew.onsubmit = (editor) => {
			var content = editor.content;
			editor.content = '';
			if (content === '')
				return;
			this.comments.post(content);
		};
		this.refreshBtn.onclick = () => {
			this.comments.fetch();
		};
	}
	appendListView() {
		super.appendListView();
		if (!this.comments.state)
			this.comments.fetch();
	}
}
exports.discussion = new class extends CommentsView {
	constructor() {
		super(...arguments);
		this.endpoint = 'discussion';
		this.eventName = 'diss-changed';
	}
	init() {
		this.title = utils_1.I `Discussion`;
		this.sidebarItem = new UI_1.SidebarItem({ text: utils_1.I `Discussion` });
		Router_1.router.addRoute({
			path: ['discussion'],
			sidebarItem: () => this.sidebarItem,
			contentView: () => this.lazyView.value
		});
		UI_1.ui.sidebarList.addFeatureItem(this.sidebarItem);
		User_1.user.onSwitchedUser.add(() => {
			this.sidebarItem.hidden = User_1.user.state != 'logged';
		})();
	}
};
exports.notes = new class extends CommentsView {
	constructor() {
		super(...arguments);
		this.endpoint = 'my/notes';
		this.eventName = 'note-changed';
	}
	init() {
		this.title = utils_1.I `Notes`;
		this.sidebarItem = new UI_1.SidebarItem({ text: utils_1.I `Notes` }).bindContentView(() => this.view);
		Router_1.router.addRoute({
			path: ['notes'],
			sidebarItem: () => this.sidebarItem,
			contentView: () => this.lazyView.value
		});
		UI_1.ui.sidebarList.addFeatureItem(this.sidebarItem);
		User_1.user.onSwitchedUser.add(() => {
			if (this.state && exports.notes.state !== 'waiting')
				this.fetch();
		});
		User_1.user.onSwitchedUser.add(() => {
			this.sidebarItem.hidden = User_1.user.state != 'logged';
		})();
	}
};
exports.comments = new class {
	init() {
		Router_1.router.addRoute({
			path: ['track-comments'],
			onNav: ({ remaining }) => {
				var id = parseInt(remaining[0]);
				UI_1.ui.sidebarList.setActive(null);
				var comments = new CommentsView();
				comments.endpoint = "tracks/" + id + "/comments";
				UI_1.ui.content.setCurrent(comments.view);
			}
		});
	}
};
class CommentViewItem extends viewlib_1.ListViewItem {
	constructor(comment) {
		super();
		this.onContextMenu = (item, ev) => {
			ev.preventDefault();
			var m = new viewlib_1.ContextMenu([
				new viewlib_1.MenuInfoItem({ text: utils_1.I `Comment ID` + ': ' + this.comment.id })
			]);
			if (this.onremove) {
				m.add(new viewlib_1.MenuItem({ text: utils_1.I `Remove`, cls: 'dangerous', onclick: () => { this.onremove(this); } }), 0);
			}
			if (this.onedit) {
				m.add(new viewlib_1.MenuItem({ text: utils_1.I `Edit`, onclick: () => { this.onedit(this); } }), 0);
			}
			m.show({ ev: ev });
		};
		this.comment = comment;
	}
	get id() { return this.comment.id; }
	createDom() {
		return {
			_ctx: this,
			tag: 'div.item.comment.no-transform',
			child: [
				{ tag: 'div.username', text: () => this.comment.username },
				{ tag: 'div.date', text: () => utils_1.utils.formatDateTime(new Date(this.comment.date)) },
				{ tag: 'div.content', text: () => this.comment.content }
			]
		};
	}
}
class CommentEditor extends viewlib_1.View {
	get content() { this.ensureDom(); return this.domcontent.value; }
	set content(val) { this.ensureDom(); this.domcontent.value = val; }
	createDom() {
		return {
			_ctx: this,
			tag: 'div.comment-editor',
			child: [
				{ tag: 'textarea.input-text.content', _key: 'domcontent' },
				{ tag: 'div.btn.submit', textContent: utils_1.I `Submit`, _key: 'domsubmit' }
			]
		};
	}
	postCreateDom() {
		this.domcontent.addEventListener('keydown', (ev) => {
			if (ev.ctrlKey && ev.keyCode === 13) {
				this.onsubmit(this);
			}
		});
		this.domsubmit.addEventListener('click', () => {
			this.onsubmit(this);
		});
	}
}

},{"./Api":4,"./ListContentView":7,"./MessageClient":12,"./Router":15,"./UI":20,"./User":22,"./utils":25,"./viewlib":26}],6:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const I18n_1 = require("@yuuza/webfx/lib/I18n");
exports.I18n = I18n_1.I18n;
exports.i18n = I18n_1.i18n;
exports.I = I18n_1.I;
// Use JSON.parse(a_big_json) for faster JavaScript runtime parsing
I18n_1.i18n.add2dArray(JSON.parse(`[
	["en", "zh"],
	["English", "中文"],
	["Language: {0}", "语言：{0}"],
	[" (auto-detected)", "（自动检测）"],
	["Reload to fully apply changes", "刷新以完全应用更改"],
	["Pin", "固定"],
	["Unpin", "浮动"],
	["Pause", "暂停"],
	["Pause...", "暂停..."],
	["Play", "播放"],
	[" (logging in...)", " （登录中...）"],
	["Guest (click to login)", "游客（点击登录）"],
	["Login", "登录"],
	["Create account", "创建账户"],
	["Close", "关闭"],
	["Username", "用户名"],
	["Password", "密码"],
	["Change password", "更改密码"],
	["New password", "新密码"],
	["Confirm password", "确认密码"],
	["Requesting...", "请求中……"],
	[" (error!)", "（错误！）"],
	["Username or password is not correct.", "用户名或密码不正确。"],
	["Logged in with previous working account.", "已登录为之前的用户。"],
	["Please input the username!", "请输入用户名！"],
	["Please input the password!", "请输入密码！"],
	["Please input the new password!", "请输入新密码！"],
	["Password confirmation does not match!", "确认密码不相同！"],
	["Playlist", "播放列表"],
	["Playlists", "播放列表"],
	["New Playlist", "新建播放列表"],
	["New Playlist ({0})", "新播放列表（{0}）"],
	["Click to edit", "点击编辑"],
	["(Empty)", "（空）"],
	["Logging in", "登录中"],
	["Loading", "加载中"],
	["Oh no! Something just goes wrong:", "发生错误："],
	["[Click here to retry]", "[点击重试]"],
	["My Uploads", "我的上传"],
	["Click here to select files to upload", "点此选择文件并上传"],
	["or drag files to this zone...", "或拖放文件到此处..."],
	["Comments", "评论"],
	["Remove", "移除"],
	["Remove {0} tracks","移除 {0} 首歌曲"],
	["List ID", "列表 ID"],
	["Track ID", "歌曲 ID"],
	["Name", "名称"],
	["Artist", "艺术家"],
	["Duration", "时长"],
	["Size", "大小"],
	["Search", "搜索"],
	["Discussion", "灌水区"],
	["Notes", "便签"],
	["Submit", "提交"],
	["Submitting", "提交中"],
	["Download", "下载"],
	["Convert", "转换"],
	["Converting \\"{0}\\"...", "正在转换 \\"{0}\\"..."],
	["Error converting \\"{0}\\".", "转换 \\"{0}\\" 时发生错误."],
	["Edit", "编辑"],
	["Discard", "放弃更改"],
	["Done", "完成"],
	["Save", "保存"],
	["Saving...", "保存中..."],
	["Error", "错误"],
	["User {0}", "用户 {0}"],
	["You've logged in as \\"{0}\\".", "你已登录为 \\"{0}\\"。"],
	["Switch user", "切换用户"],
	["Logout", "注销"],
	["Logging out...", "正在注销..."],
	["Failed to create playlist \\"{0}\\".", "创建播放列表 \\"{0}\\" 失败。"],
	["Failed to sync playlist \\"{0}\\".", "同步播放列表 \\"{0}\\" 失败。"],
	["Login to create playlists.", "登录以创建播放列表。"],
	["Failed to login.", "登录失败。"],
	["Failed to upload file \\"{0}\\".", "上传文件 \\"{0}\\" 失败。"],
	["Failed to remove track.", "移除歌曲失败。"],
	["Failed to logout.", "注销失败。"],
	["Player error:", "播放器错误："],
	["Removing of a uploading track is currently not supported.", "目前不支持移除上传中的歌曲。"],
	["Changing password...", "正在更改密码..."],
	["Failed to change password.", "更改密码失败。"],
	["Password changed successfully.", "已成功更改密码。"],
	["Server: ", "服务器："],
	["Volume", "音量"],
	["(Scroll whell or drag to adjust volume)", "（滚动滚轮或拖动调整音量）"],
	["Warning", "警告"],
	["Are you sure to delete the track permanently?", "确定要永久删除此歌曲吗？"],
	["Are you sure to delete {0} tracks permanently?", "确定要永久删除 {0} 首歌曲吗？"],
	["Question", "询问"],
	["Did you mean to upload 1 file?", "是否要上传 1 个文件？"],
	["Did you mean to upload {0} files?", "是否要上传 {0} 个文件？"],
	["Refresh", "刷新"],
	["Select", "选择"],
	["Select all", "全选"],
	["Cancel", "取消"],
	["Settings", "设置"],
	["Color theme: {0}", "配色主题：{0}"],
	["Preferred bitrate (0: original file)", "首选码率（0：原始文件）"],
	["Now Playing", "正在播放"],
	["Lyrics", "歌词"],
	["Edit Lyrics", "编辑歌词"],
	["Error parsing lyrics", "歌词解析错误"],
	["Source code", "源代码"],
	["Music Cloud", "Music Cloud"]
]`));
I18n_1.i18n.add2dArray([
	["_key_", "en", "zh"],
	["uploads_pending", "Pending", "队列中"],
	["uploads_uploading", "Uploading", "上传中"],
	["uploads_processing", "Processing", "处理中"],
	["uploads_error", "Error", "错误"],
	["uploads_done", "Done", "完成"],
	["prev_track", "Prev", "上一首"],
	["next_track", "Next", "下一首"],
	["loopmode_list-seq", "List-seq", "顺序播放"],
	["loopmode_list-loop", "List-loop", "列表循环"],
	["loopmode_track-loop", "Track-loop", "单曲循环"],
	["msgbox_no", "No", "否"],
	["msgbox_yes", "Yes", "是"],
	["msgbox_ok", "OK", "确定"],
	["msgbox_cancel", "Cancel", "取消"],
	["colortheme_light", "light", "亮色"],
	["colortheme_dark", "dark", "暗色"],
]);

},{"@yuuza/webfx/lib/I18n":1}],7:[function(require,module,exports){
"use strict";
// file: ListContentView.ts
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
	function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
	return new (P || (P = Promise))(function (resolve, reject) {
		function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
		function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
		function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
		step((generator = generator.apply(thisArg, _arguments || [])).next());
	});
};
Object.defineProperty(exports, "__esModule", { value: true });
const viewlib_1 = require("./viewlib");
const utils_1 = require("./utils");
const UI_1 = require("./UI");
class DataBackedListViewItem extends viewlib_1.ListViewItem {
	constructor(data) {
		super();
		this.data = data;
	}
}
class DataBackedListView extends viewlib_1.ListView {
	constructor() {
		super(...arguments);
		/** Do NOT modify this array directly, use {add,remove}Data methods instead. */
		this.dataList = [];
	}
	addData(data) {
		this.dataList.push(data);
		if (this._dom)
			this.add(this.createListViewItem(data));
	}
	removeData(pos) {
		var [d] = this.dataList.splice(pos, 1);
		if (this._dom)
			this.remove(pos);
		return d;
	}
	createListViewItem(data) {
		return new DataBackedListViewItem(data);
	}
	postCreateDom() {
		super.postCreateDom();
		this.dataList.forEach(data => this.add(this.createListViewItem(data)));
	}
}
class ListContentView extends UI_1.ContentView {
	get rendered() { return this.domCreated; }
	get canMultiSelect() { return this._canMultiSelect; }
	set canMultiSelect(v) {
		this._canMultiSelect = v;
		if (this.selectBtn)
			this.selectBtn.hidden = !this.canMultiSelect;
		if (this.listView)
			this.listView.selectionHelper.ctrlForceSelect = this.canMultiSelect;
	}
	createDom() {
		return utils_1.utils.buildDOM({ tag: 'div.listcontentview' });
	}
	postCreateDom() {
		super.postCreateDom();
		this.appendHeader();
		this.appendScrollBox();
	}
	createHeader() {
		return new UI_1.ContentHeader({ title: this.title });
	}
	appendHeader() {
		this.header = this.createHeader();
		this.header.actions.addView(this.refreshBtn = new UI_1.ActionBtn({ text: utils_1.I `Refresh` }));
		this.header.actions.addView(this.selectAllBtn = new UI_1.ActionBtn({ text: utils_1.I `Select all` }));
		this.header.actions.addView(this.selectBtn = new UI_1.ActionBtn({ text: utils_1.I `Select` }));
		this.selectBtn.onclick = () => {
			this.listView.selectionHelper.enabled = !this.listView.selectionHelper.enabled;
		};
		this.selectAllBtn.onclick = () => {
			this.listView.forEach(x => this.listView.selectionHelper.toggleItemSelection(x, true));
		};
		this.dom.appendView(this.header);
	}
	appendScrollBox() {
		this.scrollBox = this.createScrollBox();
		this.appendView(this.scrollBox);
		this.appendListView();
	}
	createScrollBox() {
		return new viewlib_1.View({ tag: 'div.scrollbox' });
	}
	appendListView() {
		this.listView = new viewlib_1.ListView({ tag: 'ul.listview' });
		this.listView.selectionHelper.onEnabledChanged.add(() => {
			this.selectBtn.hidden = !this.canMultiSelect && !this.listView.selectionHelper.enabled;
			this.selectBtn.text = this.listView.selectionHelper.enabled ? utils_1.I `Cancel` : utils_1.I `Select`;
			this.selectAllBtn.hidden = !this.listView.selectionHelper.enabled;
		})();
		this.listView.selectionHelper.ctrlForceSelect = this.canMultiSelect;
		this.scrollBox.appendView(this.listView);
	}
	onShow() {
		super.onShow();
		this.ensureDom();
	}
	onRemove() {
		super.onRemove();
	}
	useLoadingIndicator(li) {
		if (li !== this.loadingIndicator) {
			if (this.rendered) {
				if (this.loadingIndicator)
					this.loadingIndicator.dom.remove();
				if (li)
					this.insertLoadingIndicator(li);
			}
			this.loadingIndicator = li;
		}
		this.updateView();
	}
	insertLoadingIndicator(li) {
		this.scrollBox.dom.insertBefore(li.dom, this.listView.dom);
	}
	updateView() {
		if (!this.rendered)
			return;
		if (this.listView.length === 0) {
			if (!this.loadingIndicator) {
				this.emptyIndicator = this.emptyIndicator || new viewlib_1.LoadingIndicator({ state: 'normal', content: utils_1.I `(Empty)` });
				this.useLoadingIndicator(this.emptyIndicator);
			}
		}
		else {
			if (this.emptyIndicator && this.loadingIndicator === this.emptyIndicator) {
				this.useLoadingIndicator(null);
			}
		}
	}
	loadingAction(func) {
		return __awaiter(this, void 0, void 0, function* () {
			var li = this.loadingIndicator || new viewlib_1.LoadingIndicator();
			this.useLoadingIndicator(li);
			try {
				yield func();
			}
			catch (error) {
				li.error(error, () => this.loadingAction(func));
				throw error;
			}
			this.useLoadingIndicator(null);
		});
	}
}
exports.ListContentView = ListContentView;
;

},{"./UI":20,"./utils":25,"./viewlib":26}],8:[function(require,module,exports){
"use strict";
// file: ListIndex.ts
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
	function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
	return new (P || (P = Promise))(function (resolve, reject) {
		function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
		function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
		function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
		step((generator = generator.apply(thisArg, _arguments || [])).next());
	});
};
Object.defineProperty(exports, "__esModule", { value: true });
const viewlib_1 = require("./viewlib");
const utils_1 = require("./utils");
const TrackList_1 = require("./TrackList");
const User_1 = require("./User");
const Router_1 = require("./Router");
const UI_1 = require("./UI");
const PlayerCore_1 = require("./PlayerCore");
const Api_1 = require("./Api");
const Uploads_1 = require("./Uploads");
class ListIndex {
	constructor() {
		this.loadedList = {};
		this.loadIndicator = new viewlib_1.LoadingIndicator();
		this.playing = null;
		this.nextId = -100;
		this.listView = new viewlib_1.ListView({ tag: 'ul' });
		this.listView.dragging = true;
		this.listView.moveByDragging = true;
		this.listView.onItemMoved = (item, from) => {
			User_1.user.setListids(this.listView.map(l => l.listInfo.id));
		};
		this.listView.onDragover = (arg) => {
			const src = arg.source;
			const data = arg.event.dataTransfer;
			if (!data)
				return;
			if (src instanceof TrackList_1.TrackViewItem) {
				arg.accept = true;
				data.dropEffect = 'copy';
				if (arg.drop) {
					const list = this.getList(arg.target.listInfo.id);
					if (list.fetching)
						list.fetching.then(r => {
							for (const item of arg.sourceItems) {
								list.addTrack(item.track.toApiTrack(), arg.event.altKey ? undefined : 0);
							}
							return list.put();
						}).catch(err => {
							console.error('error adding track:', err);
						});
				}
			}
			else if (data.files.length > 0) {
				data.effectAllowed = 'copy';
				arg.accept = true;
				if (arg.drop) {
					const list = this.getList(arg.target.listInfo.id);
					for (let i = 0; i < data.files.length; i++) {
						const file = data.files[i];
						Uploads_1.uploads.uploadFile(file).then((track) => __awaiter(this, void 0, void 0, function* () {
							if (!track)
								return;
							if (list.fetching)
								yield list.fetching;
							list.addTrack(track.toApiTrack(), arg.event.altKey ? undefined : 0);
							yield list.put();
						})).catch(err => {
							console.error('error adding track:', err);
						});
					}
				}
			}
		};
		this.listView.onItemClicked = (item) => {
			if (UI_1.ui.sidebarList.currentActive.current === item)
				return;
			UI_1.ui.sidebarList.setActive(item);
			this.showTracklist(item.listInfo.id);
		};
		this.section = new viewlib_1.Section({
			title: utils_1.I `Playlists`,
			content: this.listView,
			actions: [{
					text: '➕',
					onclick: () => {
						this.newTracklist();
					}
				}]
		});
	}
	init() {
		PlayerCore_1.playerCore.onTrackChanged.add(() => {
			var _a, _b, _c, _d, _e, _f;
			var curPlaying = (_c = (_b = (_a = PlayerCore_1.playerCore.track) === null || _a === void 0 ? void 0 : _a._bind) === null || _b === void 0 ? void 0 : _b.list) !== null && _c !== void 0 ? _c : null;
			if (curPlaying != this.playing) {
				if (curPlaying === null || curPlaying === void 0 ? void 0 : curPlaying.id)
					(_d = this.getViewItem(curPlaying.id)) === null || _d === void 0 ? void 0 : _d.updateWith({ playing: true });
				if ((_e = this.playing) === null || _e === void 0 ? void 0 : _e.id)
					(_f = this.getViewItem(this.playing.id)) === null || _f === void 0 ? void 0 : _f.updateWith({ playing: false });
				this.playing = curPlaying;
			}
		});
		Api_1.api.onTrackInfoChanged.add((newer) => {
			for (const id in this.loadedList) {
				if (this.loadedList.hasOwnProperty(id)) {
					const list = this.loadedList[id];
					list.tracks.forEach(t => {
						if (t.id === newer.id) {
							list.updateTrackInfo(t, newer);
						}
					});
				}
			}
		});
		Api_1.api.onTrackDeleted.add((deleted) => {
			for (const id in this.loadedList) {
				if (this.loadedList.hasOwnProperty(id)) {
					const list = this.loadedList[id];
					list.tracks.forEach(t => {
						if (t.id === deleted.id) {
							list.remove(t, false);
						}
					});
				}
			}
		});
		UI_1.ui.sidebarList.container.appendView(this.section);
		Router_1.router.addRoute({
			path: ['list'],
			onNav: (arg) => __awaiter(this, void 0, void 0, function* () {
				yield User_1.user.waitLogin(false);
				var id = window.parseInt(arg.remaining[0]);
				var list = this.getList(id);
				UI_1.ui.content.setCurrent(list.createView());
				UI_1.ui.sidebarList.setActive(this.getViewItem(id));
			})
		});
		Router_1.router.addRoute({
			path: [''],
			onNav: (arg) => __awaiter(this, void 0, void 0, function* () {
				if (yield User_1.user.waitLogin(false)) {
					if (this.listView.length > 0)
						Router_1.router.nav(['list', this.listView.get(0).listInfo.id.toString()], false);
				}
			})
		});
	}
	setIndex(index) {
		var _a;
		this.listView.clear();
		for (const item of (_a = index === null || index === void 0 ? void 0 : index.lists) !== null && _a !== void 0 ? _a : []) {
			this.addListInfo(item);
		}
	}
	addListInfo(listinfo) {
		var _a, _b, _c, _d;
		var item = new ListIndexViewItem({
			index: this, listInfo: listinfo,
			playing: listinfo.id === ((_c = (_b = (_a = PlayerCore_1.playerCore.track) === null || _a === void 0 ? void 0 : _a._bind) === null || _b === void 0 ? void 0 : _b.list) === null || _c === void 0 ? void 0 : _c.id)
		});
		this.listView.add(item);
		var curContent = UI_1.ui.content.current;
		if (curContent instanceof TrackList_1.TrackListView && ((_d = curContent.list) === null || _d === void 0 ? void 0 : _d.id) === listinfo.id)
			UI_1.ui.sidebarList.setActive(item);
	}
	getListInfo(id) {
		var _a;
		return (_a = this.getViewItem(id)) === null || _a === void 0 ? void 0 : _a.listInfo;
	}
	getList(id) {
		var list = this.loadedList[id];
		if (!list) {
			list = new TrackList_1.TrackList();
			const listInfo = this.getListInfo(id);
			if (!listInfo)
				throw new Error('cannot find list info');
			list.loadInfo(listInfo);
			if (list.apiid) {
				list.fetch();
			}
			else {
				list.loadEmpty();
			}
			this.loadedList[id] = list;
		}
		return list;
	}
	getViewItem(id) {
		return this.listView.find(lvi => lvi.listInfo.id === id);
	}
	showTracklist(id) {
		Router_1.router.nav(['list', id.toString()]);
	}
	onrename(id, newName) {
		var lvi = this.getViewItem(id);
		lvi.listInfo.name = newName;
		lvi.updateDom();
	}
	removeList(id) {
		var _a;
		return __awaiter(this, void 0, void 0, function* () {
			if (id < 0) {
				id = yield this.getList(id).getRealId();
			}
			yield Api_1.api.delete({
				path: 'my/lists/' + id
			});
			(_a = this.getViewItem(id)) === null || _a === void 0 ? void 0 : _a.remove();
			const curContent = UI_1.ui.content.current;
			if (curContent instanceof TrackList_1.TrackListView && curContent.list.id === id) {
				UI_1.ui.content.setCurrent(null);
			}
		});
	}
	/**
	 * Create a Tracklist with an temporary local ID (negative number).
	 * It should be sync to server and get a real ID later.
	 */
	newTracklist() {
		return __awaiter(this, void 0, void 0, function* () {
			if (!(yield User_1.user.waitLogin(false))) {
				this._toastLogin = this._toastLogin || new viewlib_1.Toast({ text: utils_1.I `Login to create playlists.` });
				this._toastLogin.show(3000);
				return;
			}
			var id = this.nextId--;
			var list = {
				id,
				name: utils_1.utils.createName((x) => x ? utils_1.I `New Playlist (${x + 1})` : utils_1.I `New Playlist`, (x) => !!this.listView.find((l) => l.listInfo.name === x))
			};
			this.addListInfo(list);
			var listview = this.getList(id);
			listview.postToUser().then(() => {
				list.id = listview.apiid;
			}, (err) => {
				viewlib_1.Toast.show(utils_1.I `Failed to create playlist "${list.name}".` + '\n' + err, 5000);
			});
		});
	}
}
exports.ListIndex = ListIndex;
class ListIndexViewItem extends UI_1.SidebarItem {
	constructor(init) {
		super({});
		this.playing = false;
		this.onContextMenu = (item, ev) => {
			var m = new viewlib_1.ContextMenu();
			if (this.index && this.listInfo)
				m.add(new viewlib_1.MenuItem({
					text: utils_1.I `Remove`, cls: 'dangerous',
					onclick: () => {
						this.index.removeList(this.listInfo.id);
					}
				}));
			if (this.listInfo)
				m.add(new viewlib_1.MenuInfoItem({
					text: utils_1.I `List ID` + ': ' + this.listInfo.id
				}));
			if (m.length) {
				ev.preventDefault();
				m.show({ ev: ev });
			}
		};
		utils_1.utils.objectApply(this, init);
	}
	createDom() {
		return {
			tag: 'li.item.no-selection',
			style: 'display: flex',
			tabIndex: 0,
			child: [
				{ tag: 'span.name.flex-1', text: () => { var _a, _b; return (_b = (_a = this.listInfo) === null || _a === void 0 ? void 0 : _a.name) !== null && _b !== void 0 ? _b : this.text; } },
				{
					tag: 'span.state', style: 'margin-left: .5em; font-size: 80%;',
					update: (dom) => {
						dom.textContent = this.playing ? "🎵" : "";
						dom.hidden = !dom.textContent;
					},
				}
			]
		};
	}
}
exports.ListIndexViewItem = ListIndexViewItem;
exports.listIndex = new ListIndex();

},{"./Api":4,"./PlayerCore":14,"./Router":15,"./TrackList":19,"./UI":20,"./Uploads":21,"./User":22,"./utils":25,"./viewlib":26}],9:[function(require,module,exports){
"use strict";
// file: Lyrics.ts
Object.defineProperty(exports, "__esModule", { value: true });
function parse(str) {
	var time = new Date().getTime();
	var r = new Parser(str).parse();
	console.log(`Lyrics: parsed ${str.length} chars in ${new Date().getTime() - time} ms`);
	console.log(r);
	return r;
}
exports.parse = parse;
class LookaheadBuffer {
	constructor() {
		this.consumed = 0;
		this.buf = [];
	}
	consume() {
		var item = this.peek(0);
		this.buf.shift();
		this.consumed++;
		return item;
	}
	peek(i) {
		if (i === undefined)
			i = 0;
		while (this.buf.length <= i) {
			this.buf.push(this.provider());
		}
		return this.buf[i];
	}
}
const TAGBEGIN = '['.charCodeAt(0);
const TAGEND = ']'.charCodeAt(0);
const BRACKETBEGIN = '{'.charCodeAt(0);
const BRACKETEND = '}'.charCodeAt(0);
const NOTLINEFEED = '\r'.charCodeAt(0);
const LINEFEED = '\n'.charCodeAt(0);
const mapCharToken = {
	[TAGBEGIN]: 1 /* tagBegin */,
	[TAGEND]: 2 /* tagEnd */,
	[BRACKETBEGIN]: 3 /* bracketBegin */,
	[BRACKETEND]: 4 /* bracketEnd */,
	[NOTLINEFEED]: null,
	[LINEFEED]: 6 /* lineFeed */
};
class Lexer {
	constructor(str) {
		this.buf = new LookaheadBuffer();
		this.cur = 0;
		this.str = str;
		this.buf.provider = () => {
			return this.read();
		};
	}
	get len() { return this.str.length; }
	toArray() {
		for (var i = 0; this.buf.peek(i).type !== 7 /* eof */; i++) { }
		return this.buf.buf.map(x => x);
	}
	read() {
		var token = this.readCore();
		// console.debug('token', token, this.cur);
		this.lastToken = token;
		return token;
	}
	readCore() {
		var str = this.str;
		var begin = this.cur;
		var cur = this.cur;
		try {
			if (cur === str.length)
				return new Token(7 /* eof */, 'eof', cur);
			while (true) {
				var ch = str.charCodeAt(cur);
				var chCur = cur++;
				if (!(ch >= 0))
					return new Token(7 /* eof */, 'eof', chCur);
				const tokenType = mapCharToken[ch];
				if (tokenType !== undefined) {
					if (tokenType === null)
						continue; // ignore charater
					return new Token(tokenType, ch, chCur);
				}
				while (true) {
					ch = str.charCodeAt(cur);
					if (!(ch >= 0) || mapCharToken[ch] !== undefined)
						break;
					cur++;
				}
				;
				return new Token(5 /* text */, str.substring(begin, cur), begin);
			}
		}
		finally {
			this.cur = cur;
		}
	}
	peek(pos) { return this.buf.peek(pos); }
	consume() { return this.buf.consume(); }
	tryExpect(type, pos) {
		var t = this.peek(pos);
		if (t.type === type)
			return t;
		return null;
	}
	tryExpectSeq(types) {
		var i = 0;
		for (const t of types) {
			if (!this.tryExpect(t, i++))
				return false;
		}
		return true;
	}
	expect(type) {
		var t = this.tryExpect(type);
		if (!t)
			this.error(`expected token type '${TokenTypeEnum[type]}'`);
		return t;
	}
	error(msg) {
		throw new Error((msg !== null && msg !== void 0 ? msg : 'error') + ' at ' + this.peek());
	}
	tryExpectAndConsume(type) {
		return this.tryExpect(type) && this.consume();
	}
	expectAndConsume(type) {
		this.expect(type);
		return this.consume();
	}
}
var TokenTypeEnum;
(function (TokenTypeEnum) {
	TokenTypeEnum[TokenTypeEnum['tagBegin'] = 1] = 'tagBegin';
	TokenTypeEnum[TokenTypeEnum['tagEnd'] = 2] = 'tagEnd';
	TokenTypeEnum[TokenTypeEnum['bracketBegin'] = 3] = 'bracketBegin';
	TokenTypeEnum[TokenTypeEnum['bracketEnd'] = 4] = 'bracketEnd';
	TokenTypeEnum[TokenTypeEnum['text'] = 5] = 'text';
	TokenTypeEnum[TokenTypeEnum['lineFeed'] = 6] = 'lineFeed';
	TokenTypeEnum[TokenTypeEnum['eof'] = 7] = 'eof';
})(TokenTypeEnum || (TokenTypeEnum = {}));
class Token {
	constructor(type, val, pos) {
		this.type = type;
		this.val = typeof val === 'number' ? String.fromCharCode(val) : val;
		this.pos = pos;
	}
	toString() {
		return `{${TokenTypeEnum[this.type]}|${this.val}}`;
	}
}
class Parser {
	constructor(str) {
		this.lines = [];
		this.bpm = null;
		this.offset = 0;
		this.curTime = 0;
		this.lang = '';
		this.tlang = '';
		this.lex = new Lexer(str);
		this.tokens = this.lex.buf;
	}
	parse() {
		var lex = this.lex;
		var lastpos;
		this.skipLineFeeds();
		while (lex.peek().type !== 7 /* eof */) {
			lastpos = lex.buf.consumed;
			this.parseLine();
			this.skipLineFeeds();
			if (lex.buf.consumed === lastpos) {
				this.parseLine();
				lex.error('parseLine() doesn\'t consume tokens');
			}
		}
		this.lines.sort((a, b) => {
			return a.orderTime - b.orderTime;
		});
		return {
			lines: this.lines,
			lang: this.lang,
			translationLang: this.tlang,
			bpm: this.bpm
		};
	}
	parseLine() {
		var _a;
		var lex = this.lex;
		var startTime = null;
		var duplicateTime = [];
		var spans = [];
		var trans = null;
		var lastSpan = null;
		var curTime = null;
		var timeStamp = null;
		while (true) {
			if (lex.tryExpect(1 /* tagBegin */)) {
				var beginTag = lex.consume();
				let text = null;
				let ts;
				if (lex.tryExpectAndConsume(2 /* tagEnd */)) {
					ts = { time: -1, beats: null, beatsDiv: null };
				}
				else {
					text = lex.expectAndConsume(5 /* text */).val;
					ts = this.parseTimestamp(text, (curTime != null && curTime >= 0) ? curTime : ((_a = this.curTime) !== null && _a !== void 0 ? _a : 0));
					if (ts != null)
						lex.expectAndConsume(2 /* tagEnd */);
				}
				if (ts != null) {
					if (!lastSpan && startTime != null) {
						duplicateTime.push(ts);
					}
					else {
						if (timeStamp) {
							spans.push(lastSpan = { text: '', ruby: null, startTime: curTime, timeStamp });
						}
						timeStamp = ts;
						if (ts.time != -1) {
							curTime = ts.time;
							if (startTime === null)
								startTime = ts.time;
						}
					}
					continue;
				}
				if (text === null)
					continue;
				if (lex.tryExpectSeq([2 /* tagEnd */, 3 /* bracketBegin */])) {
					lex.consume();
					lex.consume();
					let ruby = lex.expectAndConsume(5 /* text */).val;
					lex.expectAndConsume(4 /* bracketEnd */);
					spans.push(lastSpan = { text, ruby, startTime: curTime, timeStamp });
					timeStamp = null;
				}
				else if (text.startsWith('bpm:')) {
					this.bpm = parseFloat(text.substr(4));
					lex.expectAndConsume(2 /* tagEnd */);
				}
				else if (text.startsWith('offset:')) {
					this.offset = parseFloat(text.substr(7)) / 1000;
					lex.expectAndConsume(2 /* tagEnd */);
				}
				else if (text.startsWith('lang:')) {
					let r = /^([\w\-]+)(\/([\w\-]+))?$/.exec(text.substr(5));
					if (r) {
						this.lang = r[1];
						this.tlang = r[3] || '';
					}
					lex.expectAndConsume(2 /* tagEnd */);
				}
				else {
					if (!lastSpan) {
						// unknown tag at the beginning of the line, so skip this line.
						this.skipLine();
						this.lines.push({
							startTime,
							orderTime: startTime !== null && startTime !== void 0 ? startTime : this.curTime,
							translation: null,
							spans: null,
							rawLine: lex.str.substring(beginTag.pos, lex.peek().pos)
						});
						return;
					}
					else {
						spans.push(lastSpan = { text: '[' + text + ']', ruby: null, startTime: curTime, timeStamp: null });
						if (lex.tryExpect(2 /* tagEnd */))
							lex.consume();
					}
				}
			}
			else if (lex.tryExpect(5 /* text */)) {
				let text = lex.consume().val;
				spans.push(lastSpan = { text, ruby: null, startTime: curTime, timeStamp });
				timeStamp = null;
			}
			else if (lex.tryExpect(6 /* lineFeed */)) {
				lex.consume();
				if (spans.length > 0 && lex.tryExpect(5 /* text */)) {
					let nextline = lex.peek().val;
					if (nextline.startsWith('/')) {
						trans = nextline.substr(1);
						lex.consume();
					}
				}
				break;
			}
			else if (lex.tryExpect(7 /* eof */)) {
				break;
			}
			else {
				this.skipLine();
				break;
			}
		}
		if (timeStamp) {
			spans.push(lastSpan = { text: '', ruby: null, startTime: curTime, timeStamp });
			timeStamp = null;
		}
		if (startTime === null && spans.length === 0)
			return;
		if (curTime != null)
			this.curTime = curTime;
		this.lines.push({
			startTime,
			orderTime: startTime !== null && startTime !== void 0 ? startTime : this.curTime,
			translation: trans,
			spans,
			rawLine: null
		});
		duplicateTime.forEach(t => {
			var offset = t.time - startTime;
			this.lines.push({
				startTime: t.time,
				orderTime: t.time,
				translation: trans,
				spans: spans.map(s => ({
					text: s.text,
					ruby: s.ruby,
					startTime: s.startTime >= 0 ? s.startTime + offset : s.startTime,
					timeStamp: !s.timeStamp ? null : {
						time: s.timeStamp.time >= 0 ? s.timeStamp.time + offset : s.timeStamp.time,
						beats: s.timeStamp.beats,
						beatsDiv: s.timeStamp.beatsDiv
					}
				})),
				rawLine: null
			});
		});
	}
	skipLine() {
		while (!(this.lex.tryExpect(6 /* lineFeed */) || this.lex.tryExpect(7 /* eof */)))
			this.lex.consume();
		this.lex.consume();
	}
	skipLineFeeds() {
		while (this.lex.tryExpect(6 /* lineFeed */))
			this.lex.consume();
	}
	parseTimestamp(str, curTime) {
		var match = /^((\d+)\:)?(\d+)(\.(\d+))?$/.exec(str);
		if (!curTime)
			curTime = 0;
		if (match) {
			let result = 0;
			if (match[2])
				result += parseInt(match[2]) * 60;
			if (match[3])
				result += parseInt(match[3]);
			if (match[4])
				result += parseFloat(match[4]);
			result += this.offset;
			if (result < 0)
				result = 0;
			return { time: result, beats: null, beatsDiv: null };
		}
		else if (match = /^b([\d\.]+)?(\/(\d+))?$/.exec(str)) {
			let result = { time: 60 / this.bpm, beats: 1, beatsDiv: 1 };
			if (match[1]) {
				result.beats = parseFloat(match[1]);
				result.time *= result.beats;
			}
			if (match[3]) {
				result.beatsDiv = parseInt(match[3]);
				result.time /= result.beatsDiv;
			}
			result.time += curTime;
			return result;
		}
		return null;
	}
}
exports.Parser = Parser;
function serialize(lyrics) {
	var str = '';
	var headersPending = !!lyrics.lang || lyrics.bpm != null;
	lyrics.lines.forEach(l => {
		if (l.spans && headersPending) {
			headersPending = false;
			if (lyrics.lang) {
				str += '[lang:' + lyrics.lang;
				if (lyrics.translationLang)
					str += '/' + lyrics.translationLang;
				str += ']\n';
			}
			if (lyrics.bpm != null) {
				str += '[bpm:' + lyrics.bpm + ']\n';
			}
			str += '\n';
		}
		if (l.rawLine) {
			str += l.rawLine;
		}
		else if (l.spans) {
			l.spans.forEach(s => {
				if (s.timeStamp) {
					if (s.timeStamp.beats != null) {
						str += '[b';
						if (s.timeStamp.beats != 1)
							str += s.timeStamp.beats;
						if (s.timeStamp.beatsDiv != 1)
							str += '/' + s.timeStamp.beatsDiv;
						str += ']';
					}
					else if (s.timeStamp.time === -1) {
						str += '[]';
					}
					else {
						str += '[' + s.timeStamp.time.toFixed(3) + ']';
					}
				}
				if (s.ruby != null) {
					str += '[' + s.text + ']{' + s.ruby + '}';
				}
				else {
					str += s.text;
				}
			});
			str += '\n';
		}
	});
	return str;
}
exports.serialize = serialize;

},{}],10:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const UI_1 = require("./UI");
const I18n_1 = require("./I18n");
const utils_1 = require("./utils");
const LyricsView_1 = require("./LyricsView");
const Router_1 = require("./Router");
const Lyrics_1 = require("./Lyrics");
const PlayerCore_1 = require("./PlayerCore");
const utils_2 = require("@yuuza/webfx/lib/utils");
exports.lyricsEdit = new class {
	startEdit(track, lyrics) {
		if (!this.view) {
			this.sidebarItem = new UI_1.SidebarItem({ text: I18n_1.I `Edit Lyrics` });
			this.view = new LyricsEditContentView();
			UI_1.ui.sidebarList.addFeatureItem(this.sidebarItem);
			Router_1.router.addRoute({
				path: ['lyricsEdit'],
				contentView: () => this.view,
				sidebarItem: () => this.sidebarItem
			});
		}
		this.sidebarItem.hidden = false;
		this.view.setTrack(track, lyrics);
		Router_1.router.nav('lyricsEdit');
	}
};
class LyricsEditContentView extends UI_1.ContentView {
	constructor() {
		super();
		this.header = new UI_1.ContentHeader({ title: I18n_1.I `Edit Lyrics` });
		this.lyricsView = new EditableLyricsView();
		this.track = null;
		this.lyricsString = null;
		this.lyricsScrollPos = 0;
		this.timer = new utils_1.Timer(() => this.onProgressChanged());
		this.lastTime = 0;
		this.lastChangedRealTime = 0;
		this.onProgressChanged = () => {
			if (!this.isTrackPlaying())
				return;
			var time = PlayerCore_1.playerCore.currentTime;
			var realTime = new Date().getTime();
			var timerOn = true;
			if (time != this.lastTime) {
				this.lastChangedRealTime = realTime;
				this.lyricsView.setCurrentTime(time, 'smooth');
			}
			if (realTime - this.lastChangedRealTime < 500)
				this.timer.timeout(16);
		};
		this.onResize = () => {
			this.lyricsView.resize();
			this.centerLyrics();
		};
		this.header.actions.addView(new UI_1.ActionBtn({
			text: I18n_1.I `Discard`,
			onclick: () => {
				this.close();
			}
		}));
		this.header.actions.addView(new UI_1.ActionBtn({
			text: I18n_1.I `Done`,
			onclick: () => {
				this.lyricsString = Lyrics_1.serialize(this.lyricsView.lyrics);
				this.close();
			}
		}));
	}
	close() {
		exports.lyricsEdit.sidebarItem.hidden = true;
		window.history.back();
		var trackDialog = this.track.startEdit();
		trackDialog.inputLyrics.value = this.lyricsString;
	}
	createDom() {
		return {
			tag: 'div.lyricsedit',
			child: [
				this.header,
				this.lyricsView
			]
		};
	}
	setTrack(track, lyrics) {
		this.track = track;
		this.lyricsString = lyrics;
		this.lyricsView.setLyrics(lyrics);
	}
	onShow() {
		this.ensureDom();
		this.shownEvents.add(PlayerCore_1.playerCore.onProgressChanged, this.onProgressChanged);
	}
	onDomInserted() {
		if (this.isTrackPlaying())
			this.lyricsView.setCurrentTime(PlayerCore_1.playerCore.currentTime);
		if (this.lyricsScrollPos) {
			this.lyricsView.dom.scrollTop = this.lyricsScrollPos;
		}
		requestAnimationFrame(this.onResize);
		window.addEventListener('resize', this.onResize);
	}
	onRemove() {
		super.onRemove();
		window.removeEventListener('resize', this.onResize);
		this.timer.tryCancel();
		this.lyricsScrollPos = this.lyricsView.dom.scrollTop;
	}
	isTrackPlaying() {
		return PlayerCore_1.playerCore.track && PlayerCore_1.playerCore.track === this.track && PlayerCore_1.playerCore.track.id === this.track.id;
	}
	centerLyrics() {
		if (PlayerCore_1.playerCore.state === 'playing')
			this.lyricsView.setCurrentTime(PlayerCore_1.playerCore.currentTime, 'force');
	}
}
class EditableLyricsView extends LyricsView_1.LyricsView {
	constructor() {
		super();
		this.nextSpans = [];
		this.onLyricsChanged.add(() => {
			this.lines.forEach(l => {
				var _a;
				if ((_a = l.spans) === null || _a === void 0 ? void 0 : _a.length) {
					let firstSpan = l.spans[0].span;
					if (!firstSpan.timeStamp) {
						firstSpan.timeStamp = { time: -1, beats: null, beatsDiv: null };
					}
					l.spans.forEach(s => {
						s.timeStamp && s.toggleClass('ts', true);
					});
				}
			});
			this.setNextSpans(this.getSpans());
		});
		this.onSpanClick.add((s) => {
			PlayerCore_1.playerCore.currentTime = utils_2.utils.numLimit(s.span.startTime - 3, 0, Infinity);
			this.setNextSpans(this.getSpans(s, 'here'));
		});
		this.dom.addEventListener('keydown', (ev) => {
			if (ev.code == 'ArrowRight' || ev.code == 'F' || ev.code == 'D') {
				ev.preventDefault();
				if (this.nextSpans.length) {
					const now = PlayerCore_1.playerCore.currentTime;
					this.nextSpans[0].timeStamp.time = now;
					this.nextSpans.forEach(s => {
						s.startTime = now;
					});
					if (this.nextSpans[0].position === 0) {
						this.nextSpans[0].lineView.line.startTime = now;
					}
				}
				let spans = this.getSpans(null, 'forward');
				if (spans.length)
					this.setNextSpans(spans);
			}
			else if (ev.code == 'ArrowLeft') {
				ev.preventDefault();
				let spans = this.getSpans(null, 'backward');
				if (spans.length)
					this.setNextSpans(spans);
			}
		});
		this.toggleClass('edit', true);
	}
	getSpans(span, go) {
		if (!span) {
			if (this.nextSpans.length) {
				span = this.nextSpans[go === 'backward' ? 0 : this.nextSpans.length - 1];
			}
			else {
				span = this.lines.get(0).spans[0];
			}
		}
		var colPos = span.position;
		var line = span.lineView;
		if (go == null || go === 'here') {
			while (line.spans && !line.spans[colPos].timeStamp) {
				if (colPos-- === 0) {
					line = this.lines.get(line.position - 1);
					colPos = line.length - 1;
				}
			}
		}
		else if (go === 'forward') {
			do {
				if (line && ++colPos === line.length) {
					line = this.lines.get(line.position + 1);
					colPos = 0;
				}
			} while (line && (line.spans && !line.spans[colPos].timeStamp));
		}
		else if (go === 'backward') {
			do {
				if (line && colPos-- === 0) {
					line = this.lines.get(line.position - 1);
					colPos = line.length - 1;
				}
			} while (line && (line.spans && !line.spans[colPos].timeStamp));
		}
		var spans = [];
		if (line) {
			do {
				spans.push(line.spans[colPos]);
				colPos++;
			} while (colPos < line.length && !line.spans[colPos].timeStamp);
		}
		return spans;
	}
	setNextSpans(spans) {
		while (this.nextSpans.length) {
			this.nextSpans.pop().isNext = false;
		}
		spans.forEach(s => {
			s.isNext = true;
			this.nextSpans.push(s);
		});
	}
}

},{"./I18n":6,"./Lyrics":9,"./LyricsView":11,"./PlayerCore":14,"./Router":15,"./UI":20,"./utils":25,"@yuuza/webfx/lib/utils":2}],11:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const viewlib_1 = require("./viewlib");
const utils_1 = require("./utils");
const Lyrics_1 = require("./Lyrics");
class LyricsView extends viewlib_1.View {
	constructor() {
		super(...arguments);
		this.lines = new viewlib_1.ContainerView({ tag: 'div.lyrics' });
		this.curLine = new viewlib_1.ItemActiveHelper();
		this.onSpanClick = new utils_1.Callbacks();
		this.onFontSizeChanged = new utils_1.Callbacks();
		this.onLyricsChanged = new utils_1.Callbacks();
		this._fontSize = 100;
	}
	createDom() {
		return {
			tag: 'div.lyricsview',
			tabIndex: 0,
			child: [
				this.lines
			]
		};
	}
	postCreateDom() {
		var startFontSize;
		var distance;
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
				var scale = utils_1.utils.numLimit(startFontSize * newdist / distance, 20, 500);
				this.scale = scale;
			}
		});
		function dist(a, b) {
			var dx = a.screenX - b.screenX;
			var dy = a.screenY - b.screenY;
			return Math.sqrt(dx * dx + dy * dy);
		}
		this.dom.addEventListener('wheel', (ev) => {
			if (ev.ctrlKey && ev.deltaY) {
				ev.preventDefault();
				var scale = this.scale + (ev.deltaY > 0 ? -20 : 20);
				scale = utils_1.utils.numLimit(scale, 20, 500);
				this.scale = scale;
			}
		});
	}
	setLyrics(lyrics) {
		try {
			if (typeof lyrics === 'string')
				lyrics = Lyrics_1.parse(lyrics);
		}
		catch (error) {
			console.error(error);
			lyrics = {
				lines: [{
						orderTime: 0,
						spans: [{
								text: utils_1.I `Error parsing lyrics`
							}]
					}]
			};
		}
		this.lyrics = lyrics;
		this.curLine.set(null);
		if (lyrics.lang)
			this.lines.dom.lang = lyrics.lang;
		else
			this.lines.dom.removeAttribute('lang');
		this.lines.removeAllView();
		lyrics.lines.forEach(l => {
			if (l.spans) {
				this.lines.addView(new LineView(l, this));
			}
		});
		this.onLyricsChanged.invoke();
		this.resize();
	}
	setCurrentTime(time, scroll) {
		if (!(time >= 0))
			time = 0;
		var prev = this.curLine.current;
		var line = this.getLineByTime(time, prev);
		line === null || line === void 0 ? void 0 : line.setCurrentTime(time);
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
			}
			else {
				this.lines.dom.style.margin = ((boxHeight - contentHeight) / 2) + 'px 0';
			}
		}
	}
	get scale() {
		return this._fontSize;
	}
	set scale(v) {
		this._fontSize = v;
		this.lines.dom.style.fontSize = v + '%';
		this.onFontSizeChanged.invoke();
	}
	getLineByTime(time, hint) {
		var line;
		if (hint && time >= hint.line.startTime) {
			line = hint;
			for (let i = hint.position + 1; i < this.lines.length; i++) {
				let x = this.lines.get(i);
				if (x.line.startTime != null) {
					if (x.line.startTime <= time) {
						line = x;
					}
					else {
						break;
					}
				}
			}
		}
		else {
			line = null;
			this.lines.forEach(x => {
				if (x.line.startTime != null && x.line.startTime <= time)
					line = x;
			});
		}
		return line;
	}
}
exports.LyricsView = LyricsView;
class LineView extends viewlib_1.ContainerView {
	constructor(line, lyricsView) {
		var _a;
		super({ tag: 'p.line' });
		this.line = line;
		this.lyricsView = lyricsView;
		this.line.spans.forEach(s => {
			this.addView(new SpanView(s, this));
		});
		if (this.line.translation) {
			var lyrics = (_a = this.lyricsView) === null || _a === void 0 ? void 0 : _a.lyrics;
			var tlang = lyrics && lyrics.translationLang || lyrics.lang;
			this.dom.appendChild(utils_1.utils.buildDOM({
				tag: 'div.trans',
				lang: tlang,
				text: this.line.translation
			}));
		}
	}
	get spans() { return this.items; }
	setCurrentTime(time) {
		this.spans.forEach(s => {
			s.toggleClass('active', s.span.startTime <= time);
		});
	}
}
exports.LineView = LineView;
class SpanView extends viewlib_1.View {
	constructor(span, lineView) {
		super();
		this.span = span;
		this.lineView = lineView;
	}
	get timeStamp() { return this.span.timeStamp; }
	set timeStamp(val) { this.span.timeStamp = val; }
	get startTime() { return this.span.startTime; }
	set startTime(val) { this.span.startTime = val; }
	get isNext() { return this.dom.classList.contains('next'); }
	set isNext(val) { this.toggleClass('next', val); }
	createDom() {
		var s = this.span;
		if (!s.ruby) {
			return utils_1.utils.buildDOM({
				tag: 'span.span', text: s.text
			});
		}
		else {
			return utils_1.utils.buildDOM({
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
exports.SpanView = SpanView;

},{"./Lyrics":9,"./utils":25,"./viewlib":26}],12:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const User_1 = require("./User");
const Api_1 = require("./Api");
const utils_1 = require("./utils");
exports.msgcli = new class {
	constructor() {
		this.ws = null;
		this.loginState = '';
		this.onConnected = new utils_1.Callbacks();
		this.onLogin = new utils_1.Callbacks();
		this.lastQueryId = 0;
		this.queries = {};
		this.events = {};
		this.permEvents = {};
	}
	get connected() { var _a; return ((_a = this.ws) === null || _a === void 0 ? void 0 : _a.readyState) === WebSocket.OPEN; }
	init() {
		User_1.user.onSwitchedUser.add(() => {
			if (this.connected && Api_1.api.defaultAuth)
				this.login(Api_1.api.defaultAuth);
		});
		this.onConnected.add(() => {
			if (User_1.user.state === 'logged')
				this.login(Api_1.api.defaultAuth);
			this.listenPermEvents();
		});
		this.connect();
	}
	listenPermEvents() {
		var eventlist = [];
		for (const key in this.permEvents) {
			if (this.permEvents.hasOwnProperty(key)) {
				this.events[key] = this.permEvents[key];
				eventlist.push(key);
			}
		}
		if (eventlist.length === 0)
			return;
		this.sendQuery({
			cmd: 'listenEvent',
			events: eventlist
		}, null);
	}
	getUrl() {
		var match = Api_1.api.baseUrl.match(/^(((https?):)?\/\/([\w\-\.:]))?(\/)?(.*)$/);
		if (!match)
			throw new Error('cannot generate websocket URL');
		var [_, _, protocol, _, host, pathroot, path] = match;
		protocol = protocol || window.location.protocol;
		host = host || window.location.host;
		protocol = protocol === 'https:' ? 'wss://' : 'ws://';
		path = pathroot ? '/' + path : window.location.pathname + path;
		return protocol + host + path + 'ws';
	}
	connect() {
		this.ws = new WebSocket(this.getUrl());
		this.ws.onopen = (ev) => {
			this.onConnected.invoke();
		};
		this.ws.onclose = (ev) => {
			console.warn('ws close', { code: ev.code, reason: ev.reason });
			this.ws = null;
			this.loginState = '';
			this.events = {};
			var queries = this.queries;
			for (const key in queries) {
				if (queries.hasOwnProperty(key)) {
					try {
						queries[key]({
							queryId: +key,
							resp: 'wsclose'
						});
					}
					catch (error) {
						console.error(error);
					}
				}
			}
			this.queries = {};
			setTimeout(() => {
				this.connect();
			}, 10000);
		};
		this.ws.onmessage = (ev) => {
			// console.debug('ws msg', ev.data);
			if (typeof ev.data === 'string') {
				var json = JSON.parse(ev.data);
				if (json.resp && json.queryId) {
					console.debug('ws query answer', json);
					if (this.queries[json.queryId]) {
						this.queries[json.queryId](json);
						delete this.queries[json.queryId];
					}
				}
				else if (json.cmd === 'event') {
					var evt = json.event;
					if (this.events[evt]) {
						this.events[evt]();
					}
					else {
						console.debug('ws unknown event', json);
					}
				}
				else {
					console.debug('ws unknown json', json);
				}
			}
			else {
				console.debug('ws unknwon data', ev.data);
			}
		};
	}
	login(token) {
		this.loginState = 'sent';
		this.sendQueryAsync({
			cmd: 'login',
			token
		}).then(a => {
			if (a.resp === 'ok') {
				console.log('ws login ok');
				this.loginState = 'done';
				this.onLogin.invoke();
			}
			else {
				console.log('ws login result: ', a.resp);
				this.loginState = '';
			}
		});
	}
	sendQuery(obj, callback) {
		if (!this.connected)
			throw new Error('not connected');
		var queryId = ++this.lastQueryId;
		obj = Object.assign({ queryId }, obj);
		console.log('ws send', obj);
		this.ws.send(JSON.stringify(obj));
		if (callback) {
			this.queries[queryId] = callback;
		}
	}
	sendQueryAsync(obj) {
		return new Promise(resolve => {
			this.sendQuery(obj, resolve);
		});
	}
	listenEvent(evt, callback, autoRetry) {
		if (this.events[evt])
			throw new Error('the event is already registered: ' + evt);
		if (this.connected) {
			this.sendQuery({
				cmd: 'listenEvent',
				events: [evt]
			}, null);
			this.events[evt] = callback;
		}
		else if (!autoRetry) {
			throw new Error('not connected');
		}
		if (autoRetry) {
			this.permEvents[evt] = callback;
		}
	}
};

},{"./Api":4,"./User":22,"./utils":25}],13:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Router_1 = require("./Router");
const UI_1 = require("./UI");
const utils_1 = require("./utils");
const PlayerCore_1 = require("./PlayerCore");
const LyricsView_1 = require("./LyricsView");
const Api_1 = require("./Api");
exports.nowPlaying = new class {
	constructor() {
		this.lazyView = new utils_1.Lazy(() => new PlayingView());
	}
	init() {
		var sidebarItem = new UI_1.SidebarItem({ text: utils_1.I `Now Playing` });
		Router_1.router.addRoute({
			path: ['nowplaying'],
			contentView: () => this.view,
			sidebarItem: () => sidebarItem
		});
		UI_1.ui.sidebarList.addFeatureItem(sidebarItem);
		PlayerCore_1.playerCore.onTrackChanged.add(() => {
			sidebarItem.hidden = !PlayerCore_1.playerCore.track;
		})();
	}
	get view() { return this.lazyView.value; }
};
class PlayingView extends UI_1.ContentView {
	constructor() {
		super();
		this.header = new UI_1.ContentHeader({
			title: utils_1.I `Now Playing`
		});
		this.lyricsView = new LyricsView_1.LyricsView();
		this.si = new utils_1.SettingItem('mcloud-nowplaying', 'json', {
			lyricsScale: 100
		});
		this.lyricsScrollPos = 0;
		this.loadedLyrics = '';
		this.onResize = () => {
			this.lyricsView.resize();
			this.centerLyrics();
		};
		this.timer = new utils_1.Timer(() => this.onProgressChanged());
		this.lastTime = 0;
		this.lastChangedRealTime = 0;
		this.onProgressChanged = () => {
			var time = PlayerCore_1.playerCore.currentTime;
			var realTime = new Date().getTime();
			var timerOn = true;
			if (time != this.lastTime) {
				this.lastChangedRealTime = realTime;
				this.lyricsView.setCurrentTime(time, 'smooth');
			}
			if (realTime - this.lastChangedRealTime < 500)
				this.timer.timeout(16);
		};
		this.lyricsView.scale = this.si.data.lyricsScale;
		this.lyricsView.onFontSizeChanged.add(() => {
			this.si.data.lyricsScale = this.lyricsView.scale;
			this.si.save();
			this.centerLyrics();
		});
		this.lyricsView.onSpanClick.add((s) => {
			if (s.span.startTime && s.span.startTime >= 0)
				PlayerCore_1.playerCore.currentTime = s.span.startTime;
		});
		this.header.actions.addView(this.editBtn = new UI_1.ActionBtn({
			text: utils_1.I `Edit`, onclick: () => {
				var _a;
				(_a = PlayerCore_1.playerCore.track) === null || _a === void 0 ? void 0 : _a.startEdit();
			}
		}));
	}
	createDom() {
		return {
			tag: 'div.playingview',
			child: [
				this.header,
				{ tag: 'div.name', text: () => { var _a; return (_a = PlayerCore_1.playerCore.track) === null || _a === void 0 ? void 0 : _a.name; } },
				{ tag: 'div.artist', text: () => { var _a; return (_a = PlayerCore_1.playerCore.track) === null || _a === void 0 ? void 0 : _a.artist; } },
				// {
				//	 tag: 'div.pic',
				//	 child: [
				//		 { tag: 'div.nopic.no-selection', text: () => I`No album cover` }
				//	 ]
				// },
				this.lyricsView
			]
		};
	}
	postCreateDom() {
		super.postCreateDom();
	}
	onShow() {
		super.onShow();
		this.ensureDom();
	}
	onDomInserted() {
		if (!this.checkTrack() && this.lyricsScrollPos) {
			this.lyricsView.dom.scrollTop = this.lyricsScrollPos;
		}
		this.shownEvents.add(PlayerCore_1.playerCore.onTrackChanged, () => { this.checkTrack(); });
		this.shownEvents.add(PlayerCore_1.playerCore.onProgressChanged, this.onProgressChanged);
		this.shownEvents.add(Api_1.api.onTrackInfoChanged, (track) => {
			var _a;
			if (track.id === ((_a = PlayerCore_1.playerCore.track) === null || _a === void 0 ? void 0 : _a.id)) {
				this.checkTrack();
			}
		});
		this.lyricsView.setCurrentTime(PlayerCore_1.playerCore.currentTime);
		requestAnimationFrame(this.onResize);
		window.addEventListener('resize', this.onResize);
	}
	onRemove() {
		super.onRemove();
		window.removeEventListener('resize', this.onResize);
		this.timer.tryCancel();
		this.lyricsScrollPos = this.lyricsView.dom.scrollTop;
	}
	checkTrack() {
		var _a;
		this.updateDom();
		this.editBtn.hidden = !PlayerCore_1.playerCore.track;
		var newLyrics = ((_a = PlayerCore_1.playerCore.track) === null || _a === void 0 ? void 0 : _a.lyrics) || '';
		if (this.loadedLyrics != newLyrics) {
			this.loadedLyrics = newLyrics;
			this.lyricsView.setLyrics(newLyrics);
			this.lyricsView.dom.scrollTop = 0;
			return true;
		}
		return false;
	}
	centerLyrics() {
		if (PlayerCore_1.playerCore.state === 'playing')
			this.lyricsView.setCurrentTime(PlayerCore_1.playerCore.currentTime, 'force');
	}
}

},{"./Api":4,"./LyricsView":11,"./PlayerCore":14,"./Router":15,"./UI":20,"./utils":25}],14:[function(require,module,exports){
"use strict";
// file: PlayerCore.ts
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
	function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
	return new (P || (P = Promise))(function (resolve, reject) {
		function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
		function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
		function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
		step((generator = generator.apply(thisArg, _arguments || [])).next());
	});
};
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("./utils");
const Api_1 = require("./Api");
const viewlib_1 = require("./viewlib");
/** 播放器核心：控制播放逻辑 */
exports.playerCore = new class PlayerCore {
	constructor() {
		this.audioLoaded = false;
		this.onTrackChanged = new utils_1.Callbacks();
		this.siPlayer = new utils_1.SettingItem('mcloud-player', 'json', {
			loopMode: 'list-loop',
			volume: 1,
			preferBitrate: 0
		});
		this.onLoopModeChanged = new utils_1.Callbacks();
		this._state = 'none';
		this.onStateChanged = new utils_1.Callbacks();
		this.onProgressChanged = new utils_1.Callbacks();
		this.onVolumeChanged = new utils_1.Callbacks();
	}
	get loopMode() { return this.siPlayer.data.loopMode; }
	set loopMode(val) {
		this.siPlayer.data.loopMode = val;
		this.siPlayer.save();
		this.onLoopModeChanged.invoke();
	}
	get preferBitrate() { return this.siPlayer.data.preferBitrate; }
	get state() { return this._state; }
	set state(val) {
		this._state = val;
		this.onStateChanged.invoke();
	}
	get currentTime() { var _a; return (_a = this.audio) === null || _a === void 0 ? void 0 : _a.currentTime; }
	set currentTime(val) { this.audio.currentTime = val; }
	get duration() {
		var _a;
		if (this.audio && this.audioLoaded && this.audio.readyState >= HTMLMediaElement.HAVE_METADATA)
			return this.audio.duration;
		else
			return (_a = this.track) === null || _a === void 0 ? void 0 : _a.length;
	}
	get volume() { var _a, _b; return (_b = (_a = this.audio) === null || _a === void 0 ? void 0 : _a.volume) !== null && _b !== void 0 ? _b : 1; }
	set volume(val) {
		this.audio.volume = val;
		if (val !== this.siPlayer.data.volume) {
			this.siPlayer.data.volume = val;
			this.siPlayer.save();
		}
	}
	get isPlaying() { return this.audio.duration && !this.audio.paused; }
	get isPaused() { return this.audio.paused; }
	get canPlay() { return this.audio.readyState >= 2; }
	init() {
		// migration
		var siLoop = new utils_1.SettingItem('mcloud-loop', 'str', null);
		if (siLoop.data !== null) {
			this.loopMode = siLoop.data;
			siLoop.remove();
		}
		this.audio = document.createElement('audio');
		this.audio.addEventListener('timeupdate', () => this.onProgressChanged.invoke());
		this.audio.addEventListener('canplay', () => this.onProgressChanged.invoke());
		this.audio.addEventListener('seeking', () => {
			if (!this.audio.paused)
				this.state = 'stalled';
		});
		this.audio.addEventListener('stalled', () => {
			this.state = 'stalled';
		});
		this.audio.addEventListener('play', () => {
			this.state = 'playing';
		});
		this.audio.addEventListener('playing', () => {
			this.state = 'playing';
		});
		this.audio.addEventListener('pause', () => {
			this.state = 'paused';
		});
		this.audio.addEventListener('error', (e) => {
			console.log(e);
			this.state = 'paused';
			if (this.audioLoaded) {
				viewlib_1.Toast.show(utils_1.I `Player error:` + '\n' + e.message, 3000);
			}
		});
		this.audio.addEventListener('ended', () => {
			this.next();
		});
		this.audio.addEventListener('volumechange', () => this.onVolumeChanged.invoke());
		this.audio.volume = this.siPlayer.data.volume;
	}
	prev() { return this.next(-1); }
	next(offset) {
		var _a, _b, _c;
		var nextTrack = (_c = (_b = (_a = this.track) === null || _a === void 0 ? void 0 : _a._bind) === null || _b === void 0 ? void 0 : _b.list) === null || _c === void 0 ? void 0 : _c.getNextTrack(this.track, this.loopMode, offset);
		if (nextTrack)
			this.playTrack(nextTrack, true);
		else
			this.setTrack(null);
	}
	loadUrl(src) {
		// Getting `this.audio.src` is very slow when a blob is loaded,
		// so we add this property:
		this.audioLoaded = !!src;
		if (src) {
			this.audio.src = src;
		}
		else {
			this.audio.pause();
			this.audio.removeAttribute('src');
		}
		this.audio.load();
	}
	setTrack(track) {
		var _a;
		var oldTrack = this.track;
		this.track = track;
		if ((oldTrack === null || oldTrack === void 0 ? void 0 : oldTrack.url) !== ((_a = this.track) === null || _a === void 0 ? void 0 : _a.url)
			|| ((track === null || track === void 0 ? void 0 : track.blob) && track.blob !== (oldTrack === null || oldTrack === void 0 ? void 0 : oldTrack.blob)))
			this.loadUrl(null);
		this.state = !track ? 'none' : this.audio.paused ? 'paused' : 'playing';
		this.onTrackChanged.invoke();
		this.onProgressChanged.invoke();
	}
	playTrack(track, forceStart) {
		if (track !== this.track)
			this.setTrack(track);
		if (forceStart)
			this.audio.currentTime = 0;
		this.play();
	}
	loadTrack(track) {
		var _a;
		return __awaiter(this, void 0, void 0, function* () {
			(_a = this._loadct) === null || _a === void 0 ? void 0 : _a.cancel();
			var ct = this._loadct = new utils_1.CancelToken();
			if (track.blob) {
				var dataurl = yield utils_1.utils.readBlobAsDataUrl(track.blob);
				ct.throwIfCancelled();
				this.loadUrl(dataurl);
			}
			else {
				let cur = { url: track.url, bitrate: 0 };
				var prefer = this.preferBitrate;
				if (prefer && track.files) {
					track.files.forEach(f => {
						if (!cur.bitrate || Math.abs(cur.bitrate - prefer) > Math.abs(f.bitrate - prefer)) {
							cur = f;
						}
					});
				}
				if (!cur.url) {
					yield track.requestFileUrl(cur);
					ct.throwIfCancelled();
				}
				this.loadUrl(Api_1.api.processUrl(cur.url));
			}
		});
	}
	play() {
		return __awaiter(this, void 0, void 0, function* () {
			yield this.ensureLoaded();
			this.audio.play();
		});
	}
	ensureLoaded() {
		return __awaiter(this, void 0, void 0, function* () {
			var track = this.track;
			if (track && !this.audioLoaded)
				yield this.loadTrack(track);
		});
	}
	pause() {
		this.audio.pause();
	}
};
exports.playingLoopModes = ['list-seq', 'list-loop', 'track-loop'];
if (navigator['mediaSession']) {
	let mediaSession = navigator['mediaSession'];
	exports.playerCore.onTrackChanged.add(() => {
		try {
			var track = exports.playerCore.track;
			if (!track)
				return;
			mediaSession.metadata = new MediaMetadata({
				title: track === null || track === void 0 ? void 0 : track.name,
				artist: track === null || track === void 0 ? void 0 : track.artist
			});
		}
		catch (_a) { }
	});
	mediaSession.setActionHandler('play', () => exports.playerCore.play());
	mediaSession.setActionHandler('pause', () => exports.playerCore.pause());
	mediaSession.setActionHandler('previoustrack', () => exports.playerCore.prev());
	mediaSession.setActionHandler('nexttrack', () => exports.playerCore.next());
}
window.addEventListener('beforeunload', (ev) => {
	if (!exports.playerCore.track || exports.playerCore.audio.paused)
		return;
	ev.preventDefault();
	return ev.returnValue = 'The player is running. Are you sure to leave?';
});

},{"./Api":4,"./utils":25,"./viewlib":26}],15:[function(require,module,exports){
"use strict";
// file: Router.ts
Object.defineProperty(exports, "__esModule", { value: true });
const UI_1 = require("./UI");
const utils_1 = require("./utils");
exports.router = new class {
	constructor() {
		this.routes = [];
		this.onNavCompleted = new utils_1.Callbacks();
	}
	init() {
		window.addEventListener('popstate', (ev) => {
			this.navByLocation();
		});
		this.navByLocation();
	}
	navByLocation() {
		var hash = window.location.hash;
		this.nav(hash ? hash.substr(1) : '', false);
	}
	addRoute(arg) {
		this.routes.push(arg);
		if (arg.sidebarItem)
			arg.sidebarItem().onclick = () => {
				if (arg.contentView && arg.contentView().isVisible)
					return;
				this.nav([...arg.path]);
			};
	}
	nav(path, pushState) {
		if (typeof path === 'string')
			path = parsePath(path);
		for (const r of this.routes) {
			if (match(path, r)) {
				if (r.contentView)
					UI_1.ui.content.setCurrent(r.contentView());
				if (r.sidebarItem)
					UI_1.ui.sidebarList.setActive(r.sidebarItem());
				if (r.onNav)
					r.onNav({ path, remaining: path.slice(r.path.length) });
				break;
			}
		}
		var strPath = path.join('/');
		this.current = path;
		this.currentStr = strPath;
		if (pushState === undefined || pushState) {
			window.history.pushState({}, strPath, '#' + strPath);
		}
		this.onNavCompleted.invoke({ path });
	}
};
function match(path, route) {
	var rp = route.path;
	for (let i = 0; i < rp.length; i++) {
		if (path[i] !== rp[i])
			return false;
	}
	return true;
}
function parsePath(path) {
	return path.split('/');
}

},{"./UI":20,"./utils":25}],16:[function(require,module,exports){
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
	function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
	return new (P || (P = Promise))(function (resolve, reject) {
		function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
		function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
		function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
		step((generator = generator.apply(thisArg, _arguments || [])).next());
	});
};
Object.defineProperty(exports, "__esModule", { value: true });
const Router_1 = require("./Router");
const UI_1 = require("./UI");
const utils_1 = require("./utils");
const ListContentView_1 = require("./ListContentView");
const viewlib_1 = require("./viewlib");
const Api_1 = require("./Api");
const TrackList_1 = require("./TrackList");
const Track_1 = require("./Track");
const PlayerCore_1 = require("./PlayerCore");
exports.search = new class {
	constructor() {
		this.lazyView = new utils_1.Lazy(() => new SearchView());
	}
	init() {
		var sidebarItem = new UI_1.SidebarItem({ text: utils_1.I `Search` });
		Router_1.router.addRoute({
			path: ['search'],
			contentView: () => this.view,
			sidebarItem: () => sidebarItem
		});
		UI_1.ui.sidebarList.addFeatureItem(sidebarItem);
	}
	get view() { return this.lazyView.value; }
};
class SearchView extends ListContentView_1.ListContentView {
	constructor() {
		super(...arguments);
		this.title = utils_1.I `Search`;
		this.searchbar = new SearchBar();
	}
	appendListView() {
		super.appendListView();
		this.listView.toggleClass('tracklistview', true);
		this.listView.dragging = true;
		this.listView.onItemClicked = (item) => {
			var tempList = new TrackList_1.TrackList();
			this.listView.forEach(t => tempList.addTrack(t.track.infoObj));
			PlayerCore_1.playerCore.playTrack(tempList.tracks[item.position]);
		};
	}
	appendHeader() {
		super.appendHeader();
		this.refreshBtn.hidden = true;
		this.header.appendView(this.searchbar);
		this.searchbar.onSearch.add(() => {
			this.performSearch(this.searchbar.input.value);
		});
	}
	performSearch(query) {
		return __awaiter(this, void 0, void 0, function* () {
			this.currentQuery = query;
			var li = new viewlib_1.LoadingIndicator();
			this.useLoadingIndicator(li);
			try {
				var r = yield Api_1.api.get('tracks?query=' + encodeURIComponent(query));
				this.listView.removeAll();
				r.tracks.forEach(t => {
					this.listView.add(new TrackList_1.TrackViewItem(new Track_1.Track({ infoObj: t })));
				});
				this.updatePlaying();
				this.useLoadingIndicator(null);
			}
			catch (error) {
				li.error(error, () => this.performSearch(query));
			}
		});
	}
	onShow() {
		super.onShow();
		this.updatePlaying();
		this.shownEvents.add(PlayerCore_1.playerCore.onTrackChanged, () => this.updatePlaying());
	}
	onRemove() {
		super.onRemove();
	}
	updatePlaying() {
		var playing = PlayerCore_1.playerCore.track;
		this.listView.forEach(t => {
			t.updateWith({ playing: !!playing && t.track.id === playing.id });
		});
	}
	;
}
class SearchBar extends viewlib_1.View {
	constructor() {
		super(...arguments);
		this.input = new viewlib_1.InputView();
		this.btn = new viewlib_1.ButtonView({ text: utils_1.I `Search`, onclick: () => this.onSearch.invoke() });
		this.onSearch = new utils_1.Callbacks();
	}
	get value() { return this.input.value; }
	set value(val) { this.input.value = val; }
	createDom() {
		return {
			tag: 'div.searchbar',
			child: [
				this.input,
				this.btn
			]
		};
	}
	postCreateDom() {
		super.postCreateDom();
		this.input.dom.addEventListener('keydown', (ev) => {
			if (ev.code === 'Enter') {
				ev.preventDefault();
				this.onSearch.invoke();
			}
		});
	}
}

},{"./Api":4,"./ListContentView":7,"./PlayerCore":14,"./Router":15,"./Track":18,"./TrackList":19,"./UI":20,"./utils":25,"./viewlib":26}],17:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const viewlib_1 = require("./viewlib");
const I18n_1 = require("./I18n");
const UI_1 = require("./UI");
const PlayerCore_1 = require("./PlayerCore");
const buildInfo_1 = require("./buildInfo");
exports.settingsUI = new class {
	openUI() {
		if (!this.dialog)
			this.dialog = new SettingsDialog();
		this.dialog.center();
		this.dialog.show();
	}
};
class SettingsDialog extends viewlib_1.Dialog {
	constructor() {
		super();
		this.btnSwitchTheme = new viewlib_1.ButtonView({ type: 'big' });
		this.btnSwitchLang = new viewlib_1.ButtonView({ type: 'big' });
		this.inputPreferBitrate = new viewlib_1.LabeledInput();
		this.reloadShown = false;
		this.addContent(this.btnSwitchTheme);
		this.btnSwitchTheme.onclick = () => {
			UI_1.ui.theme.set((UI_1.ui.theme.current === 'light') ? 'dark' : 'light');
			this.updateDom();
		};
		this.addContent(this.btnSwitchLang);
		this.btnSwitchLang.onclick = () => {
			var origUsingLang = UI_1.ui.lang.curLang;
			var curlang = UI_1.ui.lang.siLang.data;
			var langs = ['', ...UI_1.ui.lang.availableLangs];
			curlang = langs[(langs.indexOf(curlang) + 1) % langs.length];
			UI_1.ui.lang.siLang.set(curlang);
			if (origUsingLang != UI_1.ui.lang.curLang)
				this.showReload();
			this.updateDom();
		};
		this.addContent(this.inputPreferBitrate);
		this.onShown.add(() => {
			var _a;
			this.inputPreferBitrate.value = ((_a = PlayerCore_1.playerCore.siPlayer.data.preferBitrate) !== null && _a !== void 0 ? _a : '0').toString();
		});
		this.onClose.add(() => {
			var val = parseInt(this.inputPreferBitrate.value);
			if (!isNaN(val)) {
				PlayerCore_1.playerCore.siPlayer.data.preferBitrate = val;
				PlayerCore_1.playerCore.siPlayer.save();
			}
		});
		this.addContent(this.bottom = new viewlib_1.View({
			tag: 'div',
			style: 'margin: 5px 0; display: flex; flex-wrap: wrap; justify-content: space-between;',
			child: [
				{
					tag: 'div', style: 'width: 100%; color: var(--color-text-gray);',
					text: buildInfo_1.buildInfo.buildDate
				},
				{ tag: 'div', text: 'MusicCloud ' + buildInfo_1.buildInfo.version },
				{
					tag: 'a.clickable', style: 'color: inherit;',
					text: () => I18n_1.I `Source code`, href: 'https://github.com/lideming/MusicCloud',
					target: '_blank'
				},
			]
		}));
	}
	showReload() {
		if (this.reloadShown)
			return;
		this.reloadShown = true;
		this.content.addView(new viewlib_1.View({
			tag: 'div.clickable',
			style: 'color: var(--color-primary); text-align: center; margin: 10px 0;',
			text: () => I18n_1.I `Reload to fully apply changes`,
			onclick: () => {
				window.location.reload();
			}
		}), this.bottom.position);
	}
	updateDom() {
		this.title = I18n_1.I `Settings`;
		this.btnClose.updateWith({ text: I18n_1.I `Close` });
		super.updateDom();
		this.btnSwitchTheme.text = I18n_1.I `Color theme: ${I18n_1.i18n.get('colortheme_' + UI_1.ui.theme.current)}`;
		this.btnSwitchLang.text = I18n_1.I `Language: ${I18n_1.I `English`}`;
		if (!UI_1.ui.lang.siLang.data)
			this.btnSwitchLang.text += I18n_1.I ` (auto-detected)`;
		this.inputPreferBitrate.updateWith({ label: I18n_1.I `Preferred bitrate (0: original file)` });
		this.content.updateChildrenDom();
	}
}

},{"./I18n":6,"./PlayerCore":14,"./UI":20,"./buildInfo":23,"./viewlib":26}],18:[function(require,module,exports){
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
	function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
	return new (P || (P = Promise))(function (resolve, reject) {
		function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
		function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
		function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
		step((generator = generator.apply(thisArg, _arguments || [])).next());
	});
};
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("./utils");
const viewlib_1 = require("./viewlib");
const Api_1 = require("./Api");
const LyricsEdit_1 = require("./LyricsEdit");
/** A track binding with list */
class Track {
	constructor(init) {
		this.infoObj = null;
		this.blob = null;
		this._bind = undefined;
		utils_1.utils.objectApply(this, init);
	}
	get id() { return this.infoObj.id; }
	get name() { return this.infoObj.name; }
	get artist() { return this.infoObj.artist; }
	get url() { return this.infoObj.url; }
	get files() { return this.infoObj.files; }
	get length() { return this.infoObj.length; }
	get size() { return this.infoObj.size; }
	get lyrics() { return this.infoObj.lyrics; }
	get displayName() { return this.artist + ' - ' + this.name; }
	get canEdit() { return true; }
	toString() {
		return `${utils_1.I `Track ID`}: ${this.id}\r\n${utils_1.I `Name`}: ${this.name}\r\n${utils_1.I `Artist`}: ${this.artist}`;
	}
	toApiTrack() {
		return this.infoObj;
	}
	getExtensionName() {
		var _a;
		return (_a = /\.([\w\-_]{1,6})$/.exec(this.url)) === null || _a === void 0 ? void 0 : _a[1];
	}
	updateFromApiTrack(t) {
		if (this.id !== t.id)
			throw new Error('Bad track id');
		// utils.objectApply(this, t, ['id', 'name', 'artist', 'url', 'size']);
		this.infoObj = t;
	}
	startEdit() {
		var dialog = new TrackDialog();
		dialog.setTrack(this);
		dialog.show();
		return dialog;
	}
	requestFileUrl(file) {
		return __awaiter(this, void 0, void 0, function* () {
			if (!file.url) {
				var toast = viewlib_1.Toast.show(utils_1.I `Converting "${this.displayName}"...`);
				try {
					file.url = (yield Api_1.api.get(file.urlurl))['url'];
					toast.close();
				}
				catch (error) {
					toast.updateWith({ text: utils_1.I `Error converting "${this.displayName}".` + '\n' + error });
					toast.show(3000);
				}
			}
		});
	}
}
exports.Track = Track;
class TrackDialog extends viewlib_1.Dialog {
	constructor() {
		super();
		this.width = '500px';
		this.inputName = new viewlib_1.LabeledInput({ label: utils_1.I `Name` });
		this.inputArtist = new viewlib_1.LabeledInput({ label: utils_1.I `Artist` });
		this.inputLyrics = new viewlib_1.LabeledInput({ label: utils_1.I `Lyrics` });
		this.btnSave = new viewlib_1.TabBtn({ text: utils_1.I `Save`, right: true });
		this.btnEditLyrics = new viewlib_1.TabBtn({ text: utils_1.I `Edit Lyrics`, right: true });
		this.autoFocus = this.inputName.input;
		this.resizable = true;
		this.contentFlex = true;
		this.inputLyrics.input.multiline = true;
		this.inputLyrics.dominput.style.resize = 'none';
		this.inputLyrics.dom.style.flex = '1';
		this.inputLyrics.dominput.style.minHeight = '5em';
		[this.inputName, this.inputArtist, this.inputLyrics].forEach(x => this.addContent(x));
		this.addBtn(this.btnSave);
		this.btnSave.onClick.add(() => this.save());
		this.addBtn(this.btnEditLyrics);
		this.btnEditLyrics.onClick.add(() => {
			this.close();
			LyricsEdit_1.lyricsEdit.startEdit(this.track, this.inputLyrics.value);
		});
		this.compositionWatcher = new utils_1.TextCompositionWatcher(this.dom);
		this.dom.addEventListener('keydown', (ev) => {
			if (!this.compositionWatcher.isCompositing
				&& ev.code === 'Enter'
				&& (ev.ctrlKey || ev.target !== this.inputLyrics.dom)) {
				ev.preventDefault();
				this.save();
			}
		});
	}
	setTrack(t) {
		this.track = t;
		this.title = utils_1.I `Track ID` + ' ' + t.id;
		this.inputName.updateWith({ value: t.name });
		this.inputArtist.updateWith({ value: t.artist });
		this.inputLyrics.updateWith({ value: t.lyrics });
		this.updateDom();
	}
	save() {
		return __awaiter(this, void 0, void 0, function* () {
			if (!this.btnSave.clickable)
				throw new Error('btnSave is not clickable.');
			this.btnSave.updateWith({ clickable: false, text: utils_1.I `Saving...` });
			try {
				var newinfo = yield Api_1.api.put({
					path: 'tracks/' + this.track.id,
					obj: {
						id: this.track.id,
						name: this.inputName.value,
						artist: this.inputArtist.value,
						lyrics: this.inputLyrics.value
					}
				});
				if (newinfo.id != this.track.id)
					throw new Error('Bad ID in response');
				Api_1.api.onTrackInfoChanged.invoke(newinfo);
				this.close();
			}
			catch (error) {
				console.error(error);
				this.btnSave.updateWith({ clickable: false, text: utils_1.I `Error` });
				yield utils_1.utils.sleepAsync(3000);
			}
			this.btnSave.updateWith({ clickable: true, text: utils_1.I `Save` });
		});
	}
}
exports.TrackDialog = TrackDialog;

},{"./Api":4,"./LyricsEdit":10,"./utils":25,"./viewlib":26}],19:[function(require,module,exports){
"use strict";
// file: TrackList.ts
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
	function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
	return new (P || (P = Promise))(function (resolve, reject) {
		function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
		function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
		function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
		step((generator = generator.apply(thisArg, _arguments || [])).next());
	});
};
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("./utils");
const viewlib_1 = require("./viewlib");
const ListContentView_1 = require("./ListContentView");
const User_1 = require("./User");
const Api_1 = require("./Api");
const ListIndex_1 = require("./ListIndex");
const UI_1 = require("./UI");
const PlayerCore_1 = require("./PlayerCore");
const Router_1 = require("./Router");
const Track_1 = require("./Track");
class TrackList {
	constructor() {
		this.info = null;
		this.id = null;
		this.apiid = null;
		this.name = null;
		this.tracks = [];
		this.fetching = null;
		this.posting = null;
		this.canEdit = true;
		this.putDelaying = null;
		this.putInProgress = null;
	}
	setLoadIndicator(li) {
		this.loadIndicator = li;
		if (this.contentView)
			this.contentView.useLoadingIndicator(li);
	}
	loadInfo(info) {
		this.id = info.id;
		this.apiid = this.id > 0 ? this.id : null;
		this.name = info.name;
	}
	loadFromGetResult(obj) {
		var _a;
		this.loadInfo(obj);
		const thiz = this;
		new class extends utils_1.DataUpdatingHelper {
			constructor() {
				super(...arguments);
				this.items = thiz.tracks;
			}
			addItem(data, pos) { thiz.addTrack_NoUpdating(data, pos); }
			updateItem(item, data) { item.updateFromApiTrack(data); }
			removeItem(item) { thiz.remove_NoUpdating(item); }
		}().update(obj.tracks);
		this.updateTracksState();
		(_a = this.contentView) === null || _a === void 0 ? void 0 : _a.updateView();
		return this;
	}
	addTrack(t, pos) {
		var _a;
		var track = this.addTrack_NoUpdating(t, pos);
		if (pos !== undefined && pos !== this.tracks.length - 1)
			this.updateTracksState();
		(_a = this.contentView) === null || _a === void 0 ? void 0 : _a.updateView();
		return track;
	}
	addTrack_NoUpdating(t, pos) {
		var _a;
		var track = new Track_1.Track({
			infoObj: t,
			_bind: {
				list: this,
				position: this.tracks.length
			}
		});
		utils_1.utils.arrayInsert(this.tracks, track, pos);
		(_a = this.contentView) === null || _a === void 0 ? void 0 : _a.addItem(track, pos, false);
		return track;
	}
	loadEmpty() {
		var _a;
		(_a = this.contentView) === null || _a === void 0 ? void 0 : _a.updateView();
		return this.fetching = Promise.resolve();
	}
	fetch(force) {
		var _a;
		if (force)
			this.fetching = null;
		return this.fetching = (_a = this.fetching) !== null && _a !== void 0 ? _a : this.fetchImpl();
	}
	postToUser() {
		return this.posting = this.posting || this._post();
	}
	_post() {
		var _a;
		return __awaiter(this, void 0, void 0, function* () {
			yield User_1.user.waitLogin();
			if (this.apiid !== undefined)
				throw new Error('cannot post: apiid exists');
			var obj = {
				id: 0,
				name: (_a = this.name) !== null && _a !== void 0 ? _a : '',
				trackids: this.tracks.map(t => t.id)
			};
			var resp = yield Api_1.api.post({
				path: 'users/me/lists/new',
				obj: obj
			});
			this.apiid = resp.id;
		});
	}
	getRealId() {
		return __awaiter(this, void 0, void 0, function* () {
			if (this.apiid)
				return this.apiid;
			yield this.postToUser();
			return this.apiid;
		});
	}
	put() {
		if (this.putDelaying)
			return this.putDelaying;
		this.putDelaying = this.putCore();
	}
	putCore() {
		var _a;
		return __awaiter(this, void 0, void 0, function* () {
			try {
				if (this.putInProgress)
					yield this.putInProgress;
				yield utils_1.utils.sleepAsync(10);
				yield User_1.user.waitLogin(true);
				if (this.fetching)
					yield this.fetching;
				if (this.posting)
					yield this.posting;
				if (this.apiid == null)
					throw new Error('cannot put: no apiid');
			}
			catch (error) {
				this.putDelaying = null;
				console.error(error);
			}
			try {
				[this.putInProgress, this.putDelaying] = [this.putDelaying, null];
				var obj = {
					id: this.apiid,
					name: (_a = this.name) !== null && _a !== void 0 ? _a : '',
					trackids: this.tracks.map(t => t.id)
				};
				var resp = yield Api_1.api.put({
					path: 'lists/' + this.apiid,
					obj: obj
				});
			}
			catch (error) {
				console.error('list put() failed', this, error);
				viewlib_1.Toast.show(utils_1.I `Failed to sync playlist "${this.name}".` + '\n' + error, 3000);
				throw error;
			}
			finally {
				this.putInProgress = null;
			}
		});
	}
	fetchImpl() {
		return __awaiter(this, void 0, void 0, function* () {
			const li = new viewlib_1.LoadingIndicator();
			this.setLoadIndicator(li);
			try {
				if (this.apiid == null)
					throw new Error('Cannot fetch: no apiid');
				const obj = yield Api_1.api.getListAsync(this.apiid);
				this.loadFromGetResult(obj);
				this.setLoadIndicator(null);
			}
			catch (err) {
				li.error(err, () => this.fetch(true));
				throw err;
			}
		});
	}
	rename(newName) {
		var _a;
		return __awaiter(this, void 0, void 0, function* () {
			this.name = newName;
			var header = (_a = this.contentView) === null || _a === void 0 ? void 0 : _a.header;
			if (header)
				header.updateWith({ title: this.name });
			ListIndex_1.listIndex.onrename(this.id, newName);
			yield this.put();
		});
	}
	createView() {
		return this.contentView = this.contentView || new TrackListView(this);
	}
	getNextTrack(track, loopMode, offset) {
		var _a, _b, _c, _d, _e;
		offset = offset !== null && offset !== void 0 ? offset : 1;
		var bind = track._bind;
		if (!bind)
			return null;
		var position = bind.position;
		if ((bind === null || bind === void 0 ? void 0 : bind.list) !== this)
			return null;
		if (this.listView)
			position = (_b = position !== null && position !== void 0 ? position : (_a = this.listView.find(x => x.track === track)) === null || _a === void 0 ? void 0 : _a.position) !== null && _b !== void 0 ? _b : (_c = this.listView.find(x => x.track.id === track.id)) === null || _c === void 0 ? void 0 : _c.position;
		position = position !== null && position !== void 0 ? position : this.tracks.indexOf(track);
		if (position == null || position < 0)
			position = this.tracks.findIndex(x => x.id === track.id);
		if (position == null || position < 0)
			return null;
		if (loopMode === 'list-seq') {
			return (_d = this.tracks[position + offset]) !== null && _d !== void 0 ? _d : null;
		}
		else if (loopMode === 'list-loop') {
			return (_e = this.tracks[utils_1.utils.mod(position + offset, this.tracks.length)]) !== null && _e !== void 0 ? _e : null;
		}
		else if (loopMode === 'track-loop') {
			return track;
		}
		else {
			console.warn('unknown loopMode', loopMode);
		}
		return null;
	}
	updateTracksFromListView() {
		this.updateTracksState();
		this.put();
	}
	updateTracksState() {
		if (this.listView) {
			// if the listview exists, update `this.tracks` as well as the DOM.
			this.tracks = this.listView.map(lvi => {
				lvi.track._bind.position = lvi.position;
				lvi.updateDom();
				return lvi.track;
			});
		}
		else {
			this.tracks.forEach((t, i) => t._bind.position = i);
		}
	}
	updateTrackInfo(track, newInfo) {
		track.updateFromApiTrack(newInfo);
		if (this.listView)
			this.listView.get(track._bind.position).updateDom();
	}
	remove(track, put) {
		var _a;
		this.remove_NoUpdating(track);
		this.updateTracksState();
		(_a = this.contentView) === null || _a === void 0 ? void 0 : _a.updateView();
		if (put === undefined || put)
			this.put();
	}
	remove_NoUpdating(track) {
		var pos = track._bind.position;
		if (pos == null)
			return;
		track._bind = undefined;
		this.tracks.splice(pos, 1);
		if (this.listView)
			this.listView.remove(pos);
	}
}
exports.TrackList = TrackList;
class TrackListView extends ListContentView_1.ListContentView {
	constructor(list) {
		super();
		this.curPlaying = new viewlib_1.ItemActiveHelper({
			funcSetActive: function (item, val) { item.updateWith({ playing: val }); }
		});
		this.canMultiSelect = true;
		this.trackActionHandler = {};
		this.trackChanged = () => {
			this.updateCurPlaying();
		};
		this.list = list;
		if (this.list.canEdit) {
			this.trackActionHandler.onTrackRemove = (items) => items.forEach(x => this.list.remove(x.track));
		}
	}
	createHeader() {
		var _a;
		return new UI_1.ContentHeader({
			catalog: utils_1.I `Playlist`,
			title: (_a = this.list.name) !== null && _a !== void 0 ? _a : '',
			titleEditable: !!this.list.rename,
			onTitleEdit: (newName) => this.list.rename(newName)
		});
	}
	appendHeader() {
		super.appendHeader();
		this.refreshBtn.onclick = () => {
			this.list.fetch(true);
		};
	}
	onShow() {
		super.onShow();
		this.shownEvents.add(PlayerCore_1.playerCore.onTrackChanged, this.trackChanged);
		this.updateItems();
	}
	onRemove() {
		super.onRemove();
	}
	appendListView() {
		super.appendListView();
		var lv = this.listView;
		lv.dom.classList.add('tracklistview');
		this.list.listView = lv;
		lv.dragging = true;
		if (this.list.canEdit)
			lv.moveByDragging = true;
		lv.onItemMoved = () => this.list.updateTracksFromListView();
		lv.onItemClicked = (item) => PlayerCore_1.playerCore.playTrack(item.track);
		this.list.tracks.forEach(t => this.addItem(t, undefined, false));
		this.updateItems();
		if (this.list.loadIndicator)
			this.useLoadingIndicator(this.list.loadIndicator);
		this.updateView();
	}
	updateItems() {
		// update active state of items
		this.trackChanged();
	}
	addItem(t, pos, updateView) {
		var item = this.createViewItem(t);
		this.listView.add(item, pos);
		this.updateCurPlaying(item);
		if (updateView == null || updateView)
			this.updateView();
	}
	createViewItem(t) {
		var view = new TrackViewItem(t);
		view.actionHandler = this.trackActionHandler;
		return view;
	}
	updateCurPlaying(item) {
		var _a, _b, _c;
		const playing = PlayerCore_1.playerCore.track;
		if (item === undefined) {
			if (playing) {
				const identical = (((_a = playing._bind) === null || _a === void 0 ? void 0 : _a.list) === this.list && playing._bind.position != undefined) ? this.listView.get(playing._bind.position) : (_b = (playing && this.listView.find(x => x.track === playing))) !== null && _b !== void 0 ? _b : this.listView.find(x => x.track.id === playing.id);
				this.curPlaying.set(identical);
			}
			else {
				this.curPlaying.set(null);
			}
		}
		else if (playing) {
			const track = item.track;
			if ((((_c = playing._bind) === null || _c === void 0 ? void 0 : _c.list) === this.list && track === playing)
				|| (!this.curPlaying && track.id === playing.id)) {
				this.curPlaying.set(item);
			}
		}
	}
}
exports.TrackListView = TrackListView;
;
class TrackViewItem extends viewlib_1.ListViewItem {
	constructor(item) {
		super();
		this.actionHandler = null;
		this.noPos = false;
		this.playing = false;
		this.onContextMenu = (item, ev) => {
			var _a, _b, _c;
			ev.preventDefault();
			var selected = this.selected ? this.selectionHelper.selectedItems : [this];
			var m = new viewlib_1.ContextMenu();
			if (item.track.id)
				m.add(new viewlib_1.MenuItem({
					text: utils_1.I `Comments`, onclick: () => {
						Router_1.router.nav(['track-comments', item.track.id.toString()]);
					}
				}));
			if (this.track.url) {
				var ext = this.track.getExtensionName();
				ext = ext ? (ext.toUpperCase() + ', ') : '';
				var fileSize = utils_1.utils.formatFileSize(this.track.size);
				var files = [...((_a = this.track.files) !== null && _a !== void 0 ? _a : [])];
				files.sort((a, b) => b.bitrate - a.bitrate);
				if (!files.find(f => f.url === this.track.url))
					m.add(new viewlib_1.MenuLinkItem({
						text: utils_1.I `Download` + ' (' + ext + fileSize + ')',
						link: Api_1.api.processUrl(this.track.url),
						download: this.track.artist + ' - ' + this.track.name + '.' + ext
					}));
				files.forEach(f => {
					var _a;
					var format = (_a = f.format) === null || _a === void 0 ? void 0 : _a.toUpperCase();
					if (f.url)
						m.add(new viewlib_1.MenuLinkItem({
							text: utils_1.I `Download` + ' (' + format + ', ' + f.bitrate + ' Kbps)',
							link: Api_1.api.processUrl(f.url),
							download: this.track.artist + ' - ' + this.track.name + '.' + format
						}));
					else if (f.urlurl)
						m.add(new viewlib_1.MenuItem({
							text: utils_1.I `Convert` + ' (' + format + ', ' + f.bitrate + ' Kbps)',
							onclick: () => {
								this.track.requestFileUrl(f);
							}
						}));
				});
			}
			if (this.track.canEdit)
				m.add(new viewlib_1.MenuItem({
					text: utils_1.I `Edit`,
					onclick: () => this.track.startEdit()
				}));
			if ((_b = this.actionHandler) === null || _b === void 0 ? void 0 : _b.onTrackRemove)
				m.add(new viewlib_1.MenuItem({
					text: utils_1.I `Remove`, cls: 'dangerous',
					onclick: () => { var _a, _b; return (_b = (_a = this.actionHandler).onTrackRemove) === null || _b === void 0 ? void 0 : _b.call(_a, [this]); }
				}));
			if (((_c = this.actionHandler) === null || _c === void 0 ? void 0 : _c.onTrackRemove) && this.selected && this.selectionHelper.count > 1)
				m.add(new viewlib_1.MenuItem({
					text: utils_1.I `Remove ${this.selectionHelper.count} tracks`, cls: 'dangerous',
					onclick: () => {
						var _a, _b;
						(_b = (_a = this.actionHandler).onTrackRemove) === null || _b === void 0 ? void 0 : _b.call(_a, [...this.selectionHelper.selectedItems]);
					}
				}));
			m.add(new viewlib_1.MenuInfoItem({
				text: utils_1.I `Track ID` + ': ' +
					selected.map(x => x.track.id).join(', ') + '\n'
					+ utils_1.I `Duration` + ': ' +
					utils_1.utils.formatTime(utils_1.utils.arraySum(selected, x => x.track.length)) + '\n'
					+ utils_1.I `Size` + ': ' +
					utils_1.utils.formatFileSize(utils_1.utils.arraySum(selected, x => x.track.size))
			}));
			m.show({ ev: ev });
		};
		this.track = item;
	}
	get dragData() { return `${this.track.name} - ${this.track.artist}`; }
	createDom() {
		var track = this.track;
		return {
			tag: 'li.item.trackitem.no-selection',
			tabIndex: 0,
			child: [
				{
					tag: 'span.pos', update: (dompos) => {
						var _a;
						if (this.playing) {
							dompos.textContent = '🎵';
						}
						else if (!this.noPos) {
							dompos.textContent = ((_a = this.track._bind) === null || _a === void 0 ? void 0 : _a.position) != null
								? (this.track._bind.position + 1).toString() : '';
						}
						dompos.hidden = this.noPos && !this.playing;
					}
				},
				{ tag: 'span.name', text: () => this.track.name },
				{ tag: 'span.artist', text: () => this.track.artist },
				{ tag: 'span.duration', text: () => utils_1.utils.formatTime(this.track.length) },
			],
			draggable: true,
			_item: this
		};
	}
	updateDom() {
		super.updateDom();
		this.toggleClass('selected', !!this.selected);
	}
}
exports.TrackViewItem = TrackViewItem;

},{"./Api":4,"./ListContentView":7,"./ListIndex":8,"./PlayerCore":14,"./Router":15,"./Track":18,"./UI":20,"./User":22,"./utils":25,"./viewlib":26}],20:[function(require,module,exports){
"use strict";
// file: UI.ts
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
	function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
	return new (P || (P = Promise))(function (resolve, reject) {
		function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
		function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
		function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
		step((generator = generator.apply(thisArg, _arguments || [])).next());
	});
};
Object.defineProperty(exports, "__esModule", { value: true });
const viewlib_1 = require("./viewlib");
class SidebarItem extends viewlib_1.ListViewItem {
	constructor(init) {
		super();
		utils_1.utils.objectApply(this, init);
	}
	get onclick() { return this.onactive; }
	set onclick(val) { this.onactive = val; }
	createDom() {
		return {
			tag: 'li.item.no-selection',
			tabIndex: 0,
			text: () => this.text
		};
	}
	bindContentView(viewFunc) {
		var view;
		this.onclick = () => {
			if (!view)
				view = viewFunc();
			exports.ui.content.setCurrent(view);
			exports.ui.sidebarList.setActive(this);
		};
		return this;
	}
}
exports.SidebarItem = SidebarItem;
class ContentView extends viewlib_1.View {
	constructor() {
		super(...arguments);
		this._isVisible = false;
	}
	get isVisible() { return this._isVisible; }
	onShow() {
		this._isVisible = true;
	}
	onDomInserted() { }
	onRemove() {
		var _a;
		this._isVisible = false;
		(_a = this._shownEvents) === null || _a === void 0 ? void 0 : _a.removeAll();
	}
	get shownEvents() { return this._shownEvents ? this._shownEvents : (this._shownEvents = new utils_1.EventRegistrations()); }
}
exports.ContentView = ContentView;
class ContentHeader extends viewlib_1.View {
	constructor(init) {
		super();
		this.titleEditable = false;
		this.actions = new viewlib_1.ContainerView({ tag: 'div.actions' });
		this.titleView = new viewlib_1.View({
			tag: 'span.title.no-selection', text: () => this.title,
			update: (dom) => {
				utils_1.utils.toggleClass(dom, 'editable', !!this.titleEditable);
				if (this.titleEditable)
					dom.title = I18n_1.I `Click to edit`;
				else
					dom.removeAttribute('title');
				dom.tabIndex = this.titleEditable ? 0 : -1;
			}
		});
		this.titlebar = new viewlib_1.View({
			tag: 'div.titlebar.clearfix',
			child: [
				{ tag: 'span.catalog.no-selection', text: () => this.catalog, hidden: () => !this.catalog },
				this.titleView,
				this.actions
			]
		});
		if (init)
			utils_1.utils.objectApply(this, init);
		this.titleView.onactive = () => __awaiter(this, void 0, void 0, function* () {
			if (!this.titleEditable)
				return;
			this.editHelper = this.editHelper || new viewlib_1.EditableHelper(this.titleView.dom);
			if (this.editHelper.editing)
				return;
			var newName = yield this.editHelper.startEditAsync();
			if (newName !== this.editHelper.beforeEdit && newName != '') {
				this.onTitleEdit(newName);
			}
			this.updateDom();
		});
	}
	createDom() {
		return {
			tag: 'div.content-header',
			child: [
				this.titlebar
			]
		};
	}
	updateDom() {
		super.updateDom();
		this.titlebar.updateDom();
		this.titleView.updateDom();
	}
}
exports.ContentHeader = ContentHeader;
class ActionBtn extends viewlib_1.TextView {
	get onclick() { return this.onactive; }
	set onclick(val) { this.onactive = val; }
	constructor(init) {
		super();
		utils_1.utils.objectApply(this, init);
	}
	createDom() {
		return { tag: 'span.action.clickable.no-selection', tabIndex: 0 };
	}
}
exports.ActionBtn = ActionBtn;
const Router_1 = require("./Router");
const utils_1 = require("./utils");
const I18n_1 = require("./I18n");
const User_1 = require("./User");
const PlayerCore_1 = require("./PlayerCore");
const Uploads_1 = require("./Uploads");
/** 常驻 UI 元素操作 */
exports.ui = new class {
	constructor() {
		this.theme = new class {
			constructor() {
				this.current = 'light';
				this.timer = new utils_1.Timer(() => utils_1.utils.toggleClass(document.body, 'changing-theme', false));
				this.rendered = false;
				this.siTheme = new utils_1.SettingItem('mcloud-theme', 'str', 'light')
					.render((theme) => {
					if (this.current !== theme) {
						this.current = theme;
						if (this.rendered)
							utils_1.utils.toggleClass(document.body, 'changing-theme', true);
						utils_1.utils.toggleClass(document.body, 'dark', theme === 'dark');
						var meta = document.getElementById('meta-theme-color');
						meta.content = theme === 'dark' ? 'black' : '';
						if (this.rendered)
							this.timer.timeout(500);
					}
					this.rendered = true;
				});
			}
			set(theme) {
				this.siTheme.set(theme);
			}
		};
		this.lang = new class {
			constructor() {
				this.availableLangs = ['en', 'zh'];
				this.siLang = new utils_1.SettingItem('mcloud-lang', 'str', '');
			}
			init() {
				this.siLang.render((lang) => {
					if (!lang)
						lang = I18n_1.I18n.detectLanguage(this.availableLangs);
					this.curLang = lang;
					I18n_1.i18n.curLang = lang;
					document.body.lang = lang;
					console.log(`Current language: '${I18n_1.i18n.curLang}' - '${I18n_1.I `English`}'`);
					I18n_1.i18n.renderElements(document.querySelectorAll('.i18ne'));
				});
			}
			setLang(lang, reload) {
				this.siLang.set(lang !== null && lang !== void 0 ? lang : '');
				if (reload === undefined || reload)
					window.location.reload();
			}
		};
		this.bottomBar = new class {
			constructor() {
				this.container = document.getElementById("bottombar");
				this.btnPin = document.getElementById('btnPin');
				this.pinned = true;
				this.hideTimer = new utils_1.utils.Timer(() => { this.toggle(false); });
				this.shown = false;
				this.inTransition = false;
			}
			setPinned(val) {
				val = val !== null && val !== void 0 ? val : !this.pinned;
				this.pinned = val;
				utils_1.utils.toggleClass(document.body, 'bottompinned', val);
				this.btnPin.textContent = val ? I18n_1.I `Unpin` : I18n_1.I `Pin`;
				if (val)
					this.toggle(true);
			}
			toggle(state, hideTimeout) {
				this.shown = utils_1.utils.toggleClass(this.container, 'show', state);
				if (!this.pinned && hideTimeout)
					this.hideTimer.timeout(hideTimeout);
			}
			init() {
				var bar = this.container;
				bar.addEventListener('transitionstart', (e) => {
					if (e.target === bar && e.propertyName === 'transform')
						this.inTransition = true;
				});
				bar.addEventListener('transitionend', (e) => {
					if (e.target === bar && e.propertyName === 'transform')
						this.inTransition = false;
				});
				bar.addEventListener('transitioncancel', (e) => {
					if (e.target === bar && e.propertyName === 'transform')
						this.inTransition = false;
				});
				bar.addEventListener('mouseenter', () => {
					this.hideTimer.tryCancel();
					this.toggle(true);
				});
				bar.addEventListener('mouseleave', () => {
					this.hideTimer.tryCancel();
					if (!this.pinned)
						this.hideTimer.timeout(200);
				});
				this.siPin = new utils_1.SettingItem('mcloud-bottompin', 'bool', false)
					.render(x => this.setPinned(x))
					.bindToBtn(this.btnPin, ['', '']);
				// this.btnPin.addEventListener('click', () => this.setPinned());
			}
		};
		this.playerControl = new class {
			constructor() {
				this.progbar = document.getElementById('progressbar');
				this.fill = document.getElementById('progressbar-fill');
				this.labelCur = document.getElementById('progressbar-label-cur');
				this.labelTotal = document.getElementById('progressbar-label-total');
				this.btnPlay = new viewlib_1.TextView(document.getElementById('btn-play'));
				this.btnLoop = new viewlib_1.TextView(document.getElementById('btn-loop'));
			}
			init() {
				this.setState('none');
				this.btnLoop.dom.addEventListener('click', () => {
					var modes = PlayerCore_1.playingLoopModes;
					var next = modes[(modes.indexOf(PlayerCore_1.playerCore.loopMode) + 1) % modes.length];
					PlayerCore_1.playerCore.loopMode = next;
				});
				PlayerCore_1.playerCore.onLoopModeChanged.add(() => this.setLoopMode(PlayerCore_1.playerCore.loopMode))();
				PlayerCore_1.playerCore.onStateChanged.add(() => {
					this.setState(PlayerCore_1.playerCore.state);
					this.setProg(PlayerCore_1.playerCore.currentTime, PlayerCore_1.playerCore.duration);
				})();
				PlayerCore_1.playerCore.onProgressChanged.add(() => this.setProg(PlayerCore_1.playerCore.currentTime, PlayerCore_1.playerCore.duration));
				this.onProgressSeeking((percent) => {
					PlayerCore_1.playerCore.ensureLoaded().then(() => {
						PlayerCore_1.playerCore.currentTime = percent * PlayerCore_1.playerCore.duration;
					});
				});
				this.onPlayButtonClicked(() => {
					var state = PlayerCore_1.playerCore.state;
					if (state === 'paused')
						PlayerCore_1.playerCore.play();
					else
						PlayerCore_1.playerCore.pause();
				});
				this.btnVolume = new VolumeButton(document.getElementById('btn-volume'));
				this.btnVolume.text = I18n_1.I `Volume`;
				this.btnVolume.bindToPlayer();
			}
			setState(state) {
				var btn = this.btnPlay;
				if (state === 'none') {
					btn.text = I18n_1.I `Play`;
					btn.toggleClass('disabled', true);
				}
				else if (state === 'paused') {
					btn.text = I18n_1.I `Play`;
					btn.toggleClass('disabled', false);
				}
				else if (state === 'playing') {
					btn.text = I18n_1.I `Pause`;
					btn.toggleClass('disabled', false);
				}
				else if (state === 'stalled') {
					btn.text = I18n_1.I `Pause...`;
					btn.toggleClass('disabled', false);
				}
				else {
					throw new Error("invalid state value: " + state);
				}
				this.state = state;
			}
			setProg(cur, total) {
				var prog = cur / total;
				prog = utils_1.utils.numLimit(prog, 0, 1);
				this.fill.style.width = (prog * 100) + '%';
				this.labelCur.textContent = utils_1.utils.formatTime(cur);
				this.labelTotal.textContent = utils_1.utils.formatTime(total);
			}
			setLoopMode(str) {
				this.btnLoop.hidden = false;
				this.btnLoop.text = I18n_1.i18n.get('loopmode_' + str);
			}
			onPlayButtonClicked(cb) {
				this.btnPlay.dom.addEventListener('click', cb);
			}
			onProgressSeeking(cb) {
				var call = (offsetX) => { cb(utils_1.utils.numLimit(offsetX / this.progbar.clientWidth, 0, 1)); };
				utils_1.utils.listenPointerEvents(this.progbar, (e) => {
					e.ev.preventDefault();
					if (e.action != 'move') {
						utils_1.utils.toggleClass(this.progbar, 'btn-down', e.action === 'down');
					}
					if (exports.ui.bottomBar.shown && !exports.ui.bottomBar.inTransition)
						if ((e.type === 'mouse' && e.ev.buttons === 1)
							|| e.type === 'touch') {
							call(e.point.pageX - this.progbar.getBoundingClientRect().left);
						}
					if (e.action === 'down')
						return 'track';
				});
			}
		};
		this.trackinfo = new class {
			constructor() {
				this.element = document.getElementById('bottombar-trackinfo');
			}
			init() {
				PlayerCore_1.playerCore.onTrackChanged.add(() => this.setTrack(PlayerCore_1.playerCore.track));
			}
			setTrack(track) {
				if (track) {
					utils_1.utils.replaceChild(this.element, utils_1.utils.buildDOM({
						tag: 'span',
						child: [
							// 'Now Playing: ',
							{ tag: 'span.name', textContent: track.name },
							{ tag: 'span.artist', textContent: track.artist },
						]
					}));
					exports.ui.bottomBar.toggle(true, 5000);
				}
				else {
					this.element.textContent = "";
				}
			}
		};
		this.mainContainer = new class {
			constructor() {
				this.dom = document.getElementById('main-container');
			}
		};
		this.sidebar = new class {
			constructor() {
				this.dom = document.getElementById('sidebar');
				this._float = false;
				this._hide = false;
			}
			get float() { return this._float; }
			get hide() { return this._hide && this._float; }
			init() {
				this.toggleHide(true);
				this.checkWidth();
				window.addEventListener('resize', () => this.checkWidth());
				Router_1.router.onNavCompleted.add(() => {
					this.toggleHide(true);
				});
				viewlib_1.dragManager.onDragStart.add(() => {
					utils_1.utils.toggleClass(this.dom, 'peek', true);
				});
				viewlib_1.dragManager.onDragEnd.add(() => {
					utils_1.utils.toggleClass(this.dom, 'peek', false);
				});
				this.dom.addEventListener('dragover', () => this.toggleHide(false));
			}
			checkWidth() {
				var width = window.innerWidth;
				this.toggleFloat(width < 800);
			}
			toggleFloat(float) {
				if (float !== undefined && !!float === this._float)
					return;
				this._float = utils_1.utils.toggleClass(document.body, 'float-sidebar', float);
				if (this._float) {
					this.btnShow = this.btnShow || new SidebarToggle();
					this.dom.parentElement.appendChild(this.btnShow.dom);
				}
				else {
					this.btnShow.dom.remove();
				}
				this.updateOverlay();
			}
			toggleHide(hide) {
				this._hide = utils_1.utils.toggleClass(this.dom, 'hide', hide);
				this.updateOverlay();
			}
			updateOverlay() {
				var showOverlay = this.float && !this.hide;
				if (showOverlay != !!this.overlay) {
					if (showOverlay) {
						this.overlay = new viewlib_1.Overlay({
							tag: 'div.overlay', style: 'z-index: 99;',
							onclick: () => this.toggleHide(true),
							ondragover: () => this.toggleHide(true)
						});
						exports.ui.mainContainer.dom.appendView(this.overlay);
					}
					else {
						utils_1.utils.fadeout(this.overlay.dom);
						this.overlay = null;
					}
				}
			}
		};
		this.sidebarLogin = new class {
			constructor() {
				this.container = document.getElementById('sidebar-login');
				this.loginState = new SidebarItem();
			}
			init() {
				this.container.appendView(this.loginState);
				this.loginState.dom.id = 'login-state';
				this.loginState.onactive = (ev) => {
					User_1.user.openUI();
				};
			}
			update() {
				var _a, _b;
				var text = this.loginState.text;
				var username = (_b = (_a = User_1.user.pendingInfo) === null || _a === void 0 ? void 0 : _a.username) !== null && _b !== void 0 ? _b : User_1.user.info.username;
				if (username) {
					text = username;
					if (User_1.user.state === 'logging')
						text += I18n_1.I ` (logging in...)`;
					if (User_1.user.state === 'error')
						text += I18n_1.I ` (error!)`;
					if (User_1.user.state === 'none')
						text += I18n_1.I ` (not logged in)`;
				}
				else {
					if (User_1.user.state === 'logging')
						text = I18n_1.I `(logging...)`;
					else
						text = I18n_1.I `Guest (click to login)`;
				}
				this.loginState.updateWith({ text });
			}
		};
		this.sidebarList = new class {
			constructor() {
				this.container = document.getElementById('sidebar-list');
				this.listview = new viewlib_1.ListView(this.container);
				this.features = document.getElementById('sidebar-features');
				this.featuresListview = new viewlib_1.ListView(this.features);
				this.currentActive = new viewlib_1.ItemActiveHelper();
			}
			setActive(item) {
				this.currentActive.set(item);
			}
			addItem(item) {
				this.listview.add(item);
			}
			addFeatureItem(item) {
				this.featuresListview.add(item);
			}
		};
		this.content = new class {
			constructor() {
				this.container = document.getElementById('content-outer');
				this.current = null;
			}
			removeCurrent() {
				const cur = this.current;
				this.current = null;
				if (!cur)
					return;
				cur.contentViewState.scrollTop = this.container.scrollTop;
				cur.onRemove();
				if (cur.dom)
					this.container.removeChild(cur.dom);
			}
			setCurrent(arg) {
				if (arg === this.current)
					return;
				this.removeCurrent();
				if (arg) {
					arg.onShow();
					if (arg.dom) {
						this.container.appendChild(arg.dom);
						arg.onDomInserted();
					}
					if (!arg.contentViewState)
						arg.contentViewState = { scrollTop: 0 };
					this.container.scrollTop = arg.contentViewState.scrollTop;
				}
				this.current = arg;
			}
		};
	}
	init() {
		this.lang.init();
		this.sidebar.init();
		this.bottomBar.init();
		this.trackinfo.init();
		this.playerControl.init();
		this.sidebarLogin.init();
		viewlib_1.Dialog.defaultParent = new viewlib_1.DialogParent(this.mainContainer.dom);
		viewlib_1.ToastsContainer.default.parentDom = this.mainContainer.dom;
		Router_1.router.addRoute({
			path: ['home'],
			onNav: () => {
				exports.ui.content.setCurrent(null);
				exports.ui.sidebarList.currentActive.set(null);
			}
		});
		document.addEventListener('dragover', (ev) => {
			ev.preventDefault();
		});
		document.addEventListener('drop', (ev) => {
			var _a;
			if (ev.defaultPrevented)
				return;
			ev.preventDefault();
			const files = (_a = ev.dataTransfer) === null || _a === void 0 ? void 0 : _a.files;
			if (files && files.length) {
				new viewlib_1.MessageBox().setTitle(I18n_1.I `Question`)
					.addText(files.length === 1
					? I18n_1.I `Did you mean to upload 1 file?`
					: I18n_1.I `Did you mean to upload ${files.length} files?`)
					.addResultBtns(['no', 'yes'])
					.allowCloseWithResult('no')
					.showAndWaitResult()
					.then(r => {
					if (r === 'yes') {
						if (Router_1.router.currentStr !== 'uploads')
							Router_1.router.nav('uploads');
						for (let i = 0; i < files.length; i++) {
							const file = files[i];
							Uploads_1.uploads.uploadFile(file);
						}
					}
				});
			}
		});
		document.addEventListener('keydown', (e) => {
			document.body.classList.add('keyboard-input');
		}, true);
		['mousedown', 'touchstart'].forEach(evt => document.addEventListener(evt, (e) => {
			document.body.classList.remove('keyboard-input');
		}, true));
	}
	endPreload() {
		setTimeout(() => {
			exports.ui.mainContainer.dom.classList.remove('no-transition');
			utils_1.utils.fadeout(document.getElementById('preload-overlay'));
		}, 1);
	}
}; // ui
class ProgressButton extends viewlib_1.View {
	constructor(dom) {
		super(dom !== null && dom !== void 0 ? dom : { tag: 'div.btn' });
		this.fill = new viewlib_1.View({
			tag: 'div.btn-fill'
		});
		this.textSpan = new viewlib_1.TextView({ tag: 'span.text' });
		this.dom.classList.add('btn-progress');
		this.dom.appendView(this.fill);
		this.dom.appendView(this.textSpan);
	}
	get text() { return this.textSpan.text; }
	set text(val) { this.textSpan.text = val; }
	get progress() { return this._progress; }
	set progress(v) {
		this.fill.dom.style.width = (v * 100) + '%';
		this._progress = v;
	}
}
class VolumeButton extends ProgressButton {
	constructor(dom) {
		super(dom);
		this.onChanging = new utils_1.Callbacks();
		this.tip = '\n' + I18n_1.I `(Scroll whell or drag to adjust volume)`;
		this.dom.addEventListener('wheel', (ev) => {
			ev.preventDefault();
			var delta = Math.sign(ev.deltaY) * -0.1;
			this.onChanging.invoke(delta);
		});
		var startX;
		utils_1.utils.listenPointerEvents(this.dom, (e) => {
			if (e.type === 'mouse' && e.action === 'down' && e.ev.buttons != 1)
				return;
			e.ev.preventDefault();
			if (e.action === 'down') {
				startX = e.point.pageX;
				this.dom.classList.add('btn-down');
				this.fill.dom.style.transition = 'none';
				return 'track';
			}
			else if (e.action === 'move') {
				var deltaX = e.point.pageX - startX;
				startX = e.point.pageX;
				this.onChanging.invoke(deltaX * 0.01);
			}
			else if (e.action === 'up') {
				this.dom.classList.remove('btn-down');
				this.fill.dom.style.transition = '';
			}
		});
	}
	bindToPlayer() {
		PlayerCore_1.playerCore.onVolumeChanged.add(() => {
			this.progress = PlayerCore_1.playerCore.volume;
			this.dom.title = I18n_1.I `Volume` + ' ' + Math.floor(this.progress * 100) + '%' + this.tip;
		})();
		this.onChanging.add((x) => {
			var r = utils_1.utils.numLimit(PlayerCore_1.playerCore.volume + x, 0, 1);
			PlayerCore_1.playerCore.volume = r;
			this.tip = '';
		});
	}
}
class SidebarToggle extends viewlib_1.View {
	createDom() {
		return {
			tag: 'div.sidebar-toggle.clickable.no-selection', text: 'M',
			onclick: (ev) => {
				exports.ui.sidebar.toggleHide();
			},
			ondragover: (ev) => {
				exports.ui.sidebar.toggleHide(false);
			}
		};
	}
}

},{"./I18n":6,"./PlayerCore":14,"./Router":15,"./Uploads":21,"./User":22,"./utils":25,"./viewlib":26}],21:[function(require,module,exports){
"use strict";
// file: Uploads.ts
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
	function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
	return new (P || (P = Promise))(function (resolve, reject) {
		function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
		function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
		function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
		step((generator = generator.apply(thisArg, _arguments || [])).next());
	});
};
Object.defineProperty(exports, "__esModule", { value: true });
const TrackList_1 = require("./TrackList");
const Track_1 = require("./Track");
const utils_1 = require("./utils");
const ListIndex_1 = require("./ListIndex");
const User_1 = require("./User");
const viewlib_1 = require("./viewlib");
const Router_1 = require("./Router");
const I18n_1 = require("./I18n");
const PlayerCore_1 = require("./PlayerCore");
const UI_1 = require("./UI");
const Api_1 = require("./Api");
class UploadTrack extends Track_1.Track {
	constructor(init) {
		super(init);
		this._bind = {
			list: exports.uploads
		};
	}
	get canEdit() { return this._upload.state === 'done'; }
	setState(state) {
		var _a;
		this._upload.state = state;
		(_a = this._upload.view) === null || _a === void 0 ? void 0 : _a.updateDom();
	}
}
exports.uploads = new class extends TrackList_1.TrackList {
	constructor() {
		super(...arguments);
		this.tracks = [];
		this.state = false;
		this.canEdit = false;
		this.inprogress = 0;
		this.unreadError = false;
		this.uploadSemaphore = new utils_1.Semaphore({ maxCount: 2 });
		this.view = new class extends TrackList_1.TrackListView {
			constructor() {
				super(...arguments);
				this.usage = new viewlib_1.TextView({ tag: 'span.uploads-usage' });
			}
			appendHeader() {
				this.title = I18n_1.I `My Uploads`;
				super.appendHeader();
				this.uploadArea = new UploadArea({ onfile: (file) => exports.uploads.uploadFile(file) });
				this.dom.appendView(this.uploadArea);
				this.trackActionHandler.onTrackRemove = (items) => {
					if (items.length === 1) {
						this.removeTrack(items[0]);
					}
					else {
						new viewlib_1.MessageBox()
							.setTitle(I18n_1.I `Warning`)
							.addText(I18n_1.I `Are you sure to delete ${items.length} tracks permanently?`)
							.addResultBtns(['cancel', 'ok'])
							.allowCloseWithResult('cancel')
							.showAndWaitResult()
							.then(r => {
							if (r !== 'ok')
								return;
							items.forEach(x => this.removeTrack(x, true));
						});
					}
				};
			}
			createHeader() {
				var header = new UI_1.ContentHeader({
					title: this.title
				});
				header.titlebar.appendView(this.usage);
				return header;
			}
			onShow() {
				super.onShow();
				if (exports.uploads.unreadError) {
					exports.uploads.unreadError = false;
					exports.uploads.updateSidebarItem();
				}
			}
			appendListView() {
				super.appendListView();
				if (!exports.uploads.state)
					exports.uploads.fetch();
			}
			updateUsage() {
				var total = 0;
				exports.uploads.tracks.forEach(x => { var _a; return total += (_a = x.size) !== null && _a !== void 0 ? _a : 0; });
				this.usage.text = total ? `(${utils_1.utils.formatFileSize(total)})` : '';
			}
			updateView() {
				super.updateView();
				this.updateUsage();
			}
			createViewItem(t) {
				const item = new UploadViewItem(t);
				item.actionHandler = this.trackActionHandler;
				return item;
			}
			removeTrack(item, noPrompt) {
				return __awaiter(this, void 0, void 0, function* () {
					const track = item.track;
					if (track._upload.state === 'uploading' || track._upload.state === 'pending') {
						track._upload.state = 'cancelled';
						track._upload.cancelToken.cancel();
						exports.uploads.remove(track);
					}
					else if (track._upload.state === 'error') {
						exports.uploads.remove(track);
					}
					else if (track._upload.state === 'done') {
						if (!noPrompt && (yield new viewlib_1.MessageBox()
							.setTitle(I18n_1.I `Warning`)
							.addText(I18n_1.I `Are you sure to delete the track permanently?`)
							.addResultBtns(['cancel', 'ok'])
							.allowCloseWithResult('cancel')
							.showAndWaitResult()) !== 'ok')
							return;
						try {
							yield Api_1.api.delete({
								path: 'tracks/' + track.id
							});
						}
						catch (error) {
							viewlib_1.Toast.show(I18n_1.I `Failed to remove track.` + '\n' + error);
							return;
						}
						Api_1.api.onTrackDeleted.invoke(track);
					}
					else {
						console.error('Unexpected track._upload.state', track._upload.state);
						return;
					}
				});
			}
		}(this);
	}
	init() {
		this.sidebarItem = new ListIndex_1.ListIndexViewItem({ text: I18n_1.I `My Uploads` });
		Router_1.router.addRoute({
			path: ['uploads'],
			sidebarItem: () => this.sidebarItem,
			contentView: () => this.view
		});
		UI_1.ui.sidebarList.addFeatureItem(this.sidebarItem);
		User_1.user.onSwitchedUser.add(() => {
			if (this.state !== false && this.state !== 'waiting') {
				this.tracks = [];
				this.state = false;
				if (this.view.rendered) {
					this.view.listView.removeAll();
					this.view.updateView();
				}
				setTimeout(() => this.fetch(true), 1);
			}
		});
		User_1.user.onSwitchedUser.add(() => {
			this.sidebarItem.hidden = User_1.user.state != 'logged';
		})();
		PlayerCore_1.playerCore.onTrackChanged.add(() => {
			this.sidebarItem.updateWith({ playing: !!this.tracks.find(x => x === PlayerCore_1.playerCore.track) });
		});
		Api_1.api.onTrackInfoChanged.add((newer) => {
			this.tracks.forEach(t => {
				var _a;
				if (t.id === newer.id) {
					t.updateFromApiTrack(newer);
					(_a = t._upload.view) === null || _a === void 0 ? void 0 : _a.updateDom();
				}
			});
		});
		Api_1.api.onTrackDeleted.add((deleted) => {
			var track = this.tracks.find(x => x.id === deleted.id);
			if (track)
				this.remove(track);
		});
	}
	insertTrack(t, pos = 0, updateview) {
		this.tracks.splice(pos, 0, t);
		if (this.view.rendered)
			this.view.addItem(t, pos, updateview);
	}
	remove(track) {
		var _a;
		var pos = this.tracks.indexOf(track);
		if (pos === -1)
			return;
		this.tracks.splice(pos, 1);
		(_a = track._upload.view) === null || _a === void 0 ? void 0 : _a.remove();
	}
	fetchImpl() {
		return __awaiter(this, void 0, void 0, function* () {
			this.state = 'waiting';
			var li = new viewlib_1.LoadingIndicator();
			li.content = I18n_1.I `Logging in`;
			this.view.useLoadingIndicator(li);
			try {
				yield User_1.user.waitLogin(true);
				this.state = 'fetching';
				li.reset();
				var fetched = (yield Api_1.api.get('my/uploads'))['tracks']
					.map(t => {
					return new UploadTrack({
						infoObj: t,
						_upload: { state: 'done' }
					});
				});
				this.state = 'fetched';
			}
			catch (error) {
				li.error(error, () => this.fetchImpl());
				return;
			}
			const thiz = this;
			var doneTracks = this.tracks.filter(t => t._upload.state === 'done');
			var firstPos = this.tracks.findIndex(t => t._upload.state !== 'done') + 1;
			new class extends utils_1.DataUpdatingHelper {
				constructor() {
					super(...arguments);
					this.items = doneTracks;
				}
				addItem(data, pos) { thiz.insertTrack(data, firstPos, false); }
				updateItem(item, data) { item.updateFromApiTrack(data.infoObj); }
				removeItem(item) { var _a; (_a = item._upload.view) === null || _a === void 0 ? void 0 : _a.remove(); }
			}().update(fetched);
			this.view.useLoadingIndicator(null);
			this.view.updateView();
		});
	}
	uploadFile(file) {
		return __awaiter(this, void 0, void 0, function* () {
			var apitrack = {
				id: undefined, url: undefined,
				artist: 'Unknown', name: file.name
			};
			var track = new UploadTrack({
				infoObj: apitrack,
				blob: file,
				_upload: {
					state: 'pending',
					cancelToken: new utils_1.CancelToken()
				}
			});
			this.insertTrack(track);
			yield this.uploadSemaphore.enter();
			try {
				this.inprogress++;
				this.updateSidebarItem();
				if (track._upload.state === 'cancelled')
					return null;
				yield this.uploadCore(apitrack, track, file);
			}
			catch (err) {
				if (track._upload.state === 'cancelled')
					return null;
				track.setState('error');
				viewlib_1.Toast.show(I18n_1.I `Failed to upload file "${file.name}".` + '\n' + err, 3000);
				console.log('uploads failed: ', file.name, err);
				if (exports.uploads.view.isVisible == false) {
					this.unreadError = true;
					// will update sidebarItem later
				}
				throw err;
			}
			finally {
				this.inprogress--;
				this.updateSidebarItem();
				this.uploadSemaphore.exit();
			}
			if (this.view.rendered)
				this.view.updateUsage();
			return track;
		});
	}
	uploadCore(apitrack, track, file) {
		return __awaiter(this, void 0, void 0, function* () {
			track.setState('uploading');
			const ct = track._upload.cancelToken;
			const uploadReq = yield Api_1.api.post({
				path: 'tracks/uploadrequest',
				obj: {
					filename: file.name,
					size: file.size
				}
			});
			ct.throwIfCancelled();
			var respTrack;
			var onprogerss = (ev) => {
				var _a;
				if (ev.lengthComputable) {
					track._upload.progress = ev.loaded / ev.total;
					(_a = track._upload.view) === null || _a === void 0 ? void 0 : _a.updateDom();
				}
			};
			if (uploadReq.mode === 'direct') {
				const jsonBlob = new Blob([JSON.stringify(apitrack)]);
				const finalBlob = new Blob([
					BlockFormat.encodeBlock(jsonBlob),
					BlockFormat.encodeBlock(file)
				]);
				const xhr = yield Api_1.api.upload({
					method: 'POST',
					url: 'tracks/newfile',
					body: finalBlob,
					auth: Api_1.api.defaultAuth,
					contentType: 'application/x-mcloud-upload',
					cancelToken: ct,
					onprogerss
				}).complete;
				ct.throwIfCancelled();
				respTrack = JSON.parse(xhr.responseText);
			}
			else if (uploadReq.mode === 'put-url') {
				console.info('uploading to url', uploadReq);
				const xhr = yield Api_1.api.upload({
					method: uploadReq.method,
					url: uploadReq.url,
					body: file,
					cancelToken: ct,
					onprogerss
				}).complete;
				console.info('posting result to api');
				track.setState('processing');
				respTrack = (yield Api_1.api.post({
					path: 'tracks/uploadresult',
					obj: {
						url: uploadReq.url,
						filename: file.name,
						tag: uploadReq.tag
					}
				}));
				ct.throwIfCancelled();
			}
			else {
				throw new Error("Unknown upload mode");
			}
			track.infoObj = respTrack;
			track.setState('done');
		});
	}
	updateSidebarItem() {
		this.sidebarItem.text = this.inprogress ? I18n_1.I `My Uploads` + ` (${this.inprogress})` : I18n_1.I `My Uploads`;
		if (this.unreadError)
			this.sidebarItem.text += ' (!!)';
		this.sidebarItem.updateDom();
	}
};
class UploadViewItem extends TrackList_1.TrackViewItem {
	constructor(track) {
		super(track);
		track._upload.view = this;
	}
	postCreateDom() {
		super.postCreateDom();
		this.dom.classList.add('uploads-item');
		this.dom.appendChild(this.domstate = utils_1.utils.buildDOM({ tag: 'span.uploads-state' }));
	}
	updateDom() {
		super.updateDom();
		var newState = this.track._upload.state;
		if (this._lastUploadState != newState) {
			if (this._lastUploadState)
				this.dom.classList.remove('state-' + this._lastUploadState);
			if (newState)
				this.dom.classList.add('state-' + newState);
			if (this.track._upload.state === 'uploading' && this.track._upload.progress !== undefined) {
				this.domstate.textContent = (this.track._upload.progress * 100).toFixed(0) + '%';
			}
			else {
				this.domstate.textContent = I18n_1.i18n.get('uploads_' + newState);
			}
			this.dragging = newState === 'done';
		}
	}
}
class UploadArea extends viewlib_1.View {
	constructor(init) {
		super();
		utils_1.utils.objectApply(this, init);
	}
	createDom() {
		return {
			_ctx: this,
			tag: 'div.upload-area.clickable',
			child: [
				{ tag: 'div.text.no-selection', textContent: I18n_1.I `Click here to select files to upload` },
				{ tag: 'div.text.no-selection', textContent: I18n_1.I `or drag files to this zone...` },
				{
					tag: 'input', type: 'file', _key: 'domfile',
					style: 'visibility: collapse; height: 0;',
					accept: 'audio/*', multiple: true
				},
			]
		};
	}
	postCreateDom() {
		this.domfile.addEventListener('change', (ev) => {
			if (this.domfile.files)
				this.handleFiles(this.domfile.files);
		});
		this.dom.addEventListener('click', (ev) => {
			this.domfile.click();
		});
		this.dom.addEventListener('dragover', (ev) => {
			if (!ev.dataTransfer)
				return;
			if (ev.dataTransfer.types.indexOf('Files') >= 0) {
				ev.preventDefault();
				ev.stopPropagation();
				ev.dataTransfer.dropEffect = 'copy';
			}
		});
		this.dom.addEventListener('drop', (ev) => {
			if (!ev.dataTransfer)
				return;
			ev.preventDefault();
			ev.stopPropagation();
			if (ev.dataTransfer.types.indexOf('Files') >= 0) {
				this.handleFiles(ev.dataTransfer.files);
			}
		});
	}
	handleFiles(files) {
		var _a;
		for (let i = 0; i < files.length; i++) {
			const file = files[i];
			console.log('drop file', { name: file.name, size: file.size });
			(_a = this.onfile) === null || _a === void 0 ? void 0 : _a.call(this, file);
		}
	}
}
var BlockFormat = {
	encodeBlock(blob) {
		return new Blob([BlockFormat.encodeLen(blob.size), blob]);
	},
	encodeLen(len) {
		var str = '';
		for (var i = 0; i < 8; i++) {
			str = '0123456789aBcDeF'[(len >> (i * 4)) & 0x0f] + str;
		}
		str += '\r\n';
		return str;
	}
};

},{"./Api":4,"./I18n":6,"./ListIndex":8,"./PlayerCore":14,"./Router":15,"./Track":18,"./TrackList":19,"./UI":20,"./User":22,"./utils":25,"./viewlib":26}],22:[function(require,module,exports){
"use strict";
// file: User.ts
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
	function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
	return new (P || (P = Promise))(function (resolve, reject) {
		function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
		function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
		function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
		step((generator = generator.apply(thisArg, _arguments || [])).next());
	});
};
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("./utils");
const ListIndex_1 = require("./ListIndex");
const viewlib_1 = require("./viewlib");
const UI_1 = require("./UI");
const Api_1 = require("./Api");
const PlayerCore_1 = require("./PlayerCore");
const Uploads_1 = require("./Uploads");
const SettingsUI_1 = require("./SettingsUI");
const utils_2 = require("@yuuza/webfx/lib/utils");
exports.user = new class User {
	constructor() {
		this.siLogin = new utils_1.SettingItem('mcloud-login', 'json', {
			id: -1,
			username: null,
			passwd: undefined,
			token: null
		});
		this.state = 'none';
		this.onSwitchedUser = new utils_1.Callbacks();
		this.loggingin = null;
		this.pendingInfo = null;
		this._ignore_track_once = null;
	}
	get info() { return this.siLogin.data; }
	get isAdmin() { return this.role === 'admin'; }
	setState(state) {
		this.state = state;
		UI_1.ui.sidebarLogin.update();
	}
	init() {
		PlayerCore_1.playerCore.onTrackChanged.add(() => this.playingTrackChanged());
		if (this.info.username) {
			this.login(this.info).then(null, (err) => {
				viewlib_1.Toast.show(utils_1.I `Failed to login.` + '\n' + err, 5000);
			});
		}
		else {
			this.setState('none');
			this.openUI();
		}
	}
	initLoginUI() {
		this.loginDialog = new LoginDialog();
	}
	openUI(login) {
		login = login !== null && login !== void 0 ? login : this.state !== 'logged';
		if (login) {
			if (!this.loginDialog)
				this.loginDialog = new LoginDialog();
			this.loginDialog.show();
		}
		else {
			new MeDialog().show();
		}
	}
	closeUI() {
		var _a;
		(_a = this.loginDialog) === null || _a === void 0 ? void 0 : _a.close();
	}
	getBasicAuth(info) {
		return 'Basic ' + utils_1.utils.base64EncodeUtf8(info.username + ':' + info.passwd);
	}
	getBearerAuth(token) {
		return 'Bearer ' + token;
	}
	login(info) {
		return __awaiter(this, void 0, void 0, function* () {
			if (this.state !== 'logged')
				this.setState('logging');
			// try GET `api/users/me` using the new info
			var promise = (() => __awaiter(this, void 0, void 0, function* () {
				var token = info.token;
				try {
					// thanks to the keyword `var` of JavaScript.
					var resp = token ?
						yield Api_1.api.get('users/me', {
							auth: this.getBearerAuth(token)
						})
						: yield Api_1.api.post({
							path: 'users/me/login',
							auth: this.getBasicAuth(info)
						});
				}
				catch (err) {
					if (this.state !== 'logged')
						this.setState('error');
					if (err.message === 'user_not_found')
						throw new Error(utils_1.I `Username or password is not correct.`);
					throw err;
				}
				finally {
					this.pendingInfo = null;
				}
				yield this.handleLoginResult(resp);
			}))();
			this.loggingin = promise;
			yield promise;
		});
	}
	register(info) {
		return __awaiter(this, void 0, void 0, function* () {
			this.setState('logging');
			var promise = (() => __awaiter(this, void 0, void 0, function* () {
				var resp = yield Api_1.api.post({
					path: 'users/new',
					obj: info
				});
				if (resp.error) {
					this.setState('error');
					if (resp.error === 'dup_user')
						throw new Error(utils_1.I `A user with the same username exists`);
					throw new Error(resp.error);
				}
				yield this.handleLoginResult(resp);
			}))();
			this.loggingin = promise;
			yield promise;
		});
	}
	handleLoginResult(info) {
		return __awaiter(this, void 0, void 0, function* () {
			if (!info.username || !info.id)
				throw new Error(utils_1.I `iNTernEL eRRoR`);
			var switchingUser = this.info.username != info.username;
			this.info.id = info.id;
			this.info.username = info.username;
			this.info.passwd = undefined;
			if (info.token)
				this.info.token = info.token;
			this.role = info.role;
			this.siLogin.save();
			if (info.servermsg)
				viewlib_1.Toast.show(utils_1.I `Server: ` + info.servermsg, 3000);
			Api_1.api.storageUrlBase = info.storageUrlBase || '';
			Api_1.api.defaultAuth = this.getBearerAuth(this.info.token);
			UI_1.ui.sidebarLogin.update();
			ListIndex_1.listIndex.setIndex(info);
			this.setState('logged');
			this.loggingin = null;
			this.onSwitchedUser.invoke();
			if (info.playing)
				this.tryRestorePlaying(info.playing);
		});
	}
	logout() {
		return __awaiter(this, void 0, void 0, function* () {
			if (this.info.token) {
				var toast = viewlib_1.Toast.show(utils_1.I `Logging out...`);
				try {
					yield Api_1.api.post({ path: 'users/me/logout' });
					toast.close();
				}
				catch (error) {
					toast.text = utils_1.I `Failed to logout.` + '\n' + error;
					toast.show(5000);
					return;
				}
			}
			utils_1.utils.objectApply(this.info, { id: -1, username: undefined, passwd: undefined, token: undefined });
			this.role = undefined;
			this.siLogin.save();
			Api_1.api.defaultAuth = null;
			UI_1.ui.content.setCurrent(null);
			ListIndex_1.listIndex.setIndex(null);
			this.setState('none');
			this.loggingin = null;
			this.onSwitchedUser.invoke();
		});
	}
	setListids(listids) {
		return __awaiter(this, void 0, void 0, function* () {
			var obj = {
				id: this.info.id,
				username: this.info.username,
				listids: listids
			};
			yield Api_1.api.put({
				path: 'users/me',
				obj
			});
		});
	}
	/**
	 * Wait until finished logging in. Returns true if sucessfully logged in.
	 */
	waitLogin(throwOnFail) {
		return __awaiter(this, void 0, void 0, function* () {
			do {
				if (this.state === 'logged')
					return true;
				if (this.state === 'logging') {
					try {
						yield this.loggingin;
						if (this.state != 'logged')
							break;
						return true;
					}
					catch (_a) {
						break;
					}
				}
			} while (0);
			if (throwOnFail)
				throw new Error('No login');
			return false;
		});
	}
	playingTrackChanged() {
		var _a, _b, _c, _d, _e, _f;
		var track = PlayerCore_1.playerCore.track;
		if (track && this._ignore_track_once === track) {
			this._ignore_track_once = null;
			return;
		}
		var tl = {
			listid: (_c = (_b = (_a = track === null || track === void 0 ? void 0 : track._bind) === null || _a === void 0 ? void 0 : _a.list) === null || _b === void 0 ? void 0 : _b.id) !== null && _c !== void 0 ? _c : 0,
			position: (_e = (_d = track === null || track === void 0 ? void 0 : track._bind) === null || _d === void 0 ? void 0 : _d.position) !== null && _e !== void 0 ? _e : 0,
			trackid: (_f = track === null || track === void 0 ? void 0 : track.id) !== null && _f !== void 0 ? _f : 0
		};
		this.postPlaying(tl)
			.then(() => console.info("post playing OK"), (err) => console.warn('post playing error', err));
	}
	tryRestorePlaying(playing) {
		return __awaiter(this, void 0, void 0, function* () {
			if (playing.trackid) {
				var list = playing.listid ? ListIndex_1.listIndex.getList(playing.listid) : Uploads_1.uploads;
				yield list.fetch();
				var track = list.tracks[playing.position];
				if ((track === null || track === void 0 ? void 0 : track.id) !== playing.trackid)
					track = list.tracks.find(x => x.id === playing.trackid) || null;
				this._ignore_track_once = track;
				PlayerCore_1.playerCore.setTrack(track);
			}
		});
	}
	getPlaying() {
		return __awaiter(this, void 0, void 0, function* () {
			yield this.waitLogin(true);
			var result = yield Api_1.api.get('my/playing');
			return result;
		});
	}
	postPlaying(trackLocation) {
		return __awaiter(this, void 0, void 0, function* () {
			yield this.waitLogin(true);
			yield Api_1.api.post({
				path: 'my/playing',
				obj: trackLocation
			});
		});
	}
	changePassword(newPasswd) {
		return __awaiter(this, void 0, void 0, function* () {
			var toast = viewlib_1.Toast.show(utils_1.I `Changing password...`);
			try {
				yield Api_1.api.put({
					path: 'users/me',
					obj: {
						id: this.info.id,
						username: this.info.username,
						passwd: newPasswd
					}
				});
				this.info.passwd = newPasswd;
				Api_1.api.defaultAuth = this.getBasicAuth(this.info);
				this.siLogin.save();
			}
			catch (error) {
				toast.updateWith({ text: utils_1.I `Failed to change password.` + '\n' + error });
				toast.show(3000);
				return;
			}
			toast.updateWith({ text: utils_1.I `Password changed successfully.` });
			toast.show(3000);
		});
	}
};
class LoginDialog extends viewlib_1.Dialog {
	constructor() {
		super();
		this.tabLogin = new viewlib_1.TabBtn({ text: utils_1.I `Login`, active: true });
		this.tabCreate = new viewlib_1.TabBtn({ text: utils_1.I `Create account` });
		this.inputUser = new viewlib_1.LabeledInput({ label: utils_1.I `Username` });
		this.inputPasswd = new viewlib_1.LabeledInput({ label: utils_1.I `Password`, type: 'password' });
		this.inputPasswd2 = new viewlib_1.LabeledInput({ label: utils_1.I `Confirm password`, type: 'password' });
		this.viewStatus = new viewlib_1.TextView({ tag: 'div.input-label', style: 'white-space: pre-wrap; color: red;' });
		this.btn = new viewlib_1.ButtonView({ text: utils_1.I `Login`, type: 'big' });
		this.isRegistering = false;
		var dig = this;
		dig.title = '';
		[this.tabLogin, this.tabCreate].forEach(x => {
			dig.addBtn(x);
			x.onClick.add(() => toggle(x));
		});
		[this.inputUser, this.inputPasswd, this.inputPasswd2].forEach(x => dig.addContent(x));
		dig.addContent(utils_1.utils.buildDOM({
			tag: 'div',
			child: [this.viewStatus, this.btn]
		}));
		this.compositionWatcher = new utils_2.TextCompositionWatcher(this.dom);
		dig.dom.addEventListener('keydown', (ev) => {
			if (!this.compositionWatcher.isCompositing && ev.code === 'Enter') {
				this.btnClicked();
				ev.preventDefault();
			}
		});
		dig.autoFocus = this.inputUser.input;
		this.btn.toggleClass('bigbtn', true);
		this.btn.dom.addEventListener('click', () => this.btnClicked());
		var toggle = (btn) => {
			if (btn.active)
				return;
			this.isRegistering = !this.isRegistering;
			this.inputPasswd2.hidden = !this.isRegistering;
			this.btn.text = btn.text;
			this.tabLogin.updateWith({ active: !this.isRegistering });
			this.tabCreate.updateWith({ active: this.isRegistering });
		};
		this.inputPasswd2.hidden = true;
		this.addBtn(new viewlib_1.TabBtn({
			text: utils_1.I `Settings`, right: true,
			onclick: () => {
				SettingsUI_1.settingsUI.openUI();
				this.close();
			}
		}));
	}
	show() {
		this.center();
		super.show();
	}
	btnClicked() {
		if (this.btn.dom.classList.contains('disabled'))
			return;
		var precheckErr = [];
		if (!this.inputUser.value)
			precheckErr.push(utils_1.I `Please input the username!`);
		if (!this.inputPasswd.value)
			precheckErr.push(utils_1.I `Please input the password!`);
		else if (this.isRegistering && this.inputPasswd.value !== this.inputPasswd2.value)
			precheckErr.push(utils_1.I `Password confirmation does not match!`);
		this.viewStatus.dom.textContent = precheckErr.join('\r\n');
		if (precheckErr.length) {
			return;
		}
		(() => __awaiter(this, void 0, void 0, function* () {
			this.viewStatus.text = utils_1.I `Requesting...`;
			this.btn.updateWith({ disabled: true });
			var info = { username: this.inputUser.value, passwd: this.inputPasswd.value };
			try {
				exports.user.pendingInfo = info;
				if (this.isRegistering) {
					yield exports.user.register(info);
				}
				else {
					yield exports.user.login(info);
				}
				this.viewStatus.text = '';
				[this.inputUser, this.inputPasswd, this.inputPasswd2].forEach(x => x.value = '');
				exports.user.closeUI();
			}
			catch (e) {
				this.viewStatus.text = e;
				// fallback to previous login info
				if (exports.user.state === 'logged' && exports.user.info.username) {
					this.viewStatus.text += '\r\n' + utils_1.I `Logged in with previous working account.`;
				}
			}
			finally {
				exports.user.pendingInfo = null;
				this.btn.updateWith({ disabled: false });
			}
		}))();
	}
}
class MeDialog extends viewlib_1.Dialog {
	constructor() {
		super();
		this.btnChangePassword = new viewlib_1.ButtonView({ text: utils_1.I `Change password`, type: 'big' });
		this.btnSwitch = new viewlib_1.ButtonView({ text: utils_1.I `Switch user`, type: 'big' });
		this.btnLogout = new viewlib_1.ButtonView({ text: utils_1.I `Logout`, type: 'big' });
		var username = exports.user.info.username;
		this.title = utils_1.I `User ${username}`;
		this.addContent(new viewlib_1.View({ tag: 'p', textContent: utils_1.I `You've logged in as "${username}".` }));
		if (exports.user.isAdmin)
			this.addContent(new viewlib_1.View({ tag: 'p', textContent: utils_1.I `You are admin.` }));
		this.addContent(this.btnChangePassword);
		this.addContent(this.btnSwitch);
		this.addContent(this.btnLogout);
		this.btnChangePassword.onclick = () => {
			new ChangePasswordDialog().show();
			this.close();
		};
		this.btnSwitch.onclick = () => {
			exports.user.openUI(true);
			this.close();
		};
		this.btnLogout.onclick = () => {
			exports.user.logout();
			this.close();
		};
		this.addBtn(new viewlib_1.TabBtn({
			text: utils_1.I `Settings`, right: true,
			onclick: () => {
				SettingsUI_1.settingsUI.openUI();
				this.close();
			}
		}));
	}
}
class ChangePasswordDialog extends viewlib_1.Dialog {
	constructor() {
		super();
		this.inputPasswd = new viewlib_1.LabeledInput({ label: utils_1.I `New password`, type: 'password' });
		this.inputPasswd2 = new viewlib_1.LabeledInput({ label: utils_1.I `Confirm password`, type: 'password' });
		this.status = new viewlib_1.TextView({ tag: 'div.input-label', style: 'white-space: pre-wrap; color: red;' });
		this.btnChangePassword = new viewlib_1.ButtonView({ text: utils_1.I `Change password`, type: 'big' });
		this.title = utils_1.I `Change password`;
		[this.inputPasswd, this.inputPasswd2, this.status, this.btnChangePassword]
			.forEach(x => this.addContent(x));
		this.btnChangePassword.onclick = () => {
			if (!this.inputPasswd.value) {
				this.status.text = (utils_1.I `Please input the new password!`);
			}
			else if (this.inputPasswd.value !== this.inputPasswd2.value) {
				this.status.text = (utils_1.I `Password confirmation does not match!`);
			}
			else {
				exports.user.changePassword(this.inputPasswd.value);
				this.close();
			}
		};
	}
}

},{"./Api":4,"./ListIndex":8,"./PlayerCore":14,"./SettingsUI":17,"./UI":20,"./Uploads":21,"./utils":25,"./viewlib":26,"@yuuza/webfx/lib/utils":2}],23:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("@yuuza/webfx/lib/utils");
exports.buildInfo = {
	raw: '{"version":"1.0.0","buildDate":"2020-04-12T00:05:45.743Z"}',
	buildDate: '',
	version: '',
};
if (exports.buildInfo.raw !== '__mc_bui' + 'ld_info__') {
	const obj = JSON.parse(exports.buildInfo.raw);
	utils_1.utils.objectApply(exports.buildInfo, obj, ['buildDate', 'version']);
}
else {
	exports.buildInfo.raw = '';
}

},{"@yuuza/webfx/lib/utils":2}],24:[function(require,module,exports){
"use strict";
// file: main.ts
// TypeScript 3.7 is required.
Object.defineProperty(exports, "__esModule", { value: true });
// Why do we need to use React and Vue.js? ;)
console.time('main init');
exports.settings = {
	apiBaseUrl: 'api/',
	// apiBaseUrl: 'http://127.0.0.1:50074/api/',
	// apiBaseUrl: 'http://127.0.0.1:5000/api/',
	debug: true,
	apiDebugDelay: 0,
};
console.time('modules importing');
const viewlib_1 = require("./viewlib");
const UI_1 = require("./UI");
const PlayerCore_1 = require("./PlayerCore");
const Api_1 = require("./Api");
const User_1 = require("./User");
const ListIndex_1 = require("./ListIndex");
const Uploads_1 = require("./Uploads");
const Discussion_1 = require("./Discussion");
const Router_1 = require("./Router");
const SettingsUI_1 = require("./SettingsUI");
const MessageClient_1 = require("./MessageClient");
const NowPlaying_1 = require("./NowPlaying");
const Search_1 = require("./Search");
const Lyrics = require("./Lyrics");
const LyricsEdit_1 = require("./LyricsEdit");
console.timeEnd('modules importing');
var app = window['app'] = {
	settings: exports.settings, settingsUI: SettingsUI_1.settingsUI,
	ui: UI_1.ui, api: Api_1.api, playerCore: PlayerCore_1.playerCore, router: Router_1.router, listIndex: ListIndex_1.listIndex, user: User_1.user, uploads: Uploads_1.uploads, discussion: Discussion_1.discussion, notes: Discussion_1.notes, nowPlaying: NowPlaying_1.nowPlaying, lyricsEdit: LyricsEdit_1.lyricsEdit,
	Toast: viewlib_1.Toast, ToastsContainer: viewlib_1.ToastsContainer, Lyrics,
	msgcli: MessageClient_1.msgcli,
	init() {
		console.time('app.init()');
		UI_1.ui.init();
		PlayerCore_1.playerCore.init();
		User_1.user.init();
		Uploads_1.uploads.init();
		Search_1.search.init();
		Discussion_1.discussion.init();
		Discussion_1.notes.init();
		NowPlaying_1.nowPlaying.init();
		Discussion_1.comments.init();
		ListIndex_1.listIndex.init();
		MessageClient_1.msgcli.init();
		Router_1.router.init();
		console.timeEnd('app.init()');
	}
};
app.init();
window['preload'].jsOk();
console.timeEnd('main init');

},{"./Api":4,"./Discussion":5,"./ListIndex":8,"./Lyrics":9,"./LyricsEdit":10,"./MessageClient":12,"./NowPlaying":13,"./PlayerCore":14,"./Router":15,"./Search":16,"./SettingsUI":17,"./UI":20,"./Uploads":21,"./User":22,"./viewlib":26}],25:[function(require,module,exports){
"use strict";
function __export(m) {
	for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
__export(require("@yuuza/webfx/lib/utils"));

},{"@yuuza/webfx/lib/utils":2}],26:[function(require,module,exports){
"use strict";
function __export(m) {
	for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
__export(require("@yuuza/webfx/lib/viewlib"));

},{"@yuuza/webfx/lib/viewlib":3}]},{},[24]);
