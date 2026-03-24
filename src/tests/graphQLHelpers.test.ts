import axios from 'axios';
import { queryGraphQL } from '../graphQLHelpers';
import { OP_RESULT_CODES } from '../opResultCodes';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const VALID_ARGS = {
  url: 'https://api.example.com/graphql',
  queryName: 'getUser',
  query: '{ getUser { id name } }',
} as const;

/**
 * Wraps a payload in the shape the GraphQL endpoint returns:
 * the top-level `data` key holds a map of queryName -> OpResult-shaped object.
 */
const makeGraphQLResponse = (
  queryName: string,
  payload: {
    code?: number;
    data?: any;
    total?: number;
    errors?: any[];
  },
) => ({ data: { data: { [queryName]: payload } } });

// ---------------------------------------------------------------------------
// Input validation
// ---------------------------------------------------------------------------

describe('queryGraphQL — input validation', () => {
  it('fails when url is missing', async () => {
    const result = await queryGraphQL({ ...VALID_ARGS, url: '' });

    expect(result.didFail()).toBe(true);
    expect(result.code).toBe(OP_RESULT_CODES.VALIDATION_FAILED);
    expect(result.getErrorSummary()).toBe('URL is required');
  });

  it('fails when queryName is missing', async () => {
    const result = await queryGraphQL({ ...VALID_ARGS, queryName: '' });

    expect(result.didFail()).toBe(true);
    expect(result.code).toBe(OP_RESULT_CODES.VALIDATION_FAILED);
    expect(result.getErrorSummary()).toBe('Query name is required');
  });

  it('fails when query is missing', async () => {
    const result = await queryGraphQL({ ...VALID_ARGS, query: '' });

    expect(result.didFail()).toBe(true);
    expect(result.code).toBe(OP_RESULT_CODES.VALIDATION_FAILED);
    expect(result.getErrorSummary()).toBe('Query is required');
  });
});

// ---------------------------------------------------------------------------
// Successful responses
// ---------------------------------------------------------------------------

