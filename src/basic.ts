import { Ref } from '@vue/composition-api';
import { UnwrapRef } from '@vue/composition-api/dist/reactivity/ref';

type CleanupRegistrator = (invalidate: () => void) => void;

export type MaybePromise<T> = Promise<T> | T;

type WatcherSource<T> = Ref<T> | (() => T);

type MapSources<T> = T extends never[]
  ? never[]
  : T extends any[]
  ? { [K in keyof T]: T[K] extends WatcherSource<infer V> ? V : never }
  : T;

type WatcherCallBack<T, R> = (
  newVal: T,
  oldVal: T,
  onCleanup: CleanupRegistrator
) => MaybePromise<R>;

type FlushMode = 'pre' | 'post' | 'sync';
interface WatcherOption {
  lazy: boolean;
  deep: boolean;
  flush: FlushMode;
}

type AsyncStateStatus = 'not-requested' | 'loading' | 'success' | 'error';

interface AsyncState<R> {
  status: AsyncStateStatus;
  loading: boolean;
  error: Error | null;
  result: R | null;
}

export interface AsyncStateResult<R> extends AsyncState<R> {
  setLoading: () => void;
  setResult: (r: R) => void;
  setError: (e: Error) => void;
}

export type AsyncStateReactiveResult<R> = UnwrapRef<AsyncStateResult<R>>;

export type SetLoading<R> = (asyncState: AsyncStateReactiveResult<R>) => void;
export type SetResult<R> = (
  result: R,
  asyncState: AsyncStateReactiveResult<R>
) => void;
export type SetError<R> = (
  error: Error,
  asyncState: AsyncStateReactiveResult<R>
) => void;

export interface AsyncOptions<R> {
  initialState: () => AsyncState<R>;
  setLoading: SetLoading<R>;
  setResult: SetResult<R>;
  setError: SetError<R>;
}
type UseAsyncOptions<R> = Partial<WatcherOption> & Partial<AsyncOptions<R>>;

type Sources = never[] | [WatcherSource<any>] | Array<WatcherSource<any>>;

export interface UseAsync {
  // tuple
  <T extends Sources, R = unknown>(
    sources: T,
    cb: WatcherCallBack<MapSources<T>, R>,
    options?: UseAsyncOptions<R>
  ): AsyncStateReactiveResult<R>;
  // simple
  <T = unknown, R = unknown>(
    source: WatcherSource<T>,
    cb: WatcherCallBack<MapSources<T>, R>,
    options?: UseAsyncOptions<R>
  ): AsyncStateReactiveResult<R>;
}

export interface UseAsyncSelf {
  // tuple
  <T extends Sources, R = unknown>(
    sources: T,
    cb: (...newVal: MapSources<T>) => MaybePromise<R>,
    options?: UseAsyncOptions<R>
  ): AsyncStateReactiveResult<R>;
  // simple
  <T = unknown, R = unknown>(
    source: WatcherSource<T>,
    cb: (newVal: MapSources<T>) => MaybePromise<R>,
    options?: UseAsyncOptions<R>
  ): AsyncStateReactiveResult<R>;
}

export interface UseAsyncAbortable {
  // tuple
  <T extends Sources, R = unknown>(
    sources: T,
    cb: (signal: AbortSignal, ...newVal: MapSources<T>) => MaybePromise<R>,
    options?: UseAsyncOptions<R>
  ): AsyncStateReactiveResult<R>;
  // simple
  <T = unknown, R = unknown>(
    source: WatcherSource<T>,
    cb: (signal: AbortSignal, newVal: MapSources<T>) => MaybePromise<R>,
    options?: UseAsyncOptions<R>
  ): AsyncStateReactiveResult<R>;
}
