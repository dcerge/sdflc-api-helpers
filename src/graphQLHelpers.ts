import { OP_RESULT_CODES } from './opresult-codes';
import { OpResult } from './opresult';
import axios from 'axios';

import { QueryGraphQLArgs } from './interfaces/QueryGraphQLArgs';

const queryGraphQL = async (args: QueryGraphQLArgs) => {
  const { url, queryName, query, variables, headers } = args || {};

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
        variables,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          ...(headers || {}),
        },
      },
    );

    return new OpResult(response.data.data[queryName]);
  } catch (ex: any) {
    if (ex.response?.status === 400) {
      return OpResult.fail(OP_RESULT_CODES.EXCEPTION, ex.response.data, ex.message);
    } else {
      return OpResult.fail(OP_RESULT_CODES.EXCEPTION, ex, ex.message);
    }
  }
};

export { queryGraphQL };
