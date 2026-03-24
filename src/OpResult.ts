import { OP_RESULT_CODES, OP_RESULT_CODE_TO_HTTP_CODE, OpResultCode } from './opResultCodes';
import { OpResultErrorCategory, OpResultErrorItem, OpResultFormErrors, OpResultOptions } from './interfaces';
import { HTTP_STATUSES } from './httpStatuses';

/**
 * Type guard that checks whether a value is an OpResult instance.
 * Preferred over `instanceof` as it works across module boundaries,
 * different bundle copies, and JS realms (workers, iframes, etc.).
 *
 * @param value - The value to check.
 * @returns True if the value is an OpResult instance.
 *
 * @example
 * if (isOpResult(value)) {
 *   console.log(value.didSucceed());
 * }
 */
export function isOpResult(value: any): value is OpResult {
  return (
    value !== null &&
    typeof value === 'object' &&
    value._isOpResult === true &&
    Array.isArray(value.errors) &&
    typeof value.didSucceed === 'function'
  );
}

/**
 * Normalizes input data into a flat array, optionally transforming
 * each item and/or wrapping each item in a model class instance.
 *
 * - If `data` is undefined or empty, returns [].
 * - If `data` is not an array, wraps it in one before processing.
 * - If `transform` is provided, applies it to each item.
 * - If `flatten` is true (default), flattens any arrays returned by `transform`.
 * - If `modelClass` is provided, maps each item through `new modelClass(item)`.
 */
const createData = (props: any) => {
  const { data, modelClass, transform, flatten } = props;
  const doTransform = typeof transform === 'function';
  const doFlatten = flatten !== false;

  if (data === undefined) {
    return [];
  }

  const tmpData = !Array.isArray(data) ? [data] : data;

  if (tmpData.length === 0) {
    return [];
  }

  const arrData: any = [];

  tmpData.forEach((item: any) => {
    const transformed = doTransform ? transform(item) : item;

    if (doFlatten && Array.isArray(transformed)) {
      transformed.forEach((transformedItem: any) => arrData.push(transformedItem));
    } else {
      arrData.push(transformed);
    }
  });

  return modelClass ? arrData.map((dataItem: any) => new modelClass(dataItem)) : arrData;
};

/**
 * Represents the result of an operation, typically an API call.
 * Encapsulates a status code, data payload, total count, and a structured
 * list of errors. Designed to be used on both client and server sides.
 *
 * @example
 * // Success with data
 * const result = OpResult.ok([{ id: 1, name: 'Alice' }]);
 *
 * // Failure with a message
 * const result = OpResult.fail(OP_RESULT_CODES.VALIDATION_FAILED, null, 'Invalid input');
 *
 * // Chaining
 * const result = new OpResult()
 *   .setCode(OP_RESULT_CODES.VALIDATION_FAILED)
 *   .addError('email', 'Email is required')
 *   .addError('password', 'Password is too short');
 */
export class OpResult {
  /** Brand property used by the `isOpResult` type guard. */
  readonly _isOpResult = true;

  /** Operation status code. Positive = in progress, 0 = OK, negative = failure. */
  code: number = OP_RESULT_CODES.OK;

  /** Data payload returned by the operation. Always stored as an array internally. */
  data: any = null;

  /** Total number of records available, useful for paginated responses. */
  total = 0;

  /** Structured list of errors, grouped by field name. */
  errors: OpResultErrorItem[] = [];

  /** Options controlling data transformation and model instantiation. */
  private opt?: OpResultOptions;

  /** Cached flat map of field name to joined error string. Invalidated on any error mutation. */
  private _errorsMapCache: Record<string, string> | null = null;

  /**
   * Builds and caches a flat map of field name to joined error string.
   * Returns the cached version if available.
   */
  private _buildErrorsMap(): Record<string, string> {
    if (this._errorsMapCache) {
      return this._errorsMapCache;
    }

    this._errorsMapCache = this.errors.reduce((acc: Record<string, string>, item: OpResultErrorItem) => {
      acc[item.name] = item.errors.join('. ');
      return acc;
    }, {});

    return this._errorsMapCache;
  }

