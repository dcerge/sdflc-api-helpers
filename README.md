# @sdflc/api-helpers

This is a set of classes that help to organize communication between front end and server. These classes are used across all the other libraries within @sdflc scope unless it is specified otherwise.

# Classes overview

- **OpResult** - this class represents an operation result that is expected by a front-end app and that should be sent by a server.
- **ApiWrapper** - this class wraps `axios.request` method to do requests to a server and also wraps a response from server into `OpResult` class.
- **ApiDataList** - this class used to simplify fetching paginated lists of objects from the server. It expects the server sends data as `OpResult` structure.

---

# OpResult

This class is used to send data from server to the front-end in a unified way as well as wrap received JSON object from server in this class on the front-end side. This helps to works with data the same way as on the server as well as on the front-end.
The object structure basically looks like this:

```js
{
  code: 0,   // Result code. Zero is OK, negative value is an error
  data: [],  // Data from server are always wrapped by an array. Event for one items that server sends it gets wrapped into an array
  errors: [] // An array with errors if any. See description below
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
  errors: []
}
```

Here is an example of the object error after trying to save data:

```js
{
  code: 0,
  data: [],
  errors: [
    {
      name: '',
      errors: [
        'Failed to save user information due to lack of access rights.'
      ]
    }
  ]
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
  errors: [
    {
      name: 'email',
      errors: [
        'Email field should should be a valid email address'
      ]
    }
  ]
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

The `errors` property is an array that contains information about errors occured during executing an operation. The structure of the `errors` object has the following structure:

```js
[
  {
    name: '',
    errors: ['Summary error description'],
  },
  {
    name: fieldName,
    errors: ['fieldName error description', 'You can add several errors for the fieldName'],
  },
  {
    name: otherName,
    errors: ['otherName error description', 'You can add several errors for the otherName'],
  },
];
```

## OpResults methods

### constructor(props)

Contructor accepts props that are expected to look like:

```js
{
  code: 0,
  data: [],
  errors: []
}
```

Setting the class properties via constructor works best when you receive result object from server and need to initialize `OpResult` accordingly.

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

### didSucceed()

Returns true if the `code` isequal to OP_RESULT_CODES.OK.

### didFail()

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

### hasErrors()

Returns true if there are elements in the OpResult.errors array

### didSucceedAndHasData()

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

### getFieldErrors(field: string)

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

---

# ApiWrapper

The helper class wraps `axios.request` method to do a request to the server and then pass received json object into OpResult for further work. Also, the class catches all exceptions that may happen and also returns OpResult object.

## ApiWrapper propeties

### baseApiUrl

The property `baseApiUrl` stores root path to the API. For example, 'https://my-api.com/v1/'. Note that it must end with '/'.

### onException

The `onException` property is a function that is called if some exception happens. This is per request property.

### static fetchFnOpts

The `fetchFnOpts` defines default configuration parameters supplied to `axios.request` method. By default it looks like:

```js
...
static fetchFnOpts: any = {
  withCredentials: true,
  timeout: 0,
};
...
```

### static fetcnFn

This is static function used by all instances of the `ApiWrapper` and it does actuall call of the `axios.request`. You can override the function if you want to use another library to send requests. Just make sure it returns response the same way as `axios.request`.

### static onExceptionFn

This is the function that is assigned to each `ApiWrapper` instance if no `OnException` prop passed to constructor. By default, the function just console.error information about exception.

## ApiWrapper methods

### get(path: string, params: any)

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

### post(path: string, data?: any, params: any = {})

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

### put(path: string, data?: any, params: any = {})

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

### delete(path: string, data: any = {}, params: any = {})

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

---

# ApiDataList

The helper class helps to simplify fetching paginated lists of objects from the server providing the server sends data using `OpResult` structure. The class uses both `ApiWrapper` and `OpResult` in its operation. Fetched pages are cached in the memory.

## Constructor and methods

### constructor(props: any)

Constructor of the class expects the following properties to be passed:

- **baseApiUrl** - _mandatory_ - base API URL, example: https://app.com/api/v1 or https://app.com/api/v1/users.
- **mode** - _optional_ - specifies what to do with page number each time `fetchList` method is used. Default value is to increase page number by one on each call.
- **modelClass** - _optional_ - specifies an object to use for wrapping each item of received list. The class should accept raw object in its constructor to inialize its props.
- **params** - _optional_ - is an object that will be passed to the server as URL query params.
- **transform** - _optional_ - is a function used to transform each object of received list before applying `modelClass` if any.

### clone()

Used to clone the object including arrays with received data. New arrays with data reference the same objects though.

### parseOrderBy(orderBy: string)

Used to parse `orderBy` parameter from a string to an object. The string should have pattern like this `field1-(asc|desc)~field2-(asc|desc)`. For example, for the string `name-asc~orderDate-desc` will be converted into the object

```js
{
  name: 'asc',
  orderDate: 'desc'
}
```

### resetState()

Clears the class instance state.

### setBaseUrl(baseApiUrl: string)

Used to set new base API URL for the instance.

### setModelClass(modelClass: any)

Used to set new `modelClass` class. By setting new `modelClass` you reset current state so you need to refetch data.

### setMode(mode: string)

Sets new fetch mode. Supported modes are:

- **STAY** (`API_DATALIST_FETCH_MODES.STAY`) - stay on the same page each time `fetchList` is called;
- **FORWARD** (`API_DATALIST_FETCH_MODES.FORWARD`) - increase page number each time `fetchList` is called;
- **BACK** (`API_DATALIST_FETCH_MODES.BAKC`) - decrease page number each time `fetchList` is called;

### setParams(params: any, reset?: boolean)

Sets query parameters to uses when fetching data. The `params` is an object that will be transformed into URL query string. If `reset = true` then resets object's inner state and clears all already loaded data. Example:

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

### appendParams(params: any, reset?: boolean)

Append new parameters or replace existing parameters. If `reset = true` then resets object's inner state and clears all already loaded data. Example:

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

### removeParams(keys: string[], reset?: boolean)

Append new parameters or replace existing parameters. If `reset = true` then resets object's inner state and clears all already loaded data. Example:

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

### resetParams(reset?: boolean)

Returns existing params.

### getParams()

Returns existing params object.

### setPageSize(pageSize: number, reset?: boolean)

Sets new page size. If `reset = true` then resets object's inner state and clears all already loaded data.

### setOrderBy(orderBy: any, reset?: boolean)

Sets new orderBy property. The `orderBy` can be either an object or string in a specified format. Examples:

```js
dataList.setOrderBy({ name: 'asc', dateOrder: 'desc' }); // should be used on the front-end side
dataList.setOrderBy('name-asc~dateOrder-desc'); // should be used on the back-end side to initialize ApiDataList object with orerBy property
```

If `reset = true` then resets object's inner state and clears all already loaded data.

### toggleOrderBy(key: string, reset?: boolean)

Toggles (asc/desc) `orderBy` property for provided field. If no field provided it toggles all fields in `orderBy`.
If `reset = true` then resets object's inner state and clears all already loaded data.

### setPage(page: number)

Sets new page number. If page less than zero sets it as zero.

### toNextPage()

Increases page number by one.

### toPrevPage()

Decreases page number by one.

### getPage()

Returns curent page number.

### canFetchMode()

Returns true if the mode is `FORWARD` and it is first call or previously loaded list items length equals to `pageSize` or the mode is `BACK` and current page is greater than 1.

### fetchList(path: string = '')

Does call to the server API to fetch data list. The `path` is optional and if present then it is added to the `baseApiUrl` property.
If there is no error the data list gets added to inner state `pages` object.
The method returns `OpResult` object so user can get access to possible error details.

### getTotalPages()

Returns pages count requested by this moment.

### getPageItems(page: number = -1)

Returns items for specified page or for current page.

### getItems()

Returns items for all pages requested by this moment.

### startLoading()

Sets loading state to the inner state OpResult object. This may be used to change UI accordingly to let a user know that list is being loaded.

### isLoading()

Returns true if the request is still in progress.

### didSucceed()

Returns true if the request succeeded.

### didFail()

Returns true if the request failed.

### getResult()

Returns request result as `OpResult` object.

### getSkip()

Returns number of items to skip when doing query to the data source. It should used on the server side and is calculated as (page - 1) \* pageSize.

### getPageSize()

Returns page size used to query this amount of rows from the data source. It should be used on the server side.

### getOrderBy()

Returns param's `orderBy` object.

# GraphQL Helpers

## queryGraphQL(args: QueryGraphQLArgs): OpResult

The `QueryGraphQLArgs` has the following paramters:

- url - string - URL of the GraphQL server
- queryName: string - name of query in the query string, used to extract result from response
- query: string - query string to be sent
- variables?: any - an object representing variables to send along with the query
- headers?: any - an object with HTTP headers, for example authorization header

Example of usage:

```
const result = await queryGraphQL({
  url: 'http://localhost:4000,
  query: `
    query SignIn($params: SignInInput) {
      signIn(params: $params) {
        code
        errors {
          name
          errors
          warnings
        }
        data {
          id
          username
          email
          firstName
          middleName
          lastName
        }
      }
    }
  `,
  variables: {
    username: 'testuser',
    password: 'somepassword',
  },
  headers: {
    'x-api-key': 'some-api-key'
  }
});

// result.data =>
// {
//   code: 0,
//   errors: [],
//   data: {
//     id: 1,
//     username: 'testuser',
//     email: 'some@gmail.com',
//     firstName: 'Test',
//     middleName: '',
//     lastName: 'User',
//   }
// }
```
