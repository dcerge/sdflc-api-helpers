import { OpResult, isOpResult, OP_RESULT_CODES } from '../';

// ============================================
// Test model classes
// ============================================

class User {
  name = '';
  email = '';

  constructor(props: any) {
    if (!props) props = {};
    this.name = props.name;
    this.email = props.email;
  }
}

class Login {
  login = '';
  email = '';

  constructor(props: any) {
    if (!props) props = {};
    this.login = props.login;
    this.email = props.email;
  }
}

// ============================================
// Constructor & toJS
// ============================================

describe('Constructor & toJS', () => {
  test('creates an empty result with default values', () => {
    const r = new OpResult();
    expect(r.toJS()).toEqual({
      code: OP_RESULT_CODES.OK,
      data: [],
      errors: [],
      total: 0,
    });
  });

  test('initializes from a raw props object', () => {
    const raw = {
      code: OP_RESULT_CODES.OK,
      data: [{ name: 'ITEM' }],
      errors: [{ name: 'name', errors: ['Error'] }],
      total: 0,
    };
    expect(new OpResult(raw).toJS()).toEqual(raw);
  });

  test('defaults to OK code when code is not provided', () => {
    const r = new OpResult({ data: [{ name: 'test' }] });
    expect(r.code).toEqual(OP_RESULT_CODES.OK);
  });

  test('defaults to empty errors when errors are not provided', () => {
    const r = new OpResult({ code: OP_RESULT_CODES.OK });
    expect(r.errors).toEqual([]);
  });
});

// ============================================
// toJSON
// ============================================

describe('toJSON', () => {
  test('returns a JSON string of toJS()', () => {
    const r = new OpResult();
    expect(r.toJSON()).toEqual(JSON.stringify(r.toJS()));
  });
});

// ============================================
// Data methods
// ============================================

describe('setData / getData / getDataFirst', () => {
  test('wraps a plain object in an array', () => {
    const r = new OpResult();
    r.setData({ name: 'John' });
    expect(r.getData()).toEqual([{ name: 'John' }]);
  });

  test('stores an array as-is', () => {
    const r = new OpResult();
    r.setData([{ name: 'A' }, { name: 'B' }]);
    expect(r.getData()).toEqual([{ name: 'A' }, { name: 'B' }]);
  });

  test('getDataFirst returns first item', () => {
    const r = new OpResult();
    r.setData([{ name: 'FIRST' }, { name: 'SECOND' }]);
    expect(r.getDataFirst()).toEqual({ name: 'FIRST' });
  });

  test('getDataFirst returns defaultValue when data is null', () => {
    const r = new OpResult();
    r.setData(null);
    expect(r.getDataFirst()).toEqual(null);
    expect(r.getDataFirst('N/A')).toEqual('N/A');
  });

  test('getDataFirst returns defaultValue when data is undefined', () => {
    const r = new OpResult();
    r.setData(undefined);
    expect(r.getDataFirst()).toEqual(undefined);
    expect(r.getDataFirst('N/A')).toEqual('N/A');
  });

  test('getDataFirst returns undefined when no defaultValue and data is empty', () => {
    const r = new OpResult();
    expect(r.getDataFirst()).toBeUndefined();
  });
});

describe('getDataFieldValue', () => {
  test('returns a field value from the first data item', () => {
    const r = new OpResult();
    r.setData([{ name: 'FIRST' }, { name: 'SECOND' }]);
    expect(r.getDataFieldValue('name')).toEqual('FIRST');
  });

  test('returns defaultValue when field is missing', () => {
    const r = new OpResult();
    r.setData({ name: 'John' });
    expect(r.getDataFieldValue('age', 'Unknown')).toEqual('Unknown');
    expect(r.getDataFieldValue('age')).toEqual('');
  });

  test('calls the field value if it is a function', () => {
    const r = new OpResult();
    r.setData({
      firstName: 'John',
      lastName: 'Smith',
      fullName: (obj: any) => `${obj.firstName} ${obj.lastName}`,
    });
    expect(r.getDataFieldValue('fullName')).toEqual('John Smith');
  });
});