  /**
   * Invalidates the errors map cache.
   * Must be called whenever `this.errors` is mutated.
   */
  private _invalidateErrorsCache() {
    this._errorsMapCache = null;
    return this;
  }

  /**
   * Creates a new OpResult instance.
   *
   * @param props - Initial values for `code`, `data`, and `errors`.
   * @param opt - Options for data transformation: `modelClass`, `transform`, `flatten`.
   *
   * @example
   * const result = new OpResult({ code: OP_RESULT_CODES.OK, data: [{ id: 1 }] });
   */
  constructor(props?: any, opt?: OpResultOptions) {
    if (!props) {
      props = {};
    }

    if (!opt) {
      opt = {
        modelClass: undefined,
        transform: undefined,
        flatten: true,
      };
    }

    const { code, data, errors, total } = props;

    this.code = code || OP_RESULT_CODES.OK;
    this.data = createData({ data, ...opt });
    this.total = total || 0;
    this.errors = errors || [];
    this.opt = opt;
  }

  // ============================================
  // Data
  // ============================================

  /**
   * Replaces the current data payload.
   * Non-array values are wrapped in an array for internal consistency.
   *
   * @param data - The new data to store.
   *
   * @example
   * result.setData({ id: 1 });     // stored as [{ id: 1 }]
   * result.setData([{ id: 1 }]);   // stored as-is
   */
  setData(data: any): OpResult {
    if (Array.isArray(data)) {
      this.data = data;
    } else {
      this.data = [data];
    }

    return this;
  }

  /**
   * Returns the first item in the data array.
   * If no data is present, returns `defaultValue` if provided, otherwise returns the falsy value as-is.
   *
   * @param defaultValue - Fallback value if data is empty or falsy.
   *
   * @example
   * result.getDataFirst();           // first item or undefined
   * result.getDataFirst(null);       // first item or null
   */
  getDataFirst(defaultValue?: any): any {
    const data = this.data && this.data[0];

    if (!data) {
      return defaultValue === undefined ? data : defaultValue;
    }

    return data;
  }

  /**
   * Returns the full data array.
   */
  getData(): any {
    return this.data;
  }

  /**
   * Returns the value of a named field from the first data item.
   * If the field value is a function, calls it with the data item as the argument.
   * Falls back to `defaultValue` if the field is missing or falsy.
   *
   * @param field - Field name to retrieve.
   * @param defaultValue - Fallback value if the field is absent or falsy. Defaults to ''.
   *
   * @example
   * result.getDataFieldValue('name');          // 'Alice'
   * result.getDataFieldValue('role', 'guest'); // 'guest' if role is missing
   */
  getDataFieldValue(field: string, defaultValue = ''): any {
    const data = (this.data instanceof Array ? this.data[0] : this.data) || {};
    return typeof data[field] === 'function' ? data[field](data) : data[field] || defaultValue;
  }

  /**
   * Applies a model class to the current data, re-wrapping each item
   * with `new modelClass(item)`. Useful when the model class is not
   * known at construction time.
   *
   * @param modelClass - Constructor to wrap each data item with.
   *
   * @example
   * result.applyModelClass(UserModel);
   */
  applyModelClass(modelClass: any): OpResult {
    this.opt = {
      ...this.opt,
      modelClass,
    };

    const { data, opt } = this;

    this.data = createData({ data, ...opt });

    return this;
  }

  // ============================================
  // Code
  // ============================================

  /**
   * Sets the operation status code.
   *
   * @param code - A numeric status code, typically from `OP_RESULT_CODES`.
   */
  setCode(code: number): OpResult {
    this.code = code;
    return this;
  }

  /**
   * Returns the current operation status code.
   */
  getCode(): number {
    return this.code;
  }

  // ============================================
  // Total
  // ============================================

  /**
   * Sets the total record count, useful for pagination.
   * Ignores negative or NaN values, defaulting to 0.
   *
   * @param total - Total number of records available.
   */
  setTotal(total: number): OpResult {
    this.total = !isNaN(total) && total >= 0 ? total : 0;
    return this;
  }

