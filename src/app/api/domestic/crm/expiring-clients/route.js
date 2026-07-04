import { supabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { getUser } from '@/lib/auth-helper';

export async function GET(request) {
  try {
      const { user, error: authError } = getUser(request);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUserId = user.user_id || user.id

    const { data: clients, error } = await supabaseServer
      .from('domestic_crm_clients')
      .select('client_id, company_name, expiry_date')
      .eq('user_id', currentUserId)
      .not('expiry_date', 'is', null)

    if (error) {
      console.error('Fetch clients error:', error)
      return NextResponse.json({ error: 'Failed to fetch clients', details: error.message }, { status: 500 })
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const thirtyDaysLater = new Date(today)
    thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 15)

    const expired = []
    const expiringSoon = []

    ;(clients || []).forEach(client => {
      if (!client.expiry_date) return
      
      const expiryDate = new Date(client.expiry_date)
      expiryDate.setHours(0, 0, 0, 0)
      
      if (expiryDate < today) {
        expired.push({
          client_id: client.client_id,
          company_name: client.company_name,
          expiry_date: client.expiry_date
        })
      } else if (expiryDate <= thirtyDaysLater) {
        expiringSoon.push({
          client_id: client.client_id,
          company_name: client.company_name,
          expiry_date: client.expiry_date
        })
      }
    })

    return NextResponse.json({
      success: true,
      expired: expired.length,
      expiringSoon: expiringSoon.length,
      list: [...expired, ...expiringSoon]
    })

  } catch (error) {
    console.error('Expiring clients API error:', error)
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 })
  }
}