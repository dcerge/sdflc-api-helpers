# @sdflc/api-helpers

This is a set of classes that help to organize communication between front end and server. These classes are used across all the other libraries within @sdflc scope unless it is specified otherwise.

# Classes overview

- **OpResult** - this class represents an operation result that is expected by a front-end app and that should be sent by a server.
- **ApiWrapper** - this class wraps `axios.request` method to do requests to a server and also wraps a resonse from server into `OpResult` class.

# OpResult

This class is used to send data from server to the front-end in a unified way as well as wrap received JSON object from server in this class on the front-end side. This helps to works with data the same way as on the server as well as on the front-end.
The object structure basically looks like this:

```js
{
  code: 0,   // Result code. Zero is OK, negative value is an error
  data: [],  // Data from server are always wrapped by an array. Event for one items that server sends it gets wrapped into an array
  errors: {} // An object with errors if any. See description below
}
```

Here is an example of the object with some data:

```js
{
  code: 0,
  data: [
    {
      name: 'John Smith',
      email: 'jsmith@email.com'
    }
  ],
  errors: {}
}
```

Here is an example of the object error after trying to save data:

```js
{
  code: 0,
  data: [],
  errors: {
    '': {
      errors: [
        'Failed to save user information due to lack of access rights.'
      ]
    }
  }
}
```

or

```js
{
  code: 0,
  data: [
    {
      name: 'John Smith',
      email: 'jsmith-email.com'
    }
  ],
  errors: {
    'email': {
      errors: [
        'Email field should should be a valid email address'
      ]
    }
  }
}
```

or

```js
{
  code: 0,
  data: [
    {
      name: 'John Smith',
      contats: {
        email: 'jsmith@email.com',
        phone: '4037654321
      }
    },
    {
      name: 'Tom',
      contats: {
        email: 'tom-email.com',
        phone: '4031234567
      }
    }
  ],
  errors: {
    'users[1].contats.phone': {
      errors: [
        'Email field should should be a valid email address'
      ]
    }
  }
}
```

## OpResults properties

### code

The `code` property provides information of an operation result. If it is 0 then you the operation was successful. In case of negative value it means that there was an error and the error details should be available in the `errors` property. Your code should set corresponding errors, of course. The value can be positive which mean that the operation is still in progress.

All available code values are located in the `OP_RESULT_CODE` object.

### data

The `data` property contains actual data server sends to back to front-end or other side. You must use `setData` method to set your data to the OpResult object.
It is important to keep in mind that data is alwat an array. If there is no data then the array is empty. Also, data is considered empty when there is one item in the array and it is either `null` or `undefined`.

### errors

The `errors` property is an object that contains information about errors occured during executing an operation. The structure of the `errors` object has the following structure:

```js
{
  '': {
    errors: ['Summary error description']
  },
  fieldName: {
    errors: [
      'fieldName error description',
      'You can add several errors for the fieldName'
    ]
  },
  otherName: {
    errors: [
      'v error description',
      'You can add several errors for the otherName'
    ]
  }
}
```

As you can see each object key is either a fieldName or ''. This way you can automate displaying errors for each wrong field of your form.

## OpResults methods

### constructor(props)

Contructor accepts props that are expected to look like:

```js
{
  code: 0,
  data: [],
  errors: {}
}
```

Setting the class properties via constructor works best when you receive result object from server and need to initialize OpResult accordingly.

#### Example

```js
const requestServer = async (props) => {
  const response = await axios.get(url);
  const result = new OpResult(response.data);
};
```

### setData(data: any)

Sets data to the OpResult class object:

```js
const r = new OpResult();

r.setData({
  name: 'John',
});
```

### getData()

Gets data from the OpResult class object:

```js
const r = new OpResult();

r.setData({
  name: 'John',
});

const d = r.getData();

// the `d` will be:
// [
//   {
//     name: 'John'
//   }
// ]
```

### getDataFirst(defaultValue: any)

Gets data's first item and there is no data then it returns `defaultValue`:

```js
const r = new OpResult();

r.setData({
  name: 'John',
});

const d = r.getDataFirst();

// the `d` will be:
// {
//   name: 'John'
// }
```

