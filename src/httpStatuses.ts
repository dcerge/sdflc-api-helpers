// HTTP Status codes list: https://en.wikipedia.org/wiki/List_of_HTTP_status_codes
const HTTP_STATUSES = {
  HS_100_CONTINUE: 100,
  HS_101_SWITCH_PROTOCOLS: 101,
  HS_102_PROCESSING: 102,
  HS_103_EARLY_HINTS: 103,
  HS_200_OK: 200,
  HS_201_CREATED: 201,
  HS_202_ACCEPTED: 202,
  HS_204_NO_CONTENT: 204,
  HS_205_RESET_CONTENT: 205,
  HS_206_PARTIAL_CONTENT: 206,
  HS_208_ALREADY_REPORTED: 208,
  HS_300_MULTIPLE_CHOICE: 300,
  HS_301_MOVED_PERMANENTLY: 301,
  HS_302_FOUND: 302,
  HS_303_SEE_OTHER: 303,
  HS_304_NOT_MODIFIED: 304,
  HS_400_BAD_REQUEST: 400,
  HS_401_UNAUTHORIZED: 401,
  HS_402_PAYMENT_REQUIRED: 402,
  HS_403_FORBIDDEN: 403,
  HS_404_NOT_FOUND: 404,
  HS_405_METHOUD_NOT_ALLOWED: 405,
  HS_406_NOT_ACCEPTABLE: 406,
  HS_408_REQUEST_TIMEOUT: 408,
  HS_409_CONFLICT: 409,
  HS_410_GONE: 410,
  HS_480_LIMIT_REACHED: 480, // CUSTOM NON-STANDARD CODE FOR THIS SDFLC LIBRARY
  HS_500_INTERNAL_SERVER_ERROR: 500,
  HS_501_NOT_IMPLEMENTED: 501,
  HS_502_BAD_GATEWAY: 502,
  HS_503_SERVICE_UNAVAILABLE: 503,
  HS_504_GATEWAY_TIMEOUT: 504,
};

export { HTTP_STATUSES };