  /**
   * Returns the total record count.
   */
  getTotal(): number {
    return this.total;
  }

  // ============================================
  // Status checks
  // ============================================

  /**
   * Returns true if the operation completed successfully (code === OK).
   */
  didSucceed(): boolean {
    return this.code === OP_RESULT_CODES.OK;
  }

  /**
   * Returns true if the operation succeeded and data is present.
   */
  didSucceedAndHasData(): boolean {
    return this.code === OP_RESULT_CODES.OK && this.hasData();
  }

  /**
   * Returns true if the operation failed (code < OK).
   */
  didFail(): boolean {
    return this.code < OP_RESULT_CODES.OK;
  }

  /**
   * Returns true if data is present and the first item is not null or undefined.
   */
  hasData(): boolean {
    return (this.data || []).length > 0 && this.data[0] != null && this.data[0] != undefined;
  }

  /**
   * Returns true if there are any errors in the errors array.
   */
  hasErrors(): boolean {
    return Array.isArray(this.errors) ? this.errors.length > 0 : false;
  }

  /**
   * Returns true if the operation is currently in a loading state.
   */
  isLoading(): boolean {
    return this.code === OP_RESULT_CODES.LOADING;
  }

  /**
   * Returns true if the operation is currently in a saving state.
   */
  isSaving(): boolean {
    return this.code === OP_RESULT_CODES.SAVING;
  }

  /**
   * Returns true if the operation is currently in a deleting state.
   */
  isDeleting(): boolean {
    return this.code === OP_RESULT_CODES.DELETING;
  }

  /**
   * Returns true if the operation is in any in-progress state (code > OK).
   */
  isInProgress(): boolean {
    return this.code > OP_RESULT_CODES.OK;
  }

  /**
   * Sets the code to LOADING and returns this for chaining.
   */
  startLoading(): OpResult {
    this.code = OP_RESULT_CODES.LOADING;
    return this;
  }

  /**
   * Sets the code to SAVING and returns this for chaining.
   */
  startSaving(): OpResult {
    this.code = OP_RESULT_CODES.SAVING;
    return this;
  }

  /**
   * Sets the code to DELETING and returns this for chaining.
   */
  startDeleting(): OpResult {
    this.code = OP_RESULT_CODES.DELETING;
    return this;
  }

  // ============================================
  // Category helpers
  // ============================================

  /**
   * Returns the error category for the current code.
   * Useful for conditional UI handling without comparing raw numeric codes.
   *
   * @example
   * if (result.getCategory() === 'auth') { redirectToLogin(); }
   */
  getCategory(): OpResultErrorCategory {
    return OpResult.getCategoryFromCode(this.code);
  }

  /**
   * Returns true if the error is authentication-related
   * (e.g. unauthorized, expired token, invalid signature).
   */
  isAuthError(): boolean {
    return this.getCategory() === 'auth';
  }

  /**
   * Returns true if the requested resource was not found.
   */
  isNotFound(): boolean {
    return this.getCategory() === 'not_found';
  }

  /**
   * Returns true if the error is due to failed validation.
   */
  isValidationError(): boolean {
    return this.getCategory() === 'validation';
  }

  /**
   * Returns true if the error is a conflict (e.g. duplicate record).
   */
  isConflict(): boolean {
    return this.getCategory() === 'conflict';
  }

  /**
   * Returns true if a resource or rate limit has been reached.
   */
  isLimitReached(): boolean {
    return this.getCategory() === 'limit';
  }

  /**
   * Returns true if the error originated from a server-side failure or unhandled exception.
   */
  isServerError(): boolean {
    return this.getCategory() === 'server';
  }

  /**
   * Returns true if the error is network-related (e.g. connectivity issue, timeout).
   */
  isNetworkError(): boolean {
    return this.getCategory() === 'network';
  }

  /**
   * Returns true if the operation can be safely retried.
   * Currently covers network errors and server errors.
   */
  isRetryableError(): boolean {
    const category = this.getCategory();
    return category === 'network' || category === 'server';
  }

  // ============================================
  // Errors
  // ============================================

