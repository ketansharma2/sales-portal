import { supabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { getUser } from '@/lib/auth-helper'

export async function GET(request) {
    try {
        // Authentication - user injected by middleware (no auth calls needed!)
        const { user, error: authError } = getUser(request);
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch users where role contains 'LEADGEN' and sector is Corporate
        const { data: users, error } = await supabaseServer
            .from('users')
            .select('user_id, name')
            .contains('role', ['LEADGEN'])
            .ilike('sector', '%Corporate%')
            .order('name', { ascending: true });

        if (error) {
            console.error('Error fetching Leadgen users:', error);
            return Response.json({ 
                success: false, 
                message: 'Failed to fetch Leadgen users',
                error: error.message 
            }, { status: 500 });
        }

        return Response.json({
            success: true,
            data: users || []
        });

    } catch (error) {
        console.error('Unexpected error:', error);
        return Response.json({
            success: false,
            message: 'Internal server error',
            error: error.message
        }, { status: 500 });
    }
}
