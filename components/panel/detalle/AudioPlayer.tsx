"use client";

import { useEffect, useRef, useState } from "react";
import { IconoPausa, IconoPlay } from "@/components/iconos";

/**
 * Player del audio del reclamo. Si hay signedUrl reproduce el archivo real con
 * barra de progreso; si no, cae al modo simulado del prototipo (barra animada
 * ~6,3 s). La etiqueta de duración es fija.
 */
export function AudioPlayer({
  signedUrl,
  duracion,
}: {
  signedUrl: string | null;
  duracion: string;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [sonando, setSonando] = useState(false);
  const [pct, setPct] = useState(0);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  function reproducir() {
    if (signedUrl && audioRef.current) {
      void audioRef.current.play();
      setSonando(true);
      return;
    }
    // Modo simulado: 1% cada 63 ms (≈6,3 s), como el prototipo.
    if (pct >= 100) setPct(0);
    setSonando(true);
    intervalRef.current = setInterval(() => {
      setPct((p) => {
        if (p >= 100) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          setSonando(false);
          return 100;
        }
        return p + 1;
      });
    }, 63);
  }

  function pausar() {
    if (signedUrl && audioRef.current) {
      audioRef.current.pause();
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    setSonando(false);
  }

  return (
    <div className="flex items-center" style={{ gap: "12px" }}>
      {signedUrl ? (
        <audio
          ref={audioRef}
          src={signedUrl}
          onTimeUpdate={(e) => {
            const el = e.currentTarget;
            if (el.duration) setPct((el.currentTime / el.duration) * 100);
          }}
          onEnded={() => setSonando(false)}
          className="hidden"
        />
      ) : null}

      <button
        type="button"
        onClick={sonando ? pausar : reproducir}
        aria-label={sonando ? "Pausar audio" : "Reproducir audio"}
        className="flex cursor-pointer items-center justify-center border-none text-white transition-colors duration-200 hover:bg-primario-hover"
        style={{
          width: "36px",
          height: "36px",
          minWidth: "36px",
          borderRadius: "50%",
          background: "var(--primario)",
        }}
      >
        {sonando ? <IconoPausa /> : <IconoPlay />}
      </button>

      <span
        aria-hidden
        className="relative flex-1 overflow-hidden"
        style={{ height: "4px", borderRadius: "2px", background: "#DDE0DB" }}
      >
        <span
          className="absolute left-0 top-0 h-full"
          style={{ width: `${pct}%`, background: "var(--primario)" }}
        />
      </span>

      <span
        className="whitespace-nowrap font-mono text-tinta-2"
        style={{ fontSize: "12px" }}
      >
        {duracion}
      </span>
    </div>
  );
}