  /**
   * Adds an error message for a given field. If errors for the field already
   * exist, the new message(s) are appended. Optionally updates the status code.
   * Invalidates the errors map cache.
   *
   * @param field - Field name the error belongs to. Use '' for generic errors.
   * @param errorMessage - A single message or array of messages.
   * @param code - Optional status code to set on the result.
   *
   * @example
   * result.addError('email', 'Email is required');
   * result.addError('', 'Something went wrong', OP_RESULT_CODES.FAILED);
   */
  addError(field: string, errorMessage: string | string[], code?: number): OpResult {
    const key = field || '';
    let err = this.errors.find((item) => item.name === key);

    if (!err) {
      err = {
        name: field,
        errors: Array.isArray(errorMessage) ? errorMessage : [errorMessage],
      };

      this.errors.push(err);
    } else if (Array.isArray(errorMessage)) {
      err.errors.push(...errorMessage);
    } else {
      err.errors.push(errorMessage);
    }

    if (code != undefined && !isNaN(code)) {
      this.code = code;
    }

    this._invalidateErrorsCache();

    return this;
  }

  /**
   * Removes all errors and invalidates the errors map cache.
   */
  clearErrors() {
    this.errors = [];
    this._invalidateErrorsCache();
    return this;
  }

  /**
   * Returns the raw array of error messages for a given field.
   * Returns an empty array if no errors exist for that field.
   *
   * @param field - Field name to look up. Use '' for generic errors.
   *
   * @example
   * result.getFieldErrors('email'); // ['Email is required', 'Email is invalid']
   */
  getFieldErrors(field: string): string[] {
    const errors = (this.errors || []).find((item: any) => item.name === field);
    return errors && Array.isArray(errors.errors) ? errors.errors : [];
  }

  /**
   * Returns a single combined error string for the given field,
   * with individual messages joined by a space.
   * Returns an empty string if no errors exist for that field.
   *
   * @param field - Field name to look up. Defaults to '' for generic errors.
   *
   * @example
   * result.getErrorSummary('email');  // 'Email is required Email is invalid'
   * result.getErrorSummary();         // generic errors summary
   */
  getErrorSummary(field?: string): string {
    return this._buildErrorsMap()[field ?? ''] ?? '';
  }

  /**
   * Returns an array of all field names that have errors.
   *
   * @example
   * result.getErrorFields(); // ['email', 'password', '']
   */
  getErrorFields(): string[] {
    return this.errors.map((item) => item.name);
  }

  /**
   * Returns a flat map of field name to combined error string for all fields.
   * Result is cached and invalidated on any error mutation.
   *
   * @example
   * result.getErrorsMap();
   * // { email: 'Email is required', password: 'Too short' }
   */
  getErrorsMap(): Record<string, string> {
    return this._buildErrorsMap();
  }

  /**
   * Returns a map of error summaries for fields NOT in `knownFields`.
   * Useful for surfacing unexpected or server-side errors that don't
   * correspond to any known form field.
   *
   * @param knownFields - Fields to exclude from the result.
   *
   * @example
   * result.getCommonErrors(['email', 'password']);
   * // { '': 'Something went wrong', 'username': 'Already taken' }
   */
  getCommonErrors(knownFields: string[]): Record<string, string> {
    const knownSet = new Set(knownFields);
    return Object.entries(this._buildErrorsMap()).reduce((acc: Record<string, string>, [key, value]) => {
      if (!knownSet.has(key)) {
        acc[key] = value;
      }
      return acc;
    }, {});
  }

  /**
   * Merges errors from another OpResult into this one.
   * For fields that already have errors, only non-duplicate messages are appended.
   * For new fields, the entire error entry is deep-copied and added.
   * Invalidates the errors map cache.
   *
   * @param opResult - The OpResult whose errors should be merged in.
   *
   * @example
   * result.mergeErrorsIn(validationResult).mergeErrorsIn(authResult);
   */
  mergeErrorsIn(opResult: OpResult): OpResult {
    if (!isOpResult(opResult)) {
      return this;
    }

    const errorMap = new Map<string, OpResultErrorItem>(this.errors.map((item) => [item.name, item]));

    opResult.errors.forEach((incomingError) => {
      const existing = errorMap.get(incomingError.name);

      if (existing) {
        const newMessages = incomingError.errors.filter((msg) => !existing.errors.includes(msg));
        existing.errors.push(...newMessages);
      } else {
        const newEntry = { ...incomingError, errors: [...incomingError.errors] };
        this.errors.push(newEntry);
        errorMap.set(incomingError.name, newEntry);
      }
    });

    this._invalidateErrorsCache();

    return this;
  }

