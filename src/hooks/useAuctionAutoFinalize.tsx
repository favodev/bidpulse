"use client";

import { useEffect, useRef } from "react";
import { finalizeExpiredAuctions, activateScheduledAuctions } from "@/services/auction.service";

const CHECK_INTERVAL = 60 * 1000; 

export function useAuctionAutoFinalize() {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isRunningRef = useRef(false);

  useEffect(() => {
    const checkAndFinalize = async () => {
      // Evitar ejecuciones simultáneas
      if (isRunningRef.current) return;
      
      isRunningRef.current = true;
      try {
        await activateScheduledAuctions();
        await finalizeExpiredAuctions();
      } catch (error) {
        console.error("[useAuctionAutoFinalize] Error:", error);
      } finally {
        isRunningRef.current = false;
      }
    };

    // Ejecutar inmediatamente al montar
    checkAndFinalize();

    // Configurar intervalo
    intervalRef.current = setInterval(checkAndFinalize, CHECK_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);
}
