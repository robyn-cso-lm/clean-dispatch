import { NextRequest, NextResponse } from 'next/server';
import { createHash, timingSafeEqual } from 'crypto';

export async function POST(request: NextRequest) {
  const { password } = await request.json();
  const adminPassword = process.env.ADMIN_PASSWORD ?? '';

  if (!adminPassword) {
    return NextResponse.json({ error: 'ADMIN_PASSWORD not configured' }, { status: 500 });
  }

  let valid = false;
  try {
    const a = Buffer.from(password ?? '');
    const b = Buffer.from(adminPassword);
    valid = a.length === b.length && timingSafeEqual(a, b);
  } catch {
    valid = false;
  }

  if (!valid) {
    await new Promise(r => setTimeout(r, 500));
    return NextResponse.json({ error: 'Incorrect password' }, { status: 401 });
  }

  const token = createHash('sha256').update(adminPassword).digest('hex');
  const response = NextResponse.json({ ok: true });
  response.cookies.set('admin_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  });
  return response;
}
