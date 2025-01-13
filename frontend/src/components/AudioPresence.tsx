import { hslToHex } from '@/lib/utils';
import { useEffect, useMemo, useRef } from 'react';

import { WavRenderer, useAudio } from '@chainlit/react-client';

import { useTheme } from '@/components/ThemeProvider';

interface Props {
  type: 'client' | 'server';
  height: number;
  width: number;
  barCount: number;
  barSpacing: number;
}

export default function AudioPresence({
  type,
  height,
  width,
  barCount,
  barSpacing
}: Props) {
  const { variant } = useTheme();
  const { wavRecorder, wavStreamPlayer, isAiSpeaking } = useAudio();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const foregroundColor = useMemo(() => {
    const root = document.documentElement;
    const styles = getComputedStyle(root);
    return hslToHex(styles.getPropertyValue('--foreground'));
  }, [variant]);

  width = type === 'server' && !isAiSpeaking ? height : width;

  useEffect(() => {
    let isLoaded = true;
    const dpr = window.devicePixelRatio || 1;
    let bounceDirection = 1;
    let bounceFactor = 0;

    const getData = () => {
      if (type === 'server' && isAiSpeaking) {
        return wavStreamPlayer.analyser
          ? wavStreamPlayer.getFrequencies('voice')
          : { values: new Float32Array([0]) };
      } else {
        return wavRecorder.recording
          ? wavRecorder.getFrequencies('voice')
          : { values: new Float32Array([0]) };
      }
    };

    const render = () => {
      if (!isLoaded) return;
      const canvas = canvasRef.current;
      let ctx: CanvasRenderingContext2D | null = null;

      if (canvas) {
        // Set the canvas size based on the DPR
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;

        ctx = ctx || canvas.getContext('2d');
        if (ctx) {
          // Scale the context to account for the DPR
          ctx.scale(dpr, dpr);

          ctx.clearRect(0, 0, width, height); // Use CSS dimensions here
          const result = getData();

          if (type === 'server' && !isAiSpeaking) {
            // Draw a bouncing circle
            const amplitude = Math.min(
              Math.max(0.6, Math.max(...result.values)),
              1
            ); // Ensure a minimum amplitude
            const maxRadius = width / 2;
            const baseRadius = maxRadius * amplitude;
            const radius = baseRadius * (0.6 + 0.2 * bounceFactor);
            const centerX = width / 2;
            const centerY = height / 2;

            ctx.fillStyle = foregroundColor;
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            ctx.fill();

            const newFactor = bounceFactor + 0.01 * bounceDirection;
            if (newFactor > 1 || newFactor < 0) {
              bounceDirection *= -1;
            }
            bounceFactor = Math.max(0, Math.min(newFactor, 1));
          } else {
            WavRenderer.drawBars(
              ctx,
              result.values,
              width,
              height,
              foregroundColor,
              barCount,
              0,
              barSpacing,
              true
            );
          }
        }
      }
      window.requestAnimationFrame(render);
    };
    render();

    return () => {
      isLoaded = false;
    };
  }, [
    height,
    width,
    barCount,
    barSpacing,
    foregroundColor,
    wavRecorder,
    isAiSpeaking
  ]);

  return (
    <div className="flex items-center gap-1">
      {type === 'server' && !isAiSpeaking ? (
        <div className="text-muted-foreground">Listening</div>
      ) : null}
      <canvas ref={canvasRef} />
    </div>
  );
}
