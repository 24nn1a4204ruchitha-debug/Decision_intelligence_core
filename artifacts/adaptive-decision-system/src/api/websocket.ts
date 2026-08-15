import type { EventPayload } from './types';

export const EVENTS_WEBSOCKET_PATH = '/ws/events';

function configuredWebSocketUrl(): string {
  const rawUrl = (import.meta.env.VITE_WS_URL as string | undefined)?.trim();
  if (rawUrl) {
    try {
      const url = new URL(rawUrl, window.location.href);
      if (!url.pathname.endsWith(EVENTS_WEBSOCKET_PATH)) {
        url.pathname = `${url.pathname.replace(/\/+$/, '')}${EVENTS_WEBSOCKET_PATH}`;
      }
      if (url.protocol === 'http:') url.protocol = 'ws:';
      if (url.protocol === 'https:') url.protocol = 'wss:';
      return url.toString();
    } catch {
      // Fallback
    }
  }

  // Default fallback to FastAPI backend on port 8000
  return `ws://127.0.0.1:8000${EVENTS_WEBSOCKET_PATH}`;
}

export function getEventsWebSocketUrl(): string {
  return configuredWebSocketUrl();
}

export function parseEventPayload(data: unknown): EventPayload | null {
  if (typeof data !== 'string') return null;
  try {
    const parsed = JSON.parse(data);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? parsed as EventPayload
      : null;
  } catch {
    return null;
  }
}