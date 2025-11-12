import { Router } from 'express';
import axios from 'axios';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

const router = Router();

router.get('/api/image-proxy', async (req, res) => {
  try {
    const url = String(req.query.url || '');
    const width = parseInt(String(req.query.width || '0')) || undefined;
    const height = parseInt(String(req.query.height || '0')) || undefined;
    const quality = parseInt(String(req.query.quality || '0')) || 80;
    const format = String(req.query.format || 'webp').toLowerCase();

    if (!url || !/^https?:\/\//i.test(url)) {
      return res.status(400).json({ error: 'Invalid or missing url parameter' });
    }

    // Build cache key + path
    const cacheRoot = path.join(process.cwd(), 'uploads', 'image-cache');
    try { if (!fs.existsSync(cacheRoot)) fs.mkdirSync(cacheRoot, { recursive: true }); } catch {}
    const cacheKey = crypto
      .createHash('sha1')
      .update(`${url}|w=${width || ''}|h=${height || ''}|q=${quality}|f=${format}`)
      .digest('hex');
    const cacheFile = path.join(cacheRoot, `${cacheKey}.${format}`);

    // Serve cached file if present and fresh (up to 24h)
    try {
      const stat = fs.existsSync(cacheFile) ? fs.statSync(cacheFile) : null;
      if (stat && (Date.now() - stat.mtimeMs) < 24 * 60 * 60 * 1000) {
        const cached = fs.readFileSync(cacheFile);
        res.setHeader('Content-Type', `image/${format === 'webp' ? 'webp' : format}`);
        res.setHeader('Cache-Control', 'public, max-age=86400');
        return res.status(200).end(cached);
      }
    } catch {}

    // Fetch image bytes
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      headers: {
        'User-Agent': 'PickNTrust Image Proxy/1.0',
        'Accept': 'image/*,*/*;q=0.8',
      },
      maxRedirects: 3,
      timeout: 10000,
    });

    const buffer = Buffer.from(response.data);

    // If content is not image, just pass through
    const contentType = String(response.headers['content-type'] || '').toLowerCase();
    const isImage = contentType.includes('image/');
    if (!isImage) {
      res.setHeader('Cache-Control', 'no-store');
      res.setHeader('Content-Type', contentType || 'application/octet-stream');
      return res.status(200).end(buffer);
    }

    // Process with sharp if resize/format requested
    let img = sharp(buffer, { failOnError: false });
    if (width || height) {
      img = img.resize({ width, height, fit: 'cover' });
    }
    let out: Buffer;
    switch (format) {
      case 'jpeg':
        out = await img.jpeg({ quality, mozjpeg: true }).toBuffer();
        res.setHeader('Content-Type', 'image/jpeg');
        break;
      case 'png':
        out = await img.png().toBuffer();
        res.setHeader('Content-Type', 'image/png');
        break;
      default: // webp
        out = await img.webp({ quality }).toBuffer();
        res.setHeader('Content-Type', 'image/webp');
        break;
    }
    // Write to cache for future requests
    try { fs.writeFileSync(cacheFile, out); } catch {}
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.status(200).end(out);
  } catch (error: any) {
    console.error('image-proxy error:', error?.message || error);
    return res.status(500).json({ error: 'Failed to proxy image' });
  }
});

export default router;