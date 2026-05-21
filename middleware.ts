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

  if (pathname === '/admin/login') {
    return NextResponse.next();
  }

  const session = request.cookies.get('admin_session')?.value;
  if (!session) {
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }

  const expected = await expectedToken();
  if (session !== expected) {
    const res = NextResponse.redirect(new URL('/admin/login', request.url));
    res.cookies.delete('admin_session');
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
