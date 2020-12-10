import axios from 'axios';

import { OP_RESULT_CODES } from './opresult-codes';
import { HTTP_STATUSES } from './http-codes';
import { OpResult } from './opresult';

export class ApiWrapper {
  /**
   * Absolute path to API server. For example: 'https://myapi.com/v1/'. Note that ending '/' is required.
   */
  baseApiUrl: string = '';

  /**
   * This is the function that will be called in case there was an exception on sending request.
   * An object with the following information will be passed to the function:
   * {string} method
   * {string} url
   * {string} params
   * data
   */
  onException: any = null;

  /**
   * This is default props used when making a request.
   * You can override it globally if needed
   */
  static fetchFnOpts: any = {
    withCredentials: true, // whether or not cross-site Access-Control requests
                           // should be made using credentials
    timeout: 0,            // Timeout to wait for a response in ms
  };

  /**
   * The function is wrapper around axois.request function to send requests.
   * You can override it with your own function.
   * @param {object} props contain information required to send a request: method, url, data, params
   * 
   */
  static fetcnFn: any = (props: any) => {
    const { method, url, data, params } = props;

    console.log('fetchFn:', props);

    return axios.request({
      method,
      url, 
      data,
      params,
      ...ApiWrapper.fetchFnOpts,
    });
  };

  /**
   * The function is called on exception when doing a request and shows exceotion details in console.
   * You can override the function either passing it to constructor as `{ onEception }` or setup globally:
   * ApiWrapper.onExceptionFn = (details) => { ... your implementation }
   * @param {object} details an object with request details
   */
  static onExceptionFn: any = (details?: any) => {
    console.log(ApiWrapper.messages.exception, details);
  };

  /**
   * An object with error phrases to be used when returns OpResult object in case server returned an error.
   */
  static messages = {
    networkError: 'There was either failure on the server or with network. Please try again. If the issue persists please contact support.',
    validationFailed: 'Some of required fields missed.',
    notFound: 'API entry point was not found. Please contact support.',
    serverError: 'The server responded with an error',
    exception: 'An exception has occured when making a request: '
  }

  constructor(props?: any) {
    const { baseApiUrl, onException } = props || {};
    this.baseApiUrl = `${baseApiUrl || '/'}`;
    this.onException = onException || ApiWrapper.onExceptionFn;
  }

  /**
   * This function is called upon receiving response from server (after calling `axios.request`) or on an exception. 
   * By checking response code it adds error messages. The main purpose is to add some message in case 
   * there was no correct response from the server. This is private function and should not be called manually.
   * @param {object} response is an object returned by `ApiWrapper.fetcnFn`
   * @param {object} result is an instance of OpResult object where the function adds error descriptions if any.
   * @return {object} returns the result param with added error description.
   */
  private postResult(response: any, result: OpResult) {
    if (!response) {
      result.setCode(OP_RESULT_CODES.NETWORK_ERROR).addError('', ApiWrapper.messages.networkError);
    } else if (response.status === HTTP_STATUSES.HS_400_BAD_REQUEST) {
      result.setCode(OP_RESULT_CODES.NETWORK_ERROR).addError('', ApiWrapper.messages.validationFailed);
    } else if (response.status === HTTP_STATUSES.HS_404_NOT_FOUND) {
      result.setCode(OP_RESULT_CODES.NETWORK_ERROR).addError('', ApiWrapper.messages.notFound);
    } else if (response.status >= HTTP_STATUSES.HS_300_MULTIPLE_CHOICE) {
      result.setCode(OP_RESULT_CODES.NETWORK_ERROR).addError('', ApiWrapper.messages.serverError);
    }

    return result;
  }

  /**
   * Combines base API URL with relative path.
   * For example, if base API URL (baseApiUrl) is 'http://myapi.com/v1/' and path 'projects' 
   * then the result will be 'http://myapi.com/v1/projects'.
   * @param {string} path path to add to base API url when making a request
   */
  private buildPath(path: string) {
    return `${this.baseApiUrl}${path}`;
  }

  /**
   * Does a request using `ApiWrapper.fetcnFn` and wraps received result into OpResult object.
   * This functions does not throw any exceptions. To check if request failed use OpResult's method `isFailed()`.
   * @param {object} props information needed to make a request: method, url, data, params.
   */
  private async doRequest(props: any) {
    const { method, path, data, params } = props;
    const url = this.buildPath(path);

    try {
      let response;

      response = await ApiWrapper.fetcnFn({
        method,
        url, 
        data,
        params,
        ...ApiWrapper.fetchFnOpts,
      });

      const result = new OpResult(response.data);

      return this.postResult(response, result);
    } catch (exception) {
      this.onException({ method, url, params, data, exception });
      return this.postResult(null, new OpResult((exception || {}).data));
    }
  }

  async get(path: string, params: any) {
    return this.doRequest({ method: 'get', path, params });
  }

  async post(path: string, data?: any, params: any = {}) {
    return this.doRequest({ method: 'post', path, data, params });
  }

  async put(path: string, data?: any, params: any = {}) {
    return this.doRequest({ method: 'put', path, data, params });
  }

  async delete(path: string, data: any = {}, params: any = {}) {
    return this.doRequest({ method: 'delete', path, data, params });
  }
}