  // ============================================
  // Serialization
  // ============================================

  /**
   * Returns a plain object representation of this result.
   * Suitable for logging, passing over the wire, or storing in state.
   */
  toJS(): any {
    return {
      code: this.code,
      data: this.data,
      total: this.total,
      errors: this.errors,
    };
  }

  /**
   * Returns a JSON string representation of this result.
   * Note: if you pass an OpResult directly to `JSON.stringify()`,
   * this method will be called automatically, producing a double-encoded string.
   * Prefer `toJS()` when passing to `JSON.stringify()` yourself.
   */
  toJSON(): string {
    return JSON.stringify(this.toJS());
  }

  /**
   * Returns the HTTP status code that corresponds to the current OpResult code.
   * If the code is OK but there is no data, returns 204 (No Content).
   * Falls back to 500 for any unrecognised codes.
   */
  getHttpStatus(): number {
    const httpStatus = OP_RESULT_CODE_TO_HTTP_CODE[this.code as OpResultCode];

    if (this.code === OP_RESULT_CODES.OK) {
      return this.hasData() ? httpStatus : 204;
    }

    return httpStatus ?? HTTP_STATUSES.HS_500_INTERNAL_SERVER_ERROR;
  }

  /**
   * Returns a deep clone of this OpResult, including a deep copy of errors
   * and a shallow copy of data and options.
   *
   * @example
   * const snapshot = result.clone();
   */
  clone(): OpResult {
    const cloned = new OpResult(
      { code: this.code, errors: this.errors.map((e) => ({ ...e, errors: [...e.errors] })) },
      { ...this.opt },
    );
    cloned.setData([...this.data]);
    cloned.total = this.total;

    return cloned;
  }

  // ============================================
  // Static helpers
  // ============================================

  /**
   * Determines the error category for a given numeric OpResult code.
   * Returns 'unknown' for any code not explicitly mapped.
   *
   * @param code - Numeric operation result code.
   *
   * @example
   * OpResult.getCategoryFromCode(OP_RESULT_CODES.UNAUTHORIZED); // 'auth'
   * OpResult.getCategoryFromCode(OP_RESULT_CODES.NOT_FOUND);    // 'not_found'
   */
  static getCategoryFromCode(code: number): OpResultErrorCategory {
    switch (code) {
      case OP_RESULT_CODES.UNAUTHORIZED:
      case OP_RESULT_CODES.EXPIRED:
      case OP_RESULT_CODES.INVALID_SIGNATURE:
      case OP_RESULT_CODES.INVALID_AUDIENCE:
      case OP_RESULT_CODES.INVALID_ISSUER:
      case OP_RESULT_CODES.MALFORMED_TOKEN:
      case OP_RESULT_CODES.NO_SIGNATURE:
      case OP_RESULT_CODES.FORBIDDEN:
        return 'auth';

      case OP_RESULT_CODES.NOT_FOUND:
        return 'not_found';

      case OP_RESULT_CODES.VALIDATION_FAILED:
        return 'validation';

      case OP_RESULT_CODES.CONFLICT:
        return 'conflict';

      case OP_RESULT_CODES.LIMIT_REACHED:
        return 'limit';

      case OP_RESULT_CODES.FAILED:
      case OP_RESULT_CODES.EXCEPTION:
        return 'server';

      case OP_RESULT_CODES.NETWORK_ERROR:
      case OP_RESULT_CODES.TIMEOUT:
        return 'network';

      default:
        return 'unknown';
    }
  }