describe('applyModelClass', () => {
  test('wraps existing data items with the provided model class', () => {
    const r = new OpResult();
    r.setData([
      { name: 'SD', email: 'sd@gmail.com' },
      { name: 'EM', email: 'em@gmail.com' },
    ]);
    r.applyModelClass(User);
    expect(r.getDataFirst()).toBeInstanceOf(User);
    expect(r.getDataFirst()).toEqual({ name: 'SD', email: 'sd@gmail.com' });
  });
});

// ============================================
// modelClass & transform options
// ============================================

describe('modelClass option', () => {
  test('wraps a single data object with the model class', () => {
    const r = new OpResult({ data: { name: 'SD', email: 'sd@gmail.com' } }, { modelClass: User });
    expect(r.getDataFirst()).toEqual({ name: 'SD', email: 'sd@gmail.com' });
    expect(r.getDataFirst()).toBeInstanceOf(User);
  });

  test('wraps multiple data items with the model class', () => {
    const r = new OpResult(
      {
        data: [
          { name: 'SD', email: 'sd@gmail.com' },
          { name: 'EM', email: 'em@gmail.com' },
        ],
      },
      { modelClass: User },
    );
    expect(r.getData()).toEqual([
      { name: 'SD', email: 'sd@gmail.com' },
      { name: 'EM', email: 'em@gmail.com' },
    ]);
    r.getData().forEach((item: any) => expect(item).toBeInstanceOf(User));
  });
});

describe('transform option', () => {
  test('transforms data items before applying the model class', () => {
    const transform = (obj: any) => ({ login: obj.name, email: obj.email });

    const r = new OpResult(
      {
        data: [
          { name: 'SD', email: 'sd@gmail.com' },
          { name: 'EM', email: 'em@gmail.com' },
        ],
      },
      { modelClass: Login, transform },
    );

    expect(r.getData()).toEqual([
      { login: 'SD', email: 'sd@gmail.com' },
      { login: 'EM', email: 'em@gmail.com' },
    ]);
    r.getData().forEach((item: any) => expect(item).toBeInstanceOf(Login));
  });

  test('flattens arrays returned by transform when flatten is not false', () => {
    const transform = (obj: any) => [obj, { ...obj, name: obj.name + '_copy' }];
    const r = new OpResult({ data: [{ name: 'A', email: 'a@x.com' }] }, { transform });
    expect(r.getData()).toHaveLength(2);
    expect(r.getData()[1].name).toEqual('A_copy');
  });

  test('does not flatten when flatten is false', () => {
    const transform = (obj: any) => [obj, { ...obj, name: obj.name + '_copy' }];
    const r = new OpResult({ data: [{ name: 'A', email: 'a@x.com' }] }, { transform, flatten: false });
    expect(r.getData()).toHaveLength(1);
    expect(Array.isArray(r.getData()[0])).toBe(true);
  });
});

// ============================================
// Code methods
// ============================================

describe('setCode / getCode', () => {
  test('sets and gets the code', () => {
    const r = new OpResult();
    r.setCode(OP_RESULT_CODES.FAILED);
    expect(r.getCode()).toEqual(OP_RESULT_CODES.FAILED);
    expect(r.code).toEqual(OP_RESULT_CODES.FAILED);
  });

  test('setCode returns this for chaining', () => {
    const r = new OpResult();
    expect(r.setCode(OP_RESULT_CODES.FAILED)).toBe(r);
  });
});

// ============================================
// Total methods
// ============================================

describe('setTotal / getTotal', () => {
  test('sets and gets a valid total', () => {
    const r = new OpResult();
    r.setTotal(42);
    expect(r.getTotal()).toEqual(42);
  });

  test('defaults to 0 for negative values', () => {
    const r = new OpResult();
    r.setTotal(-5);
    expect(r.getTotal()).toEqual(0);
  });

  test('defaults to 0 for NaN', () => {
    const r = new OpResult();
    r.setTotal(NaN);
    expect(r.getTotal()).toEqual(0);
  });

  test('accepts 0 as a valid total', () => {
    const r = new OpResult();
    r.setTotal(10);
    r.setTotal(0);
    expect(r.getTotal()).toEqual(0);
  });
});

// ============================================
// Status checks
// ============================================

