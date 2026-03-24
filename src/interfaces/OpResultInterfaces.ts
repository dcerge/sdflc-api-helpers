export interface OpResultErrorItem {
  name: string;
  errors: string[];
}

export interface OpResultOptions {
  modelClass?: new (data: any) => any;
  transform?: (item: any) => any;
  flatten?: boolean;
}

export type OpResultErrorCategory =
  | 'auth'
  | 'not_found'
  | 'validation'
  | 'conflict'
  | 'limit'
  | 'server'
  | 'network'
  | 'unknown';

export interface OpResultFormErrors<T extends string> {
  fields: Record<T, string | undefined>;
  genericErrors: string[];
}
