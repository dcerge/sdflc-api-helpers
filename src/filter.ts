// import { OpResult } from './opresult';
// import { ApiWrapper } from './apiwrapper';

// export const FETCH_MODES = {
//   START: 'start',
//   NEXT: 'next',
//   PREV: 'prev',
// };

// export class Filter {
//   constructor(props, state, mappers) {
//     if (!props) {
//       props = {};
//     }

//     this.params = {
//       page: props.Page || props.page || 1,
//       pageSize: props.PageSize || keys.pageSize,
//       orderBy: props.orderBy || {},
//       filter: props.filter || null,
//       extra: props.extra,
//       noPagination: props.noPagination != null ? props.noPagination : false,
//     };

//     if (!mappers) {
//       mappers = {};
//     }

//     this.mappers = {
//       onLoaded: typeof mappers.onLoaded === 'function' ? mappers.onLoaded : this.defaultOnLoadMapper,
//     };

//     if (!state) {
//       state = {};
//     }

//     this.state = {
//       items: (state.items || []).map(this.mappers.onLoaded),
//       loadedCnt: state.loadedCnt || 0,
//       loadedPrevCnt: state.loadedPrevCnt || 0,
//       loading: state.loading != null ? state.loading : false,
//       error: state.error || '',
//       mode: state.mode || FETCH_MODES.START,
//     };

//     this.api = new ApiWrapper();
//   }

//   clone() {
//     return new FilterModel(this.params, this.state, this.mappers);
//   }

//   static createItemsOfClass(modelClass) {
//     return new FilterModel(null, null, {
//       onLoaded: (item) => {
//         return modelClass ? new modelClass(item) : item;
//       },
//     });
//   }

//   startLoading(mode) {
//     this.state.mode = mode || this.state.mode;

//     switch (this.state.mode) {
//       default:
//       case FETCH_MODES.START:
//         this.params.page = 1;
//         break;

//       case FETCH_MODES.NEXT:
//         this.params.page++;
//         break;
//       case FETCH_MODES.PREV:
//         this.params.page > 1 && this.page--;
//         break;
//     }

//     this.state.loading = true;

//     return this.clone();
//   }

//   stopLoading() {
//     this.state.loading = false;
//     return this.clone();
//   }

//   newFilter() {
//     return new FilterModel(null, null, { ...this.mappers });
//   }

//   setItems(items) {
//     return new FilterModel({ ...this.params }, { ...this.state, /* loading: false, */ items }, { ...this.mappers });
//   }

//   clearItems() {
//     this.state.items = [];
//     return this.clone();
//   }

//   addItems(items) {
//     return this.setItems([...items, ...this.state.items]);
//   }

//   removeItems(func) {
//     return new FilterModel(
//       {
//         ...this.params,
//       },
//       {
//         ...this.state,
//         loading: false,
//         items: this.state.items.filter((item) => !func(item)),
//       },
//       this.mappers
//     );
//   }

//   updateItems(func, newItem) {
//     return new FilterModel(
//       {
//         ...this.params,
//       },
//       {
//         ...this.state,
//         loading: false,
//         items: this.state.items.map((item) => {
//           if (func(item)) {
//             return this.mappers.onLoaded(newItem);
//           }

//           return item;
//         }),
//       },
//       this.mappers
//     );
//   }

//   getOrderBy() {
//     return this.params.orderBy;
//   }

//   setOrderBy(orderBy) {
//     this.params.orderBy = orderBy;
//     return this;
//   }

//   setPageSize(pageSize) {
//     this.params.pageSize = pageSize;
//     return this;
//   }

//   setNoPagination() {
//     this.params.noPagination = true;
//     return this;
//   }

//   toggleOrderBy(orderBy) {
//     let asc = true;

//     if (this.params.orderBy[orderBy] !== undefined) {
//       asc = !this.params.orderBy[orderBy];
//     } else {
//       asc = true;
//     }

//     this.params.orderBy = {
//       [orderBy]: asc,
//     };

//     return this;
//   }

//   canLoadMore() {
//     return this.state.loadedCnt >= this.params.pageSize;
//   }

//   canLoadPrev() {
//     return this.state.loadedPrevCnt >= this.params.pageSize;
//   }

//   setMode(mode) {
//     this.state.mode = mode;
//     return this;
//   }

//   nextPage() {
//     this.params.page++;
//     return this;
//   }

//   resetPage() {
//     this.params.page = 1;
//     return this;
//   }

//   reset() {
//     return this;
//   }

//   loading() {
//     return this.state.loading;
//   }

//   loadingNext() {
//     return (this.state.mode === FETCH_MODES.NEXT || this.state.mode === FETCH_MODES.START) && this.state.loading;
//   }

