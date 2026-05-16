/** Global constants — pagination, modal sizes, defaults */

export const APP_TITLE = 'gll-金融投资指挥中台';

export const DEFAULT_PAGE_SIZE = 10;
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

export const MODAL_WIDTH = {
  sm: 480,
  md: 640,
  lg: 800,
} as const;

export const REQUEST_TIMEOUT = 30000;
export const REQUEST_RETRY_COUNT = 2;
export const DEBOUNCE_MS = 300;
export const THROTTLE_MS = 800;

export const TOKEN_KEY = 'gll_fin_token';
export const USER_KEY = 'gll_fin_user';
export const REMEMBER_KEY = 'gll_fin_remember';
export const QUERY_CACHE_PREFIX = 'gll_fin_query_';

export const MOCK_DELAY_MS = 400;
