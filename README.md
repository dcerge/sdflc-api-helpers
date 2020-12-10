# @sdflc/api-helpers

This is a set of classes that help to organize communication between front end and server. These classes are used across all the other libraries within @sdflc scope unless it is specified otherwise.

# Classes overview

- **OpResult** - this class represents an operation result that is expected by a front-end app and that should be sent by a server.
- **ApiWrapper** - this class wraps `axios.request` method to do requests to a server and also wraps a resonse from server into `OpResult` class.

# OpResult

This class is used to send data from server to the front-end in a unified way that basically looks like this:

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
