import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';
import sharp from 'sharp';
import { requireAdmin } from '@/lib/auth/require-admin';

const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;
const MAX_PIXELS = 25_000_000;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const ALLOWED_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp']);

function createR2Client() {
  const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_PUBLIC_URL } = process.env;
  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET || !R2_PUBLIC_URL) {
    return null;
  }
  return new S3Client({
    region: 'auto',
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
  });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    console.error('[POST /api/admin/upload] Auth failed');
    return auth.response;
  }

  try {
    const s3 = createR2Client();
    if (!s3 || !process.env.R2_BUCKET || !process.env.R2_PUBLIC_URL) {
      console.error('[POST /api/admin/upload] R2 storage is not configured');
      return NextResponse.json({ error: 'Upload storage is not configured' }, { status: 503 });
    }

    const form = await req.formData();
    const value = form.get('file');
    if (!(value instanceof File)) {
      return NextResponse.json({ error: 'No file' }, { status: 400 });
    }

    const file = value;
    if (file.size <= 0) {
      return NextResponse.json({ error: 'File is empty' }, { status: 400 });
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json({ error: 'Image must be 15MB or smaller' }, { status: 413 });
    }
    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json({ error: 'Only JPEG, PNG, and WebP images are allowed' }, { status: 415 });
    }

    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!extension || !ALLOWED_EXTENSIONS.has(extension)) {
      return NextResponse.json({ error: 'Unsupported image file extension' }, { status: 415 });
    }

    const rawBuffer = Buffer.from(await file.arrayBuffer());
    const image = sharp(rawBuffer, { limitInputPixels: MAX_PIXELS });
    const metadata = await image.metadata();

    if (!metadata.width || !metadata.height || !metadata.format) {
      return NextResponse.json({ error: 'Invalid image' }, { status: 400 });
    }
    if (metadata.width * metadata.height > MAX_PIXELS) {
      return NextResponse.json({ error: 'Image dimensions are too large' }, { status: 413 });
    }
    if (!['jpeg', 'png', 'webp'].includes(metadata.format)) {
      return NextResponse.json({ error: 'Unsupported image format' }, { status: 415 });
    }

    // Convert to WebP, resize to max 1200px wide, quality 82
    const webpBuffer = await image
      .resize({ width: 1200, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();

    const key = `uploads/${randomUUID()}.webp`;

    await s3.send(new PutObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: key,
      Body: webpBuffer,
      ContentType: 'image/webp',
      CacheControl: 'public, max-age=31536000',
    }));

    const url = `${process.env.R2_PUBLIC_URL}/${key}`;
    return NextResponse.json({ url });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[POST /api/admin/upload] Upload failed:', message);
    return NextResponse.json({ error: 'Upload failed', detail: message }, { status: 500 });
  }
}
