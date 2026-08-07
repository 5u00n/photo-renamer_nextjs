import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { verifySession } from '@/lib/auth';
import { getPhotosByUserId, getAllPhotosWithOwners, addPhotoToDb } from '@/db';

const MAX_BASE64_SIZE = 7 * 1024 * 1024; // ~7MB base64 string

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/bmp',
  'image/tiff',
  'image/svg+xml',
];

const SavePhotoSchema = z.object({
  photoDataUri: z
    .string()
    .min(1, 'photoDataUri is required')
    .max(MAX_BASE64_SIZE, 'Image is too large. Maximum size is ~5MB.'),
  newName: z
    .string()
    .min(1, 'Name is required')
    .max(255, 'Name too long')
    .regex(
      /^[a-zA-Z0-9\s\-_.()[\]]+$/,
      'Name contains invalid characters. Only letters, numbers, spaces, hyphens, underscores, periods, and parentheses are allowed.'
    ),
});

export async function GET(req: NextRequest) {
  try {
    const session = await verifySession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const scope = searchParams.get('scope');

    if (scope === 'all' || session.role === 'admin') {
      if (session.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
      }
      const allPhotos = getAllPhotosWithOwners();
      return NextResponse.json(allPhotos);
    }

    const userPhotos = getPhotosByUserId(session.userId);
    return NextResponse.json(userPhotos);
  } catch (error) {
    console.error('[API GET /api/photos] Error:', error);
    return NextResponse.json({ error: 'Failed to retrieve photos' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await verifySession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
    }

    const body = await req.json();
    const validation = SavePhotoSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { photoDataUri, newName } = validation.data;

    // MIME type check
    const mimeMatch = photoDataUri.match(/^data:([a-zA-Z0-9][a-zA-Z0-9!#$&\-^_]*\/[a-zA-Z0-9][a-zA-Z0-9!#$&\-^_]*);base64,/);
    if (!mimeMatch) {
      return NextResponse.json({ error: 'Invalid image data URI format' }, { status: 400 });
    }

    const mimeType = mimeMatch[1].toLowerCase();
    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
      return NextResponse.json(
        { error: `File type "${mimeType}" is not allowed.` },
        { status: 400 }
      );
    }

    const savedPhoto = addPhotoToDb(session.userId, newName, photoDataUri);

    return NextResponse.json(
      {
        success: true,
        message: 'Photo saved successfully.',
        photo: savedPhoto,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[API POST /api/photos] Error:', error);
    return NextResponse.json({ error: 'Failed to save photo' }, { status: 500 });
  }
}
