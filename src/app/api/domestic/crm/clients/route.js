import { supabaseServer } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const currentUserId = user.user_id || user.id

    const { data: clients, error: clientsError } = await supabaseServer
      .from('domestic_crm_clients')
      .select('client_id, company_name, email')
      .eq('user_id', currentUserId)
      .order('company_name', { ascending: true })

    if (clientsError) {
      console.error('Clients fetch error:', clientsError)
      return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 })
    }

    const clientsWithEmails = await Promise.all(
      (clients || []).map(async (client) => {
        const { data: branches, error: branchesError } = await supabaseServer
          .from('domestic_crm_branch')
          .select('branch_id')
          .eq('client_id', client.client_id)

        if (branchesError) {
          return { ...client, branchEmails: [], branchPhones: [] }
        }

        const branchIds = (branches || []).map(b => b.branch_id).filter(Boolean)

        let branchEmails = []
        let branchPhones = []
        if (branchIds.length > 0) {
          const { data: contacts, error: contactsError } = await supabaseServer
            .from('domestic_crm_contacts')
            .select('email, phone')
            .in('branch_id', branchIds)

          if (!contactsError && contacts) {
            const allEmails = contacts
              .map(c => c.email)
              .filter(email => email && email.trim() !== '')
            branchEmails = [...new Set(allEmails)]
            
            const allPhones = contacts
              .map(c => c.phone)
              .filter(phone => phone && phone.trim() !== '')
            branchPhones = [...new Set(allPhones)]
          }
        }

        return { ...client, branchEmails, branchPhones }
      })
    )

    return NextResponse.json({ success: true, data: clientsWithEmails || [] });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}