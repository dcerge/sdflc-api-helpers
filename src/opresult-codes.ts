import { HTTP_STATUSES } from './http-codes';

export const OP_RESULT_CODES = {
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

export const OP_RESULT_CODE_TO_HTTP_CODE = {
  [OP_RESULT_CODES.DELETING]: HTTP_STATUSES.HS_200_OK,
  [OP_RESULT_CODES.SAVING]: HTTP_STATUSES.HS_200_OK,
  [OP_RESULT_CODES.LOADING]: HTTP_STATUSES.HS_200_OK,
  [OP_RESULT_CODES.OK]: HTTP_STATUSES.HS_200_OK,
  [OP_RESULT_CODES.FAILED]: HTTP_STATUSES.HS_500_INTERNAL_SERVER_ERROR,
  [OP_RESULT_CODES.EXCEPTION]: HTTP_STATUSES.HS_500_INTERNAL_SERVER_ERROR,
  [OP_RESULT_CODES.NETWORK_ERROR]: HTTP_STATUSES.HS_503_SERVICE_UNAVAILABLE,
  [OP_RESULT_CODES.TIMEOUT]: HTTP_STATUSES.HS_504_GATEWAY_TIMEOUT,
  [OP_RESULT_CODES.NOT_IMPLEMETED]: HTTP_STATUSES.HS_501_NOT_IMPLEMENTED,
  [OP_RESULT_CODES.VALIDATION_FAILED]: HTTP_STATUSES.HS_400_BAD_REQUEST,
  [OP_RESULT_CODES.NOT_FOUND]: HTTP_STATUSES.HS_404_NOT_FOUND,
  [OP_RESULT_CODES.CONFLICT]: HTTP_STATUSES.HS_409_CONFLICT,
  [OP_RESULT_CODES.LIMIT_REACHED]: HTTP_STATUSES.HS_480_LIMIT_REACHED,
  [OP_RESULT_CODES.UNAUTHORIZED]: HTTP_STATUSES.HS_401_UNAUTHORIZED,
  [OP_RESULT_CODES.FORBIDDEN]: HTTP_STATUSES.HS_403_FORBIDDEN,
};
