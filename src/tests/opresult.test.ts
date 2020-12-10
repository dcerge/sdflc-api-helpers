const { OpResult, OP_RESULT_CODES } = require('../');

class User {
  name: string = '';
  email: string = '';

  constructor(props: any) {
    if (!props) {
      props = {};
    }
  
    this.name = props.name;
    this.email = props.email;
  }
}

test('Result Class Testing', () => {
  const rawResult = {
    code: OP_RESULT_CODES.OK,
    data: [
      {
        name: "ITEM"
      }
    ],
    errors: {
      name: {
        errors: ['Error']
      }
    }
  };

  const rawDataItem = {
    name: "SOMETHING"
  };

  const rawDataArray = [
    {
      name: "FIRST"
    },
    {
      name: "SECOND"
    },
  ];

  const result = new OpResult();
  const preInitResult = new OpResult(rawResult);

  expect(result.toJS()).toEqual({
    code: OP_RESULT_CODES.OK,
    data: [],
    errors: {},
  });

  expect(preInitResult.toJS()).toEqual(rawResult);

  result.setData(rawDataItem);

  expect(result.toJS()).toEqual({
    code: 0,
    data: [rawDataItem],
    errors: {},
  });

  result.setData(rawDataArray);

  expect(result.toJS()).toEqual({
    code: 0,
    data: rawDataArray,
    errors: {},
  });

  expect(result.getDataFirst()).toEqual(rawDataArray[0]);
  expect(result.getDataFieldValue('name')).toEqual('FIRST');

  result.setData(null);
  expect(result.getDataFirst()).toEqual(null);
  expect(result.getDataFirst('N/A')).toEqual('N/A');

  result.setData(undefined);
  expect(result.getDataFirst()).toEqual(undefined);
  expect(result.getDataFirst('N/A')).toEqual('N/A');

  result.setCode(OP_RESULT_CODES.VALIDATION_FAILED).addError('name', 'Name should be shorter')
  expect(result.getErrorSummary('name')).toEqual('Name should be shorter');
  expect(result.getErrorSummary('')).toEqual('');
  expect(result.code).toEqual(OP_RESULT_CODES.VALIDATION_FAILED);

  result.clearErrors();
  expect(result.getErrorSummary('')).toEqual('');
  expect(result.getErrorSummary('')).toEqual('');

  const okeed = OpResult.ok(rawDataItem);

  expect(okeed.getDataFirst()).toEqual(rawDataItem);
  expect(okeed.isSucceeded()).toEqual(true);
  expect(okeed.isSucceededAndHasData()).toEqual(true);
  expect(okeed.isFailed()).toEqual(false);
  expect(okeed.hasData()).toEqual(true);
  expect(okeed.getHttpStatus()).toEqual(200);

  okeed.setData(null);
  expect(okeed.getHttpStatus()).toEqual(204);

  const failed = OpResult.fail(OP_RESULT_CODES.FORBIDDEN, null, 'Access forbidden');
  expect(failed.getErrorSummary('')).toEqual('Access forbidden');
  expect(failed.isSucceeded()).toEqual(false);
  expect(failed.isSucceededAndHasData()).toEqual(false);
  expect(failed.isFailed()).toEqual(true);
  expect(failed.hasData()).toEqual(false);
  expect(failed.getErrorFields()).toEqual(['']);
  expect(failed.getFieldErrors('')).toEqual(['Access forbidden']);

  const failed2 = OpResult.fail(OP_RESULT_CODES.FORBIDDEN, { name: 'USER' }, 'Access forbidden');
  expect(failed2.getDataFirst()).toEqual({ name: 'USER' });


  const withModel = new OpResult({ data: { name: 'SD', email: "sd@gmail.com"} }, { modelClass: User });
  expect(withModel.getDataFirst()).toEqual({ name: 'SD', email: "sd@gmail.com"});

  const withModels = new OpResult({ data: [{ name: 'SD', email: "sd@gmail.com"}, { name: 'EM', email: "em@gmail.com"}] }, { modelClass: User });
  expect(withModels.getData()).toEqual([{ name: 'SD', email: "sd@gmail.com"}, { name: 'EM', email: "em@gmail.com"}]);

  const r = new OpResult();

  r.setData({
    firstName: 'John',
    lastName: 'Smith',
    fullName: (obj: any) => {
      return `${obj.firstName} ${obj.lastName}`;
    },
  });
  expect(r.getDataFieldValue('fullName')).toEqual('John Smith');
});
