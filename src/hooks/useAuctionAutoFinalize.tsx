"use client";

import { useEffect, useRef } from "react";

const CHECK_INTERVAL = 60 * 1000; 

export function useAuctionAutoFinalize(enabled = true) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isRunningRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;

    const checkAndFinalize = async () => {
      if (isRunningRef.current) return;
      
      isRunningRef.current = true;
      try {
        await fetch("/api/auction/finalize", { method: "POST", credentials: "include" });
      } catch (error) {
        console.error("[useAuctionAutoFinalize] Error:", error);
      } finally {
        isRunningRef.current = false;
      }
    };

    checkAndFinalize();
    intervalRef.current = setInterval(checkAndFinalize, CHECK_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled]);
}
