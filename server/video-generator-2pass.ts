import path from 'path';
import fs from 'fs';
import os from 'os';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure ffmpeg binary is set (works cross-platform)
if (ffmpegStatic) {
  ffmpeg.setFfmpegPath(ffmpegStatic as string);
}

export interface ShortVideoOptions {
  imageUrl: string;
  caption?: string;
  durationSec?: number;
  outputDir?: string;
  seed?: string;
  withAudio?: boolean;
}

/**
 * Generate a vertical MP4 video with smooth motion and audio using a robust two-pass pipeline.
 * Pass 1: render motion-only video (no audio) to avoid filter reinit issues.
 * Pass 2: mux audio (real track with fades or generated silent track) copying video.
 */
export async function generateShortVideo(options: ShortVideoOptions): Promise<string> {
  const { imageUrl, durationSec = 15, outputDir, seed, withAudio = true } = options;

  const tmpDir = outputDir || path.join(os.tmpdir(), 'pnt-video');
  fs.mkdirSync(tmpDir, { recursive: true });

  const imagePath = path.join(tmpDir, `input-${Date.now()}.jpg`);
  const motionPath = path.join(tmpDir, `motion-${Date.now()}.mp4`);
  const outputPath = path.join(tmpDir, `short-${Date.now()}.mp4`);

  // Download image
  const res = await fetch(imageUrl);
  if (!res.ok) throw new Error(`Failed to download image: ${res.status} ${res.statusText}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(imagePath, buf);

  // Deterministic seed
  const fps = 30;
  const makeSeed = (s: string) => {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  };
  const seedValue = makeSeed((seed || '') + imageUrl);
  const pick = (n: number) => seedValue % n;

  // Stable motion filters: ensure extra margins by overscaling, then crop 1080x1920 with bounded sway
  // Step 1: fill the target using aspect-ratio safe scale, Step 2: overscale by ~8% to create motion room
  const scaleUp = `scale=1080:1920:force_original_aspect_ratio=increase,scale=ceil(iw*1.08/2)*2:ceil(ih*1.08/2)*2`;
  // Slightly stronger amplitudes for visible motion across various inputs
  const ampX = Math.min(140, 90 + (seedValue % 50));
  const ampY = Math.min(120, 70 + ((seedValue >> 3) % 50));
  const periodX = fps * (5 + (seedValue % 5)); // 5–9s
  const periodY = fps * (6 + ((seedValue >> 5) % 5)); // 6–10s
  const motionPresets = [
    `${scaleUp},crop=1080:1920:x='trunc((in_w-w)/2 + min((in_w-w)/2,${ampX})*sin(2*PI*n/${periodX}))':y='trunc((in_h-h)/2 + min((in_h-h)/2,${ampY})*sin(2*PI*n/${periodY}))'`,
    `${scaleUp},crop=1080:1920:x='trunc((in_w-w)/2 + min((in_w-w)/2,${ampX})*sin(2*PI*n/${periodX}))':y='trunc((in_h-h)/2)'`,
    `${scaleUp},crop=1080:1920:x='trunc((in_w-w)/2)':y='trunc((in_h-h)/2 + min((in_h-h)/2,${ampY})*sin(2*PI*n/${periodY}))'`,
    `${scaleUp},crop=1080:1920:x='trunc((in_w-w)/2 + min((in_w-w)/2,${ampX - 10})*sin(2*PI*n/${periodX}))':y='trunc((in_h-h)/2 + min((in_h-h)/2,${ampY - 10})*sin(2*PI*n/${periodY}))',hue=s=1.03`,
  ];
  const motionFilters = motionPresets[pick(motionPresets.length)];

  // Audio track selection
  let audioPath: string | null = null;
  if (withAudio) {
    const audioRootA = path.join(process.cwd(), 'backend-assets', 'audio', 'universal');
    const audioRootB = path.join(process.cwd(), 'backend-assets', 'audio');
    const candidateRoot = fs.existsSync(audioRootA) ? audioRootA : audioRootB;
    try {
      const files = fs.readdirSync(candidateRoot).filter(f => /\.(mp3|m4a|aac|wav)$/i.test(f));
      if (files.length > 0) {
        const idx = seedValue % files.length;
        audioPath = path.join(candidateRoot, files[idx]);
      }
    } catch {}
  }

  // Pass 1: motion-only render
  try {
    await new Promise<void>((resolve, reject) => {
      const motionMode = (process.env.PNT_MOTION_MODE || 'overlay').toLowerCase();
      if (motionMode === 'zoom') {
        // Ken Burns style zoom-in/out with safe bounds
        // Push-in up to 1.12x over duration, centered crop
        const zSpeed = 0.002 + (seedValue % 10) * 0.0001; // ~0.002–0.003
        const zoomFilter = `scale=1080:1920:force_original_aspect_ratio=increase,zoompan=z='min(zoom+${zSpeed},1.12)':x='iw/2-(iw/zoom)/2':y='ih/2-(ih/zoom)/2':d=1:s=1080x1920`;
        ffmpeg()
          .input(imagePath)
          .inputOptions(['-loop 1'])
          .videoFilters(zoomFilter)
          .videoCodec('libx264')
          .fps(fps)
          .outputOptions([
            '-t', String(durationSec),
            '-pix_fmt', 'yuv420p',
            '-movflags', '+faststart',
            '-an'
          ])
          .on('end', () => resolve())
          .on('error', (err) => reject(err))
          .save(motionPath);
      } else {
        // Overlay-based sway using time t
        const periodXS = 6 + (seedValue % 5); // seconds
        const periodYS = 7 + ((seedValue >> 5) % 5); // seconds
        const overlayAmpX = ampX; // px
        const overlayAmpY = ampY; // px

        const complex = [
          { filter: 'scale', options: '1080:1920:force_original_aspect_ratio=increase', inputs: '1:v', outputs: 'img1' },
          { filter: 'scale', options: 'ceil(iw*1.08/2)*2:ceil(ih*1.08/2)*2', inputs: 'img1', outputs: 'img' },
          { filter: 'overlay', options: `x='(W-w)/2 + min((w-W)/2,${overlayAmpX})*sin(2*PI*t/${periodXS})':y='(H-h)/2 + min((h-H)/2,${overlayAmpY})*sin(2*PI*t/${periodYS})'`, inputs: ['0:v','img'], outputs: 'out' },
        ];

        ffmpeg()
          .input('color=c=black:size=1080x1920:rate=' + fps)
          .inputFormat('lavfi')
          .input(imagePath)
          .inputOptions(['-loop 1'])
          .complexFilter(complex, 'out')
          .videoCodec('libx264')
          .fps(fps)
          .outputOptions([
            '-map', '[out]',
            '-t', String(durationSec),
            '-pix_fmt', 'yuv420p',
            '-movflags', '+faststart',
            '-an'
          ])
          .on('end', () => resolve())
          .on('error', (err) => reject(err))
          .save(motionPath);
      }
    });
  } catch (err) {
    // Fallback to scale+pad
    const fallbackFilters = `scale=1080:-1,pad=1080:1920:(ow-iw)/2:(oh-ih)/2`;
    await new Promise<void>((resolve, reject) => {
      ffmpeg()
        .input(imagePath)
        .inputOptions(['-loop 1'])
        .videoFilters(fallbackFilters)
        .videoCodec('libx264')
        .fps(fps)
        .outputOptions([
          '-t', String(durationSec),
          '-pix_fmt', 'yuv420p',
          '-movflags', '+faststart',
          '-an'
        ])
        .on('end', () => resolve())
        .on('error', (err2) => reject(err2))
        .save(motionPath);
    });
  }

  // Pass 2: mux audio (licensed or silent), copy video
  await new Promise<void>((resolve, reject) => {
    const cmd2 = ffmpeg()
      .input(motionPath)
      .videoCodec('copy')
      .outputOptions(['-movflags', '+faststart']);

    if (audioPath && fs.existsSync(audioPath)) {
      const fadeOutStart = Math.max(0, durationSec - 0.8);
      cmd2
        .input(audioPath)
        .audioCodec('aac')
        .audioFilters(`afade=t=in:st=0:d=0.8,afade=t=out:st=${fadeOutStart}:d=0.8`)
        .outputOptions(['-shortest']);
    } else {
      cmd2
        .input('anullsrc=r=44100:cl=stereo')
        .inputFormat('lavfi')
        .audioCodec('aac')
        .outputOptions(['-shortest']);
    }

    cmd2
      .on('end', () => resolve())
      .on('error', (err) => reject(err))
      .save(outputPath);
  });

  // Cleanup temp files
  try { fs.unlinkSync(imagePath); } catch {}
  try { fs.unlinkSync(motionPath); } catch {}

  return outputPath;
}