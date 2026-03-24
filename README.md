# @sdflc/api-helpers

This is a set of classes that help to organize communication between frontend and backend.
These classes are used across all the other libraries within the `@sdflc` scope unless it is specified otherwise.

## Classes overview

- **OpResult** - this class represents an operation result that is sent by an API or between modules.
- **ApiWrapper** - this class wraps `axios.request` method to send requests to a server and also wraps a response from server into `OpResult` class.
- **ApiDataList** - this class used to simplify fetching paginated lists of objects from the server. It expects the server to send data as `OpResult`.

# OpResult

This class is used to send data and errors in a unified way between API and frontend or between modules.

The object structure looks like this:

```js
{
  code: 0,   // Result code. Zero is OK, negative value is an error, positive numbers represent in-progress states
  data: [],  // Data is always wrapped in an array, even for a single item
  total: 0,  // Total number of records available, useful for paginated responses
  errors: [] // Array of objects describing errors, if any
}
```

Here is an example of a successful response with data:

```js
{
  code: 0,
  data: [
    {
      name: 'John Smith',
      email: 'jsmith@email.com'
    }
  ],
  total: 1,
  errors: []
}
```

Here is an example of a validation error response:

```js
{
  code: -20100,
  data: [],
  total: 0,
  errors: [
    {
      name: '',
      errors: ['Failed to save user information due to lack of access rights.']
    },
    {
      name: 'email',
      errors: ['Email field should be a valid email address']
    }
  ]
}
```

---

## Properties

### `code`

The `code` property describes the outcome of an operation:

- `0` — the operation was successful (`OP_RESULT_CODES.OK`)
- Negative value — an error occurred; details are available in the `errors` property
- Positive value — the operation is still in progress (e.g. loading, saving, deleting)

All available codes are defined in the `OP_RESULT_CODES` object:

```js
import { OP_RESULT_CODES } from '@sdflc/api-helpers';

// In-progress codes (positive)
OP_RESULT_CODES.LOADING; // 10001
OP_RESULT_CODES.SAVING; // 10002
OP_RESULT_CODES.DELETING; // 10003

// Success
OP_RESULT_CODES.OK; // 0

// General error codes (negative)
OP_RESULT_CODES.FAILED; // -10000
OP_RESULT_CODES.EXCEPTION; // -11000
OP_RESULT_CODES.NETWORK_ERROR; // -12000
OP_RESULT_CODES.TIMEOUT; // -13000

// Validation / resource errors
OP_RESULT_CODES.VALIDATION_FAILED; // -20100
OP_RESULT_CODES.NOT_FOUND; // -20200
OP_RESULT_CODES.CONFLICT; // -20300
OP_RESULT_CODES.LIMIT_REACHED; // -20400

// Auth errors
OP_RESULT_CODES.UNAUTHORIZED; // -30100
OP_RESULT_CODES.FORBIDDEN; // -30200
OP_RESULT_CODES.EXPIRED; // -30300
OP_RESULT_CODES.INVALID_SIGNATURE; // -30400
OP_RESULT_CODES.INVALID_AUDIENCE; // -30410
OP_RESULT_CODES.INVALID_ISSUER; // -30420
OP_RESULT_CODES.MALFORMED_TOKEN; // -30430
OP_RESULT_CODES.NO_SIGNATURE; // -30450
```

### `data`

The `data` property contains the payload returned by the operation. It is always stored as an array internally. Use `setData` to assign data to an `OpResult` object.

Data is considered empty when the array is empty, or when it contains a single `null` or `undefined` item.

### `total`

The `total` property stores the total number of records available on the server. This is useful for paginated responses where `data` contains only one page of results.

### `errors`

The `errors` property is an array of objects describing any errors that occurred. Each error object has the following structure:

```js
{
  name: '',            // Field name the error belongs to. Use '' for generic errors.
  errors: [],          // Array of error message strings for this field
}
```

Example with multiple field errors:

```js
errors: [
  {
    name: '',
    errors: ['Something went wrong. Please try again.'],
  },
  {
    name: 'email',
    errors: ['Email is required', 'Email must be a valid address'],
  },
  {
    name: 'password',
    errors: ['Password must be at least 8 characters'],
  },
];
```

---

## Constructor

### `constructor(props?, opt?)`

Creates a new `OpResult` instance. `props` is expected to have the same shape as the object structure above. `opt` allows optional data transformation.

```js
import { OpResult, OP_RESULT_CODES } from '@sdflc/api-helpers';

// Empty result with default OK code
const r = new OpResult();

// From a server response
const r = new OpResult(response.data);

// With a model class to wrap each data item
const r = new OpResult(response.data, { modelClass: UserModel });

// With a transform function applied before the model class
const r = new OpResult(response.data, {
  modelClass: UserModel,
  transform: (item) => ({ ...item, fullName: `${item.firstName} ${item.lastName}` }),
});
```

