"use client";

import { useEffect, useRef } from "react";

const CHECK_INTERVAL = 60 * 1000; 

/**
 * Calls the server-side finalize API periodically.
 * This replaces direct client-side Firestore mutations with a secure server endpoint.
 */
export function useAuctionAutoFinalize() {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isRunningRef = useRef(false);

  useEffect(() => {
    const checkAndFinalize = async () => {
      if (isRunningRef.current) return;
      
      isRunningRef.current = true;
      try {
        await fetch("/api/auction/finalize", { method: "POST" });
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
  }, []);
}
