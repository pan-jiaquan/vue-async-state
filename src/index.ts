import { reactive, watch } from '@vue/composition-api';
import {
  MaybePromise,
  AsyncStateReactiveResult,
  SetLoading,
  SetResult,
  SetError,
  AsyncOptions,
  UseAsync,
  UseAsyncSelf,
  UseAsyncAbortable,
} from './basic';

const defaultSetLoading: SetLoading<any> = state => {
  Object.assign(state, {
    status: 'loading',
    loading: true,
    error: null,
    result: null,
  });
};

const defaultSetResult: SetResult<any> = (result, state) => {
  Object.assign(state, {
    status: 'success',
    loading: false,
    result,
    error: null,
  });
};

const defaultSetError: SetError<any> = (error, state) => {
  Object.assign(state, {
    status: 'error',
    loading: false,
    result: null,
    error,
  });
};

const defaultOptions: AsyncOptions<any> = {
  initialState: () => ({
    status: 'not-requested',
    loading: false,
    result: null,
    error: null,
  }),
  setLoading: defaultSetLoading,
  setResult: defaultSetResult,
  setError: defaultSetError,
};

const normalizeOptions = <R>(
  options: Partial<AsyncOptions<R>>
): AsyncOptions<R> => ({
  ...defaultOptions,
  ...options,
});

const useAsyncState = <R>(
  options: Partial<AsyncOptions<R>>
): AsyncStateReactiveResult<R> => {
  const normalizedOptions = normalizeOptions<R>(options);
  const { status, loading, result, error } = normalizedOptions.initialState();
  const state = reactive({
    status,
    loading,
    result,
    error,
    setLoading: () => {
      normalizedOptions.setLoading(state);
    },
    setResult: (result: R) => {
      normalizedOptions.setResult(result, state);
    },
    setError: (error: Error) => {
      normalizedOptions.setError(error, state);
    },
  });
  return state;
};

const noop = () => {};

export const useAsync: UseAsync = <R>(
  source: any,
  cb: any,
  options?: any
): AsyncStateReactiveResult<R> => {
  const asyncState = useAsyncState<R>(options);
  let currentPromise: Promise<R> | null = null;
  const func = (newVal: any, oldVal: any, onCleanup: any): Promise<R> => {
    let cleanup = noop;
    onCleanup(() => {
      currentPromise = null;
      cleanup();
    });
    const onCleanupWrap = (invalidate: () => void) => {
      cleanup = invalidate;
    };
    const promise: MaybePromise<R> = cb(newVal, oldVal, onCleanupWrap);
    if (promise instanceof Promise) {
      currentPromise = promise;
      asyncState.setLoading();
      promise.then(
        result => {
          if (currentPromise === promise) {
            asyncState.setResult(result);
          }
        },
        error => {
          if (currentPromise === promise) {
            asyncState.setError(error);
          }
        }
      );
      return promise;
    } else {
      // We allow passing a non-async function (mostly for useAsyncCallback conveniency)
      const syncResult: R = promise;
      asyncState.setResult(syncResult);
      return Promise.resolve<R>(syncResult);
    }
  };
  watch(source, func, options);
  return asyncState;
};

export const useAsyncSelf: UseAsyncSelf = <R>(
  source: any,
  cb: any,
  options?: any
): AsyncStateReactiveResult<R> => {
  const func = Array.isArray(source)
    ? (newVal: any[]) => cb(...newVal)
    : (newVal: any) => cb(newVal);
  return useAsync(source, func, options);
};

export const useAsyncAbortable: UseAsyncAbortable = <R>(
  source: any,
  cb: any,
  options?: any
): AsyncStateReactiveResult<R> => {
  let abortController: AbortController | null = null;
  const isTuple = Array.isArray(source);
  const func = async (newVal: any, oldVal: any, onCleanup: any) => {
    onCleanup(() => {
      if (abortController) {
        abortController.abort();
      }
    });
    const controller = new AbortController();
    abortController = controller;
    try {
      return await (isTuple
        ? cb(controller.signal, ...newVal)
        : cb(controller.signal, newVal));
    } finally {
      if (abortController === controller) {
        abortController = null;
      }
    }
  };
  return useAsync(source, func, options);
};