describe('didSucceed / didFail / didSucceedAndHasData', () => {
  test('didSucceed returns true for OK code', () => {
    expect(OpResult.ok({ id: 1 }).didSucceed()).toBe(true);
  });

  test('didSucceed returns false for failure code', () => {
    expect(OpResult.fail(OP_RESULT_CODES.FAILED).didSucceed()).toBe(false);
  });

  test('didFail returns true for failure code', () => {
    expect(OpResult.fail(OP_RESULT_CODES.NOT_FOUND).didFail()).toBe(true);
  });

  test('didFail returns false for OK code', () => {
    expect(OpResult.ok().didFail()).toBe(false);
  });

  test('didSucceedAndHasData returns true when OK and has data', () => {
    expect(OpResult.ok({ id: 1 }).didSucceedAndHasData()).toBe(true);
  });

  test('didSucceedAndHasData returns false when OK but no data', () => {
    expect(OpResult.ok().didSucceedAndHasData()).toBe(false);
  });

  test('didSucceedAndHasData returns false when failed', () => {
    const r = OpResult.fail(OP_RESULT_CODES.FAILED);
    r.setData({ id: 1 });
    expect(r.didSucceedAndHasData()).toBe(false);
  });
});

describe('hasData', () => {
  test('returns true when data has items', () => {
    const r = new OpResult();
    r.setData({ name: 'John' });
    expect(r.hasData()).toBe(true);
  });

  test('returns false when data is empty array', () => {
    expect(new OpResult().hasData()).toBe(false);
  });

  test('returns false when data contains null', () => {
    const r = new OpResult();
    r.setData(null);
    expect(r.hasData()).toBe(false);
  });

  test('returns false when data contains undefined', () => {
    const r = new OpResult();
    r.setData(undefined);
    expect(r.hasData()).toBe(false);
  });
});

describe('hasErrors', () => {
  test('returns false when there are no errors', () => {
    expect(new OpResult().hasErrors()).toBe(false);
  });

  test('returns true when there is at least one error', () => {
    const r = new OpResult();
    r.addError('', 'Something went wrong');
    expect(r.hasErrors()).toBe(true);
  });
});

describe('isLoading / isSaving / isDeleting / isInProgress', () => {
  test('isLoading returns true after startLoading', () => {
    const r = new OpResult();
    r.startLoading();
    expect(r.isLoading()).toBe(true);
    expect(r.isSaving()).toBe(false);
    expect(r.isDeleting()).toBe(false);
    expect(r.isInProgress()).toBe(true);
  });

  test('isSaving returns true after startSaving', () => {
    const r = new OpResult();
    r.startSaving();
    expect(r.isSaving()).toBe(true);
    expect(r.isLoading()).toBe(false);
    expect(r.isDeleting()).toBe(false);
    expect(r.isInProgress()).toBe(true);
  });

  test('isDeleting returns true after startDeleting', () => {
    const r = new OpResult();
    r.startDeleting();
    expect(r.isDeleting()).toBe(true);
    expect(r.isLoading()).toBe(false);
    expect(r.isSaving()).toBe(false);
    expect(r.isInProgress()).toBe(true);
  });

  test('isInProgress returns false for OK code', () => {
    expect(new OpResult().isInProgress()).toBe(false);
  });

  test('isInProgress returns false for failure code', () => {
    expect(OpResult.fail(OP_RESULT_CODES.FAILED).isInProgress()).toBe(false);
  });
});

// ============================================
// Category methods
// ============================================