A typical usage pattern with `axios`:

```js
import { OpResult, OP_RESULT_CODES } from '@sdflc/api-helpers';

const fetchUser = async (id) => {
  try {
    const response = await axios.get(`/api/users/${id}`);
    return new OpResult(response.data);
  } catch (ex) {
    return OpResult.fromException(ex);
  }
};

const result = await fetchUser(123);

if (result.didFail()) {
  console.error(result.getErrorSummary());
} else {
  console.log(result.getDataFirst());
}
```

---

## Data Methods

### `setData(data)`

Sets the data payload. Non-array values are automatically wrapped in an array.

```js
const r = new OpResult();

r.setData({ name: 'John' });
// r.data => [{ name: 'John' }]

r.setData([{ name: 'John' }, { name: 'Jane' }]);
// r.data => [{ name: 'John' }, { name: 'Jane' }]
```

### `getData()`

Returns the full data array.

```js
r.setData({ name: 'John' });
r.getData(); // => [{ name: 'John' }]
```

### `getDataFirst(defaultValue?)`

Returns the first item in the data array. Returns `defaultValue` if data is empty or falsy.

```js
r.setData({ name: 'John' });
r.getDataFirst(); // => { name: 'John' }
r.getDataFirst(null); // => { name: 'John' }

const empty = new OpResult();
empty.getDataFirst(); // => undefined
empty.getDataFirst(null); // => null
empty.getDataFirst({}); // => {}
```

### `getDataFieldValue(field, defaultValue?)`

Returns the value of a named field from the first data item. If the field value is a function, it is called with the data item as its argument. Falls back to `defaultValue` (default `''`) if the field is absent or falsy.

```js
r.setData({
  firstName: 'John',
  lastName: 'Smith',
  fullName: (obj) => `${obj.firstName} ${obj.lastName}`,
});

r.getDataFieldValue('firstName'); // => 'John'
r.getDataFieldValue('fullName'); // => 'John Smith'
r.getDataFieldValue('age'); // => ''
r.getDataFieldValue('age', 'Unknown'); // => 'Unknown'
```

### `applyModelClass(modelClass)`

Wraps each item in the current data array with the provided class constructor. Useful when the model class is not known at construction time.

```js
class UserModel {
  constructor(props) {
    this.name = props.name || '';
    this.email = props.email || '';
  }
}

const r = new OpResult(response.data);
// r.data => [{ name: 'John', email: 'john@gmail.com' }]

r.applyModelClass(UserModel);
// r.data => [UserModel { name: 'John', email: 'john@gmail.com' }]
```

---

## Code Methods

### `setCode(code)`

Sets the operation status code.

```js
r.setCode(OP_RESULT_CODES.FAILED);
```

### `getCode()`

Returns the current operation status code.

```js
r.getCode(); // => -10000
```

---

## Total Methods

### `setTotal(total)`

Sets the total record count. Ignores negative or `NaN` values, defaulting to `0`.

```js
r.setTotal(142);
```

### `getTotal()`

Returns the total record count.

```js
r.getTotal(); // => 142
```

---

## Status Check Methods

### `didSucceed()`

Returns `true` if `code === OP_RESULT_CODES.OK`.

```js
const r = OpResult.ok({ name: 'John' });
r.didSucceed(); // => true
```

### `didFail()`

Returns `true` if `code < OP_RESULT_CODES.OK`.

```js
const r = OpResult.fail(OP_RESULT_CODES.NOT_FOUND, null, 'User not found');
r.didFail(); // => true
```

### `didSucceedAndHasData()`

Returns `true` if the operation succeeded and data is present.

```js
const r = OpResult.ok({ name: 'John' });
r.didSucceedAndHasData(); // => true

const empty = OpResult.ok();
empty.didSucceedAndHasData(); // => false
```

### `hasData()`

Returns `true` if the data array has at least one item that is not `null` or `undefined`.

```js
r.setData({ name: 'John' });
r.hasData(); // => true

r.setData(null);
r.hasData(); // => false

r.setData([]);
r.hasData(); // => false
```

### `hasErrors()`

Returns `true` if there is at least one error in the `errors` array.

```js
r.addError('email', 'Email is required');
r.hasErrors(); // => true
```

### `isLoading()` / `isSaving()` / `isDeleting()`

Returns `true` if the code matches the corresponding in-progress state. Typically used on the frontend to show loading indicators.

```js
r.startLoading();
r.isLoading(); // => true
r.isSaving(); // => false
r.isDeleting(); // => false
```

### `isInProgress()`

Returns `true` if the code is any positive in-progress value (loading, saving, or deleting).

