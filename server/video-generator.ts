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
  caption?: string; // text overlay not applied to keep dependencies light
  durationSec?: number; // default 15 seconds
  outputDir?: string; // defaults to OS tmp dir
  /**
   * Optional seed to make animation/audio selection deterministic.
   * Use contentId or any stable identifier.
   */
  seed?: string;
  /**
   * If true, try to add background audio from backend-assets/audio.
   * Falls back to silent if none found.
   */
  withAudio?: boolean;
}

/**
 * Generate a vertical MP4 video from a single image suitable for YouTube Shorts.
 * - Resolution: 1080x1920, 30 fps, H.264 + AAC
 * - Simple scale+pad to avoid distortion (no text overlay to keep it robust)
 */
export async function generateShortVideo(options: ShortVideoOptions): Promise<string> {
  const { imageUrl, durationSec = 15, outputDir, seed, withAudio = true } = options;

  // Prepare temp paths
  const tmpDir = outputDir || path.join(os.tmpdir(), 'pnt-video');
  fs.mkdirSync(tmpDir, { recursive: true });

  const imagePath = path.join(tmpDir, `input-${Date.now()}.jpg`);
  const outputPath = path.join(tmpDir, `short-${Date.now()}.mp4`);

  // Download image to disk
  const res = await fetch(imageUrl);
  if (!res.ok) {
    throw new Error(`Failed to download image: ${res.status} ${res.statusText}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(imagePath, buf);

  // --- Animation preset selection (deterministic via seed) ---
  const fps = 30;
  const frames = Math.max(1, Math.floor(durationSec * fps));

  // Basic string hash for seeding
  const makeSeed = (s: string) => {
    let h = 2166136261 >>> 0; // FNV offset basis
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  };
  const seedValue = makeSeed((seed || '') + imageUrl);
  const pick = (n: number) => seedValue % n;

  // Previously zoompan caused filter reinitialization on some inputs.
  // We use a safer approach: scale to be larger than the final frame, then crop 1080x1920
  // while gently varying x/y over time for motion. This avoids reinit issues.
  const basePre = `scale=1200:2133:force_original_aspect_ratio=increase`;
  const step = 0.0005 + (pick(5) * 0.00015); // vary zoom speed slightly

  const presets: string[] = [
    // 0: gentle sway both axes
    `${basePre},crop=1080:1920:x='trunc((in_w-w)/2 + min((in_w-w)/2,40)*sin(n/120))':y='trunc((in_h-h)/2 + min((in_h-h)/2,30)*sin(n/140))'`,
    // 1: horizontal pan
    `${basePre},crop=1080:1920:x='trunc((in_w-w)/2 + min((in_w-w)/2,50)*sin(n/100))':y='trunc((in_h-h)/2)'`,
    // 2: vertical pan
    `${basePre},crop=1080:1920:x='trunc((in_w-w)/2)':y='trunc((in_h-h)/2 + min((in_h-h)/2,50)*sin(n/110))'`,
    // 3: sway + mild saturation tweak
    `${basePre},crop=1080:1920:x='trunc((in_w-w)/2 + min((in_w-w)/2,35)*sin(n/115))':y='trunc((in_h-h)/2 + min((in_h-h)/2,25)*sin(n/130))',hue=s=1.03`
  ];
  const presetIndex = pick(presets.length);
  const videoFilters = presets[presetIndex];

  // --- Audio selection ---
  let audioPath: string | null = null;
  if (withAudio) {
    const audioRootA = path.join(process.cwd(), 'backend-assets', 'audio', 'universal');
    const audioRootB = path.join(process.cwd(), 'backend-assets', 'audio');
    const candidateRoot = fs.existsSync(audioRootA) ? audioRootA : audioRootB;
    try {
      const files = fs.readdirSync(candidateRoot)
        .filter(f => /\.(mp3|m4a|aac|wav)$/i.test(f));
      if (files.length > 0) {
        const idx = seedValue % files.length;
        audioPath = path.join(candidateRoot, files[idx]);
      }
    } catch {}
  }

  await new Promise<void>((resolve, reject) => {
    const cmd = ffmpeg()
      .input(imagePath)
      .inputOptions(['-loop 1'])
      .videoFilters(videoFilters)
      .videoCodec('libx264')
      .fps(fps)
      .outputOptions([
        '-t', String(durationSec),
        '-pix_fmt', 'yuv420p',
        '-movflags', '+faststart'
      ]);

    if (audioPath && fs.existsSync(audioPath)) {
      const fadeOutStart = Math.max(0, durationSec - 0.8);
      cmd
        .input(audioPath)
        .audioCodec('aac')
        .audioFilters(`afade=t=in:st=0:d=0.8,afade=t=out:st=${fadeOutStart}:d=0.8`)
        .outputOptions(['-shortest']);
    } else {
      // Ensure an audio stream exists by generating a silent track
      cmd
        .input('anullsrc=r=44100:cl=stereo')
        .inputFormat('lavfi')
        .audioCodec('aac')
        .outputOptions(['-shortest']);
    }

    cmd
      .on('end', () => resolve())
      .on('error', (err) => reject(err))
      .save(outputPath);
  });

  // Cleanup input image (keep output for upload)
  try { fs.unlinkSync(imagePath); } catch {}

  return outputPath;
}