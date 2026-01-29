import { supabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET(request, { params }) {
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

    const { id } = await params

    // Fetch client from corporate_crm_clients
    const { data: client, error: clientError } = await supabaseServer
      .from('corporate_crm_clients')
      .select('*')
      .eq('client_id', id)
      .eq('user_id', user.id) // Ensure user owns the client
      .single()

    if (clientError || !client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    // Fetch branches for this client
    const { data: branches, error: branchesError } = await supabaseServer
      .from('corporate_crm_branch')
      .select('*')
      .eq('client_id', id)
      .eq('user_id', user.id)

    if (branchesError) {
      console.error('Fetch branches error:', branchesError)
      // Don't fail the request, just log
    }

    // Fetch contacts for all branches
    const branchIds = (branches || []).map(b => b.branch_id || b.id)
    let contacts = []
    if (branchIds.length > 0) {
      const { data: contactsData, error: contactsError } = await supabaseServer
        .from('corporate_crm_contacts')
        .select('*')
        .in('branch_id', branchIds)
        .eq('user_id', user.id)

      if (contactsError) {
        console.error('Fetch contacts error:', contactsError)
      } else {
        contacts = contactsData || []
      }
    }

    // Format branches to match UI structure
    const formattedBranches = (branches || []).map(branch => {
      const branchContacts = contacts
        .filter(c => c.branch_id === branch.branch_id)
        .map(c => ({
          id: c.contact_id,
          contact_id: c.contact_id,
          name: c.name,
          role: c.designation,
          dept: c.dept,
          phone: c.phone,
          email: c.email,
          handles: c.handles,
          is_primary: c.is_primary
        }))

      return {
        id: branch.branch_id,
        branch_id: branch.branch_id,
        name: branch.branch_name,
        state: branch.state,
        type: "Branch",
        status: branch.initial_status,
        contacts: branchContacts,
        full_address: branch.full_address
      }
    })

    // Format the client data to match the UI structure
    const formattedClient = {
      id: client.client_id,
      name: client.company_name,
      onboardedOn: client.onboarding_date,
      clientType: client.client_type || '',
      industry: client.category,
      hqLocation: `${client.location}, ${client.state}`,
      gst: client.gst_details || '',
      kycStatus: client.kyc_status || '',
      contractLink: client.contract_link || '',
      termsCondition: client.tnc || '',
      kycDocLink: client.kyc_doc || '',
      emailScreenshot: client.email_ss || '',
      status: 'Active',
      branches: formattedBranches,
      contact: {
        name: client.contact_person,
        email: client.email,
        phone: client.phone
      },
      remarks: client.remarks
    }

    return NextResponse.json({
      success: true,
      data: formattedClient
    })

  } catch (error) {
    console.error('Client detail API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}

export async function PUT(request, { params }) {
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

    const { id } = await params
    const body = await request.json()
    const {
      name,
      onboardedOn,
      clientType,
      industry,
      hqLocation,
      gst,
      kycStatus,
      contractLink,
      termsCondition,
      kycDocLink,
      emailScreenshot
    } = body

    // Split hqLocation into location and state if provided
    let location = '', state = ''
    if (hqLocation) {
      const parts = hqLocation.split(',').map(p => p.trim())
      location = parts[0] || ''
      state = parts[1] || ''
    }

    // Prepare update data
    const updateData = {
      company_name: name,
      onboarding_date: onboardedOn,
      client_type: clientType,
      category: industry,
      location,
      state,
      gst_details: gst,
      kyc_status: kycStatus,
      contract_link: contractLink,
      tnc: termsCondition,
      kyc_doc: kycDocLink,
      email_ss: emailScreenshot
    }

    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key]
      }
    })

    // Update client in corporate_crm_clients
    const { data: updatedClient, error: updateError } = await supabaseServer
      .from('corporate_crm_clients')
      .update(updateData)
      .eq('client_id', id)
      .eq('user_id', user.id) // Ensure user owns the client
      .select()
      .single()

    if (updateError) {
      console.error('Update client error:', updateError)
      return NextResponse.json({
        error: 'Failed to update client',
        details: updateError.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: updatedClient
    })

  } catch (error) {
    console.error('Update client API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}