//   loadingPrev() {
//     return this.state.mode === FETCH_MODES.PREV && this.state.loading;
//   }

//   isInProgress() {
//     return this.state.loading;
//   }

//   loadingFirstPage() {
//     return this.loadingNext() && this.params.page === 1;
//   }

//   isFirstPage() {
//     return this.params.page === 1;
//   }

//   initialLoading() {
//     return this.params.page === 1;
//   }

//   getItems() {
//     return this.state.items || [];
//   }

//   getItem(obj) {
//     const keys = Object.keys(obj || {});

//     const item = (this.state.items || []).find((item) => {
//       return keys.every((key) => {
//         // eslint-disable-next-line
//         return obj[key] == item[key];
//       });
//     });

//     return item;
//   }

//   getFirstItem() {
//     return this.state.items && this.state.items[0];
//   }

//   getLastItem(defaultProps = null) {
//     return (
//       (this.state.items && this.state.items[this.state.items.length - 1]) ||
//       (defaultProps ? this.mappers.onLoaded(defaultProps) : null)
//     );
//   }

//   getErrorSummary() {
//     return this.state.error;
//   }

//   setExtraParams(params) {
//     return new FilterModel({ ...this.params, extra: params }, { ...this.state, loading: false }, this.mappers);
//   }

//   getExtraParams() {
//     return this.params.extra;
//   }

//   buildExtraParamsString(startWith = '', parmsObj) {
//     const params = parmsObj;
//     let str = '';

//     if (!params) {
//       return str;
//     }

//     Object.keys(params).forEach((key) => {
//       if (params[key] !== undefined) {
//         str = `${str}${!str ? startWith : '&'}${key}=${params[key] || ''}`;
//       }
//     });

//     return str;
//   }

//   buildFilterQuery(filter) {
//     return filter && filter.length > 0 ? JSON.stringify(filter) : '';
//   }

//   buildOrderByQuery(orderBy) {
//     let str = '';

//     Object.keys(orderBy || {}).forEach((key) => {
//       str = `${str}${!str ? '' : ','}${key}-${orderBy[key] ? 'asc' : 'desc'}`;
//     });

//     return str;
//   }

//   buildQueryString(filter) {
//     const query = this.buildExtraParamsString('?', {
//       ..._.omit(this.params, [
//         'extra',
//         'orderBy',
//         'filter',
//         'noPagination',
//         ...(this.params.noPagination ? ['page', 'pageSize'] : []),
//       ]),
//       ...this.params.extra,
//     });

//     let filterQuery = this.buildFilterQuery(filter);

//     if (filterQuery) {
//       filterQuery = `&filter=${filterQuery}`;
//     }

//     const orderByQuery = this.buildOrderByQuery(this.params.orderBy);

//     if (orderByQuery) {
//       filterQuery = `&orderBy=${orderByQuery}`;
//     }

//     return `${query}${filterQuery}`;
//   }

//   defaultOnLoadMapper(item) {
//     return item;
//   }

//   mapItems(items) {
//     const totalItem = [];

//     (items || []).forEach((item) => {
//       const mapped = this.mappers.onLoaded(item);
//       if (mapped instanceof Array) {
//         mapped.forEach((mappedItem) => totalItem.push(mappedItem));
//       } else {
//         totalItem.push(mapped);
//       }
//     });

//     return totalItem; // items.map(this.mappers.onLoaded);
//   }

//   async fetch(url, filter) {
//     try {
//       const result = await this.api.get(`${url}${this.buildQueryString(filter)}`);
//       const data = result.data instanceof Array ? result.data : [result.data];
//       const mappedItems = this.mapItems(data);

//       this.state.error = result.getErrorSummary();

//       if (result.succeeded()) {
//         const dataLength = (result.data || []).length || 0;
//         switch (this.state.mode) {
//           default:
//           case FETCH_MODES.START:
//             this.state.items = [...mappedItems];
//             this.state.loadedCnt = dataLength;
//             this.state.loadedPrevCnt = dataLength;
//             break;
//           case FETCH_MODES.NEXT:
//             this.state.items = [...this.state.items, ...mappedItems];
//             this.state.loadedCnt = dataLength;
//             break;
//           case FETCH_MODES.PREV:
//             this.state.items = [...mappedItems, ...this.state.items];
//             this.state.loadedPrevCnt = dataLength;
//             break;
//         }
//       }

//       return result.setData(this, FilterModel);
//     } catch (exception) {
//       console.log('An exception has occurred when fetching a list of data:', exception);
//       return ResultModel.fromException(exception);
//     }
//   }
// }
