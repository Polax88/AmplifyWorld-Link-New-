'use client';

import { useEffect, useRef, useState } from 'react';
import QRCodeLib from 'qrcode';
import { Download } from 'lucide-react';
import { cn } from '../lib/cn';

export interface QrCodeProps {
  value: string;
  size?: number;
  className?: string;
  /** Shows a small "Download" button beneath the code that saves it as a PNG. */
  downloadable?: boolean;
  downloadFileName?: string;
}

export function QrCode({
  value,
  size = 160,
  className,
  downloadable = false,
  downloadFileName = 'qr-code.png',
}: QrCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!canvasRef.current) return;
    setReady(false);
    QRCodeLib.toCanvas(canvasRef.current, value, {
      width: size,
      margin: 1,
      color: { dark: '#0a0a0a', light: '#ffffff' },
    })
      .then(() => setReady(true))
      .catch(() => setReady(false));
  }, [value, size]);

  function handleDownload() {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = downloadFileName;
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  }

  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      <canvas ref={canvasRef} width={size} height={size} className="rounded-xl bg-white p-2" />
      {downloadable ? (
        <button
          type="button"
          onClick={handleDownload}
          disabled={!ready}
          className="flex items-center gap-1.5 text-xs text-white/50 transition-colors hover:text-white disabled:opacity-40"
        >
          <Download className="size-3.5" />
          Download
        </button>
      ) : null}
    </div>
  );
}
