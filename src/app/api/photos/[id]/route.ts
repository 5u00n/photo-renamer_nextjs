import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth';
import { deletePhotoById } from '@/db';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await verifySession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const photoId = parseInt(id, 10);

    if (isNaN(photoId)) {
      return NextResponse.json({ error: 'Invalid photo ID' }, { status: 400 });
    }

    const isAdmin = session.role === 'admin';
    const deleted = deletePhotoById(photoId, session.userId, isAdmin);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Photo not found or you do not have permission to delete it.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Photo deleted successfully',
    });
  } catch (error) {
    console.error('[API DELETE /api/photos/[id]] Error:', error);
    return NextResponse.json({ error: 'Failed to delete photo' }, { status: 500 });
  }
}