describe('getCategory / isAuth / isNotFound / isValidation / etc.', () => {
  const cases: [number, string][] = [
    [OP_RESULT_CODES.UNAUTHORIZED, 'auth'],
    [OP_RESULT_CODES.FORBIDDEN, 'auth'],
    [OP_RESULT_CODES.EXPIRED, 'auth'],
    [OP_RESULT_CODES.INVALID_SIGNATURE, 'auth'],
    [OP_RESULT_CODES.INVALID_AUDIENCE, 'auth'],
    [OP_RESULT_CODES.INVALID_ISSUER, 'auth'],
    [OP_RESULT_CODES.MALFORMED_TOKEN, 'auth'],
    [OP_RESULT_CODES.NO_SIGNATURE, 'auth'],
    [OP_RESULT_CODES.NOT_FOUND, 'not_found'],
    [OP_RESULT_CODES.VALIDATION_FAILED, 'validation'],
    [OP_RESULT_CODES.CONFLICT, 'conflict'],
    [OP_RESULT_CODES.LIMIT_REACHED, 'limit'],
    [OP_RESULT_CODES.FAILED, 'server'],
    [OP_RESULT_CODES.EXCEPTION, 'server'],
    [OP_RESULT_CODES.NETWORK_ERROR, 'network'],
    [OP_RESULT_CODES.TIMEOUT, 'network'],
  ];

  test.each(cases)('code %i maps to category "%s"', (code, expected) => {
    const r = new OpResult();
    r.setCode(code);
    expect(r.getCategory()).toEqual(expected);
    expect(OpResult.getCategoryFromCode(code)).toEqual(expected);
  });

  test('unknown code maps to "unknown"', () => {
    const r = new OpResult();
    r.setCode(-99999);
    expect(r.getCategory()).toEqual('unknown');
  });

  test('isAuthError returns true for auth codes', () => {
    const r = new OpResult();
    r.setCode(OP_RESULT_CODES.UNAUTHORIZED);
    expect(r.isAuthError()).toBe(true);
  });

  test('isNotFound returns true for NOT_FOUND', () => {
    const r = new OpResult();
    r.setCode(OP_RESULT_CODES.NOT_FOUND);
    expect(r.isNotFound()).toBe(true);
  });

  test('isValidationError returns true for VALIDATION_FAILED', () => {
    const r = new OpResult();
    r.setCode(OP_RESULT_CODES.VALIDATION_FAILED);
    expect(r.isValidationError()).toBe(true);
  });

  test('isConflict returns true for CONFLICT', () => {
    const r = new OpResult();
    r.setCode(OP_RESULT_CODES.CONFLICT);
    expect(r.isConflict()).toBe(true);
  });

  test('isLimitReached returns true for LIMIT_REACHED', () => {
    const r = new OpResult();
    r.setCode(OP_RESULT_CODES.LIMIT_REACHED);
    expect(r.isLimitReached()).toBe(true);
  });

  test('isServerError returns true for FAILED and EXCEPTION', () => {
    const r = new OpResult();
    r.setCode(OP_RESULT_CODES.FAILED);
    expect(r.isServerError()).toBe(true);
    r.setCode(OP_RESULT_CODES.EXCEPTION);
    expect(r.isServerError()).toBe(true);
  });

  test('isNetworkError returns true for NETWORK_ERROR and TIMEOUT', () => {
    const r = new OpResult();
    r.setCode(OP_RESULT_CODES.NETWORK_ERROR);
    expect(r.isNetworkError()).toBe(true);
    r.setCode(OP_RESULT_CODES.TIMEOUT);
    expect(r.isNetworkError()).toBe(true);
  });

  test('isRetryableError returns true for network and server errors', () => {
    const r = new OpResult();
    r.setCode(OP_RESULT_CODES.NETWORK_ERROR);
    expect(r.isRetryableError()).toBe(true);
    r.setCode(OP_RESULT_CODES.FAILED);
    expect(r.isRetryableError()).toBe(true);
    r.setCode(OP_RESULT_CODES.NOT_FOUND);
    expect(r.isRetryableError()).toBe(false);
    r.setCode(OP_RESULT_CODES.VALIDATION_FAILED);
    expect(r.isRetryableError()).toBe(false);
  });
});

// ============================================
// Error methods
// ============================================

