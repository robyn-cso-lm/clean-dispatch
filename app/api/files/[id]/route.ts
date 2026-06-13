import { NextRequest, NextResponse } from 'next/server';
import { fetchFile } from '@/lib/graphFiles';

// Streams a stored file (e.g. cleaner work photo) by its Graph driveItem id.
// Referenced from <img src="/api/files/<driveItemId>">.
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const file = await fetchFile(id);
    if (!file) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return new NextResponse(file.body, {
      headers: {
        'Content-Type': file.contentType,
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch (err) {
    console.error('File stream error:', err);
    return NextResponse.json({ error: 'Failed to load file' }, { status: 500 });
  }
}