describe('queryGraphQL — successful responses', () => {
  afterEach(() => jest.clearAllMocks());

  it('returns a successful OpResult with data from the backend payload', async () => {
    const userData = { id: '1', name: 'Alice' };
    mockedAxios.post.mockResolvedValue(
      makeGraphQLResponse('getUser', { code: OP_RESULT_CODES.OK, data: [userData], total: 1, errors: [] }),
    );

    const result = await queryGraphQL(VALID_ARGS);

    expect(result.didSucceed()).toBe(true);
    expect(result.didSucceedAndHasData()).toBe(true);
    expect(result.getDataFirst()).toEqual(userData);
    expect(result.getTotal()).toBe(1);
    expect(result.hasErrors()).toBe(false);
  });

  it('maps total correctly from the backend payload', async () => {
    mockedAxios.post.mockResolvedValue(
      makeGraphQLResponse('getUser', {
        code: OP_RESULT_CODES.OK,
        data: [{ id: '1' }, { id: '2' }],
        total: 50,
        errors: [],
      }),
    );

    const result = await queryGraphQL(VALID_ARGS);

    expect(result.didSucceed()).toBe(true);
    expect(result.getData()).toHaveLength(2); // only 2 items in this page
    expect(result.getTotal()).toBe(50); // but 50 total available
  });

  it('maps the backend code into the returned OpResult', async () => {
    mockedAxios.post.mockResolvedValue(
      makeGraphQLResponse('getUser', { code: OP_RESULT_CODES.NOT_FOUND, data: null, total: 0, errors: [] }),
    );

    const result = await queryGraphQL(VALID_ARGS);

    expect(result.didFail()).toBe(true);
    expect(result.code).toBe(OP_RESULT_CODES.NOT_FOUND);
    expect(result.isNotFound()).toBe(true);
  });

  it('maps backend errors and failure code into the returned OpResult', async () => {
    const backendErrors = [{ name: 'email', errors: ['Email is required'] }];
    mockedAxios.post.mockResolvedValue(
      makeGraphQLResponse('getUser', {
        code: OP_RESULT_CODES.VALIDATION_FAILED,
        data: null,
        total: 0,
        errors: backendErrors,
      }),
    );

    const result = await queryGraphQL(VALID_ARGS);

    expect(result.didFail()).toBe(true);
    expect(result.code).toBe(OP_RESULT_CODES.VALIDATION_FAILED);
    expect(result.hasErrors()).toBe(true);
    expect(result.getFieldErrors('email')).toEqual(['Email is required']);
  });

  it('accepts a payload where data is null (e.g. record not found)', async () => {
    mockedAxios.post.mockResolvedValue(
      makeGraphQLResponse('getUser', { code: OP_RESULT_CODES.OK, data: null, total: 0, errors: [] }),
    );

    const result = await queryGraphQL(VALID_ARGS);

    expect(result.didSucceed()).toBe(true);
    expect(result.hasData()).toBe(false);
    expect(result.getTotal()).toBe(0);
  });

  it('forwards variables in the request body when provided', async () => {
    const variables = { id: '42' };
    mockedAxios.post.mockResolvedValue(
      makeGraphQLResponse('getUser', { code: OP_RESULT_CODES.OK, data: [{}], total: 1, errors: [] }),
    );

    await queryGraphQL({ ...VALID_ARGS, variables });

    expect(mockedAxios.post).toHaveBeenCalledWith(
      VALID_ARGS.url,
      { query: VALID_ARGS.query, variables },
      expect.any(Object),
    );
  });

  it('omits the variables key from the request body when not provided', async () => {
    mockedAxios.post.mockResolvedValue(
      makeGraphQLResponse('getUser', { code: OP_RESULT_CODES.OK, data: [{}], total: 1, errors: [] }),
    );

    await queryGraphQL(VALID_ARGS);

    const body = mockedAxios.post.mock.calls[0][1] as Record<string, unknown>;
    expect('variables' in body).toBe(false);
  });

  it('merges custom headers with the default Content-Type header', async () => {
    const customHeaders = { Authorization: 'Bearer token123' };
    mockedAxios.post.mockResolvedValue(
      makeGraphQLResponse('getUser', { code: OP_RESULT_CODES.OK, data: [{}], total: 1, errors: [] }),
    );

    await queryGraphQL({ ...VALID_ARGS, headers: customHeaders });

    const config = mockedAxios.post.mock.calls[0][2] as { headers: Record<string, string> };
    expect(config.headers).toEqual({
      'Content-Type': 'application/json',
      Authorization: 'Bearer token123',
    });
  });

  it('uses the default 30 s timeout when timeoutMs is not provided', async () => {
    mockedAxios.post.mockResolvedValue(
      makeGraphQLResponse('getUser', { code: OP_RESULT_CODES.OK, data: [{}], total: 1, errors: [] }),
    );

    await queryGraphQL(VALID_ARGS);

    const config = mockedAxios.post.mock.calls[0][2] as { timeout: number };
    expect(config.timeout).toBe(30_000);
  });

  it('uses the caller-supplied timeoutMs when provided', async () => {
    mockedAxios.post.mockResolvedValue(
      makeGraphQLResponse('getUser', { code: OP_RESULT_CODES.OK, data: [{}], total: 1, errors: [] }),
    );

    await queryGraphQL({ ...VALID_ARGS, timeoutMs: 5_000 });

    const config = mockedAxios.post.mock.calls[0][2] as { timeout: number };
    expect(config.timeout).toBe(5_000);
  });
});

// ---------------------------------------------------------------------------
// Malformed / unexpected response shapes
// ---------------------------------------------------------------------------

describe('queryGraphQL — malformed response shapes', () => {
  afterEach(() => jest.clearAllMocks());

  it('fails when the top-level response data is empty', async () => {
    mockedAxios.post.mockResolvedValue({ data: null });

    const result = await queryGraphQL(VALID_ARGS);

    expect(result.didFail()).toBe(true);
    expect(result.code).toBe(OP_RESULT_CODES.VALIDATION_FAILED);
    expect(result.getErrorSummary()).toBe('Response data is empty');
  });

  it('fails when the `data` field is absent from the response', async () => {
    mockedAxios.post.mockResolvedValue({ data: {} });

    const result = await queryGraphQL(VALID_ARGS);

    expect(result.didFail()).toBe(true);
    expect(result.code).toBe(OP_RESULT_CODES.VALIDATION_FAILED);
    expect(result.getErrorSummary()).toBe('GraphQL response is missing the data field');
  });

  it('fails when queryName is not a key in response.data', async () => {
    mockedAxios.post.mockResolvedValue({ data: { data: { someOtherQuery: {} } } });

    const result = await queryGraphQL(VALID_ARGS);

    expect(result.didFail()).toBe(true);
    expect(result.code).toBe(OP_RESULT_CODES.VALIDATION_FAILED);
    expect(result.getErrorSummary()).toBe(`Query "${VALID_ARGS.queryName}" not found in GraphQL response`);
  });
});