```js
r.startSaving();
r.isInProgress(); // => true
```

### `startLoading()` / `startSaving()` / `startDeleting()`

Sets the code to the corresponding in-progress state. Returns `this` for chaining.

```js
result.startLoading();
// ... perform fetch ...
result.setCode(OP_RESULT_CODES.OK).setData(responseData);
```

---

## Category Methods

Category methods provide a higher-level classification of the current error code, useful for conditional UI handling without comparing raw numeric codes.

### `getCategory()`

Returns the error category string for the current code. Possible values: `'auth'`, `'not_found'`, `'validation'`, `'conflict'`, `'limit'`, `'server'`, `'network'`, `'unknown'`.

```js
const r = OpResult.fail(OP_RESULT_CODES.UNAUTHORIZED);
r.getCategory(); // => 'auth'
```

### `isAuthError()`

Returns `true` for auth-related errors: `UNAUTHORIZED`, `FORBIDDEN`, `EXPIRED`, `INVALID_SIGNATURE`, `INVALID_AUDIENCE`, `INVALID_ISSUER`, `MALFORMED_TOKEN`, `NO_SIGNATURE`.

```js
if (result.isAuthError()) {
  redirectToLogin();
}
```

### `isNotFound()`

Returns `true` if `code === OP_RESULT_CODES.NOT_FOUND`.

```js
if (result.isNotFound()) {
  show404Page();
}
```

### `isValidationError()`

Returns `true` if `code === OP_RESULT_CODES.VALIDATION_FAILED`.

```js
if (result.isValidationError()) {
  highlightFormErrors(result.getErrorsMap());
}
```

### `isConflict()`

Returns `true` if `code === OP_RESULT_CODES.CONFLICT`.

```js
if (result.isConflict()) {
  showToast('A record with this name already exists.');
}
```

### `isLimitReached()`

Returns `true` if `code === OP_RESULT_CODES.LIMIT_REACHED`.

### `isServerError()`

Returns `true` for `FAILED` or `EXCEPTION` codes.

### `isNetworkError()`

Returns `true` for `NETWORK_ERROR` or `TIMEOUT` codes.

### `isRetryableError()`

Returns `true` if the error is a network or server error and the operation can safely be retried.

```js
if (result.isRetryableError()) {
  scheduleRetry(fetchData);
}
```

---

## Error Methods

### `addError(field, errorMessage, code?)`

Adds one or more error messages for a given field. Use `''` as the field name for generic errors. Optionally updates the result code. Returns `this` for chaining.

```js
r.addError('email', 'Email is required');
r.addError('email', 'Email must be a valid address');
r.addError('', 'Something went wrong', OP_RESULT_CODES.FAILED);

// With an array of messages
r.addError('password', ['Too short', 'Must contain a number']);
```

### `clearErrors()`

Removes all errors. Returns `this` for chaining.

```js
r.clearErrors();
r.hasErrors(); // => false
```

### `getErrorSummary(field?)`

Returns a single combined string of all error messages for the given field, joined by a space. Defaults to the generic `''` field if no field is provided.

```js
r.addError('email', 'Email is required');
r.addError('email', 'Email must be valid');

r.getErrorSummary('email'); // => 'Email is required Email must be valid'
r.getErrorSummary(''); // => generic errors summary
r.getErrorSummary(); // => same as getErrorSummary('')
```

### `getFieldErrors(field)`

Returns the raw array of error message strings for the given field.

```js
r.addError('email', 'Email is required');
r.addError('email', 'Email must be valid');

r.getFieldErrors('email'); // => ['Email is required', 'Email must be valid']
r.getFieldErrors('name'); // => []
```

### `getErrorFields()`

Returns an array of all field names that have errors.

```js
r.addError('name', 'Required');
r.addError('email', 'Invalid');

r.getErrorFields(); // => ['name', 'email']
```

### `getErrorsMap()`

Returns a flat map of field name to combined error string for all fields. The result is cached and invalidated on any error mutation.

```js
r.addError('email', 'Email is required');
r.addError('password', 'Too short');

r.getErrorsMap();
// => { email: 'Email is required', password: 'Too short' }
```

### `getCommonErrors(knownFields)`

Returns the errors map for all fields **not** in `knownFields`. Useful for surfacing unexpected or server-side errors that don't map to a known form field.

```js
r.addError('email', 'Email is required');
r.addError('serverId', 'Unknown server ID');
r.addError('', 'Something went wrong');

r.getCommonErrors(['email']);
// => { serverId: 'Unknown server ID', '': 'Something went wrong' }
```

### `mergeErrorsIn(opResult)`

Merges errors from another `OpResult` into this one. For fields that already have errors, only non-duplicate messages are appended. New fields are deep-copied. Returns `this` for chaining.

