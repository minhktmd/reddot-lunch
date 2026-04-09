import { NextResponse } from 'next/server';

import type { NextRequest } from 'next/server';

async function timingSafeEqual(a: string, b: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const aBytes = encoder.encode(a);
  const bBytes = encoder.encode(b);
  if (aBytes.length !== bBytes.length) return false;
  const aKey = await crypto.subtle.importKey('raw', aBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const bKey = await crypto.subtle.importKey('raw', bBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const msg = encoder.encode('compare');
  const [aSig, bSig] = await Promise.all([
    crypto.subtle.sign('HMAC', aKey, msg),
    crypto.subtle.sign('HMAC', bKey, msg),
  ]);
  const aArr = new Uint8Array(aSig);
  const bArr = new Uint8Array(bSig);
  return aArr.length === bArr.length && aArr.every((v, i) => v === bArr[i]);
}

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Exclude /admin/login from the gate check to avoid redirect loops
  if (pathname === '/admin/login') {
    return NextResponse.next();
  }

  const adminToken = process.env.ADMIN_TOKEN;

  // Fail open if ADMIN_TOKEN is not configured (dev convenience)
  if (!adminToken) {
    console.warn('[proxy] ADMIN_TOKEN is not set — allowing all /admin/* requests');
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  const tokenParam = url.searchParams.get('token');

  // Case A: ?token query param is present
  if (tokenParam !== null) {
    const isValid = await timingSafeEqual(tokenParam, adminToken);

    if (isValid) {
      // Strip token from URL and redirect
      url.searchParams.delete('token');
      const response = NextResponse.redirect(url);
      response.cookies.set('admin_token', tokenParam, {
        httpOnly: true,
        sameSite: 'strict',
        maxAge: 2592000, // 30 days
        secure: process.env.NODE_ENV === 'production',
        path: '/admin',
      });
      return response;
    }

    // Invalid token — redirect to login with error
    return NextResponse.redirect(new URL('/admin/login?error=invalid', request.url));
  }

  // Case B: no ?token param — check cookie
  const cookieToken = request.cookies.get('admin_token')?.value;

  if (cookieToken) {
    const isValid = await timingSafeEqual(cookieToken, adminToken);
    if (isValid) {
      return NextResponse.next();
    }
  }

  // Missing or invalid cookie — redirect to login
  return NextResponse.redirect(new URL('/admin/login', request.url));
}

export const config = {
  matcher: ['/admin/:path*'],
};
