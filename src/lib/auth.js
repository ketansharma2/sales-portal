import { supabaseServer } from './supabase-server'
import { cookies } from 'next/headers'

/**
 * Get authenticated user from HttpOnly cookie
 * This is the primary authentication method for server-side routes
 * 
 * @returns {Promise<{user: Object|null, error: string|null}>}
 */
export async function getAuthenticatedUser() {
  try {
    const cookieStore = cookies()
    const token = cookieStore.get('access_token')?.value
    
    if (!token) {
      return { user: null, error: 'No authentication token found' }
    }
    
    const { data: { user }, error } = await supabaseServer.auth.getUser(token)
    
    if (error || !user) {
      return { user: null, error: error?.message || 'Invalid authentication token' }
    }
    
    return { user, error: null }
  } catch (error) {
    console.error('Authentication error:', error)
    return { user: null, error: 'Authentication failed' }
  }
}

/**
 * Get user from request headers (set by middleware)
 * This method should be preferred in API routes as it avoids additional Supabase calls
 * Falls back to cookie-based authentication if middleware headers are not present
 * 
 * @param {Request} request - Next.js request object
 * @returns {Promise<{user: Object|null, error: string|null}>}
 */
export async function getUserFromRequest(request) {
  try {
    // Try to get user from middleware headers first (most efficient)
    const userId = request.headers.get('x-user-id')
    const userEmail = request.headers.get('x-user-email')
    const userRole = request.headers.get('x-user-role')
    
    if (userId && userEmail) {
      // User context provided by middleware - no additional Supabase call needed
      return {
        user: {
          id: userId,
          email: userEmail,
          role: userRole ? JSON.parse(userRole) : null,
          user_metadata: {
            email: userEmail
          }
        },
        error: null
      }
    }
    
    // Fallback to cookie-based authentication
    // This path is used for routes not protected by middleware
    return await getAuthenticatedUser()
  } catch (error) {
    console.error('Error getting user from request:', error)
    return { user: null, error: 'Failed to authenticate user' }
  }
}

/**
 * Get user with profile data from database
 * Use this when you need additional user information beyond auth data
 * 
 * @param {Request} request - Next.js request object
 * @returns {Promise<{user: Object|null, profile: Object|null, error: string|null}>}
 */
export async function getUserWithProfile(request) {
  try {
    const { user, error } = await getUserFromRequest(request)
    
    if (error || !user) {
      return { user: null, profile: null, error: error || 'User not found' }
    }
    
    // Fetch user profile from database
    const { data: profile, error: profileError } = await supabaseServer
      .from('users')
      .select('user_id, name, email, role, manager_id, hod_id, sector')
      .eq('user_id', user.id)
      .single()
    
    if (profileError) {
      console.error('Profile fetch error:', profileError)
      return { user, profile: null, error: 'Failed to fetch user profile' }
    }
    
    return { user, profile, error: null }
  } catch (error) {
    console.error('Error getting user with profile:', error)
    return { user: null, profile: null, error: 'Failed to get user data' }
  }
}

/**
 * Verify user has required role
 * 
 * @param {Request} request - Next.js request object
 * @param {string|string[]} requiredRoles - Role(s) required to access the resource
 * @returns {Promise<{authorized: boolean, user: Object|null, error: string|null}>}
 */
export async function verifyUserRole(request, requiredRoles) {
  try {
    const { user, profile, error } = await getUserWithProfile(request)
    
    if (error || !user || !profile) {
      return { authorized: false, user: null, error: error || 'User not authenticated' }
    }
    
    const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles]
    const userRoles = Array.isArray(profile.role) ? profile.role : [profile.role]
    
    // Check if user has any of the required roles
    const hasRole = roles.some(role => 
      userRoles.some(userRole => 
        userRole.toLowerCase() === role.toLowerCase()
      )
    )
    
    if (!hasRole) {
      return { 
        authorized: false, 
        user, 
        error: `Access denied. Required role(s): ${roles.join(', ')}` 
      }
    }
    
    return { authorized: true, user: { ...user, profile }, error: null }
  } catch (error) {
    console.error('Error verifying user role:', error)
    return { authorized: false, user: null, error: 'Role verification failed' }
  }
}

/**
 * Simple authentication check - returns 401 response if not authenticated
 * Use this as a quick auth guard in API routes
 * 
 * @param {Request} request - Next.js request object
 * @returns {Promise<{user: Object, response: null}|{user: null, response: Response}>}
 */
export async function requireAuth(request) {
  const { user, error } = await getUserFromRequest(request)
  
  if (error || !user) {
    return {
      user: null,
      response: new Response(
        JSON.stringify({ error: 'Unauthorized', message: error || 'Authentication required' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }
  }
  
  return { user, response: null }
}

/**
 * Require authentication with specific role(s)
 * Returns 401 if not authenticated, 403 if missing required role
 * 
 * @param {Request} request - Next.js request object
 * @param {string|string[]} requiredRoles - Role(s) required
 * @returns {Promise<{user: Object, response: null}|{user: null, response: Response}>}
 */
export async function requireRole(request, requiredRoles) {
  const { authorized, user, error } = await verifyUserRole(request, requiredRoles)
  
  if (!authorized) {
    const status = error?.includes('Access denied') ? 403 : 401
    return {
      user: null,
      response: new Response(
        JSON.stringify({ error: status === 403 ? 'Forbidden' : 'Unauthorized', message: error }),
        { status, headers: { 'Content-Type': 'application/json' } }
      )
    }
  }
  
  return { user, response: null }
}
