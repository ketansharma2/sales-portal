import { supabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

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

    // Query expenses with status 'PAID' (case insensitive)
    const { data: paymentHistory, error: historyError } = await supabaseServer
      .from('expenses')
      .select(`
        exp_id,
        date,
        category,
        amount,
        notes,
        file_link,
        status,
        created_at,
        paid_date,
        approved_by,
        approved_at,
        users!expenses_user_id_fkey (
          user_id,
          name,
          role
        ),
        approver:users!expenses_approved_by_fkey (
          user_id,
          name
        )
      `)
      .eq('submitted', true)
      .ilike('status', 'PAID')
      .order('paid_date', { ascending: false })

    if (historyError) {
      console.error('Payment history fetch error:', historyError)
      return NextResponse.json({
        error: 'Failed to fetch payment history',
        details: historyError.message
      }, { status: 500 })
    }

    // Format the data
    const formattedHistory = paymentHistory?.map(expense => {
      return {
        id: expense.exp_id,
        empName: expense.users.name,
        role: expense.users.role,
        category: expense.category,
        desc: expense.notes || 'No notes added',
        amount: expense.amount,
        expenseDate: new Date(expense.date).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-'),
        paidDate: expense.paid_date ? new Date(expense.paid_date).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-') : 'N/A',
        approvedBy: expense.approver?.name || expense.approved_by || '-',
        approvedAt: expense.approved_at ? new Date(expense.approved_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }).replace(/\//g, '-') : '-',
        status: 'Paid',
        file_link: expense.file_link
      };
    }) || []

    return NextResponse.json({
      success: true,
      data: formattedHistory
    })

  } catch (error) {
    console.error('Payment history API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}