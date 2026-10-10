import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useToast } from "@/context/ToastContext";

function beep() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = 880;
    gain.gain.value = 0.08;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    setTimeout(() => {
      osc.stop();
      void ctx.close();
    }, 180);
  } catch {
    /* sound is best-effort */
  }
}

/** Polls recent orders and raises a toast (+ optional sound) when a new one appears. */
export function useNewOrderWatcher(enabled: boolean) {
  const toast = useToast();
  const lastId = useRef<string | null>(null);
  const initialized = useRef(false);

  const { data } = useQuery({
    queryKey: ["orders", "watcher"],
    queryFn: () => api.orders({ page: 1, page_size: 5 }),
    enabled,
    refetchInterval: 15000,
  });

  useEffect(() => {
    if (!data?.items?.length) return;
    const top = data.items[0];
    if (!initialized.current) {
      lastId.current = top.id;
      initialized.current = true;
      return;
    }
    if (top.id !== lastId.current) {
      lastId.current = top.id;
      toast.info("New print request", `${top.order_number} • ${top.original_filename ?? "document"}`);
      if (localStorage.getItem("sx_sound") !== "false") beep();
    }
  }, [data, toast]);
}
