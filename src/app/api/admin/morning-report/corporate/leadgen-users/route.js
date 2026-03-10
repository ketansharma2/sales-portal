import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

export async function GET(request) {
    try {
        // Fetch users where role contains 'LEADGEN' and sector is Corporate
        const { data: users, error } = await supabase
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
