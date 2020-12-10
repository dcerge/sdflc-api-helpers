import { OP_RESULT_CODES, OP_RESULT_CODE_TO_HTTP_CODE } from './opresult-codes';

const createData = (data: any, modelClass: any = null) => {
  if (!data) {
    return [];
  } else if (Array.isArray(data)) {
    return modelClass ? data.map((dataItem) => new modelClass(dataItem)) : data;
  } else {
    return [modelClass ? new modelClass(data) : data];
  }
};

export class OpResult {
  code: number = OP_RESULT_CODES.OK;
  data: any = null;
  errors: any = null;

  private opt?: any  = {};

  constructor(props?: any, opt?: any) {

    if (!props) {
      props = {};
    }

    if (!opt) {
      opt = {
        modelClass: null,
      };
    }

    this.code = props.code || OP_RESULT_CODES.OK;
    this.data = createData(props.data, opt.modelClass);
    this.errors = props.errors || {};
    this.opt = opt;
  }

  /**
   * Set data to result object. If data is not an array it will be wrapper by array.
   * @param {any} data - data to set.
   */
  setData(data: any) {
    if (Array.isArray(data)) {
      this.data = data;
    } else {
      this.data = [data];
    }

    return this;
  }

  getDataFirst(defaultValue: any) {
    const data = this.data && this.data[0];
    if (!data) {
      return defaultValue === undefined ? data : defaultValue;
    } else {
      return data;
    }
  }

  getData() {
    return this.data;
  }

  setCode(code: number) {
    this.code = code;
    return this;
  }

  getCode() {
    return this.code;
  }

  addError(field: string, errorMessage: string) {
    const key = field || '';

    if (this.errors[key] === undefined) {
      this.errors = {
        [key]: {
          errors: []
        }
      };
    }

    this.errors[key].errors.push(errorMessage);

    return this;
  }

  clearErrors() {
    this.errors = {};

    return this;
  }

  applyModelClass(modelClass: any) {
    this.opt = {
      ...this.opt,
      modelClass
    };

    this.data = createData(this.data, this.opt.modelClass);

    return this;
  }

  isSucceeded() {
    return this.code >= OP_RESULT_CODES.OK;
  }

  hasData() {
    return (this.data || []).length > 0 && this.data[0] != null && this.data[0] != undefined;
  }

  isSucceededAndHasData() {
    return this.code >= OP_RESULT_CODES.OK && this.hasData();
  }

  isFailed() {
    return this.code < OP_RESULT_CODES.OK;
  }

  isLoading() {
    return this.code === OP_RESULT_CODES.LOADING;
  }

  isSaving() {
    return this.code === OP_RESULT_CODES.SAVING;
  }

  isDeleting() {
    return this.code === OP_RESULT_CODES.DELETING;
  }

  isInProgress() {
    return this.code > OP_RESULT_CODES.OK;
  }

  startLoading() {
    this.code = OP_RESULT_CODES.LOADING;
    return this;
  }

  startSaving() {
    this.code = OP_RESULT_CODES.SAVING;
    return this;
  }

  startDeleting() {
    this.code = OP_RESULT_CODES.DELETING;
    return this;
  }

  clone() {
    return new OpResult({ code: this.code, data: this.data, errors: this.errors }, { ...this.opt });
  }

  getErrorSummary(field?: string) {
    const errors = (this.errors && this.errors[field || '']) || {};
    const strs = errors instanceof Array ? errors : errors.errors || [];
    return strs.reduce((r: string, c: string) => {
      return (r = `${r} ${c}`.trim());
    }, '');
  }

  getErrorFields() {
    return Object.keys(this.errors);
  }

  getFieldErrors(fieldName: string) {
    return (this.errors[fieldName] || {}).errors || [];
  }

  getDataFieldValue(fieldName: string, defaultValue: string = '') {
    const data = (this.data instanceof Array ? this.data[0] : this.data) || {};
    return typeof data[fieldName] === 'function' ? data[fieldName]() : data[fieldName] || defaultValue;
  }

  toJS() {
    return {
      code: this.code,
      data: this.data,
      errors: this.errors
    };
  }

  toJSON() {
    return JSON.stringify(this.toJS());
  }

  getHttpStatus() {
    let httpStatus = OP_RESULT_CODE_TO_HTTP_CODE[this.code];

    if (this.code === OP_RESULT_CODES.OK) {
      if (!this.hasData()) {
        httpStatus = 204;
      }
    }

    return httpStatus;
  }

  static ok(data?: any, opt?: any) {
    return new OpResult({
      code: OP_RESULT_CODES.OK,
      data: createData(data, (opt || {}).modelClass),
    });
  }

  static fail(code: number, data: any, message: string, opt?: any) {
    let errors = {};

    if (typeof message === 'object') {
      errors = Object.keys(message).reduce((acc: any, key: string) => {
        acc[key] = {
          errors: [message[key]],
        };

        return acc;
      }, {});
    } else {
      errors = {
        '': {
          errors: [message || ''],
        },
      };
    }

    return new OpResult({
      code,
      errors,
      data
    }, opt);
  }

  static fromException(exception: any) {
    if (exception instanceof OpResult) {
      return new OpResult(exception);
    }

    return new OpResult({
      code: OP_RESULT_CODES.EXCEPTION,
      data: exception,
    });
  }

  static asException(exceptionMsg: string) {
    return new OpResult().setCode(OP_RESULT_CODES.EXCEPTION).addError('', exceptionMsg);
  }
}