### setCode(code: number)

Sets code to the OpResult class object:

```js
import { OP_RESULT_CODE } from '@sdflc/api-helpers';

const r = new OpResult();

r.setCode(OP_RESULT_CODE.FAILED);
```

### getCode()

Gets code from the OpResult class object:

```js
import { OP_RESULT_CODE } from '@sdflc/api-helpers';

const r = new OpResult();

r.setCode(OP_RESULT_CODE.FAILED);

const code = r.getCode(); // => code = -10000
```

### addError(field: string, errorMessage: string, code?: number)

Adds an error message to specified field errors.
Here is an simple example of a server side function that accepts `formData`, does some checks and in case of wrong data add errors adn return OpResult object.

```js
import { OP_RESULT_CODE } from '@sdflc/api-helpers';

const save = async (formData) => {
  const r = new OpResult();

  if (!formData) {
    return r.addError('', 'No form data provided', OP_RESULT_CODE.VALIDATION_FAILED);
  }

  if (!formData.name) {
    r.addError('name', 'You must provide user name', OP_RESULT_CODE.VALIDATION_FAILED);
  }

  if (!checkEmail(formData.email)) {
    r.addError('email', 'Email field must be a valid email address', OP_RESULT_CODE.VALIDATION_FAILED);
  }

  if (r.hasErrors()) {
    return r;
  }

  try {
    saveUser(formData);
  } catch (ex) {
    r.addError('', 'Oops, something went wrong when saving data. Try again', OP_RESULT_CODE.EXCEPTION);
  }

  return r;
};
```

### hasErrors()

Returns true if there is at least one error in the `errors` property.

```js
import { OP_RESULT_CODE } from '@sdflc/api-helpers';

const r = new OpResult();

r.addError('', 'Oops, something went wrong when saving data. Try again', OP_RESULT_CODE.EXCEPTION);
if (r.hasErrors()) {
  console.log('We have errors');
}
```

### clearErrors()

Clears all added errors.

```js
import { OP_RESULT_CODE } from '@sdflc/api-helpers';

const r = new OpResult();

r.addError('', 'Oops, something went wrong when saving data. Try again', OP_RESULT_CODE.EXCEPTION);
r.clearErrors(); // => errors: {}
```

### applyModelClass(modelClass: any)

Used to apply passed class to all OpResult's data items, ie. convert from anonymous data items to specfic ones.
Here is a simple example:

```js
import { OP_RESULT_CODE } from '@sdflc/api-helpers';

class User {
  name: string = '';
  email: string = '';

  constructor(props) {
    if (!props) {
      props = {};
    }

    this.name = props.name || '';
    this.email = props.email || '';
  }
}

// or using vanilla JavaScript
// function User(props) {
//   if (!props) {
//     props = {}
//   }
//   this.name = props.name || '';
//   this.email = props.email || '';
// }

const getRq = async (userData) => {
  const response = await axios.get(url);
  const result = new OpResult(response.data);
  // by now result.data = [{ name: 'John', email: 'john@gmail.com' }]
  result.applyModelClass(User);
  // by now result.data = [User { name: 'John', email: 'john@gmail.com' }]
};
```

### isSucceeded()

Returns true if the `code` isequal to OP_RESULT_CODES.OK.

### isFailed()

Returns true if the `code` is not equal to OP_RESULT_CODES.OK.

### hasData()

Returns true if the `data` has at least one element in the array and it is not equal to null or undefined.

```js
const r = new OpResult();

r.setData({ name: 'John' });
r.hasData(); // => true as data = [{ name: 'John' }]
r.setData(null);
r.hasData(); // => false as data = [null]
r.setData([null, { name: 'John' }]);
r.hasData(); // => true as data = [null, { name: 'John' }]
```

### isSucceededAndHasData()

Returns true if the `code` is equal to OP_RESULT_CODES.OK and `hasData() === true`.

### isLoading()

Returns true if the `code` is equal to OP_RESULT_CODES.LOADING. The method usually used by front-end to track status of `get` request.

### isSaving()

