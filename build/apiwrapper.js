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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiWrapper = void 0;
var axios_1 = __importDefault(require("axios"));
var opresult_codes_1 = require("./opresult-codes");
var http_codes_1 = require("./http-codes");
var opresult_1 = require("./opresult");
var ApiWrapper = /** @class */ (function () {
    function ApiWrapper(props) {
        /**
         * Absolute path to API server. For example: 'https://myapi.com/v1/'. Note that ending '/' is required.
         */
        this.baseApiUrl = '';
        /**
         * Options to set to result object on fetching data.
         */
        this.resultOptions = ApiWrapper.defaultResultOptions;
        /**
         * This is the function that will be called in case there was an exception on sending request.
         * An object with the following information will be passed to the function:
         * {string} method
         * {string} url
         * {string} params
         * data
         */
        this.onException = null;
        var _a = props || {}, baseApiUrl = _a.baseApiUrl, onException = _a.onException, resultOptions = _a.resultOptions;
        this.baseApiUrl = baseApiUrl || ApiWrapper.defaultBaseApiUrl;
        this.resultOptions = resultOptions || ApiWrapper.defaultResultOptions;
        this.onException = onException || ApiWrapper.onExceptionFn;
    }
    /**
     * This function is called upon receiving response from server (after calling `axios.request`) or on an exception.
     * By checking response code it adds error messages. The main purpose is to add some message in case
     * there was no correct response from the server. This is private function and should not be called manually.
     * @param {object} response is an object returned by `ApiWrapper.fetcnFn`
     * @param {object} result is an instance of OpResult object where the function adds error descriptions if any.
     * @return {object} returns the result param with added error description.
     */
    ApiWrapper.prototype.postResult = function (response, result) {
        if (!response) {
            result.setCode(opresult_codes_1.OP_RESULT_CODES.NETWORK_ERROR).addError('', ApiWrapper.messages.networkError);
        }
        else if (response.status === http_codes_1.HTTP_STATUSES.HS_400_BAD_REQUEST) {
            result.setCode(opresult_codes_1.OP_RESULT_CODES.NETWORK_ERROR).addError('', ApiWrapper.messages.validationFailed);
        }
        else if (response.status === http_codes_1.HTTP_STATUSES.HS_404_NOT_FOUND) {
            result.setCode(opresult_codes_1.OP_RESULT_CODES.NETWORK_ERROR).addError('', ApiWrapper.messages.notFound);
        }
        else if (response.status >= http_codes_1.HTTP_STATUSES.HS_300_MULTIPLE_CHOICE) {
            result.setCode(opresult_codes_1.OP_RESULT_CODES.NETWORK_ERROR).addError('', ApiWrapper.messages.serverError);
        }
        return result;
    };
    /**
     * Sets new API URL
     * @param {string} baseApiUrl new value for api's absolute path
     */
    ApiWrapper.prototype.setBaseApiUrl = function (baseApiUrl) {
        this.baseApiUrl = baseApiUrl;
        return this;
    };
    /**
     * Combines base API URL with relative path.
     * For example, if base API URL (baseApiUrl) is 'http://myapi.com/v1/' and path 'projects'
     * then the result will be 'http://myapi.com/v1/projects'.
     * @param {string} path path to add to base API url when making a request
     */
    ApiWrapper.prototype.buildPath = function (path) {
        return "" + this.baseApiUrl + path;
    };
    /**
     * Does a request using `ApiWrapper.fetcnFn` and wraps received result into OpResult object.
     * This functions does not throw any exceptions. To check if request failed use OpResult's method `didFail()`.
     * @param {object} props information needed to make a request: method, url, data, params.
     */
    ApiWrapper.prototype.doRequest = function (props) {
        return __awaiter(this, void 0, void 0, function () {
            var method, path, data, params, url, response, result, exception_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        method = props.method, path = props.path, data = props.data, params = props.params;
                        url = this.buildPath(path);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, ApiWrapper.fetcnFn(__assign({ method: method,
                                url: url,
                                data: data,
                                params: params }, ApiWrapper.fetchFnOpts))];
                    case 2:
                        response = _a.sent();
                        result = new opresult_1.OpResult(response.data, this.resultOptions);
                        return [2 /*return*/, this.postResult(response, result)];
                    case 3:
                        exception_1 = _a.sent();
                        this.onException({ method: method, url: url, params: params, data: data, exception: exception_1 });
                        return [2 /*return*/, this.postResult(null, new opresult_1.OpResult((exception_1 || {}).data))];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Does GET request to baseApiUrl/path.
     * @param {string} path path to add to baseApiUrl
     * @param {any?} params an object to be converted into query URL params
     * @returns {OpResult} result of operation as an OpResult object
     */
    ApiWrapper.prototype.get = function (path, params) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.doRequest({ method: 'get', path: path, params: params })];
            });
        });
    };
    /**
     * Does POST request to baseApiUrl/path.
     * @param {string} path path to add to baseApiUrl
     * @param {any?} data an object to be sent in the body of the request
     * @param {any?} params an object to be converted into query URL params
     * @returns {OpResult} result of operation as an OpResult object
     */
    ApiWrapper.prototype.post = function (path, data, params) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.doRequest({ method: 'post', path: path, data: data, params: params })];
            });
        });
    };
    /**
     * Does PUT request to baseApiUrl/path.
     * @param {string} path path to add to baseApiUrl
     * @param {any?} data an object to be sent in the body of the request
     * @param {any?} params an object to be converted into query URL params
     * @returns {OpResult} result of operation as an OpResult object
     */
    ApiWrapper.prototype.put = function (path, data, params) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.doRequest({ method: 'put', path: path, data: data, params: params })];
            });
        });
    };
    /**
     * Does DELETE request to baseApiUrl/path.
     * @param {string} path path to add to baseApiUrl
     * @param {any?} data an object to be sent in the body of the request
     * @param {any?} params an object to be converted into query URL params
     * @returns {OpResult} result of operation as an OpResult object
     */
    ApiWrapper.prototype.delete = function (path, data, params) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.doRequest({ method: 'delete', path: path, data: data, params: params })];
            });
        });
    };
    ApiWrapper.defaultBaseApiUrl = '';
    ApiWrapper.defaultResultOptions = {};
    /**
     * This is default props used when making a request.
     * You can override it globally if needed
     */
    ApiWrapper.fetchFnOpts = {
        withCredentials: true,
        timeout: 0,
    };
    /**
     * The function is wrapper around axois.request function to send requests.
     * You can override it with your own function.
     * @param {object} props contain information required to send a request: method, url, data, params
     *
     */
    ApiWrapper.fetcnFn = function (props) {
        var method = props.method, url = props.url, data = props.data, params = props.params;
        return axios_1.default.request(__assign({ method: method,
            url: url,
            data: data,
            params: params }, ApiWrapper.fetchFnOpts));
    };
    /**
     * The function is called on exception when doing a request and shows exceotion details in console.
     * You can override the function either passing it to constructor as `{ onEception }` or setup globally:
     * ApiWrapper.onExceptionFn = (details) => { ... your implementation }
     * @param {object} details an object with request details
     */
    ApiWrapper.onExceptionFn = function (details) {
        console.log(ApiWrapper.messages.exception, details);
    };
    /**
     * An object with error phrases to be used when returns OpResult object in case server returned an error.
     */
    ApiWrapper.messages = {
        networkError: 'There was either failure on the server or with network. Please try again. If the issue persists please contact support.',
        validationFailed: 'Some of required fields missed.',
        notFound: 'API entry point was not found. Please contact support.',
        serverError: 'The server responded with an error',
        exception: 'An exception has occured when making a request: ',
    };
    return ApiWrapper;
}());
exports.ApiWrapper = ApiWrapper;
