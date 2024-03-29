import { OP_RESULT_CODES } from './opResultCodes';
import { OpResult } from './OpResult';
import { ApiWrapper } from './ApiWrapper';

export const API_DATALIST_FETCH_MODES = {
  STAY: 'STAY',
  FORWARD: 'FORWARD',
  BACK: 'BACK',
};

export class ApiDataList {
  private api: any;
  private mode: string;
  private params: any = null;
  private modelClass: any = null;
  private state: any = null;
  private transform: any = null;

  /**
   * Defaults used when an object of the class gets initialized
   */
  static defaults = {
    mode: API_DATALIST_FETCH_MODES.FORWARD,
    modelClass: null,
    page: 1,
    pageSize: process.env.DATALIST_DEFAULT_PAGESIZE || 50,
    orderBy: {},
    params: {},
    allowedOrderDirections: ['asc', 'desc'],
    transform: null,
  };

  /**
   * Defaults for the object state when it gets initialized or reset
   */
  static defaultState = {
    currentPage: 0,
    pages: {},
    result: new OpResult(),
    loadedCnt: undefined,
    totalCnt: 0,
  };

  constructor(props: any) {
    if (!props) {
      props = {};
    }

    const { baseApiUrl, mode, modelClass, params, transform } = props;

    this.mode = mode || ApiDataList.defaults.mode;
    this.modelClass = modelClass || ApiDataList.defaults.modelClass;
    this.transform = typeof transform === 'function' ? transform : ApiDataList.defaults.transform;

    this.api = baseApiUrl ? new ApiWrapper({ baseApiUrl, resultOptions: { modelClass, transform } }) : null;

    this.params = {
      ...(params || ApiDataList.defaults.params),
      page: +(params || {}).page || ApiDataList.defaults.page,
      pageSize: +(params || {}).pageSize || ApiDataList.defaults.pageSize,
      orderBy: this.processOrderBy((params || {}).orderBy),
    };

    this.setState(props.state);
  }

  /**
   * Create clone of the object. Note this is shallow cloning and all the pages data will not be cloned
   * but rather be wrapped in a new object. This helps to work with redux.
   */
  public clone() {
    const { mode, modelClass, params, transform } = this;
    return new ApiDataList({ baseApiUrl: this.api.baseApiUrl, mode, modelClass, params, transform });
  }

  /**
   * Sets object state, ie page, loaded items, etc.
   * @param {any} state state to set to the object
   */
  private setState(state?: any) {
    if (!state) {
      state = {};
    }

    this.state = {
      currentPage: state.currentPage || ApiDataList.defaultState.currentPage,
      pages: state.pages || { ...ApiDataList.defaultState.pages },
      result: new OpResult(null, { modelClass: this.modelClass }),
      loadedCnt: state.loadedCnt || ApiDataList.defaultState.loadedCnt,
      totalCnt: state.loadedCnt || ApiDataList.defaultState.totalCnt,
      allRead: false,
    };

    return this;
  }

  /**
   * Used to convert orderBy object into a string to be sent to the server API.
   */
  private stringifyOrderBy() {
    const arr: string[] = [];

    Object.keys(this.params.orderBy).forEach((key) => {
      arr.push(`${key}-${this.params.orderBy[key]}`);
    });

    return arr.join('~');
  }

  /**
   * Used to convert stringified orderBy back into a object on the server side.
   */
  public parseOrderBy(orderBy: string) {
    if (!orderBy || typeof orderBy !== 'string') {
      return {};
    }

    const tmp: any = {};

    orderBy.split('~').forEach((token) => {
      const [key, tmpOrder] = token.split('-');
      const orderIdx = ApiDataList.defaults.allowedOrderDirections.indexOf((tmpOrder || '').toLowerCase());
      const order = ApiDataList.defaults.allowedOrderDirections[orderIdx !== -1 ? orderIdx : 0];

      tmp[key] = order;
    });

    return tmp;
  }

  /**
   * Resets state, ie removes all read pages, sets page to 1, etc.
   */
  public resetState() {
    return this.setState();
  }

  /**
   * Sets absolute API URL to the ApiWrapper object.
   * @param baseApiUrl Absolute API URL to use when making API calls.
   */
  public setBaseUrl(baseApiUrl: string) {
    if (this.api) {
      if (baseApiUrl) {
        this.api.setBaseApiUrl(baseApiUrl);
      } else {
        this.api = null;
      }
    } else if (baseApiUrl) {
      const { modelClass, transform } = this;
      this.api = new ApiWrapper({ baseApiUrl, resultOptions: { modelClass, transform } });
    }

    return this.resetState();
  }

  /**
   * Sets modelClass which is used as received list items initialized.
   * It may be needed to conver anonymous objects to required class.
   * @param modelClass
   */
  public setModelClass(modelClass: any) {
    this.modelClass = modelClass;

    return this.resetState();
  }