```js
const authResult = OpResult.fail(OP_RESULT_CODES.VALIDATION_FAILED, null, { email: 'Already in use' });
const validationResult = OpResult.fail(OP_RESULT_CODES.VALIDATION_FAILED, null, { name: 'Required' });

const combined = new OpResult();
combined.mergeErrorsIn(authResult).mergeErrorsIn(validationResult);

combined.getErrorsMap();
// => { email: 'Already in use', name: 'Required' }
```

---

## Serialization Methods

### `toJS()`

Returns a plain object with `code`, `data`, `total`, and `errors`. Useful for sending over the wire or logging.

```js
r.setData({ name: 'John' });
r.toJS();
// => { code: 0, data: [{ name: 'John' }], total: 0, errors: [] }
```

### `toJSON()`

Returns a JSON string of `toJS()`. Note: if you pass an `OpResult` directly to `JSON.stringify()`, this method is called automatically. To avoid double-encoding, use `toJS()` instead when passing to `JSON.stringify()` yourself.

```js
r.toJSON();
// => '{"code":0,"data":[{"name":"John"}],"total":0,"errors":[]}'
```

### `getHttpStatus()`

Returns the HTTP status code corresponding to the current `code`. If `code` is `OK` but there is no data, returns `204`. Falls back to `500` for unrecognized codes.

```js
OpResult.ok({ id: 1 }).getHttpStatus(); // => 200
OpResult.ok().getHttpStatus(); // => 204 (no data)

OpResult.fail(OP_RESULT_CODES.NOT_FOUND).getHttpStatus(); // => 404
OpResult.fail(OP_RESULT_CODES.VALIDATION_FAILED).getHttpStatus(); // => 400
OpResult.fail(OP_RESULT_CODES.UNAUTHORIZED).getHttpStatus(); // => 401
OpResult.fail(OP_RESULT_CODES.EXCEPTION).getHttpStatus(); // => 500
```

### `clone()`

Returns a deep copy of the `OpResult`, including a deep copy of errors. Data is shallow-copied.

```js
const original = OpResult.ok({ name: 'John' });
const copy = original.clone();

copy.addError('name', 'Required');

original.hasErrors(); // => false — errors are independent
copy.hasErrors(); // => true
```

---

## Static Methods

### `OpResult.ok(data?, opt?)`

Creates a successful `OpResult` with the given data.

```js
const r = OpResult.ok({ id: 1, name: 'Alice' });
r.didSucceed(); // => true
r.getDataFirst(); // => { id: 1, name: 'Alice' }
```

### `OpResult.fail(code, data?, message?, opt?)`

Creates a failed `OpResult`. If `message` is a string it becomes a generic error. If `message` is an object, its keys are treated as field names.

```js
// Generic error
const r = OpResult.fail(OP_RESULT_CODES.FAILED, null, 'Something went wrong');
r.getErrorSummary(); // => 'Something went wrong'

// Field-specific errors
const r = OpResult.fail(OP_RESULT_CODES.VALIDATION_FAILED, null, {
  email: 'Email is required',
  password: 'Too short',
});
r.getErrorsMap(); // => { email: 'Email is required', password: 'Too short' }
```

### `OpResult.fromException(exception)`

Creates an `OpResult` from a caught exception. If the exception is already an `OpResult`, it is wrapped in a new instance. Otherwise, sets code to `EXCEPTION` and adds the exception message as a generic error.

```js
try {
  await riskyOperation();
} catch (ex) {
  return OpResult.fromException(ex);
}
```

### `OpResult.asException(message)`

Creates a failed `OpResult` with `EXCEPTION` code and a custom error message. Useful when you want to signal a failure without a thrown error.

```js
if (!config) {
  return OpResult.asException('Configuration is missing');
}
```

### `OpResult.getCategoryFromCode(code)`

Returns the error category string for any numeric code, without needing an instance.

```js
OpResult.getCategoryFromCode(OP_RESULT_CODES.EXPIRED); // => 'auth'
OpResult.getCategoryFromCode(OP_RESULT_CODES.NOT_FOUND); // => 'not_found'
OpResult.getCategoryFromCode(OP_RESULT_CODES.TIMEOUT); // => 'network'
OpResult.getCategoryFromCode(-99999); // => 'unknown'
```

### `OpResult.getFormErrors(result, knownFields)`

Extracts field-specific and generic errors from an `OpResult` for use in forms. Known fields are mapped to their combined error string. Errors for unknown fields are prefixed with the field name and collected into `genericErrors`. Accepts `null` or `undefined` safely.

