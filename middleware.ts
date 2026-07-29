import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  // 🔴 THE FIX: Swapped AUTH_SECRET to NEXTAUTH_SECRET to match your Vercel deployment
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = req.nextUrl;

  // 1. Define Public & System Routes
  const isPublicRoute = pathname.startsWith('/login') || 
                        pathname.startsWith('/register') || 
                        pathname.startsWith('/api/auth') || 
                        pathname.startsWith('/api/seed');

  // 2. Handle Logged-In Users trying to access Public Routes (e.g., /login)
  if (isPublicRoute) {
    if (token) {
      // Smart Auto-Routing based on Role Hierarchy
      if (token.role === 'SUPER_ADMIN') return NextResponse.redirect(new URL('/admin/branches', req.url));
      if (token.role === 'ADMIN') return NextResponse.redirect(new URL('/admin', req.url));
      if (token.role === 'HR') return NextResponse.redirect(new URL('/hr/employees', req.url));
      
      // Default standard employee workspace
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
    return NextResponse.next();
  }

  // 3. Absolute Perimeter Defense: Block all unauthenticated traffic
  if (!token) {
    const loginUrl = new URL('/login', req.url);
    // Remember where they wanted to go, so we can route them there after login
    loginUrl.searchParams.set('callbackUrl', req.url);
    return NextResponse.redirect(loginUrl);
  }

  const role = token.role as string;

  // ==========================================
  // 4. THE COMMAND & CONTROL ROUTERS
  // ==========================================

  // 🔴 THE FIX: Reordered logic. Catch the most specific route first.
  
  // A. Super Admin Zone (Global Overseer - Branches Only)
  if (pathname.startsWith('/admin/branches')) {
    if (role !== 'SUPER_ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', req.url)); 
    }
  }
  
  // B. Branch Manager Zone (Local Command - All other Admin routes)
  else if (pathname.startsWith('/admin')) {
    if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
  }
  
  // C. HR & Personnel Zone (Branch Level)
  else if (pathname.startsWith('/hr')) {
    if (!['HR', 'ADMIN', 'SUPER_ADMIN'].includes(role)) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
  }

  // 5. Allow standard employees to access their /dashboard freely
  return NextResponse.next();
}

// Ensure the middleware doesn't run on static assets, images, or Next.js internals
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};