import { useEffect, useRef } from 'react';

import { Box } from '@mui/material';
import { useTheme } from '@mui/material/styles';

import { WavRenderer, useAudio } from '@chainlit/react-client';

interface Props {
  height: number;
  width: number;
  barCount: number;
  barSpacing: number;
}

export default function AudioWaves({
  height,
  width,
  barCount,
  barSpacing
}: Props) {
  const theme = useTheme();
  const { wavRecorder } = useAudio();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let isLoaded = true;
    const dpr = window.devicePixelRatio || 1;

    const render = () => {
      if (isLoaded) {
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
            ctx.scale(dpr, dpr);
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const result = wavRecorder.recording
              ? wavRecorder.getFrequencies('voice')
              : { values: new Float32Array([0]) };
            WavRenderer.drawBars(
              ctx,
              result.values,
              width,
              height,
              theme.palette.text.primary,
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
  }, []);

  return (
    <Box height={height} width={width}>
      <canvas ref={canvasRef} />
    </Box>
  );
}
