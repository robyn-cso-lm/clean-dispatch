import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { uploadFile } from '@/lib/graphFiles';

// Token-gated work-photo upload for existing cleaners (the same personal link
// used for availability). Accepts multipart/form-data with `token` + `photos`.
export async function POST(request: NextRequest) {
  const form = await request.formData();
  const token = String(form.get('token') ?? '');

  const cleaner = token
    ? await prisma.cleaner.findUnique({ where: { accessToken: token }, select: { id: true } })
    : null;
  if (!cleaner) {
    return NextResponse.json({ error: 'Invalid or missing access link.' }, { status: 401 });
  }

  const photos = form.getAll('photos').filter((p): p is File => p instanceof File && p.size > 0);
  if (photos.length === 0) {
    return NextResponse.json({ error: 'Please choose at least one photo.' }, { status: 400 });
  }

  const existing = await prisma.cleanerWorkPhoto.count({ where: { cleanerId: cleaner.id } });
  let uploaded = 0;
  const errors: string[] = [];
  for (let i = 0; i < photos.length; i++) {
    const file = photos[i];
    try {
      const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
      const buffer = Buffer.from(await file.arrayBuffer());
      const { driveItemId } = await uploadFile(
        `CleanDispatch/cleaners/${cleaner.id}/work-${existing + i + 1}.${ext}`,
        buffer,
        file.type || 'image/jpeg'
      );
      await prisma.cleanerWorkPhoto.create({ data: { cleanerId: cleaner.id, driveItemId } });
      uploaded++;
    } catch (err) {
      console.error(`Work photo upload failed:`, err);
      errors.push(file.name);
    }
  }

  if (uploaded === 0) {
    return NextResponse.json(
      { error: 'Upload failed — photo storage may not be configured yet.', uploaded: 0 },
      { status: 502 }
    );
  }

  return NextResponse.json({ success: true, uploaded, failed: errors.length });
}