```js
const result = OpResult.fail(OP_RESULT_CODES.VALIDATION_FAILED, null, {
  email: 'Email is required',
  password: 'Too short',
  serverId: 'Unrecognized server',
  '': 'Submission failed',
});

const { fields, genericErrors } = OpResult.getFormErrors(result, ['email', 'password']);

fields.email; // => 'Email is required'
fields.password; // => 'Too short'

genericErrors;
// => ['Submission failed', 'serverId: Unrecognized server']

// Usage with a form:
// <TextInput label="Email"    error={fields.email} />
// <TextInput label="Password" error={fields.password} />
// {genericErrors.length > 0 && <Alert color="red">{genericErrors.join('. ')}</Alert>}
```

---

## `isOpResult(value)`

A standalone type guard that checks whether a value is an `OpResult` instance. Preferred over `instanceof` because it works reliably across module boundaries, different bundle copies, and JS realms (workers, iframes, etc.).

```js
import { isOpResult } from '@sdflc/api-helpers';

isOpResult(new OpResult()); // => true
isOpResult(OpResult.ok()); // => true
isOpResult({ code: 0 }); // => false
isOpResult(null); // => false
isOpResult('error'); // => false
```

A common use case is safely handling values that could be either an `OpResult` or a plain exception:

```js
function handleResult(value) {
  if (isOpResult(value)) {
    if (value.didFail()) {
      console.error(value.getErrorSummary());
    } else {
      console.log(value.getDataFirst());
    }
  } else {
    console.error('Unexpected value', value);
  }
}
```

## ApiWrapper

The helper class wraps `axios.request` method to do a request to the server and then pass received JSON object
into the `OpResult` for further work. Also, the class catches all exceptions that may happen and also returns OpResult object.

### ApiWrapper propeties

#### baseApiUrl

The property `baseApiUrl` stores root path to the API. For example, 'https://my-api.com/v1/'.
Note that it must end with '/'.

#### onException

The `onException` property is a function that is called if some exception happens. This is per request property.

#### static fetchFnOpts

The `fetchFnOpts` defines default configuration parameters supplied to `axios.request` method. By default it looks like:

```js
//...
static fetchFnOpts: any = {
  withCredentials: true,
  timeout: 0,
};
//...
```

#### static fetcnFn

This is static function used by all instances of the `ApiWrapper` and it does actuall call of the `axios.request`.
You can override the function if you want to use another library to send requests. Just make sure it returns response
the same way as `axios.request`.

#### static onExceptionFn

This is the function that is assigned to each `ApiWrapper` instance if no `OnException` prop passed to constructor.
By default, the function just does `console.error` with the information about an exception.

### ApiWrapper methods

#### get(path: string, params: any)

Sends GET request to the server with provided path and params.

```js
const api = new ApiWrapper({ baseApiUrl: 'https://my-server.com/v1/' });
const r = await api.get('user/123', { some: 'something' }); // => GET https://my-server.com/v1/user/123?some=something
// r = {
//   code: 0,
//   data: [
//     {
//       name: 'John'
//     }
//   ],
//   errors: {}
// }
// or
// r = {
//   code: -20200,
//   data: [],
//   errors: {
//     name: {
//       errors: ['Such user not found']
//     }
//   }
// }
```

#### post(path: string, data?: any, params: any = {})

Sends POST request to the server with provided path and params. Used to create an entity on the server.

```js
const api = new ApiWrapper({ baseApiUrl: 'https://my-server.com/v1/' });
const r = await api.post('user', { name: 'John' }); // => POST https://my-server.com/v1/user
// r = {
//   code: 0,
//   data: [
//     {
//       id: 123,
//       name: 'John'
//     }
//   ],
//   errors: {}
// }
// or
// r = {
//   code: -20300,
//   data: [],
//   errors: {
//     name: {
//       errors: ['Such user already exists']
//     }
//   }
// }
```

#### put(path: string, data?: any, params: any = {})

Sends POST request to the server with provided path and params. Used to create an entity on the server.

```js
const api = new ApiWrapper({ baseApiUrl: 'https://my-server.com/v1/' });
const r = await api.put('user/123', { name: 'Tom' }); // => PUT https://my-server.com/v1/user/123
// r = {
//   code: 0,
//   data: [
//     {
//       id: 123,
//       name: 'Tom'
//     }
//   ],
//   errors: {}
// }
// or
// r = {
//   code: -20300,
//   data: [],
//   errors: {
//     name: {
//       errors: ['Such user already exists']
//     }
//   }
// }
```

#### delete(path: string, data: any = {}, params: any = {})

Sends DELETE request to the server with provided path and params. Used to create an entity on the server.

