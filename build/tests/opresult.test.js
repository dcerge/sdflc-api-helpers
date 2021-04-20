"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var __1 = require("../");
var User = /** @class */ (function () {
    function User(props) {
        this.name = '';
        this.email = '';
        if (!props) {
            props = {};
        }
        this.name = props.name;
        this.email = props.email;
    }
    return User;
}());
var Login = /** @class */ (function () {
    function Login(props) {
        this.login = '';
        this.email = '';
        if (!props) {
            props = {};
        }
        this.login = props.login;
        this.email = props.email;
    }
    return Login;
}());
describe('OpResult testing', function () {
    test('OpResult Class Testing', function () {
        var rawResult = {
            code: __1.OP_RESULT_CODES.OK,
            data: [
                {
                    name: 'ITEM',
                },
            ],
            errors: [
                {
                    name: 'name',
                    errors: ['Error'],
                },
            ],
            total: 0,
        };
        var rawDataItem = {
            name: 'SOMETHING',
        };
        var rawDataArray = [
            {
                name: 'FIRST',
            },
            {
                name: 'SECOND',
            },
        ];
        var result = new __1.OpResult();
        var preInitResult = new __1.OpResult(rawResult);
        expect(result.toJS()).toEqual({
            code: __1.OP_RESULT_CODES.OK,
            data: [],
            errors: [],
            total: 0,
        });
        expect(preInitResult.toJS()).toEqual(rawResult);
        result.setData(rawDataItem);
        expect(result.toJS()).toEqual({
            code: 0,
            data: [rawDataItem],
            errors: [],
            total: 0,
        });
        result.setData(rawDataArray);
        expect(result.toJS()).toEqual({
            code: 0,
            data: rawDataArray,
            errors: [],
            total: 0,
        });
        expect(result.getDataFirst()).toEqual(rawDataArray[0]);
        expect(result.getDataFieldValue('name')).toEqual('FIRST');
        result.setData(null);
        expect(result.getDataFirst()).toEqual(null);
        expect(result.getDataFirst('N/A')).toEqual('N/A');
        result.setData(undefined);
        expect(result.getDataFirst()).toEqual(undefined);
        expect(result.getDataFirst('N/A')).toEqual('N/A');
        result.setCode(__1.OP_RESULT_CODES.VALIDATION_FAILED).addError('name', 'Name should be shorter');
        expect(result.getErrorSummary('name')).toEqual('Name should be shorter');
        expect(result.getErrorSummary('')).toEqual('');
        expect(result.code).toEqual(__1.OP_RESULT_CODES.VALIDATION_FAILED);
        result.clearErrors();
        expect(result.getErrorSummary('')).toEqual('');
        expect(result.getErrorSummary('')).toEqual('');
        var okeed = __1.OpResult.ok(rawDataItem);
        expect(okeed.getDataFirst()).toEqual(rawDataItem);
        expect(okeed.didSucceed()).toEqual(true);
        expect(okeed.didSucceedAndHasData()).toEqual(true);
        expect(okeed.didFail()).toEqual(false);
        expect(okeed.hasData()).toEqual(true);
        expect(okeed.getHttpStatus()).toEqual(200);
        okeed.setData(null);
        expect(okeed.getHttpStatus()).toEqual(204);
        var failed = __1.OpResult.fail(__1.OP_RESULT_CODES.FORBIDDEN, null, 'Access forbidden');
        expect(failed.getErrorSummary('')).toEqual('Access forbidden');
        expect(failed.didSucceed()).toEqual(false);
        expect(failed.didSucceedAndHasData()).toEqual(false);
        expect(failed.didFail()).toEqual(true);
        expect(failed.hasData()).toEqual(false);
        expect(failed.getErrorFields()).toEqual(['']);
        expect(failed.getFieldErrors('')).toEqual(['Access forbidden']);
        var failed2 = __1.OpResult.fail(__1.OP_RESULT_CODES.FORBIDDEN, { name: 'USER' }, 'Access forbidden');
        expect(failed2.getDataFirst()).toEqual({ name: 'USER' });
        var withModel = new __1.OpResult({ data: { name: 'SD', email: 'sd@gmail.com' } }, { modelClass: User });
        expect(withModel.getDataFirst()).toEqual({ name: 'SD', email: 'sd@gmail.com' });
        var withModels = new __1.OpResult({
            data: [
                { name: 'SD', email: 'sd@gmail.com' },
                { name: 'EM', email: 'em@gmail.com' },
            ],
        }, { modelClass: User });
        expect(withModels.getData()).toEqual([
            { name: 'SD', email: 'sd@gmail.com' },
            { name: 'EM', email: 'em@gmail.com' },
        ]);
        var r = new __1.OpResult();
        r.setData({
            firstName: 'John',
            lastName: 'Smith',
            fullName: function (obj) {
                return obj.firstName + " " + obj.lastName;
            },
        });
        expect(r.getDataFieldValue('fullName')).toEqual('John Smith');
        var transform = function (obj) {
            return {
                login: obj.name,
                email: obj.email,
            };
        };
        var withTransform = new __1.OpResult({
            data: [
                { name: 'SD', email: 'sd@gmail.com' },
                { name: 'EM', email: 'em@gmail.com' },
            ],
        }, { modelClass: Login, transform: transform });
        expect(withTransform.getData()).toEqual([
            { login: 'SD', email: 'sd@gmail.com' },
            { login: 'EM', email: 'em@gmail.com' },
        ]);
    });
});