describe('addError', () => {
  test('adds a single error message for a field', () => {
    const r = new OpResult();
    r.addError('name', 'Name is required');
    expect(r.getFieldErrors('name')).toEqual(['Name is required']);
  });

  test('adds multiple errors for the same field', () => {
    const r = new OpResult();
    r.addError('email', 'Email is required');
    r.addError('email', 'Email must be valid');
    expect(r.getFieldErrors('email')).toEqual(['Email is required', 'Email must be valid']);
  });

  test('adds an array of error messages at once', () => {
    const r = new OpResult();
    r.addError('password', ['Too short', 'Must contain a number']);
    expect(r.getFieldErrors('password')).toEqual(['Too short', 'Must contain a number']);
  });

  test('appends an array of messages to existing errors', () => {
    const r = new OpResult();
    r.addError('password', 'Too short');
    r.addError('password', ['Must contain a number', 'Must contain a symbol']);
    expect(r.getFieldErrors('password')).toEqual(['Too short', 'Must contain a number', 'Must contain a symbol']);
  });

  test('adds a generic error with empty string field name', () => {
    const r = new OpResult();
    r.addError('', 'Something went wrong');
    expect(r.getFieldErrors('')).toEqual(['Something went wrong']);
  });

  test('updates the code when code is provided', () => {
    const r = new OpResult();
    r.addError('name', 'Required', OP_RESULT_CODES.VALIDATION_FAILED);
    expect(r.code).toEqual(OP_RESULT_CODES.VALIDATION_FAILED);
  });

  test('does not update code when code is not provided', () => {
    const r = new OpResult();
    r.addError('name', 'Required');
    expect(r.code).toEqual(OP_RESULT_CODES.OK);
  });

  test('returns this for chaining', () => {
    const r = new OpResult();
    expect(r.addError('a', 'err1').addError('b', 'err2')).toBe(r);
  });
});

describe('clearErrors', () => {
  test('removes all errors', () => {
    const r = new OpResult();
    r.addError('name', 'Required');
    r.addError('email', 'Invalid');
    r.clearErrors();
    expect(r.hasErrors()).toBe(false);
    expect(r.errors).toEqual([]);
  });

  test('invalidates the errors map cache', () => {
    const r = new OpResult();
    r.addError('name', 'Required');
    r.getErrorsMap(); // populate cache
    r.clearErrors();
    expect(r.getErrorsMap()).toEqual({});
  });
});

describe('getErrorSummary', () => {
  test('returns combined error string for a field', () => {
    const r = new OpResult();
    r.addError('name', 'Name should be shorter');
    expect(r.getErrorSummary('name')).toEqual('Name should be shorter');
  });

  test('joins multiple messages with a space', () => {
    const r = new OpResult();
    r.addError('email', 'Email is required');
    r.addError('email', 'Email must be valid');
    expect(r.getErrorSummary('email')).toEqual('Email is required. Email must be valid');
  });

  test('returns empty string for a field with no errors', () => {
    expect(new OpResult().getErrorSummary('name')).toEqual('');
  });

  test('defaults to generic field when no argument is provided', () => {
    const r = new OpResult();
    r.addError('', 'Something went wrong');
    expect(r.getErrorSummary()).toEqual('Something went wrong');
    expect(r.getErrorSummary('')).toEqual('Something went wrong');
  });

  test('returns empty string when there are no errors at all', () => {
    expect(new OpResult().getErrorSummary()).toEqual('');
    expect(new OpResult().getErrorSummary('')).toEqual('');
  });
});

describe('getFieldErrors', () => {
  test('returns array of messages for a field', () => {
    const r = new OpResult();
    r.addError('', 'Error 1');
    r.addError('', 'Error 2');
    expect(r.getFieldErrors('')).toEqual(['Error 1', 'Error 2']);
  });

  test('returns empty array for a field with no errors', () => {
    expect(new OpResult().getFieldErrors('name')).toEqual([]);
  });
});

describe('getErrorFields', () => {
  test('returns array of field names that have errors', () => {
    const r = new OpResult();
    r.addError('name', 'Required');
    r.addError('email', 'Invalid');
    expect(r.getErrorFields()).toEqual(['name', 'email']);
  });

  test('returns empty array when there are no errors', () => {
    expect(new OpResult().getErrorFields()).toEqual([]);
  });
});

describe('getErrorsMap', () => {
  test('returns a flat map of field to combined error string', () => {
    const r = new OpResult();
    r.addError('email', 'Email is required');
    r.addError('email', 'Must be valid');
    r.addError('password', 'Too short');
    expect(r.getErrorsMap()).toEqual({
      email: 'Email is required. Must be valid',
      password: 'Too short',
    });
  });

  test('returns empty object when there are no errors', () => {
    expect(new OpResult().getErrorsMap()).toEqual({});
  });

  test('cache is invalidated after addError', () => {
    const r = new OpResult();
    r.addError('name', 'First');
    const map1 = r.getErrorsMap();
    r.addError('name', 'Second');
    const map2 = r.getErrorsMap();
    expect(map1).toEqual({ name: 'First' });
    expect(map2).toEqual({ name: 'First. Second' });
  });

  test('cache is invalidated after clearErrors', () => {
    const r = new OpResult();
    r.addError('name', 'Required');
    r.getErrorsMap();
    r.clearErrors();
    expect(r.getErrorsMap()).toEqual({});
  });
});