```js
const api = new ApiWrapper({ baseApiUrl: 'https://my-server.com/v1/' });
const r = await api.delete('user/123'); // => DELETE https://my-server.com/v1/user/123
// r = {
//   code: 0,
//   data: [],
//   errors: {}
// }
// or
// r = {
//   code: -20200,
//   data: [],
//   errors: {
//     name: {
//       errors: ['Cannot delete the user as it is not found']
//     }
//   }
// }
```

## ApiDataList

The helper class helps to simplify fetching paginated lists of objects from the server providing the server sends data
using the `OpResult` structure. The class uses both `ApiWrapper` and `OpResult` in its operation. Fetched pages
are cached in the memory.

### Constructor and methods

#### constructor(props: any)

Constructor of the class expects the following properties to be passed:

- **baseApiUrl** - _mandatory_ - base API URL, example: 'https://app.com/api/v1' or 'https://app.com/api/v1/users'.
- **mode** - _optional_ - specifies what to do with page number each time `fetchList` method is used. Default value is to increase page number by one on each call.
- **modelClass** - _optional_ - specifies an object to use for wrapping each item of received list. The class should accept raw object in its constructor to inialize its props.
- **params** - _optional_ - is an object that will be passed to the server as URL query params.
- **transform** - _optional_ - is a function used to transform each object of received list before applying `modelClass` if any.

#### clone()

Used to clone the object including arrays with received data. New arrays with data reference the same objects though.

#### parseOrderBy(orderBy: string)

Used to parse `orderBy` parameter from a string to an object. The string should have pattern like this `field1-(asc|desc)~field2-(asc|desc)`.
For example, for the string `name-asc~orderDate-desc` will be converted into the object

```js
{
  name: 'asc',
  orderDate: 'desc'
}
```

#### resetState()

Clears the class instance state.

#### setBaseUrl(baseApiUrl: string)

Used to set new base API URL for the instance.

#### setModelClass(modelClass: any)

Used to set new `modelClass` class. By setting new `modelClass` you reset current state so you need to refetch data.

#### setMode(mode: string)

Sets new fetch mode. Supported modes are:

- **STAY** (`API_DATALIST_FETCH_MODES.STAY`) - stay on the same page each time `fetchList` is called;
- **FORWARD** (`API_DATALIST_FETCH_MODES.FORWARD`) - increase page number each time `fetchList` is called;
- **BACK** (`API_DATALIST_FETCH_MODES.BAKC`) - decrease page number each time `fetchList` is called;

#### setParams(params: any, reset?: boolean)

Sets query parameters to uses when fetching data. The `params` is an object that will be transformed into URL query string.
If `reset = true` then resets object's inner state and clears all already loaded data. Example:

```js
const dataList = new ApiDataList({ ... });
...
const params = {
  projectId: '123',
  label: 'lbl'
}

dataList.setParams(params);

dataList.fetchList() // https://baseurlapi/path?projectId=123&label=lbl
```

#### appendParams(params: any, reset?: boolean)

Append new parameters or replace existing parameters. If `reset = true` then resets object's inner state and
clears all already loaded data. Example:

```js
const existingParams = dataList.getParams();
// existingParams = {
//   projectId: '123',
//   label: 'lbl'
// };
dataList.appendParams({
  projectId: '456',
  status: 'open',
});
// dataList.getParams() = {
//   projectId: '456',
//   label: 'lbl',
//   status: 'open'
// };
```

#### removeParams(keys: string[], reset?: boolean)

Append new parameters or replace existing parameters. If `reset = true` then resets object's inner state and
clears all already loaded data. Example:

```js
const removeParams = dataList.getParams();
// existingParams = {
//   projectId: '123',
//   label: 'lbl',
//   status: 'open'
// };
dataList.removeParams(['label', 'status']);
// dataList.getParams() = {
//   projectId: '456'
// };
```

#### resetParams(reset?: boolean)

Returns existing params.

#### getParams()

Returns existing params object.

#### setPageSize(pageSize: number, reset?: boolean)

Sets new page size. If `reset = true` then resets object's inner state and clears all already loaded data.

#### setOrderBy(orderBy: any, reset?: boolean)

Sets new orderBy property. The `orderBy` can be either an object or string in a specified format. Examples:

```js
dataList.setOrderBy({ name: 'asc', dateOrder: 'desc' }); // should be used on the frontend side
dataList.setOrderBy('name-asc~dateOrder-desc'); // should be used on the back-end side to initialize ApiDataList object with orerBy property
```

If `reset = true` then resets object's inner state and clears all already loaded data.

#### toggleOrderBy(key: string, reset?: boolean)

Toggles (asc/desc) `orderBy` property for provided field. If no field provided it toggles all fields in `orderBy`.
If `reset = true` then resets object's inner state and clears all already loaded data.

#### setPage(page: number)

Sets new page number. If page less than zero sets it as zero.

#### toNextPage()

Increases page number by one.

