import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const sector = searchParams.get('sector') || 'Domestic';

        // Fetch users where role contains 'FSE' (as an array element) and sector matches (case-insensitive)
        const { data: users, error } = await supabase
            .from('users')
            .select('user_id, name, email, role, sector')
            .contains('role', ['FSE'])
            .ilike('sector', `%${sector}%`)
            .order('name', { ascending: true });

        if (error) {
            console.error('Error fetching FSE users:', error);
            return Response.json({ 
                success: false, 
                message: 'Failed to fetch FSE users',
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