Returns true if the `code` is equal to OP_RESULT_CODES.SAVING. The method usually used by front-end to track status of `post/put` request.

### isDeleting()

Returns true if the `code` is equal to OP_RESULT_CODES.DELETING. The method usually used by front-end to track status of `delete` request.

### isInProgress()

Returns true if the `code` is equal to either OP_RESULT_CODES.LOADING, OP_RESULT_CODES.SAVING or OP_RESULT_CODES.DELETING. The method usually used by front-end to track status of a request.

### startLoading()

Sets `code` to OP_RESULT_CODES.LOADING. The method usually used by front-end to track status of `get` request.

### startSaving()

Sets `code` to OP_RESULT_CODES.SAVING. The method usually used by front-end to track status of `post/put` request.

### startDeleting()

Sets `code` to OP_RESULT_CODES.DELETING. The method usually used by front-end to track status of `delete` request.

### clone()

Create a copy of the OpResult object.

```js
const r = new OpResult();
r.setData({ name: 'John' });
r.setCode(OP_RESULT_CODES.FAILED);
const r2 = r.clone();
// r2 is a new object with data = [{ name: 'John' }] and code = OP_RESULT_CODES.FAILED
```

### getErrorSummary(field?: string)

Returns errors summary in one string object for the specified field.

```js
import { OP_RESULT_CODE } from '@sdflc/api-helpers';

const r = new OpResult();

r.addError('', 'Error 1.', OP_RESULT_CODE.EXCEPTION);
r.addError('', 'Error 2.', OP_RESULT_CODE.EXCEPTION);
r.getErrorSummary(''); // => 'Error 1. Error 2.'
```

### getErrorFields()

Returns array with all `errors` keys.

```js
import { OP_RESULT_CODE } from '@sdflc/api-helpers';

const r = new OpResult();

r.addError('name', 'Wrong name', OP_RESULT_CODE.VALIDATION_FAILED));
r.addError('email', 'Invalid email address.', OP_RESULT_CODE.VALIDATION_FAILED);
r.getErrorFields(); // => ['name', 'email']
```

### getFieldErrors(fieldName: string)

Returns array with all errors for the specified field:

```js
import { OP_RESULT_CODE } from '@sdflc/api-helpers';

const r = new OpResult();

r.addError('', 'Error 1.', OP_RESULT_CODE.EXCEPTION);
r.addError('', 'Error 2.', OP_RESULT_CODE.EXCEPTION);
r.getFieldErrors(''); // => ['Error 1', 'Error 2']
```

### getDataFieldValue(fieldName: string, defaultValue: string = '')

It is suppsed to be used when `data` property has just one element in it. The method takes first element from the `data` property, and then tries to get a value `fieldName`. If the value is `null` or `undefined` then it returns `defaultValue`. If the `fieldName` is a function it calls the function and returns its result.

```js
const r = new OpResult();

r.setData({
  firstName: 'John',
  lastName: 'Smith',
  fullName: (obj) => {
    return `${obj.firstName} ${obj.lastName}`;
  },
});
r.getDataFieldValue('fullName'); // => John Smith
```

### toJS

Returns an object containg properties `code`, `data`, `errors`. It is used to send data back to the front-end:

```js
const r = new OpResult();

r.setData({
  firstName: 'John',
  lastName: 'Smith',
});
r.toJS(); // { code: 0, data: [{ firstName: 'John', lastName: 'Smith' }], errors: {} }
```

### toJSON()

Returns stringified result of `toJS()`.

### getHttpStatus()

Returns HTTP Status Code depending on value in the `code` property.

For example,

- if code = OP_RESULT_CODES.EXCEPTION then the function will return 500.
- if code = OP_RESULT_CODES.NOT_FOUND then the function will return 404.

### static ok(data?: any, opt?: any)

This is static function to simplify creating of OpResult object with data:

```js
const r = OpResult.ok({
  firstName: 'John',
  lastName: 'Smith',
});
```

### static fail(code: number, data: any, message: string, opt?: any)

This is static function to simplify creating of OpResult object with simple error information:

```js
const r = OpResult.fail(OP_RESULT_CODES.NOT_FOUND, {}, 'Object not found');
```
