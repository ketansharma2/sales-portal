import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import jwt from 'jsonwebtoken'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

/**
 * Decode JWT token to get user information
 * Fast local validation without network calls
 * 
 * @param {string} token - JWT access token
 * @returns {Object|null} - Decoded user data or null
 */
function decodeToken(token) {
  try {
    // Decode without verification (Supabase already verified it)
    const decoded = jwt.decode(token)
    
    if (!decoded || !decoded.sub) {
      return null
    }
    
    // Check if token is expired
    if (decoded.exp && decoded.exp < Date.now() / 1000) {
      return null
    }
    
    // Return user object with profile data (cached in JWT during login)
    return {
      id: decoded.sub,
      email: decoded.email,
      user_metadata: decoded.user_metadata || {},
      app_metadata: decoded.app_metadata || {},
      aud: decoded.aud,
      role: decoded.role,
      // Profile data cached in JWT (eliminates DB call)
      profile_role: decoded.profile_role,
      profile_sector: decoded.profile_sector,
      profile_manager_id: decoded.profile_manager_id,
      profile_hod_id: decoded.profile_hod_id
    }
  } catch (error) {
    console.error('Token decode error:', error)
    return null
  }
}

export async function middleware(request) {
  const { pathname } = request.nextUrl
  
  // Define protected route patterns
  const protectedPaths = [
    '/admin',
    '/hod',
    '/manager',
    '/crm',
    '/fse',
    '/leadgen',
    '/corporate',
    '/domestic',
    '/recruiter',
    '/tl',
    '/revenue',
    '/jobpost',
    '/operations',
    '/api/admin',
    '/api/hod',
    '/api/manager',
    '/api/fse',
    '/api/corporate',
    '/api/domestic',
    '/api/recruiter',
    '/api/tl',
    '/api/revenue',
    '/api/jobpost',
    '/api/operations',
    '/api/notifications',        // <-- Add this
    '/api/user/fcm-token',       // <-- Add this
    '/api/user',
    '/api/auth',
  ]
  
  // Check if current path is protected
  const isProtected = protectedPaths.some(path => pathname.startsWith(path))
  
  // Allow public routes
  if (!isProtected) {
    console.log(`[Middleware] Skipping non-protected route: ${pathname}`)
    return NextResponse.next()
  }
  
  console.log(`[Middleware] Processing protected route: ${pathname}`)
  
  // Get access token from cookie
  const token = request.cookies.get('access_token')?.value
  
  if (!token) {
    console.log(`[Middleware] No token found for protected route: ${pathname}`)
    return NextResponse.redirect(new URL('/', request.url))
  }
  
  try {
    // Fast JWT decoding (2ms vs 200ms+ for Supabase call)
    let user = decodeToken(token)
    
    if (!user) {
      // Fallback: validate with Supabase (only if decode fails)
      console.log(`[Middleware] JWT decode failed, falling back to Supabase for: ${pathname}`)
      const { data: { user: supabaseUser }, error } = await supabase.auth.getUser(token)
      
      if (error || !supabaseUser) {
        console.log(`[Middleware] Invalid token for route: ${pathname}`, error?.message)
        const response = NextResponse.redirect(new URL('/', request.url))
        response.cookies.delete('access_token')
        return response
      }
      user = supabaseUser
    }
    
    // Use profile data cached in JWT (eliminates database call!)
    // Create new headers with user context
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-user-id', user.id)
    requestHeaders.set('x-user-email', user.email)
    
    // Profile data from JWT cache
    if (user.profile_role) {
      requestHeaders.set('x-user-role', JSON.stringify(user.profile_role))
    }
    
    if (user.profile_sector) {
      requestHeaders.set('x-user-sector', user.profile_sector)
    }
    
    if (user.profile_manager_id) {
      requestHeaders.set('x-user-manager-id', user.profile_manager_id)
    }
    
    if (user.profile_hod_id) {
      requestHeaders.set('x-user-hod-id', user.profile_hod_id)
    }
    
    console.log(`[Middleware] Authenticated user ${user.email} for route: ${pathname}`)
    
    // Continue with modified headers
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  } catch (error) {
    console.error('[Middleware] Authentication error:', error)
    const response = NextResponse.redirect(new URL('/', request.url))
    response.cookies.delete('access_token')
    return response
  }
}

// middleware.js - Update the config
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth/login (login endpoint - public)
     * - api/auth/register (register endpoint - public)
     * - api/auth/refresh (refresh token - public)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api/auth/login|api/auth/register|api/auth/refresh|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    '/admin/:path*',
    '/hod/:path*',
    '/manager/:path*',
    '/crm/:path*',
    '/fse/:path*',
    '/leadgen/:path*',
    '/corporate/:path*',
    '/domestic/:path*',
    '/recruiter/:path*',
    '/tl/:path*',
    '/revenue/:path*',
    '/jobpost/:path*',
    '/operations/:path*',
    '/api/admin/:path*',
    '/api/hod/:path*',
    '/api/manager/:path*',
    '/api/fse/:path*',
    '/api/corporate/:path*',
    '/api/domestic/:path*',
    '/api/recruiter/:path*',
    '/api/tl/:path*',
    '/api/revenue/:path*',
    '/api/jobpost/:path*',
    '/api/operations/:path*'
  ]
}