  /**
   * Sets fetch mode to one of the following:
   * - STAY - do not change page number when calling fetchList
   * - FORWARD - increase page number before making API call to fetch list.
   * - BACK - decrease page number before making API call to fetch list. If page is 1 then return error.
   * @param mode specifies the way how to change page number on each fetch call.
   */
  public setMode(mode: string) {
    this.mode = mode;

    return this;
  }

  /**
   * Sets parameters to send to the server. Parameters is what added after '?' in URL.
   * @param params to be send to the server along with API call.
   * @param {boolean} reset if specified and true then resets inner state
   */
  public setParams(params: any, reset?: boolean) {
    this.params = params;

    return reset === true ? this.resetState() : this;
  }

  /**
   * Appends specified parameters with existing parameters and resets current internal state.
   * @param params to be added or replaced to existing parameters
   * @param {boolean} reset if specified and true then resets inner state
   */
  public appendParams(params: any, reset?: boolean) {
    const newParams = {
      ...params,
      page: +(params || {}).page || this.params.page || ApiDataList.defaults.page,
      pageSize: +(params || {}).pageSize || this.params.pageSize || ApiDataList.defaults.pageSize,
      orderBy: this.processOrderBy((params || this.params).orderBy),
    };

    this.params = {
      ...this.params,
      ...newParams,
    };

    return reset === true ? this.resetState() : this;
  }

  /**
   * Removes parameters by provided list of names.
   * @param {string[]} keys array of params props names to remove.
   * @param {boolean} reset if specified and true then resets inner state
   */
  public removeParams(keys: string[], reset?: boolean) {
    const newParams = Object.keys(this.params || {})
      .filter((key: string) => keys.indexOf(key) === -1)
      .reduce((obj: any, key: string) => {
        obj[key] = this.params[key];

        return obj;
      }, {});

    this.params = {
      ...newParams,
    };

    return reset === true ? this.resetState() : this;
  }

  /**
   * Removes currents parameters and resets current internal state.
   * @param {boolean} reset if specified and true then resets inner state
   */
  public resetParams(reset?: boolean) {
    this.params = null;

    return reset === true ? this.resetState() : this;
  }

  /**
   * Returns current parameters.
   */
  public getParams() {
    return this.params;
  }

  /**
   * Sets pageSize which is number of items to request from the server when making API call.
   * @param {number} pageSize amount of items to request when making API call.
   * @param {boolean} reset if specified and true then resets inner state
   */
  public setPageSize(pageSize: number, reset?: boolean) {
    this.params.pageSize = pageSize;

    return reset === true ? this.resetState() : this;
  }

  /**
   * Processes orderBy property:
   * - If the object is used on the server side to wrap list request params then orderBy should a string.
   * - If the object is used on front-end (ie send requests to API) then orderBy should be an object
   * where its keys are fields to sort and values are order in which to sort (asc, desc).
   */
  private processOrderBy(orderBy: any) {
    const orderByType = typeof orderBy;
    if (orderByType === 'string') {
      // orderBy passed as string so try to parse it into an object
      return this.parseOrderBy(orderBy);
    } else if (orderByType === 'object') {
      // orderBy is an object so use it
      return orderBy;
    } else {
      // orderBy is neither string or object so use class defaults
      return ApiDataList.defaults.orderBy;
    }
  }

  /**
   * Sets new orderBy property.
   * @param {any|string} orderBy object or string to be set to orderBy property.
   * @param {boolean} reset if specified and true then resets inner state
   */
  public setOrderBy(orderBy: any | string, reset?: boolean) {
    this.params.orderBy = this.processOrderBy(orderBy);

    return reset === true ? this.resetState() : this;
  }

  /**
   * Toggles (asc/desc) orderBy property for provided field. If no field provided it toggles all fields in orderBy.
   * @param {string} key name of field (key) to toggle asc <=> desc.
   * @param {boolean?} reset specified if resetting state is needed after toggling.
   */
  public toggleOrderBy(key: string, reset?: boolean) {
    let newOrder = '';
    const { orderBy } = this.params;

    if (!key) {
      Object.keys(orderBy).forEach((item) => this.toggleOrderBy(item, false));

      return reset === true ? this.resetState() : this;
    }

    const order = orderBy[key];

    if (order === 'asc') {
      newOrder = 'desc';
    } else if (order === 'desc') {
      newOrder = 'asc';
    }

    if (newOrder) {
      orderBy[key] = newOrder;
    }

    return reset === true ? this.resetState() : this;
  }

  /**
   * Sets new page number. If page less than zero sets it as zero.
   * @param page speficies page number to set.
   */
  public setPage(page: number) {
    if (page < 0) {
      page = 0;
    }

    this.state.currentPage = page;

    return this;
  }

