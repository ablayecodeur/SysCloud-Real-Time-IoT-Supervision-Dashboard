'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import type { WsMessage } from '@/types';

interface UseWebSocketOptions {
  deviceId?: string;
  onMessage: (msg: WsMessage) => void;
}

export function useWebSocket({ deviceId, onMessage }: UseWebSocketOptions) {
  const wsRef      = useRef<WebSocket | null>(null);
  const onMsgRef   = useRef(onMessage);
  const [connected, setConnected] = useState(false);

  onMsgRef.current = onMessage;

  const connect = useCallback(() => {
    const base = (process.env.NEXT_PUBLIC_WS_URL ?? 'ws://localhost:4000')
      .replace(/^http/, 'ws');
    const ws = new WebSocket(`${base}/api/v1/stream`);

    ws.onopen = () => {
      setConnected(true);
      if (deviceId) {
        ws.send(JSON.stringify({ deviceId }));
      }
    };

    ws.onmessage = (event) => {
      try {
        const msg: WsMessage = JSON.parse(event.data as string);
        onMsgRef.current(msg);
      } catch {
        // ignore malformed frames
      }
    };

    ws.onerror  = () => ws.close();
    ws.onclose  = () => {
      setConnected(false);
      // exponential back-off capped at 10 s
      setTimeout(connect, Math.min(1000 * 2 ** (wsRef.current ? 0 : 3), 10_000));
    };

    wsRef.current = ws;
  }, [deviceId]);

  useEffect(() => {
    connect();
    return () => {
      wsRef.current?.close();
    };
  }, [connect]);

  return { connected };
}