#### toPrevPage()

Decreases page number by one.

#### getPage()

Returns curent page number.

#### canFetchMode()

Returns true if the mode is `FORWARD` and it is first call or previously loaded list items length equals to `pageSize`
or the mode is `BACK` and current page is greater than 1.

#### fetchList(path: string = '')

Does call to the server API to fetch data list. The `path` is optional and if present then it is added
to the `baseApiUrl` property. If there is no error the data list gets added to inner state `pages` object.
The method returns `OpResult` object so user can get access to possible error details.

#### getTotalPages()

Returns pages count requested by this moment.

#### getPageItems(page: number = -1)

Returns items for specified page or for current page.

#### getItems()

Returns items for all pages requested by this moment.

#### startLoading()

Sets loading state to the inner state OpResult object. This may be used to change UI accordingly to let a user know
that list is being loaded.

#### isLoading()

Returns true if the request is still in progress.

#### didSucceed()

Returns true if the request succeeded.

#### didFail()

Returns true if the request failed.

#### getResult()

Returns request result as `OpResult` object.

#### getSkip()

Returns number of items to skip when doing query to the data source. It should used on the server side
and is calculated as (page - 1) \* pageSize.

#### getPageSize()

Returns page size used to query this amount of rows from the data source. It should be used on the server side.

#### getOrderBy()

Returns param's `orderBy` object.

## GraphQL Helpers

# `queryGraphQL` Helper

A typed async helper for executing GraphQL queries over HTTP using `axios`.
It normalises every possible outcome — success, backend failure, transport error,
and schema error — into a consistent `OpResult` instance.

---

## Signature

```typescript
const queryGraphQL = async (args: QueryGraphQLArgs): Promise<OpResult>
```

---

## Arguments

```typescript
export interface QueryGraphQLArgs {
  url: string; // GraphQL endpoint URL
  queryName: string; // Top-level key to extract from response.data
  query: string; // GraphQL query or mutation string
  variables?: Record<string, unknown>; // Optional GraphQL variables
  headers?: Record<string, string>; // Optional additional HTTP headers
  timeoutMs?: number; // Request timeout in ms (default: 30 000)
}
```

| Field       | Required | Default  | Notes                                                |
| ----------- | -------- | -------- | ---------------------------------------------------- |
| `url`       | ✅       | —        | Full URL to the GraphQL endpoint                     |
| `queryName` | ✅       | —        | Must match the root key in `response.data`           |
| `query`     | ✅       | —        | GraphQL query / mutation string                      |
| `variables` | ❌       | —        | Omitted from request body entirely when not provided |
| `headers`   | ❌       | `{}`     | Merged with `Content-Type: application/json`         |
| `timeoutMs` | ❌       | `30_000` | Passed directly to axios                             |

---

## Expected Response Structure

The helper is designed to work with a backend that also uses `OpResult`.
Every GraphQL resolver is expected to return an **OpResult-shaped object**:

```json
{
  "data": {
    "getUser": {
      "code": 0,
      "data": [{ "id": "1", "name": "Alice" }],
      "total": 50,
      "errors": []
    }
  }
}
```

### Field mapping

| Backend field            | Mapped to                      |
| ------------------------ | ------------------------------ |
| `data[queryName].code`   | `result.code`                  |
| `data[queryName].data`   | `result.data` (internal array) |
| `data[queryName].total`  | `result.total`                 |
| `data[queryName].errors` | `result.errors`                |

> **Important:** `total` represents the full record count available on the server
> (e.g. for pagination), while `data` contains only the current page of items.
> These two values are independent.

---

## Return Value

Always returns a `Promise<OpResult>`. Never throws. The caller inspects the
result using `OpResult`'s own API:

```typescript
const result = await queryGraphQL({ url, queryName, query });

if (result.didFail()) {
  console.error(result.getErrorSummary()); // generic error message
  console.error(result.getFieldErrors('email')); // field-level errors
  return;
}

const user = result.getDataFirst(); // first item in the data array
const total = result.getTotal(); // total records available
```

---

## Error Scenarios

The helper distinguishes between four distinct failure origins,
each mapped to a different `OP_RESULT_CODES` value:

### 1. Input validation failure

Triggered before any network call is made.

| Condition            | Error message              |
| -------------------- | -------------------------- |
| `url` is empty       | `'URL is required'`        |
| `queryName` is empty | `'Query name is required'` |
| `query` is empty     | `'Query is required'`      |

```typescript
result.code; // OP_RESULT_CODES.VALIDATION_FAILED
result.didFail(); // true
result.getErrorSummary(); // e.g. 'URL is required'
```

### 2. Malformed HTTP response

The HTTP call succeeded but the response shape is unexpected.

