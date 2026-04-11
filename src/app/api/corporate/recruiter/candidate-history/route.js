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

    const { searchParams } = new URL(request.url)
    const parsingId = searchParams.get('parsing_id')

    if (!parsingId) {
      return NextResponse.json({ error: 'Parsing ID is required' }, { status: 400 })
    }

    // Fetch conversations for the specific parsing_id with requirement details
    const { data, error } = await supabaseServer
      .from('candidates_conversation')
      .select('*')
      .eq('parsing_id', parsingId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Fetch conversations error:', error)
      return NextResponse.json({
        error: 'Failed to fetch conversations',
        details: error.message
      }, { status: 500 })
    }

    // Fetch user names for all user_ids in conversations
    let userNamesMap = new Map()
    if (data && data.length > 0) {
      const userIds = [...new Set(data.map(item => item.user_id).filter(Boolean))]
      console.log('User IDs in conversations:', userIds)
      if (userIds.length > 0) {
        const { data: userData, error: userError } = await supabaseServer
          .from('users')
          .select('user_id, name')
          .in('user_id', userIds)
        
        console.log('User data from users table:', userData, userError)
        
        if (userData) {
          userNamesMap = new Map(userData.map(u => [u.user_id, u.name]))
        }
      }
    }

    // If there are conversations with req_id, fetch the job titles and company names
    let reqsMap = new Map()
    let reqToCompanyMap = new Map()
    if (data && data.length > 0) {
      const reqIds = [...new Set(data.map(item => item.req_id).filter(Boolean))]
      if (reqIds.length > 0) {
        // Fetch requirements with branch info
        const { data: requirements } = await supabaseServer
          .from('corporate_crm_reqs')
          .select('req_id, job_title, branch_id')
          .in('req_id', reqIds)
        
        if (requirements) {
          console.log('Requirements:', requirements)
          reqsMap = new Map(requirements.map(r => [r.req_id, r.job_title]))
          
          // Get unique branch_ids
          const branchIds = [...new Set(requirements.map(r => r.branch_id).filter(Boolean))]
          console.log('Branch IDs:', branchIds)
          if (branchIds.length > 0) {
            // Fetch branches to get client_id
            const { data: branches } = await supabaseServer
              .from('corporate_crm_branch')
              .select('branch_id, client_id')
              .in('branch_id', branchIds)
            
            console.log('Branches:', branches)
            if (branches) {
              const branchMap = new Map(branches.map(b => [b.branch_id, b.client_id]))
              const clientIds = [...new Set(branches.map(b => b.client_id).filter(Boolean))]
              console.log('Client IDs:', clientIds)
              
              if (clientIds.length > 0) {
                // Fetch clients to get company_name
                const { data: clients } = await supabaseServer
                  .from('corporate_crm_clients')
                  .select('client_id, company_name')
                  .in('client_id', clientIds)
                
                console.log('Clients:', clients)
                if (clients) {
                  const clientMap = new Map(clients.map(c => [c.client_id, c.company_name]))
                  // Map company names directly to req_ids
                  requirements.forEach(r => {
                    const clientId = branchMap.get(r.branch_id)
                    if (clientId) {
                      reqToCompanyMap.set(r.req_id, clientMap.get(clientId) || null)
                    }
                  })
                  console.log('Req to Company Map:', reqToCompanyMap)
                }
              }
            }
          }
        }
      }
    }

    // If there are conversations with sent_to_tl, fetch the TL names
    let tlNamesMap = new Map()
    if (data && data.length > 0) {
      const tlIds = [...new Set(data.map(item => item.sent_to_tl).filter(Boolean))]
      if (tlIds.length > 0) {
        const { data: tlUsers } = await supabaseServer
          .from('users')
          .select('user_id, name')
          .in('user_id', tlIds)
        
        if (tlUsers) {
          tlNamesMap = new Map(tlUsers.map(u => [u.user_id, u.name]))
        }
      }
    }

    // Add job_title, company_name and tl_name to the response
    const enrichedData = data?.map(item => ({
      ...item,
      rc_name: userNamesMap.get(item.user_id) || item.user_id || null,
      job_title: reqsMap.get(item.req_id) || null,
      company_name: item.req_id ? (reqToCompanyMap.get(item.req_id) || null) : null,
      tl_name: tlNamesMap.get(item.sent_to_tl) || null
    })) || []

    return NextResponse.json({
      success: true,
      data: enrichedData
    })

  } catch (error) {
    console.error('Get conversations API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}

export async function POST(request) {
  console.log('POST request received for candidate history')
  try {
    // Authentication
    const authHeader = request.headers.get('authorization')
    console.log('Auth header:', authHeader ? 'present' : 'missing')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const body = await request.json()
    console.log('Request body:', body)
    const { 
      parsing_id, 
      req_id, 
      candidate_status, 
      remarks, 
      relevant_exp, 
      curr_ctc, 
      exp_ctc, 
      sent_to_tl,
      apply_date,
      calling_date,
      slot
    } = body

    // Validate required fields
    if (!parsing_id) {
      console.log('Validation failed: missing parsing_id')
      return NextResponse.json({ error: 'Parsing ID is required' }, { status: 400 })
    }

    const insertData = {
      user_id: user.id,
      parsing_id,
      req_id: req_id || null,
      candidate_status: candidate_status || null,
      remarks: remarks || null,
      relevant_exp: relevant_exp || null,
      curr_ctc: curr_ctc || null,
      exp_ctc: exp_ctc || null,
      sent_to_tl: sent_to_tl || null,
      apply_date: apply_date || null,
      calling_date: calling_date || null,
      slot: slot || null
    }

    console.log('Inserting data:', insertData)

    const { data, error } = await supabaseServer
      .from('candidates_conversation')
      .insert([insertData])
      .select()

    if (error) {
      console.error('Insert conversation error:', error)
      return NextResponse.json({
        error: 'Failed to insert candidate conversation',
        details: error.message
      }, { status: 500 })
    }

    console.log('Insert successful, data:', data)
    return NextResponse.json({
      success: true,
      data: data[0]
    })

  } catch (error) {
    console.error('Post candidate history API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}

export async function PUT(request) {
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

    const body = await request.json()
    const { 
      conversation_id,
      candidate_status, 
      remarks, 
      relevant_exp, 
      curr_ctc, 
      exp_ctc, 
      apply_date,
      calling_date,
      slot,
      sent_to_tl,
      sent_date
    } = body

    // Validate required fields
    if (!conversation_id) {
      return NextResponse.json({ error: 'Conversation ID is required' }, { status: 400 })
    }

    // Build update object - only include fields that are explicitly provided
    const updateData = {}
    
    if (candidate_status !== undefined) updateData.candidate_status = candidate_status
    if (remarks !== undefined) updateData.remarks = remarks
    if (relevant_exp !== undefined) updateData.relevant_exp = relevant_exp
    if (curr_ctc !== undefined) updateData.curr_ctc = curr_ctc
    if (exp_ctc !== undefined) updateData.exp_ctc = exp_ctc
    if (apply_date !== undefined) updateData.apply_date = apply_date
    if (calling_date !== undefined) updateData.calling_date = calling_date
    if (slot !== undefined) updateData.slot = slot
    if (sent_to_tl !== undefined) updateData.sent_to_tl = sent_to_tl
    if (sent_date !== undefined) updateData.sent_date = sent_date

    const { data, error } = await supabaseServer
      .from('candidates_conversation')
      .update(updateData)
      .eq('conversation_id', conversation_id)
      .select()

    if (error) {
      console.error('Update conversation error:', error)
      return NextResponse.json({
        error: 'Failed to update candidate conversation',
        details: error.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: data[0]
    })

  } catch (error) {
    console.error('Put candidate history API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}

export async function DELETE(request) {
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

    const { searchParams } = new URL(request.url)
    const conversationId = searchParams.get('conversation_id')

    if (!conversationId) {
      return NextResponse.json({ error: 'Conversation ID is required' }, { status: 400 })
    }

    const { error } = await supabaseServer
      .from('candidates_conversation')
      .delete()
      .eq('conversation_id', conversationId)

    if (error) {
      console.error('Delete conversation error:', error)
      return NextResponse.json({
        error: 'Failed to delete candidate conversation',
        details: error.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Conversation deleted successfully'
    })

  } catch (error) {
    console.error('Delete candidate history API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}