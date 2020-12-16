"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiDataList = exports.API_DATALIST_FETCH_MODES = void 0;
var opresult_codes_1 = require("./opresult-codes");
var opresult_1 = require("./opresult");
var apiwrapper_1 = require("./apiwrapper");
exports.API_DATALIST_FETCH_MODES = {
    STAY: 'STAY',
    FORWARD: 'FORWARD',
    BACK: 'BACK'
};
var ApiDataList = /** @class */ (function () {
    function ApiDataList(props) {
        this.params = null;
        this.modelClass = null;
        this.state = null;
        this.transform = null;
        if (!props) {
            props = {};
        }
        var baseApiUrl = props.baseApiUrl, mode = props.mode, modelClass = props.modelClass, params = props.params, transform = props.transform;
        this.mode = mode || ApiDataList.defaults.mode;
        this.modelClass = modelClass || ApiDataList.defaults.modelClass;
        this.transform = typeof transform === 'function' ? transform : ApiDataList.defaults.transform;
        this.api = baseApiUrl ? new apiwrapper_1.ApiWrapper({ baseApiUrl: baseApiUrl, resultOptions: { modelClass: modelClass, transform: transform } }) : null;
        this.params = __assign(__assign({}, (params || ApiDataList.defaults.params)), { page: +(params || {}).page || ApiDataList.defaults.page, pageSize: +(params || {}).pageSize || ApiDataList.defaults.pageSize, orderBy: this.processOrderBy((params || {}).orderBy) });
        this.setState(props.state);
    }
    /**
     * Create clone of the object. Note this is shallow cloning and all the pages data will not be cloned
     * but rather be wrapped in a new object. This helps to work with redux.
     */
    ApiDataList.prototype.clone = function () {
        var _a = this, mode = _a.mode, modelClass = _a.modelClass, params = _a.params, transform = _a.transform;
        return new ApiDataList({ baseApiUrl: this.api.baseApiUrl, mode: mode, modelClass: modelClass, params: params, transform: transform });
    };
    /**
     * Sets object state, ie page, loaded items, etc.
     * @param {any} state state to set to the object
     */
    ApiDataList.prototype.setState = function (state) {
        if (!state) {
            state = {};
        }
        this.state = {
            currentPage: state.currentPage || ApiDataList.defaultState.currentPage,
            pages: state.pages || __assign({}, ApiDataList.defaultState.pages),
            result: new opresult_1.OpResult(null, { modelClass: this.modelClass }),
            loadedCnt: state.loadedCnt || ApiDataList.defaultState.loadedCnt,
            totalCnt: state.loadedCnt || ApiDataList.defaultState.totalCnt,
            allRead: false
        };
        return this;
    };
    /**
     * Used to convert orderBy object into a string to be sent to the server API.
     */
    ApiDataList.prototype.stringifyOrderBy = function () {
        var _this = this;
        var arr = [];
        Object.keys(this.params.orderBy).forEach(function (key) {
            arr.push(key + "-" + _this.params.orderBy[key]);
        });
        return arr.join('~');
    };
    /**
     * Used to convert stringified orderBy back into a object on the server side.
     */
    ApiDataList.prototype.parseOrderBy = function (orderBy) {
        if (!orderBy || typeof orderBy !== 'string') {
            return {};
        }
        var tmp = {};
        orderBy.split('~').forEach(function (token) {
            var _a = token.split('-'), key = _a[0], tmpOrder = _a[1];
            var orderIdx = ApiDataList.defaults.allowedOrderDirections.indexOf((tmpOrder || '').toLowerCase());
            var order = ApiDataList.defaults.allowedOrderDirections[orderIdx !== -1 ? orderIdx : 0];
            tmp[key] = order;
        });
        return tmp;
    };
    /**
     * Resets state, ie removes all read pages, sets page to 1, etc.
     */
    ApiDataList.prototype.resetState = function () {
        return this.setState();
    };
    /**
     * Sets absolute API URL to the ApiWrapper object.
     * @param baseApiUrl Absolute API URL to use when making API calls.
     */
    ApiDataList.prototype.setBaseUrl = function (baseApiUrl) {
        if (this.api) {
            if (baseApiUrl) {
                this.api.setBaseApiUrl(baseApiUrl);
            }
            else {
                this.api = null;
            }
        }
        else if (baseApiUrl) {
            var _a = this, modelClass = _a.modelClass, transform = _a.transform;
            this.api = new apiwrapper_1.ApiWrapper({ baseApiUrl: baseApiUrl, resultOptions: { modelClass: modelClass, transform: transform } });
        }
        return this.resetState();
    };
    /**
     * Sets modelClass which is used as received list items initialized.
     * It may be needed to conver anonymous objects to required class.
     * @param modelClass
     */
    ApiDataList.prototype.setModelClass = function (modelClass) {
        this.modelClass = modelClass;
        return this.resetState();
    };
    /**
     * Sets fetch mode to one of the following:
     * - STAY - do not change page number when calling fetchList
     * - FORWARD - increase page number before making API call to fetch list.
     * - BACK - decrease page number before making API call to fetch list. If page is 1 then return error.
     * @param mode specifies the way how to change page number on each fetch call.
     */
    ApiDataList.prototype.setMode = function (mode) {
        this.mode = mode;
        return this;
    };
    /**
     * Sets parameters to send to the server. Parameters is what added after '?' in URL.
     * @param params to be send to the server along with API call.
     * @param {boolean} reset if specified and true then resets inner state
     */
    ApiDataList.prototype.setParams = function (params, reset) {
        this.params = params;
        return reset === true ? this.resetState() : this;
    };
    /**
     * Appends specified parameters with existing parameters and resets current internal state.
     * @param params to be added or replaced to existing parameters
     * @param {boolean} reset if specified and true then resets inner state
     */
    ApiDataList.prototype.appendParams = function (params, reset) {
        this.params = __assign(__assign({}, this.params), params);
        return reset === true ? this.resetState() : this;
    };
    /**
     * Removes parameters by provided list of names.
     * @param {string[]} keys array of params props names to remove.
     * @param {boolean} reset if specified and true then resets inner state
     */
    ApiDataList.prototype.removeParams = function (keys, reset) {
        var _this = this;
        var newParams = Object.keys(this.params || {})
            .filter(function (key) { return keys.indexOf(key) === -1; })
            .reduce(function (obj, key) {
            obj[key] = _this.params[key];
            return obj;
        }, {});
        this.params = __assign({}, newParams);
        return reset === true ? this.resetState() : this;
    };
    /**
     * Removes currents parameters and resets current internal state.
     * @param {boolean} reset if specified and true then resets inner state
     */
    ApiDataList.prototype.resetParams = function (reset) {
        this.params = null;
        return reset === true ? this.resetState() : this;
    };
    /**
     * Returns current parameters.
     */
    ApiDataList.prototype.getParams = function () {
        return this.params;
    };
    /**
     * Sets pageSize which is number of items to request from the server when making API call.
     * @param {number} pageSize amount of items to request when making API call.
     * @param {boolean} reset if specified and true then resets inner state
     */
    ApiDataList.prototype.setPageSize = function (pageSize, reset) {
        this.params.pageSize = pageSize;
        return reset === true ? this.resetState() : this;
    };
    /**
     * Processes orderBy property:
     * - If the object is used on the server side to wrap list request params then orderBy should a string.
     * - If the object is used on front-end (ie send requests to API) then orderBy should be an object
     * where its keys are fields to sort and values are order in which to sort (asc, desc).
     */
    ApiDataList.prototype.processOrderBy = function (orderBy) {
        var orderByType = typeof orderBy;
        if (orderByType === 'string') {
            // orderBy passed as string so try to parse it into an object
            return this.parseOrderBy(orderBy);
        }
        else if (orderByType === 'object') {
            // orderBy is an object so use it
            return orderBy;
        }
        else {
            // orderBy is neither string or object so use class defaults
            return ApiDataList.defaults.orderBy;
        }
    };
    /**
     * Sets new orderBy property.
     * @param {object|string} orderBy object or string to be set to orderBy property.
     * @param {boolean} reset if specified and true then resets inner state
     */
    ApiDataList.prototype.setOrderBy = function (orderBy, reset) {
        this.params.orderBy = this.processOrderBy(orderBy);
        return reset === true ? this.resetState() : this;
    };
    /**
     * Toggles (asc/desc) orderBy property for provided field. If no field provided it toggles all fields in orderBy.
     * @param {string} key name of field (key) to toggle asc <=> desc.
     * @param {boolean?} reset specified if resetting state is needed after toggling.
     */
    ApiDataList.prototype.toggleOrderBy = function (key, reset) {
        var _this = this;
        var newOrder = '';
        var orderBy = this.params.orderBy;
        if (!key) {
            Object.keys(orderBy).forEach(function (item) { return _this.toggleOrderBy(item, false); });
            return reset === true ? this.resetState() : this;
        }
        var order = orderBy[key];
        if (order === 'asc') {
            newOrder = 'desc';
        }
        else if (order === 'desc') {
            newOrder = 'asc';
        }
        if (newOrder) {
            orderBy[key] = newOrder;
        }
        return reset === true ? this.resetState() : this;
    };
    /**
     * Sets new page number. If page less than zero sets it as zero.
     * @param page speficies page number to set.
     */
    ApiDataList.prototype.setPage = function (page) {
        if (page < 0) {
            page = 0;
        }
        this.state.currentPage = page;
        return this;
    };
    /**
     * Increases page number by one.
     */
    ApiDataList.prototype.toNextPage = function () {
        this.setPage(this.state.currentPage + 1);
        return this;
    };
    /**
     * Decreases page number by one.
     */
    ApiDataList.prototype.toPrevPage = function () {
        this.setPage(this.state.currentPage - 1);
        return this;
    };
    /**
     * Returns curent page number.
     */
    ApiDataList.prototype.getPage = function () {
        return this.state.currentPage;
    };
    /**
     * Returns true if it can be expected that fetch operation return data.
     * It is true when:
     * - mode is forward and allRead is not true.
     * - mode is backward and page number is more than one.
     */
    ApiDataList.prototype.canFetchMode = function () {
        return (this.mode === exports.API_DATALIST_FETCH_MODES.FORWARD && !this.state.allRead)
            || (this.mode === exports.API_DATALIST_FETCH_MODES.BACK && this.state.currentPage > 1);
    };
    /**
     * Make API call to fetch list from the server. Before making actual call it changes page number accordingly.
     * After receiving result it transforms and sets received data to pages object.
     * @param path relative path added to API URL.
     * @returns OpResult result of fetch list operation.
     */
    ApiDataList.prototype.fetchList = function (path) {
        if (path === void 0) { path = ''; }
        return __awaiter(this, void 0, void 0, function () {
            var page, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        page = this.state.currentPage;
                        switch (this.mode) {
                            default:
                            case exports.API_DATALIST_FETCH_MODES.STAY:
                                break;
                            case exports.API_DATALIST_FETCH_MODES.FORWARD:
                                if (this.canFetchMode()) {
                                    page++;
                                }
                                else {
                                    return [2 /*return*/, opresult_1.OpResult.fail(opresult_codes_1.OP_RESULT_CODES.LIMIT_REACHED)];
                                }
                                break;
                            case exports.API_DATALIST_FETCH_MODES.BACK:
                                if (page > 1) {
                                    page--;
                                }
                                else {
                                    return [2 /*return*/, opresult_1.OpResult.fail(opresult_codes_1.OP_RESULT_CODES.LIMIT_REACHED)];
                                }
                                break;
                        }
                        this.startLoading();
                        return [4 /*yield*/, this.api.get(path, __assign(__assign({}, this.params), { page: page, orderBy: this.stringifyOrderBy() }))];
                    case 1:
                        result = _a.sent();
                        if (result.didSucceedAndHasData()) {
                            this.setPage(page);
                        }
                        this.setFetchListResult(result);
                        return [2 /*return*/, result];
                }
            });
        });
    };
    /**
     * Transforms and sets data from OpResult to pages object.
     * Also, it sets allRead flag in case if we received less data items than requested.
     * @param result represents OpResult object with received data.
     */
    ApiDataList.prototype.setFetchListResult = function (result) {
        this.state.result = result;
        var newItems = result.getData();
        this.state.loadedCnt = newItems.length;
        this.state.totalCnt += this.state.loadedCnt;
        this.state.allRead = this.state.loadedCnt < this.params.pageSize;
        if (this.state.loadedCnt > 0) {
            this.state.pages[this.state.currentPage] = newItems;
        }
    };
    /**
     * Returns pages count requested by this moment.
     */
    ApiDataList.prototype.getTotalPages = function () {
        return Object.keys(this.state.pages).length;
    };
    /**
     * Returns items for specified page or for current page.
     * @param page
     */
    ApiDataList.prototype.getPageItems = function (page) {
        if (page === void 0) { page = -1; }
        var items = this.state.pages[page];
        return Array.isArray(items) ? items : [];
    };
    /**
     * Returns items for all pages requested by this moment.
     */
    ApiDataList.prototype.getItems = function () {
        var pages = this.state.pages;
        var pagesKeys = Object.keys(pages);
        var items = pagesKeys.reduce(function (acc, pageKey) {
            (pages[pageKey] || []).forEach(function (item) {
                acc.push(item);
            });
            return acc;
        }, []);
        return items;
    };
    /**
     * Sets loading state to the inner state OpResult object. This may be used to change UI accordingly to let a user know that list is being loaded.
     */
    ApiDataList.prototype.startLoading = function () {
        this.state.result.startLoading();
        return this;
    };
    /**
     * Returns true if the request is still in progress.
     */
    ApiDataList.prototype.isLoading = function () {
        return this.state.result.isLoading();
    };
    /**
     * Returns true if the request succeeded.
     */
    ApiDataList.prototype.didSucceed = function () {
        return this.state.result.didSucceed();
    };
    /**
     * Returns true if the request failed.
     */
    ApiDataList.prototype.didFail = function () {
        return this.state.result.didFail();
    };
    /**
     * Returns request result as OpResult object.
     */
    ApiDataList.prototype.getResult = function () {
        return this.state.result;
    };
    /**
     * Defaults used when an object of the class gets initialized
     */
    ApiDataList.defaults = {
        mode: exports.API_DATALIST_FETCH_MODES.FORWARD,
        modelClass: null,
        page: 1,
        pageSize: process.env.DATALIST_DEFAULT_PAGESIZE || 50,
        orderBy: {},
        params: {},
        allowedOrderDirections: ['asc', 'desc'],
        transform: null,
    };
    /**
     * Defaults for the object state when it gets initialized or reset
     */
    ApiDataList.defaultState = {
        currentPage: 0,
        pages: {},
        result: new opresult_1.OpResult(),
        loadedCnt: undefined,
        totalCnt: 0,
    };
    return ApiDataList;
}());
exports.ApiDataList = ApiDataList;
;
