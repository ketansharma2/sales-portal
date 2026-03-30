import { supabaseServer } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    // Authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Get current user's ID
    const currentUserId = user.user_id || user.id

    // Fetch clients for current CRM user with email
    const { data: clients, error: clientsError } = await supabaseServer
      .from('corporate_crm_clients')
      .select('client_id, company_name, email')
      .eq('user_id', currentUserId)
      .order('company_name', { ascending: true })

    if (clientsError) {
      console.error('Clients fetch error:', clientsError)
      return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 })
    }

    // For each client, fetch branch_ids and their emails
    const clientsWithEmails = await Promise.all(
      (clients || []).map(async (client) => {
        // Get branch_ids from corporate_crm_branch using client_id
        const { data: branches, error: branchesError } = await supabaseServer
          .from('corporate_crm_branch')
          .select('branch_id')
          .eq('client_id', client.client_id)

        if (branchesError) {
          console.error('Branches fetch error:', branchesError)
          return { ...client, branchEmails: [] }
        }

        const branchIds = (branches || []).map(b => b.branch_id).filter(Boolean)

        // Get emails from corporate_crm_contacts using branch_ids
        let branchEmails = []
        if (branchIds.length > 0) {
          const { data: contacts, error: contactsError } = await supabaseServer
            .from('corporate_crm_contacts')
            .select('email')
            .in('branch_id', branchIds)

          if (!contactsError && contacts) {
            // Filter empty emails and get unique emails only
            const allEmails = contacts
              .map(c => c.email)
              .filter(email => email && email.trim() !== '')
            // Remove duplicates
            branchEmails = [...new Set(allEmails)]
          }
        }

        return { ...client, branchEmails }
      })
    )

    return NextResponse.json({ success: true, data: clientsWithEmails || [] });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