describe('getCommonErrors', () => {
  test('returns errors for fields not in knownFields', () => {
    const r = new OpResult();
    r.addError('email', 'Email is required');
    r.addError('serverId', 'Unknown server');
    r.addError('', 'Something went wrong');
    expect(r.getCommonErrors(['email'])).toEqual({
      serverId: 'Unknown server',
      '': 'Something went wrong',
    });
  });

  test('returns empty object when all fields are known', () => {
    const r = new OpResult();
    r.addError('email', 'Required');
    r.addError('password', 'Too short');
    expect(r.getCommonErrors(['email', 'password'])).toEqual({});
  });

  test('returns all errors when knownFields is empty', () => {
    const r = new OpResult();
    r.addError('email', 'Required');
    r.addError('', 'Generic error');
    expect(r.getCommonErrors([])).toEqual({ email: 'Required', '': 'Generic error' });
  });
});

describe('mergeErrorsIn', () => {
  test('merges errors from another OpResult', () => {
    const r1 = new OpResult();
    r1.addError('email', 'Email is required');

    const r2 = new OpResult();
    r2.addError('password', 'Too short');

    r1.mergeErrorsIn(r2);
    expect(r1.getErrorsMap()).toEqual({
      email: 'Email is required',
      password: 'Too short',
    });
  });

  test('appends non-duplicate messages for existing fields', () => {
    const r1 = new OpResult();
    r1.addError('email', 'Email is required');

    const r2 = new OpResult();
    r2.addError('email', 'Email must be valid');

    r1.mergeErrorsIn(r2);
    expect(r1.getFieldErrors('email')).toEqual(['Email is required', 'Email must be valid']);
  });

  test('does not add duplicate messages', () => {
    const r1 = new OpResult();
    r1.addError('email', 'Email is required');

    const r2 = new OpResult();
    r2.addError('email', 'Email is required');

    r1.mergeErrorsIn(r2);
    expect(r1.getFieldErrors('email')).toEqual(['Email is required']);
  });

  test('deep copies incoming error entries', () => {
    const r1 = new OpResult();
    const r2 = new OpResult();
    r2.addError('name', 'Required');

    r1.mergeErrorsIn(r2);
    r2.addError('name', 'Too long');

    // r1 should not be affected by subsequent changes to r2
    expect(r1.getFieldErrors('name')).toEqual(['Required']);
  });

  test('ignores non-OpResult values and returns this', () => {
    const r = new OpResult();
    r.addError('name', 'Required');
    const result = r.mergeErrorsIn({} as any);
    expect(result).toBe(r);
    expect(r.getFieldErrors('name')).toEqual(['Required']);
  });

  test('invalidates the errors map cache', () => {
    const r1 = new OpResult();
    r1.addError('email', 'Required');
    r1.getErrorsMap(); // populate cache

    const r2 = new OpResult();
    r2.addError('password', 'Too short');
    r1.mergeErrorsIn(r2);

    expect(r1.getErrorsMap()).toEqual({
      email: 'Required',
      password: 'Too short',
    });
  });

  test('returns this for chaining', () => {
    const r1 = new OpResult();
    const r2 = new OpResult();
    expect(r1.mergeErrorsIn(r2)).toBe(r1);
  });
});

// ============================================
// getHttpStatus
// ============================================