| Condition                                | Error message                                     |
| ---------------------------------------- | ------------------------------------------------- |
| Response body is null / empty            | `'Response data is empty'`                        |
| `data` key absent from response          | `'GraphQL response is missing the data field'`    |
| `queryName` not found in `response.data` | `'Query "getUser" not found in GraphQL response'` |

```typescript
result.code; // OP_RESULT_CODES.VALIDATION_FAILED
result.getErrorSummary(); // descriptive message from table above
```

### 3. GraphQL transport-level errors

The GraphQL layer itself returned a top-level `errors` array (HTTP 200,
but the schema or resolver rejected the request). These are distinct from
backend `OpResult` errors inside `data`.

```json
{ "errors": [{ "message": "Field 'foo' not found" }] }
```

```typescript
result.code; // OP_RESULT_CODES.VALIDATION_FAILED
result.getErrorSummary(); // first error's message, or 'GraphQL error' if absent
result.getData(); // full errors array from the GraphQL response
```

### 4. HTTP / network errors

Caught from axios and mapped by HTTP status code.

| Condition                        | Code                | Notes                                                       |
| -------------------------------- | ------------------- | ----------------------------------------------------------- |
| HTTP 400                         | `VALIDATION_FAILED` | `result.getData()` contains the raw response body           |
| HTTP 5xx / other                 | `EXCEPTION`         | `result.getErrorSummary()` contains the axios error message |
| No response (timeout, DNS, etc.) | `EXCEPTION`         | Covers axios network errors with no `response` object       |
| Non-Error thrown value           | `EXCEPTION`         | Safely converted via `String(ex)`                           |

```typescript
result.isServerError(); // true for EXCEPTION
result.isNotFound(); // true for NOT_FOUND
result.isAuthError(); // true for UNAUTHORIZED, EXPIRED, etc.
```

---

## Nuances & Gotchas

**GraphQL always returns HTTP 200 for query errors.**
A failed query (e.g. unauthorised field, resolver exception) comes back as
`{ errors: [...] }` with a 200 status. The helper checks `responseData.errors`
_before_ inspecting `data`, so these are caught correctly.

**`queryName` must exactly match the resolver key.**
If the backend returns `{ data: { fetchUser: ... } }` but `queryName` is
`"getUser"`, the helper returns a `VALIDATION_FAILED` result with message
`Query "getUser" not found in GraphQL response`.

**`variables` is omitted entirely when not provided.**
Rather than sending `{ query, variables: undefined }`, the key is conditionally
spread so the request body stays clean for backends that distinguish between
a missing key and an explicit `undefined`.

**`data: null` is a valid success response.**
A resolver may legitimately return `null` (e.g. a user that doesn't exist).
`result.didSucceed()` will be `true`, but `result.hasData()` will be `false`.
Do not treat `hasData() === false` as an error without also checking `didFail()`.

**`total` and `data.length` are independent.**
`total` reflects the full server-side count; `data` holds only the current page.
Always use `result.getTotal()` for pagination logic, not `result.getData().length`.

**Backend errors are field-aware.**
The backend's `errors` array is an array of `{ name: string, errors: string[] }`
objects. Use `result.getFieldErrors('fieldName')` to retrieve per-field messages
and `result.getErrorSummary()` for the generic (`name: ''`) message.

---

## Usage Examples

### Basic query

```typescript
const result = await queryGraphQL({
  url: 'https://api.example.com/graphql',
  queryName: 'getUser',
  query: `query GetUser($id: ID!) { getUser(id: $id) { code data { id name } total errors { name errors } } }`,
  variables: { id: '42' },
});

if (result.didFail()) {
  console.error(result.getErrorSummary());
  return;
}

const user = result.getDataFirst(); // { id: '42', name: 'Alice' }
```

### Paginated list

```typescript
const result = await queryGraphQL({
  url: 'https://api.example.com/graphql',
  queryName: 'listUsers',
  query: `query ListUsers($page: Int!) { listUsers(page: $page) { code data { id name } total errors { name errors } } }`,
  variables: { page: 1 },
});

const users = result.getData(); // current page items
const total = result.getTotal(); // total available across all pages
```

### Authenticated request with custom timeout

```typescript
const result = await queryGraphQL({
  url: 'https://api.example.com/graphql',
  queryName: 'getProfile',
  query: `{ getProfile { code data { id role } total errors { name errors } } }`,
  headers: { Authorization: `Bearer ${token}` },
  timeoutMs: 5_000,
});
```

### Form error handling

```typescript
const result = await queryGraphQL({ ... });

const { fields, genericErrors } = OpResult.getFormErrors(result, ['email', 'password']);
// fields.email    → 'Email is required'
// fields.password → 'Too short'
// genericErrors   → ['Something went wrong']
```
