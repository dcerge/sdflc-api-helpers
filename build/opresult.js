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
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpResult = void 0;
var opresult_codes_1 = require("./opresult-codes");
var createData = function (props) {
    var data = props.data, modelClass = props.modelClass, transform = props.transform, flatten = props.flatten;
    var doTransform = typeof transform === 'function';
    var doFlatten = flatten !== false;
    if (data === undefined) {
        return [];
    }
    var tmpData = !Array.isArray(data) ? [data] : data;
    if (tmpData.length === 0) {
        return [];
    }
    var arrData = [];
    tmpData.forEach(function (item) {
        var transformed = doTransform ? transform(item) : item;
        if (doFlatten && Array.isArray(transformed)) {
            transformed.forEach(function (transformedItem) { return arrData.push(transformedItem); });
        }
        else {
            arrData.push(transformed);
        }
    });
    return modelClass ? arrData.map(function (dataItem) { return new modelClass(dataItem); }) : arrData;
};
var OpResult = /** @class */ (function () {
    function OpResult(props, opt) {
        this.code = opresult_codes_1.OP_RESULT_CODES.OK;
        this.data = null;
        this.errors = null;
        this.opt = {};
        if (!props) {
            props = {};
        }
        if (!opt) {
            opt = {
                modelClass: null,
                transform: null,
                doFlatted: true
            };
        }
        var code = props.code, data = props.data, errors = props.errors;
        this.code = code || opresult_codes_1.OP_RESULT_CODES.OK;
        this.data = createData(__assign({ data: data }, opt));
        this.errors = errors || {};
        this.opt = opt;
    }
    /**
     * Set data to result object. If data is not an array it will be wrapper by array.
     * @param {any} data - data to set.
     */
    OpResult.prototype.setData = function (data) {
        if (Array.isArray(data)) {
            this.data = data;
        }
        else {
            this.data = [data];
        }
        return this;
    };
    OpResult.prototype.getDataFirst = function (defaultValue) {
        var data = this.data && this.data[0];
        if (!data) {
            return defaultValue === undefined ? data : defaultValue;
        }
        else {
            return data;
        }
    };
    OpResult.prototype.getData = function () {
        return this.data;
    };
    OpResult.prototype.setCode = function (code) {
        this.code = code;
        return this;
    };
    OpResult.prototype.getCode = function () {
        return this.code;
    };
    OpResult.prototype.addError = function (field, errorMessage, code) {
        var _a;
        var key = field || '';
        if (this.errors[key] === undefined) {
            this.errors = (_a = {},
                _a[key] = {
                    errors: []
                },
                _a);
        }
        this.errors[key].errors.push(errorMessage);
        if (code != undefined && !isNaN(code)) {
            this.code = code;
        }
        return this;
    };
    OpResult.prototype.clearErrors = function () {
        this.errors = {};
        return this;
    };
    OpResult.prototype.applyModelClass = function (modelClass) {
        this.opt = __assign(__assign({}, this.opt), { modelClass: modelClass });
        var _a = this, data = _a.data, opt = _a.opt;
        this.data = createData(__assign({ data: data }, opt));
        return this;
    };
    OpResult.prototype.didSucceed = function () {
        return this.code >= opresult_codes_1.OP_RESULT_CODES.OK;
    };
    OpResult.prototype.hasData = function () {
        return (this.data || []).length > 0 && this.data[0] != null && this.data[0] != undefined;
    };
    OpResult.prototype.hasErrors = function () {
        return this.getErrorFields().length > 0;
    };
    OpResult.prototype.didSucceedAndHasData = function () {
        return this.code >= opresult_codes_1.OP_RESULT_CODES.OK && this.hasData();
    };
    OpResult.prototype.didFail = function () {
        return this.code < opresult_codes_1.OP_RESULT_CODES.OK;
    };
    OpResult.prototype.isLoading = function () {
        return this.code === opresult_codes_1.OP_RESULT_CODES.LOADING;
    };
    OpResult.prototype.isSaving = function () {
        return this.code === opresult_codes_1.OP_RESULT_CODES.SAVING;
    };
    OpResult.prototype.isDeleting = function () {
        return this.code === opresult_codes_1.OP_RESULT_CODES.DELETING;
    };
    OpResult.prototype.isInProgress = function () {
        return this.code > opresult_codes_1.OP_RESULT_CODES.OK;
    };
    OpResult.prototype.startLoading = function () {
        this.code = opresult_codes_1.OP_RESULT_CODES.LOADING;
        return this;
    };
    OpResult.prototype.startSaving = function () {
        this.code = opresult_codes_1.OP_RESULT_CODES.SAVING;
        return this;
    };
    OpResult.prototype.startDeleting = function () {
        this.code = opresult_codes_1.OP_RESULT_CODES.DELETING;
        return this;
    };
    OpResult.prototype.clone = function () {
        return new OpResult({ code: this.code, data: this.data, errors: this.errors }, __assign({}, this.opt));
    };
    OpResult.prototype.getErrorSummary = function (field) {
        var errors = (this.errors && this.errors[field || '']) || {};
        var strs = errors instanceof Array ? errors : errors.errors || [];
        return strs.reduce(function (r, c) {
            return (r = (r + " " + c).trim());
        }, '');
    };
    OpResult.prototype.getErrorFields = function () {
        return Object.keys(this.errors);
    };
    OpResult.prototype.getFieldErrors = function (fieldName) {
        return (this.errors[fieldName] || {}).errors || [];
    };
    OpResult.prototype.getDataFieldValue = function (fieldName, defaultValue) {
        if (defaultValue === void 0) { defaultValue = ''; }
        var data = (this.data instanceof Array ? this.data[0] : this.data) || {};
        return typeof data[fieldName] === 'function' ? data[fieldName](data) : data[fieldName] || defaultValue;
    };
    OpResult.prototype.toJS = function () {
        return {
            code: this.code,
            data: this.data,
            errors: this.errors
        };
    };
    OpResult.prototype.toJSON = function () {
        return JSON.stringify(this.toJS());
    };
    OpResult.prototype.getHttpStatus = function () {
        var httpStatus = opresult_codes_1.OP_RESULT_CODE_TO_HTTP_CODE[this.code];
        if (this.code === opresult_codes_1.OP_RESULT_CODES.OK) {
            if (!this.hasData()) {
                httpStatus = 204;
            }
        }
        return httpStatus;
    };
    OpResult.ok = function (data, opt) {
        return new OpResult({
            code: opresult_codes_1.OP_RESULT_CODES.OK,
            data: createData(__assign({ data: data }, opt))
        });
    };
    OpResult.fail = function (code, data, message, opt) {
        var errors = {};
        if (typeof message === 'object') {
            errors = Object.keys(message).reduce(function (acc, key) {
                acc[key] = {
                    errors: [message[key]],
                };
                return acc;
            }, {});
        }
        else {
            errors = {
                '': {
                    errors: [message || ''],
                },
            };
        }
        return new OpResult({
            code: code,
            errors: errors,
            data: data
        }, opt);
    };
    OpResult.fromException = function (exception) {
        if (exception instanceof OpResult) {
            return new OpResult(exception);
        }
        return new OpResult({
            code: opresult_codes_1.OP_RESULT_CODES.EXCEPTION,
            data: exception,
        });
    };
    OpResult.asException = function (exceptionMsg) {
        return new OpResult().setCode(opresult_codes_1.OP_RESULT_CODES.EXCEPTION).addError('', exceptionMsg);
    };
    return OpResult;
}());
exports.OpResult = OpResult;
