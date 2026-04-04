import { supabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function PUT(request, { params }) {
  const { id: branchId } = await params
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

    const body = await request.json()
    const { branch_name, state, city, full_address, initial_status } = body

    if (!branchId) {
      return NextResponse.json({ error: 'Branch ID is required' }, { status: 400 })
    }

    const { data: updatedBranch, error: updateError } = await supabaseServer
      .from('corporate_crm_branch')
      .update({
        branch_name: branch_name || null,
        state: state || null,
        city: city || null,
        full_address: full_address || null,
        initial_status: initial_status || null
      })
      .eq('branch_id', branchId)
      .select()
      .single()

    if (updateError) {
      console.error('Update branch error:', updateError)
      return NextResponse.json({
        error: 'Failed to update branch',
        details: updateError.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: updatedBranch
    })

  } catch (error) {
    console.error('Update branch API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}
