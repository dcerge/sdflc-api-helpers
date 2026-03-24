import axios from 'axios';
import { OP_RESULT_CODES } from './opResultCodes';
import { OpResult } from './OpResult';
import { QueryGraphQLArgs } from './interfaces/QueryGraphQLArgs';

const DEFAULT_TIMEOUT_MS = 30000;

const queryGraphQL = async (args: QueryGraphQLArgs) => {
  const { url, queryName, query, variables, headers, timeoutMs } = args || {};

  if (!url) {
    return OpResult.fail(OP_RESULT_CODES.VALIDATION_FAILED, null, 'URL is required');
  }

  if (!queryName) {
    return OpResult.fail(OP_RESULT_CODES.VALIDATION_FAILED, null, 'Query name is required');
  }

  if (!query) {
    return OpResult.fail(OP_RESULT_CODES.VALIDATION_FAILED, null, 'Query is required');
  }

  try {
    const response = await axios.post(
      url,
      {
        query,
        // Omit variables key entirely if not provided, rather than sending undefined
        ...(variables !== undefined && { variables }),
      },
      {
        headers: {
          'Content-Type': 'application/json',
          ...(headers ?? {}),
        },
        timeout: timeoutMs ?? DEFAULT_TIMEOUT_MS,
      },
    );

    const responseData = response.data;

    if (!responseData) {
      return OpResult.fail(OP_RESULT_CODES.VALIDATION_FAILED, null, 'Response data is empty');
    }

    // Check for GraphQL errors first — these come back as HTTP 200 with an errors array
    if (responseData.errors?.length) {
      return OpResult.fail(
        OP_RESULT_CODES.VALIDATION_FAILED,
        responseData.errors,
        responseData.errors[0]?.message ?? 'GraphQL error',
      );
    }

    // Distinguish between a missing `data` key and an explicit `data: null`
    if (!('data' in responseData)) {
      return OpResult.fail(OP_RESULT_CODES.VALIDATION_FAILED, null, 'GraphQL response is missing the data field');
    }

    // A valid query that returns null is acceptable — only fail if the key is absent
    if (!(queryName in responseData.data)) {
      return OpResult.fail(
        OP_RESULT_CODES.VALIDATION_FAILED,
        null,
        `Query "${queryName}" not found in GraphQL response`,
      );
    }

    // The backend returns an OpResult-shaped object: { data, total, errors }
    const queryResult = responseData.data[queryName];

    return new OpResult({
      code: queryResult?.code,
      data: queryResult?.data,
      total: queryResult?.total,
      errors: queryResult?.errors,
    });
  } catch (ex: unknown) {
    const err = ex instanceof Error ? ex : new Error(String(ex));
    const axiosResponse = (ex as { response?: { status?: number; data?: unknown } })?.response;

    if (axiosResponse?.status === 400) {
      return OpResult.fail(OP_RESULT_CODES.VALIDATION_FAILED, axiosResponse.data, err.message);
    }

    return OpResult.fail(OP_RESULT_CODES.EXCEPTION, ex, err.message);
  }
};

export { queryGraphQL };
