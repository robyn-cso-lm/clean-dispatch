import { NextRequest, NextResponse } from 'next/server';

async function expectedToken(): Promise<string> {
  const password = process.env.ADMIN_PASSWORD ?? '';
  const data = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isApi = pathname.startsWith('/api/');

  // Public auth endpoints (page + API)
  if (pathname === '/admin/login' || pathname === '/api/admin/login') {
    return NextResponse.next();
  }

  // Unauthenticated: APIs get a 401, pages redirect to login.
  const deny = () =>
    isApi
      ? NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      : NextResponse.redirect(new URL('/admin/login', request.url));

  const session = request.cookies.get('admin_session')?.value;
  if (!session) {
    return deny();
  }

  const expected = await expectedToken();
  if (session !== expected) {
    const res = deny();
    res.cookies.delete('admin_session');
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