  /**
   * Creates a successful OpResult with the given data and options.
   *
   * @param data - Data payload to include.
   * @param opt - Optional transformation options.
   *
   * @example
   * const result = OpResult.ok([{ id: 1, name: 'Alice' }]);
   */
  static ok(data?: any, opt?: OpResultOptions): OpResult {
    return new OpResult({ code: OP_RESULT_CODES.OK, data }, opt);
  }

  /**
   * Creates a failed OpResult with the given code, optional data, and error message(s).
   * If `message` is an object, its keys are treated as field names and values as error messages.
   * If `message` is a string, it is stored as a generic (field = '') error.
   *
   * @param code - Failure status code, typically from `OP_RESULT_CODES`.
   * @param data - Optional data payload to include alongside the failure.
   * @param message - Error message string or object mapping field names to messages.
   * @param opt - Optional transformation options.
   *
   * @example
   * OpResult.fail(OP_RESULT_CODES.VALIDATION_FAILED, null, 'Invalid input');
   * OpResult.fail(OP_RESULT_CODES.VALIDATION_FAILED, null, { email: 'Required', password: 'Too short' });
   */
  static fail(code: number, data?: any, message?: any, opt?: OpResultOptions): OpResult {
    let errors: OpResultErrorItem[];

    if (typeof message === 'object') {
      errors = Object.keys(message).reduce((acc: OpResultErrorItem[], key: string) => {
        acc.push({
          name: key,
          errors: message[key] ? [message[key]] : [],
        });

        return acc;
      }, []);
    } else {
      errors = [
        {
          name: '',
          errors: message ? [message] : [],
        },
      ];
    }

    return new OpResult({ code, errors, data }, opt);
  }

  /**
   * Creates an OpResult from a caught exception.
   * If the exception is already an OpResult, wraps it in a new instance.
   * Otherwise, sets the code to EXCEPTION and adds the exception message as a generic error.
   *
   * @param exception - A caught exception or OpResult.
   *
   * @example
   * try { ... } catch (e) {
   *   return OpResult.fromException(e);
   * }
   */
  static fromException(exception: any): OpResult {
    if (isOpResult(exception)) {
      return new OpResult(exception);
    }

    return new OpResult().setCode(OP_RESULT_CODES.EXCEPTION).addError('', exception.message);
  }

  /**
   * Creates a failed OpResult with EXCEPTION code and a custom error message.
   * Shorthand for cases where you want to signal an exception without a thrown error.
   *
   * @param exceptionMsg - The error message to attach.
   *
   * @example
   * return OpResult.asException('Unexpected state encountered');
   */
  static asException(exceptionMsg: string): OpResult {
    return new OpResult().setCode(OP_RESULT_CODES.EXCEPTION).addError('', exceptionMsg);
  }

  /**
   * Extracts field-specific and generic errors from an OpResult for use in forms.
   *
   * - Known fields are mapped to their combined error string.
   * - Errors for unknown fields are prefixed with the field name and collected into `genericErrors`.
   * - Errors with field name '' are collected into `genericErrors` as-is.
   *
   * @param result - The OpResult to extract errors from. Accepts null/undefined safely.
   * @param knownFields - Field names that exist in the form.
   *
   * @example
   * const { fields, genericErrors } = OpResult.getFormErrors(result, ['email', 'password']);
   * <TextInput error={fields.email} />
   * {genericErrors.length > 0 && <Alert>{genericErrors.join('. ')}</Alert>}
   */
  static getFormErrors<T extends string>(result: OpResult | null | undefined, knownFields: T[]): OpResultFormErrors<T> {
    const fields = Object.fromEntries(knownFields.map((f) => [f, undefined])) as Record<T, string | undefined>;
    const genericErrors: string[] = [];

    if (!result?.errors?.length) {
      return { fields, genericErrors };
    }

    const errorsMap = result.getErrorsMap();

    for (const field of knownFields) {
      if (errorsMap[field]) {
        fields[field] = errorsMap[field];
      }
    }

    const commonErrors = result.getCommonErrors(knownFields);
    genericErrors.push(...Object.entries(commonErrors).map(([key, value]) => (key ? `${key}: ${value}` : value)));

    return { fields, genericErrors };
  }
}
