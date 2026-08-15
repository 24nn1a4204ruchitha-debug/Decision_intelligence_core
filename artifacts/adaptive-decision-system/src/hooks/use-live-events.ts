import { useCallback, useEffect, useRef, useState } from 'react';
import { getEventsWebSocketUrl, parseEventPayload } from '@/api/websocket';

export type LiveEvent = {
  id?: string;
  type?: string;
  message?: string;
  timestamp?: string;
  severity?: string;
  metadata?: Record<string, unknown>;
};

export type LiveConnectionState = 'connecting' | 'connected' | 'unavailable';

type LiveEventsState = {
  events: LiveEvent[];
  connection: LiveConnectionState;
  detail: string;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null ? value as Record<string, unknown> : null;
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined;
}

function normalizeEvent(value: unknown): LiveEvent | null {
  const record = asRecord(value);
  if (!record) return null;

  const metadata = asRecord(record.metadata) ?? asRecord(record.data) ?? undefined;
  return {
    id: asString(record.id) ?? asString(record.event_id),
    type: asString(record.type) ?? asString(record.event_type) ?? asString(record.name),
    message: asString(record.message) ?? asString(record.description) ?? asString(record.title),
    timestamp: asString(record.timestamp) ?? asString(record.created_at) ?? asString(record.occurred_at),
    severity: asString(record.severity),
    metadata,
  };
}

export function useLiveEvents() {
  const [state, setState] = useState<LiveEventsState>({
    events: [],
    connection: 'connecting',
    detail: 'Checking real-time configuration',
  });
  const socketRef = useRef<WebSocket | null>(null);
  const retryTimerRef = useRef<number | undefined>(undefined);
  const mountedRef = useRef(true);

  const connect = useCallback(() => {
    const websocketUrl = getEventsWebSocketUrl();
    if (!websocketUrl) {
      setState((current) => ({
        ...current,
        connection: 'unavailable',
        detail: 'VITE_WS_URL is not configured',
      }));
      return;
    }

    setState((current) => ({ ...current, connection: 'connecting', detail: 'Connecting to real-time events' }));
    const socket = new WebSocket(websocketUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      if (!mountedRef.current) return;
      setState((current) => ({ ...current, connection: 'connected', detail: 'Real-time event stream connected' }));
    };

    socket.onmessage = (message) => {
      if (!mountedRef.current) return;
      const event = normalizeEvent(parseEventPayload(message.data));
      if (event) {
        setState((current) => ({ ...current, events: [event, ...current.events].slice(0, 100) }));
      } else {
        setState((current) => ({ ...current, detail: 'Received an unreadable real-time event' }));
      }
    };

    socket.onerror = () => {
      if (!mountedRef.current) return;
      setState((current) => ({ ...current, connection: 'unavailable', detail: 'Real-time connection unavailable' }));
    };

    socket.onclose = () => {
      if (!mountedRef.current) return;
      setState((current) => ({ ...current, connection: 'unavailable', detail: 'Real-time connection unavailable' }));
      retryTimerRef.current = window.setTimeout(connect, 5000);
    };
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    connect();
    return () => {
      mountedRef.current = false;
      if (retryTimerRef.current) window.clearTimeout(retryTimerRef.current);
      socketRef.current?.close();
      socketRef.current = null;
    };
  }, [connect]);

  const retry = useCallback(() => {
    if (retryTimerRef.current) window.clearTimeout(retryTimerRef.current);
    socketRef.current?.close();
    connect();
  }, [connect]);

  return { ...state, retry };
}