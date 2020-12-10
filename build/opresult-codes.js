"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OP_RESULT_CODE_TO_HTTP_CODE = exports.OP_RESULT_CODES = void 0;
var http_codes_1 = require("./http-codes");
exports.OP_RESULT_CODES = {
    DELETING: 10003,
    SAVING: 10002,
    LOADING: 10001,
    OK: 0,
    FAILED: -10000,
    EXCEPTION: -11000,
    NETWORK_ERROR: -12000,
    TIMEOUT: -13000,
    NOT_IMPLEMETED: -13000,
    VALIDATION_FAILED: -20100,
    NOT_FOUND: -20200,
    CONFLICT: -20300,
    LIMIT_REACHED: -20400,
    UNAUTHORIZED: -30100,
    FORBIDDEN: -30200,
};
exports.OP_RESULT_CODE_TO_HTTP_CODE = (_a = {},
    _a[exports.OP_RESULT_CODES.DELETING] = http_codes_1.HTTP_STATUES.HS_200_OK,
    _a[exports.OP_RESULT_CODES.SAVING] = http_codes_1.HTTP_STATUES.HS_200_OK,
    _a[exports.OP_RESULT_CODES.LOADING] = http_codes_1.HTTP_STATUES.HS_200_OK,
    _a[exports.OP_RESULT_CODES.OK] = http_codes_1.HTTP_STATUES.HS_200_OK,
    _a[exports.OP_RESULT_CODES.FAILED] = http_codes_1.HTTP_STATUES.HS_500_INTERNAL_SERVER_ERROR,
    _a[exports.OP_RESULT_CODES.EXCEPTION] = http_codes_1.HTTP_STATUES.HS_500_INTERNAL_SERVER_ERROR,
    _a[exports.OP_RESULT_CODES.NETWORK_ERROR] = http_codes_1.HTTP_STATUES.HS_503_SERVICE_UNAVAILABLE,
    _a[exports.OP_RESULT_CODES.TIMEOUT] = http_codes_1.HTTP_STATUES.HS_504_GATEWAY_TIMEOUT,
    _a[exports.OP_RESULT_CODES.NOT_IMPLEMETED] = http_codes_1.HTTP_STATUES.HS_501_NOT_IMPLEMENTED,
    _a[exports.OP_RESULT_CODES.VALIDATION_FAILED] = http_codes_1.HTTP_STATUES.HS_400_BAD_REQUEST,
    _a[exports.OP_RESULT_CODES.NOT_FOUND] = http_codes_1.HTTP_STATUES.HS_404_NOT_FOUND,
    _a[exports.OP_RESULT_CODES.CONFLICT] = http_codes_1.HTTP_STATUES.HS_409_CONFLICT,
    _a[exports.OP_RESULT_CODES.LIMIT_REACHED] = http_codes_1.HTTP_STATUES.HS_480_LIMIT_REACHED,
    _a[exports.OP_RESULT_CODES.UNAUTHORIZED] = http_codes_1.HTTP_STATUES.HS_401_UNAUTHORIZED,
    _a[exports.OP_RESULT_CODES.FORBIDDEN] = http_codes_1.HTTP_STATUES.HS_403_FORBIDDEN,
    _a);