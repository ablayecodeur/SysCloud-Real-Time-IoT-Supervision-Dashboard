'use client';

import { useEffect, useState } from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { useWebSocket } from '@/hooks/useWebSocket';

export function Header() {
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);

  const { connected } = useWebSocket({
    onMessage: () => setLastUpdate(new Date().toLocaleTimeString()),
  });

  return (
    <header className="flex items-center justify-between px-6 py-3 bg-slate-800 border-b border-slate-700 shrink-0">
      <h1 className="text-sm font-medium text-slate-300">
        IoT Supervision Dashboard
      </h1>

      <div className="flex items-center gap-4 text-xs text-slate-400">
        {lastUpdate && <span>Last update: {lastUpdate}</span>}

        <div className="flex items-center gap-1.5">
          {connected ? (
            <>
              <Wifi className="w-3.5 h-3.5 text-green-400" />
              <span className="text-green-400">Live</span>
            </>
          ) : (
            <>
              <WifiOff className="w-3.5 h-3.5 text-red-400" />
              <span className="text-red-400">Reconnecting…</span>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
