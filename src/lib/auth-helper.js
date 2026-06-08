/**
 * Auth Helper - Simple API Route Authentication
 * 
 * This provides simple functions for API routes to get authenticated user
 * from middleware-injected headers. No auth calls needed!
 * 
 * Usage:
 *   import { getUser } from '@/lib/auth-helper'
 *   const { user, error } = getUser(request)
 *   if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
 */

/**
 * Get user from request (injected by middleware)
 * This is the fastest method - no auth calls needed!
 * 
 * @param {Request} request - Next.js request object
 * @returns {{user: Object|null, error: string|null}}
 */
export function getUser(request) {
  try {
    // User is injected by middleware in headers
    const userId = request.headers.get('x-user-id')
    const userEmail = request.headers.get('x-user-email')
    const userRole = request.headers.get('x-user-role')
    
    if (!userId || !userEmail) {
      return { user: null, error: 'User not authenticated' }
    }
    
    return {
      user: {
        id: userId,
        email: userEmail,
        role: userRole ? JSON.parse(userRole) : null,
        user_metadata: { email: userEmail }
      },
      error: null
    }
  } catch (error) {
    return { user: null, error: 'Failed to get user' }
  }
}

/**
 * Get user with profile data (injected by middleware)
 * 
 * @param {Request} request - Next.js request object
 * @returns {{user: Object|null, profile: Object|null, error: string|null}}
 */
export function getUserWithProfile(request) {
  try {
    const { user, error } = getUser(request)
    
    if (error || !user) {
      return { user: null, profile: null, error: error || 'User not authenticated' }
    }
    
    // Get profile data from headers (injected by middleware)
    const userSector = request.headers.get('x-user-sector')
    const userManagerId = request.headers.get('x-user-manager-id')
    const userHodId = request.headers.get('x-user-hod-id')
    
    const profile = {
      sector: userSector,
      manager_id: userManagerId,
      hod_id: userHodId,
      role: user.role
    }
    
    return { user: { ...user, profile }, profile, error: null }
  } catch (error) {
    return { user: null, profile: null, error: 'Failed to get user data' }
  }
}

/**
 * Quick auth guard - returns 401 if not authenticated
 * 
 * @param {Request} request - Next.js request object
 * @returns {{user: Object|null, response: Response|null}}
 */
export function requireAuth(request) {
  const { user, error } = getUser(request)
  
  if (error || !user) {
    return {
      user: null,
      response: new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }
  }
  
  return { user, response: null }
}

/**
 * Verify user has required role
 * 
 * @param {Request} request - Next.js request object
 * @param {string|string[]} requiredRoles - Role(s) required to access the resource
 * @returns {{authorized: boolean, user: Object|null, error: string|null}}
 */
export function verifyUserRole(request, requiredRoles) {
  try {
    const { user, profile, error } = getUserWithProfile(request)
    
    if (error || !user || !profile) {
      return { authorized: false, user: null, error: error || 'User not authenticated' }
    }
    
    const userRoles = Array.isArray(profile.role) ? profile.role : [profile.role]
    const requiredRoleArray = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles]
    
    const hasRequiredRole = requiredRoleArray.some(role => 
      userRoles.some(userRole => 
        userRole.toLowerCase() === role.toLowerCase()
      )
    )
    
    if (!hasRequiredRole) {
      return { 
        authorized: false, 
        user, 
        error: `Insufficient permissions. Required roles: ${requiredRoleArray.join(', ')}` 
      }
    }
    
    return { authorized: true, user, error: null }
  } catch (error) {
    return { authorized: false, user: null, error: 'Failed to verify user role' }
  }
}

/**
 * Quick role guard - returns 403 if user doesn't have required role
 * 
 * @param {Request} request - Next.js request object
 * @param {string|string[]} requiredRoles - Role(s) required
 * @returns {{user: Object|null, response: Response|null}}
 */
export function requireRole(request, requiredRoles) {
  const { authorized, user, error } = verifyUserRole(request, requiredRoles)
  
  if (!authorized) {
    return {
      user: null,
      response: new Response(
        JSON.stringify({ error: error || 'Forbidden' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      )
    }
  }
  
  return { user, response: null }
}

/**
 * Get user ID from request (shortcut function)
 * 
 * @param {Request} request - Next.js request object
 * @returns {string|null} - User ID or null
 */
export function getUserId(request) {
  const userId = request.headers.get('x-user-id')
  return userId || null
}

/**
 * Get user email from request (shortcut function)
 * 
 * @param {Request} request - Next.js request object
 * @returns {string|null} - User email or null
 */
export function getUserEmail(request) {
  const userEmail = request.headers.get('x-user-email')
  return userEmail || null
}

/**
 * Get user sector from request (shortcut function)
 * 
 * @param {Request} request - Next.js request object
 * @returns {string|null} - User sector or null
 */
export function getUserSector(request) {
  const userSector = request.headers.get('x-user-sector')
  return userSector || null
}