  /**
   * Increases page number by one.
   */
  public toNextPage() {
    this.setPage(this.state.currentPage + 1);

    return this;
  }

  /**
   * Decreases page number by one.
   */
  public toPrevPage() {
    this.setPage(this.state.currentPage - 1);

    return this;
  }

  /**
   * Returns curent page number.
   */
  public getPage() {
    return this.state.currentPage;
  }

  /**
   * Returns true if it can be expected that fetch operation return data.
   * It is true when:
   * - mode is forward and allRead is not true.
   * - mode is backward and page number is more than one.
   */
  public canFetchMode() {
    return (
      (this.mode === API_DATALIST_FETCH_MODES.FORWARD && !this.state.allRead) ||
      (this.mode === API_DATALIST_FETCH_MODES.BACK && this.state.currentPage > 1)
    );
  }

  /**
   * Make API call to fetch list from the server. Before making actual call it changes page number accordingly.
   * After receiving result it transforms and sets received data to pages object.
   * @param path relative path added to API URL.
   * @returns OpResult result of fetch list operation.
   */
  public async fetchList(path = '') {
    let page = this.state.currentPage;

    switch (this.mode) {
      default:
      case API_DATALIST_FETCH_MODES.STAY:
        break;

      case API_DATALIST_FETCH_MODES.FORWARD:
        if (this.canFetchMode()) {
          page++;
        } else {
          return OpResult.fail(OP_RESULT_CODES.LIMIT_REACHED);
        }
        break;

      case API_DATALIST_FETCH_MODES.BACK:
        if (page > 1) {
          page--;
        } else {
          return OpResult.fail(OP_RESULT_CODES.LIMIT_REACHED);
        }
        break;
    }

    this.startLoading();

    const result = await this.api.get(path, {
      ...this.params,
      page,
      orderBy: this.stringifyOrderBy(),
    });

    if (result.didSucceedAndHasData()) {
      this.setPage(page);
    }

    this.setFetchListResult(result);

    return result;
  }

  /**
   * Transforms and sets data from OpResult to pages object.
   * Also, it sets allRead flag in case if we received less data items than requested.
   * @param result represents OpResult object with received data.
   */
  private setFetchListResult(result: OpResult) {
    this.state.result = result;

    const newItems = result.getData();

    this.state.loadedCnt = newItems.length;
    this.state.totalCnt += this.state.loadedCnt;
    this.state.allRead = this.state.loadedCnt < this.params.pageSize;

    if (this.state.loadedCnt > 0) {
      this.state.pages[this.state.currentPage] = newItems;
    }
  }

  /**
   * Returns pages count requested by this moment.
   */
  public getTotalPages() {
    return Object.keys(this.state.pages).length;
  }

  /**
   * Returns items for specified page or for current page.
   * @param page
   */
  public getPageItems(page = -1) {
    const items = this.state.pages[page];
    return Array.isArray(items) ? items : [];
  }

  /**
   * Returns items for all pages requested by this moment.
   */
  public getItems() {
    const { pages } = this.state;
    const pagesKeys: any[] = Object.keys(pages);

    const items = pagesKeys.reduce((acc: any, pageKey: any) => {
      (pages[pageKey] || []).forEach((item: any) => {
        acc.push(item);
      });

      return acc;
    }, []);

    return items;
  }

  /**
   * Sets loading state to the inner state OpResult object. This may be used to change UI accordingly to let a user know that list is being loaded.
   */
  public startLoading() {
    this.state.result.startLoading();
    return this;
  }

  /**
   * Returns true if the request is still in progress.
   */
  public isLoading() {
    return this.state.result.isLoading();
  }

  /**
   * Returns true if the request succeeded.
   */
  public didSucceed() {
    return this.state.result.didSucceed();
  }

  /**
   * Returns true if the request failed.
   */
  public didFail() {
    return this.state.result.didFail();
  }

  /**
   * Returns request result as OpResult object.
   */
  public getResult() {
    return this.state.result;
  }

  /**
   * Get number of rows to skip. Used for querying database.
   */
  public getSkip() {
    const { page, pageSize } = this.getParams();
    return (page - 1) * pageSize;
  }

  /**
   * Get number of rows to read. Used for querying database.
   */
  public getPageSize() {
    const { pageSize } = this.getParams();
    return pageSize > 0 ? pageSize : 100;
  }

  /**
   * Get order by object
   */
  public getOrderBy() {
    const { orderBy } = this.getParams();
    return orderBy || {};
  }

  public listOrderBy(mapper: any) {
    const { orderBy } = this.getParams();
    return Object.entries(orderBy)
      .map(([key, val]) => (mapper[key] ? { field: mapper[key], order: val } : null))
      .filter((item) => item);
  }
}