describe('getHttpStatus', () => {
  test('returns 200 when OK and has data', () => {
    expect(OpResult.ok({ id: 1 }).getHttpStatus()).toEqual(200);
  });

  test('returns 204 when OK and has no data', () => {
    expect(OpResult.ok().getHttpStatus()).toEqual(204);
  });

  test('returns 204 when OK and data is set to null', () => {
    const r = OpResult.ok({ id: 1 });
    r.setData(null);
    expect(r.getHttpStatus()).toEqual(204);
  });

  test('returns 400 for VALIDATION_FAILED', () => {
    expect(OpResult.fail(OP_RESULT_CODES.VALIDATION_FAILED).getHttpStatus()).toEqual(400);
  });

  test('returns 401 for UNAUTHORIZED', () => {
    expect(OpResult.fail(OP_RESULT_CODES.UNAUTHORIZED).getHttpStatus()).toEqual(401);
  });

  test('returns 403 for FORBIDDEN', () => {
    expect(OpResult.fail(OP_RESULT_CODES.FORBIDDEN).getHttpStatus()).toEqual(403);
  });

  test('returns 404 for NOT_FOUND', () => {
    expect(OpResult.fail(OP_RESULT_CODES.NOT_FOUND).getHttpStatus()).toEqual(404);
  });

  test('returns 409 for CONFLICT', () => {
    expect(OpResult.fail(OP_RESULT_CODES.CONFLICT).getHttpStatus()).toEqual(409);
  });

  test('returns 500 for EXCEPTION', () => {
    expect(OpResult.fail(OP_RESULT_CODES.EXCEPTION).getHttpStatus()).toEqual(500);
  });

  test('returns 500 for unrecognized codes', () => {
    const r = new OpResult();
    r.setCode(-99999);
    expect(r.getHttpStatus()).toEqual(500);
  });
});

// ============================================
// clone
// ============================================

describe('clone', () => {
  test('creates a new instance with the same values', () => {
    const r = OpResult.ok({ name: 'John' });
    r.setTotal(10);
    r.addError('email', 'Required');
    const copy = r.clone();

    expect(copy).not.toBe(r);
    expect(copy.code).toEqual(r.code);
    expect(copy.total).toEqual(r.total);
    expect(copy.getDataFirst()).toEqual(r.getDataFirst());
    expect(copy.getErrorsMap()).toEqual(r.getErrorsMap());
  });

  test('errors are deep copied — mutating clone does not affect original', () => {
    const r = new OpResult();
    r.addError('name', 'Required');
    const copy = r.clone();

    copy.addError('name', 'Too long');

    expect(r.getFieldErrors('name')).toEqual(['Required']);
    expect(copy.getFieldErrors('name')).toEqual(['Required', 'Too long']);
  });
});

// ============================================
// Static factory methods
// ============================================

describe('OpResult.ok', () => {
  test('creates a successful result with data', () => {
    const r = OpResult.ok({ id: 1, name: 'Alice' });
    expect(r.didSucceed()).toBe(true);
    expect(r.getDataFirst()).toEqual({ id: 1, name: 'Alice' });
  });

  test('creates a successful result with no data', () => {
    const r = OpResult.ok();
    expect(r.didSucceed()).toBe(true);
    expect(r.hasData()).toBe(false);
  });
});

describe('OpResult.fail', () => {
  test('creates a failed result with a generic string message', () => {
    const r = OpResult.fail(OP_RESULT_CODES.FORBIDDEN, null, 'Access forbidden');
    expect(r.didFail()).toBe(true);
    expect(r.code).toEqual(OP_RESULT_CODES.FORBIDDEN);
    expect(r.getErrorSummary('')).toEqual('Access forbidden');
    expect(r.getErrorFields()).toEqual(['']);
  });

  test('creates a failed result with field-specific errors from an object', () => {
    const r = OpResult.fail(OP_RESULT_CODES.VALIDATION_FAILED, null, {
      email: 'Email is required',
      password: 'Too short',
    });
    expect(r.getErrorsMap()).toEqual({
      email: 'Email is required',
      password: 'Too short',
    });
  });

  test('includes data in a failed result', () => {
    const r = OpResult.fail(OP_RESULT_CODES.FORBIDDEN, { name: 'USER' }, 'Access forbidden');
    expect(r.getDataFirst()).toEqual({ name: 'USER' });
  });

  test('creates a failed result with no message', () => {
    const r = OpResult.fail(OP_RESULT_CODES.FAILED);
    expect(r.didFail()).toBe(true);
    expect(r.getErrorSummary('')).toEqual('');
  });
});

describe('OpResult.fromException', () => {
  test('wraps a plain Error in an EXCEPTION result', () => {
    const r = OpResult.fromException(new Error('Network timeout'));
    expect(r.code).toEqual(OP_RESULT_CODES.EXCEPTION);
    expect(r.getErrorSummary('')).toEqual('Network timeout');
  });

  test('wraps an existing OpResult in a new instance', () => {
    const original = OpResult.fail(OP_RESULT_CODES.NOT_FOUND, null, 'Not found');
    const wrapped = OpResult.fromException(original);
    expect(wrapped).not.toBe(original);
    expect(wrapped.code).toEqual(OP_RESULT_CODES.NOT_FOUND);
  });
});

