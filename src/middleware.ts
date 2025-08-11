
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
 
export function middleware(req: NextRequest) {
  const token = req.cookies.get('token')?.value
 
  const { pathname } = req.nextUrl
 
  if (!token && pathname !== '/login' && pathname !== '/register') {
    return NextResponse.redirect(new URL('/login', req.url))
  }
 
  if (token && (pathname === '/login' || pathname === '/register')) {
    return NextResponse.redirect(new URL('/', req.url))
  }
 
  return NextResponse.next()
}
 
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
