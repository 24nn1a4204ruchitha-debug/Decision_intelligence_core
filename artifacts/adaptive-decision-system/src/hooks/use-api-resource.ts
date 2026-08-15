import { useCallback, useEffect, useState } from 'react';
import { ApiError } from '@/api/client';

export type ApiResourceStatus = 'loading' | 'ready' | 'error';

export type ApiResourceState<T> = {
  data: T | undefined;
  status: ApiResourceStatus;
  error: string | undefined;
  retry: () => void;
};

function messageFromError(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return 'The API request could not be completed.';
}

export function useApiResource<T>(
  key: string,
  loader: (signal: AbortSignal) => Promise<T>,
): ApiResourceState<T> {
  const [state, setState] = useState<Omit<ApiResourceState<T>, 'retry'>>({
    data: undefined,
    status: 'loading',
    error: undefined,
  });
  const [retryToken, setRetryToken] = useState(0);
  const retry = useCallback(() => setRetryToken((token) => token + 1), []);

  useEffect(() => {
    const controller = new AbortController();
    setState({ data: undefined, status: 'loading', error: undefined });
    loader(controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setState({ data, status: 'ready', error: undefined });
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) setState({ data: undefined, status: 'error', error: messageFromError(error) });
      });
    return () => controller.abort();
  }, [key, loader, retryToken]);

  return { ...state, retry };
}

export type ApiMutationState<T> = {
  data: T | undefined;
  status: 'idle' | 'loading' | 'success' | 'error';
  error: string | undefined;
  execute: (input: never) => Promise<T | undefined>;
  reset: () => void;
};

export function useApiMutation<TInput, TOutput>(
  mutation: (input: TInput, signal: AbortSignal) => Promise<TOutput>,
): {
  data: TOutput | undefined;
  status: 'idle' | 'loading' | 'success' | 'error';
  error: string | undefined;
  execute: (input: TInput) => Promise<TOutput | undefined>;
  reset: () => void;
} {
  const [state, setState] = useState<{
    data: TOutput | undefined;
    status: 'idle' | 'loading' | 'success' | 'error';
    error: string | undefined;
  }>({ data: undefined, status: 'idle', error: undefined });

  const execute = useCallback(async (input: TInput): Promise<TOutput | undefined> => {
    const controller = new AbortController();
    setState({ data: undefined, status: 'loading', error: undefined });
    try {
      const data = await mutation(input, controller.signal);
      setState({ data, status: 'success', error: undefined });
      return data;
    } catch (error: unknown) {
      setState({ data: undefined, status: 'error', error: messageFromError(error) });
      return undefined;
    }
  }, [mutation]);

  const reset = useCallback(() => setState({ data: undefined, status: 'idle', error: undefined }), []);
  return { ...state, execute, reset };
}