describe('OpResult.asException', () => {
  test('creates an EXCEPTION result with a custom message', () => {
    const r = OpResult.asException('Unexpected state encountered');
    expect(r.code).toEqual(OP_RESULT_CODES.EXCEPTION);
    expect(r.getErrorSummary('')).toEqual('Unexpected state encountered');
  });
});

// ============================================
// getFormErrors
// ============================================

describe('OpResult.getFormErrors', () => {
  test('maps known fields to their error strings', () => {
    const r = OpResult.fail(OP_RESULT_CODES.VALIDATION_FAILED, null, {
      email: 'Email is required',
      password: 'Too short',
    });
    const { fields, genericErrors } = OpResult.getFormErrors(r, ['email', 'password']);
    expect(fields.email).toEqual('Email is required');
    expect(fields.password).toEqual('Too short');
    expect(genericErrors).toEqual([]);
  });

  test('collects unknown field errors as prefixed generic errors', () => {
    const r = new OpResult();
    r.addError('email', 'Required');
    r.addError('serverId', 'Unknown server');
    const { fields, genericErrors } = OpResult.getFormErrors(r, ['email']);
    expect(fields.email).toEqual('Required');
    expect(genericErrors).toContain('serverId: Unknown server');
  });

  test('collects generic field ("") errors into genericErrors unprefixed', () => {
    const r = new OpResult();
    r.addError('', 'Something went wrong');
    const { fields, genericErrors } = OpResult.getFormErrors(r, ['email']);
    expect(genericErrors).toContain('Something went wrong');
  });

  test('returns empty fields and genericErrors for null result', () => {
    const { fields, genericErrors } = OpResult.getFormErrors(null, ['email', 'password']);
    expect(fields).toEqual({ email: undefined, password: undefined });
    expect(genericErrors).toEqual([]);
  });

  test('returns empty fields and genericErrors for result with no errors', () => {
    const { fields, genericErrors } = OpResult.getFormErrors(OpResult.ok(), ['email']);
    expect(fields).toEqual({ email: undefined });
    expect(genericErrors).toEqual([]);
  });

  test('initializes all known fields to undefined even if no error exists', () => {
    const r = new OpResult();
    r.addError('email', 'Required');
    const { fields } = OpResult.getFormErrors(r, ['email', 'password', 'name']);
    expect(fields.email).toEqual('Required');
    expect(fields.password).toBeUndefined();
    expect(fields.name).toBeUndefined();
  });
});

// ============================================
// isOpResult
// ============================================

describe('isOpResult', () => {
  test('returns true for a new OpResult instance', () => {
    expect(isOpResult(new OpResult())).toBe(true);
  });

  test('returns true for OpResult.ok()', () => {
    expect(isOpResult(OpResult.ok())).toBe(true);
  });

  test('returns true for OpResult.fail()', () => {
    expect(isOpResult(OpResult.fail(OP_RESULT_CODES.FAILED))).toBe(true);
  });

  test('returns false for a plain object', () => {
    expect(isOpResult({ code: 0, errors: [], didSucceed: () => true })).toBe(false);
  });

  test('returns false for null', () => {
    expect(isOpResult(null)).toBe(false);
  });

  test('returns false for undefined', () => {
    expect(isOpResult(undefined)).toBe(false);
  });

  test('returns false for a string', () => {
    expect(isOpResult('error')).toBe(false);
  });

  test('returns false for a number', () => {
    expect(isOpResult(0)).toBe(false);
  });

  test('returns false for an object missing _isOpResult brand', () => {
    expect(isOpResult({ errors: [], didSucceed: () => true })).toBe(false);
  });

  test('returns false for an object with non-array errors', () => {
    expect(isOpResult({ _isOpResult: true, errors: {}, didSucceed: () => true })).toBe(false);
  });

  test('returns false for an object missing didSucceed', () => {
    expect(isOpResult({ _isOpResult: true, errors: [] })).toBe(false);
  });
});