// ---------------------------------------------------------------------------
// GraphQL transport-level errors
// ---------------------------------------------------------------------------

describe('queryGraphQL — GraphQL transport-level errors in response body', () => {
  afterEach(() => jest.clearAllMocks());

  it('fails with the first error message when the top-level errors array is present', async () => {
    // These are transport/schema errors from the GraphQL layer itself, not backend OpResult errors
    const graphqlErrors = [
      { message: 'Field not found', locations: [] },
      { message: 'Another error', locations: [] },
    ];
    mockedAxios.post.mockResolvedValue({ data: { errors: graphqlErrors } });

    const result = await queryGraphQL(VALID_ARGS);

    expect(result.didFail()).toBe(true);
    expect(result.code).toBe(OP_RESULT_CODES.VALIDATION_FAILED);
    expect(result.getErrorSummary()).toBe('Field not found');
    expect(result.getData()).toEqual(graphqlErrors);
  });

  it('falls back to a generic message when the first error has no message', async () => {
    mockedAxios.post.mockResolvedValue({ data: { errors: [{}] } });

    const result = await queryGraphQL(VALID_ARGS);

    expect(result.didFail()).toBe(true);
    expect(result.code).toBe(OP_RESULT_CODES.VALIDATION_FAILED);
    expect(result.getErrorSummary()).toBe('GraphQL error');
  });
});

// ---------------------------------------------------------------------------
// HTTP / network errors
// ---------------------------------------------------------------------------

describe('queryGraphQL — HTTP and network errors', () => {
  afterEach(() => jest.clearAllMocks());

  it('returns VALIDATION_FAILED with response data on HTTP 400', async () => {
    const errorData = { message: 'Bad request body' };
    const axiosError = Object.assign(new Error('Request failed with status code 400'), {
      response: { status: 400, data: errorData },
    });
    mockedAxios.post.mockRejectedValue(axiosError);

    const result = await queryGraphQL(VALID_ARGS);

    expect(result.didFail()).toBe(true);
    expect(result.code).toBe(OP_RESULT_CODES.VALIDATION_FAILED);
    expect(result.getDataFirst()).toEqual(errorData);
    expect(result.getErrorSummary()).toBe('Request failed with status code 400');
  });

  it('returns EXCEPTION for non-400 HTTP errors (e.g. 500)', async () => {
    const axiosError = Object.assign(new Error('Internal Server Error'), {
      response: { status: 500, data: {} },
    });
    mockedAxios.post.mockRejectedValue(axiosError);

    const result = await queryGraphQL(VALID_ARGS);

    expect(result.didFail()).toBe(true);
    expect(result.isServerError()).toBe(true);
    expect(result.code).toBe(OP_RESULT_CODES.EXCEPTION);
    expect(result.getErrorSummary()).toBe('Internal Server Error');
  });

  it('returns EXCEPTION for network errors with no response (e.g. timeout)', async () => {
    mockedAxios.post.mockRejectedValue(new Error('Network Error'));

    const result = await queryGraphQL(VALID_ARGS);

    expect(result.didFail()).toBe(true);
    expect(result.code).toBe(OP_RESULT_CODES.EXCEPTION);
    expect(result.getErrorSummary()).toBe('Network Error');
  });

  it('handles a non-Error thrown value safely', async () => {
    mockedAxios.post.mockRejectedValue('something went wrong');

    const result = await queryGraphQL(VALID_ARGS);

    expect(result.didFail()).toBe(true);
    expect(result.code).toBe(OP_RESULT_CODES.EXCEPTION);
    expect(result.getErrorSummary()).toBe('something went wrong');
  });
});
