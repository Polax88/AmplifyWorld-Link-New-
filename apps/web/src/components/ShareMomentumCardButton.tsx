'use client';

import { useState } from 'react';
import { Share2 } from 'lucide-react';
import { IconButton } from '@amplifyworld/ui';

export interface ShareMomentumCardButtonProps {
  title: string;
  handle: string;
  score: number;
  percentileLabel?: string | null;
  history: number[];
}

const CARD_WIDTH = 1080;
const CARD_HEIGHT = 1920;
const ACCENT = '#ff4081';
const CANVAS_BG = '#08070c';

/**
 * Generates a 9:16 "Instagram Story" shareable graphic client-side — same
 * canvas-to-PNG-download pattern as `packages/ui/src/components/QrCode.tsx`,
 * just with a one-off offscreen canvas instead of a persistent ref, since
 * this draws once per click rather than staying mounted.
 */
export function ShareMomentumCardButton({ title, handle, score, percentileLabel, history }: ShareMomentumCardButtonProps) {
  const [generating, setGenerating] = useState(false);

  function handleShare() {
    setGenerating(true);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = CARD_WIDTH;
      canvas.height = CARD_HEIGHT;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.fillStyle = CANVAS_BG;
      ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

      ctx.fillStyle = 'rgba(255, 64, 129, 0.85)';
      ctx.font = '600 44px sans-serif';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText('AmplifyWorld', 80, 160);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.font = '600 56px sans-serif';
      ctx.fillText(title, 80, 320);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.font = '400 34px sans-serif';
      ctx.fillText(`amplify.world/${handle}`, 80, 372);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.font = '600 32px sans-serif';
      ctx.fillText('ARTIST MOMENTUM INDEX', 80, 540);
      ctx.fillStyle = '#ffffff';
      ctx.font = '700 260px sans-serif';
      ctx.fillText(String(Math.round(score)), 80, 800);

      if (percentileLabel) {
        ctx.fillStyle = 'rgba(255, 64, 129, 0.95)';
        ctx.font = '600 40px sans-serif';
        ctx.fillText(percentileLabel, 80, 880);
      }

      if (history.length > 1) {
        const plotX = 80;
        const plotY = 1080;
        const plotWidth = CARD_WIDTH - plotX * 2;
        const plotHeight = 420;
        const min = Math.min(...history);
        const max = Math.max(...history);
        const range = max - min || 1;
        const stepX = plotWidth / (history.length - 1);

        ctx.beginPath();
        history.forEach((value, index) => {
          const x = plotX + index * stepX;
          const y = plotY + plotHeight - ((value - min) / range) * plotHeight;
          if (index === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.strokeStyle = ACCENT;
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();

        const lastValue = history[history.length - 1] ?? min;
        const lastX = plotX + (history.length - 1) * stepX;
        const lastY = plotY + plotHeight - ((lastValue - min) / range) * plotHeight;
        ctx.beginPath();
        ctx.arc(lastX, lastY, 12, 0, Math.PI * 2);
        ctx.fillStyle = ACCENT;
        ctx.fill();

        ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.font = '400 30px sans-serif';
        ctx.fillText('30-day trend', plotX, plotY + plotHeight + 60);
      }

      const link = document.createElement('a');
      link.download = `${handle}-momentum-card.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } finally {
      setGenerating(false);
    }
  }

  return (
    <IconButton aria-label="Share momentum card" variant="secondary" onClick={handleShare} disabled={generating}>
      <Share2 className="size-3.5" />
    </IconButton>
  );
}
