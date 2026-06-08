import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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
    '/operations'
  ]
  
  // Check if current path is protected
  const isProtected = protectedPaths.some(path => pathname.startsWith(path))
  
  // Allow public routes
  if (!isProtected) {
    return NextResponse.next()
  }
  
  // Get access token from cookie
  const token = request.cookies.get('access_token')?.value
  
  if (!token) {
    console.log(`[Middleware] No token found for protected route: ${pathname}`)
    return NextResponse.redirect(new URL('/', request.url))
  }
  
  try {
    // Validate token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token)
    
    if (error || !user) {
      console.log(`[Middleware] Invalid token for route: ${pathname}`, error?.message)
      const response = NextResponse.redirect(new URL('/', request.url))
      response.cookies.delete('access_token')
      return response
    }
    
    // Get user profile for role information
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('role, user_id, sector, manager_id, hod_id')
      .eq('user_id', user.id)
      .single()
    
    if (profileError) {
      console.error(`[Middleware] Profile fetch error for user ${user.id}:`, profileError)
    }
    
    // Create new headers with user context
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-user-id', user.id)
    requestHeaders.set('x-user-email', user.email)
    
    if (profile?.role) {
      requestHeaders.set('x-user-role', JSON.stringify(profile.role))
    }
    
    if (profile?.sector) {
      requestHeaders.set('x-user-sector', profile.sector)
    }
    
    if (profile?.manager_id) {
      requestHeaders.set('x-user-manager-id', profile.manager_id)
    }
    
    if (profile?.hod_id) {
      requestHeaders.set('x-user-hod-id', profile.hod_id)
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

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (authentication endpoints)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
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
    '/operations/:path*'
  ]
}
