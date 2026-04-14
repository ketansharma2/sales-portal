import { supabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

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

    const { searchParams } = new URL(request.url)
    const client_id = searchParams.get('client_id')
    const sent_to_tl = searchParams.get('sent_to_tl')
    const workbench_id = searchParams.get('workbench_id')

    let query = supabaseServer
      .from('domestic_workbench')
      .select('*')
      .order('created_at', { ascending: false })

    if (client_id) {
      query = query.eq('client_id', client_id)
    }
    if (sent_to_tl) {
      query = query.eq('sent_to_tl', sent_to_tl)
    }

    const { data: workbenchData, error: fetchError } = await query

    if (fetchError) {
      console.error('Fetch workbench error:', fetchError)
      return NextResponse.json({
        error: 'Failed to fetch workbench data',
        details: fetchError.message
      }, { status: 500 })
    }

    const clientIds = [...new Set(workbenchData.map(item => item.client_id).filter(Boolean))]
    const reqIds = [...new Set(workbenchData.map(item => item.req_id).filter(Boolean))]
    const tlIds = [...new Set(workbenchData.map(item => item.sent_to_tl).filter(Boolean))]
    const recruiterIds = [...new Set(workbenchData.map(item => item.sent_to_rc).filter(Boolean))]

    console.log('Workbench data count:', workbenchData?.length || 0)
    console.log('Client IDs:', clientIds)
    console.log('Req IDs:', reqIds)

    const { data: clientsData } = await supabaseServer
      .from('domestic_crm_clients')
      .select('client_id, company_name')
      .in('client_id', clientIds)

    const { data: reqsData, error: reqsError } = reqIds.length > 0 ? await supabaseServer
      .from('domestic_crm_reqs')
      .select('req_id, job_title, experience, package, openings')
      .in('req_id', reqIds) : { data: [] }

    if (reqsError) {
      console.error('Fetch requirements error:', reqsError)
    }

    const { data: usersData } = await supabaseServer
      .from('users')
      .select('user_id, name, email')
      .in('user_id', tlIds)

    const { data: rcUsersData } = await supabaseServer
      .from('users')
      .select('user_id, name, email')
      .in('user_id', recruiterIds)

    const countsPromises = workbenchData.map(async (item) => {
      if (!item.req_id || !item.sent_to_rc || !item.date) return { workbench_id: item.workbench_id, tracker_sent: 0, today_asset: 0, today_conversion: 0, cv_naukri: 0, cv_indeed: 0, cv_other: 0, totalCv: 0 };

      const { count: trackerCount } = await supabaseServer
        .from('candidates_conversation')
        .select('*', { count: 'exact', head: true })
        .eq('req_id', item.req_id)
        .eq('user_id', item.sent_to_rc)
        .eq('calling_date', item.date);

      const { count: assetCount } = await supabaseServer
        .from('candidates_conversation')
        .select('*', { count: 'exact', head: true })
        .eq('req_id', item.req_id)
        .eq('user_id', item.sent_to_rc)
        .eq('calling_date', item.date)
        .eq('candidate_status', 'Asset');

      const { count: conversionCount } = await supabaseServer
        .from('candidates_conversation')
        .select('*', { count: 'exact', head: true })
        .eq('req_id', item.req_id)
        .eq('user_id', item.sent_to_rc)
        .eq('calling_date', item.date)
        .eq('candidate_status', 'Conversion');

      const { data: trackerRows } = await supabaseServer
        .from('candidates_conversation')
        .select('parsing_id')
        .eq('req_id', item.req_id)
        .eq('user_id', item.sent_to_rc)
        .eq('calling_date', item.date)
        .not('parsing_id', 'is', null);

      const parsingIds = [...new Set(trackerRows?.map(r => r.parsing_id).filter(Boolean))];

      let cv_naukri = 0, cv_indeed = 0, cv_other = 0;
      if (parsingIds.length > 0) {
        const { data: cvData } = await supabaseServer
          .from('cv_parsing')
          .select('portal')
          .in('id', parsingIds)
          .eq('portal_date', item.date);

        cv_naukri = cvData?.filter(c => c.portal === 'Naukri').length || 0;
        cv_indeed = cvData?.filter(c => c.portal === 'Indeed').length || 0;
        cv_other = cvData?.filter(c => c.portal === 'Other').length || 0;
      }

      return {
        workbench_id: item.workbench_id,
        tracker_sent: trackerCount || 0,
        today_asset: assetCount || 0,
        today_conversion: conversionCount || 0,
        cv_naukri,
        cv_indeed,
        cv_other,
        totalCv: cv_naukri + cv_indeed + cv_other
      };
    });

    const countsResults = await Promise.all(countsPromises);
    const trackerSentMap = new Map(countsResults.map(r => [r.workbench_id, r.tracker_sent]));
    const todayAssetMap = new Map(countsResults.map(r => [r.workbench_id, r.today_asset]));
    const todayConversionMap = new Map(countsResults.map(r => [r.workbench_id, r.today_conversion]));
    const cvNaukriMap = new Map(countsResults.map(r => [r.workbench_id, r.cv_naukri]));
    const cvIndeedMap = new Map(countsResults.map(r => [r.workbench_id, r.cv_indeed]));
    const cvOtherMap = new Map(countsResults.map(r => [r.workbench_id, r.cv_other]));
    const totalCvMap = new Map(countsResults.map(r => [r.workbench_id, r.totalCv]));

    const clientsMap = new Map(clientsData?.map(c => [c.client_id, c]) || [])
    const reqsMap = new Map(reqsData?.map(r => [r.req_id, r]) || [])
    const usersMap = new Map(usersData?.map(u => [u.user_id, u]) || [])
    const rcUsersMap = new Map(rcUsersData?.map(u => [u.user_id, u]) || [])

    const transformedData = workbenchData.map(item => {
      const client = clientsMap.get(item.client_id)
      const req = reqsMap.get(item.req_id)
      const tl = usersMap.get(item.sent_to_tl)
      const rc = rcUsersMap.get(item.sent_to_rc)

      return {
        id: item.workbench_id,
        date: item.date,
        client_id: item.client_id,
        client_name: client?.company_name || 'Unknown Client',
        req_id: item.req_id,
        job_title: req?.job_title || 'Unknown Requirement',
        experience: req?.experience || '',
        package: item.package || req?.package || '',
        openings: req?.openings || 0,
        requirement: item.req,
        sent_to_tl: item.sent_to_tl,
        tl_name: tl?.name || 'Unknown TL',
        tl_email: tl?.email || '',
        sent_to_rc: item.sent_to_rc,
        rc_name: rc?.name || '',
        user_id: item.user_id,
        created_at: item.created_at,
        advance_sti: item.advance_sti || '',
        rc_remarks: item.rc_remarks || '',
        tl_remarks: item.tl_remarks || '',
        cv_remarks: item.cv_remarks || '',
status: item.status || 'Pending',
        tracker_sent: trackerSentMap.get(item.workbench_id) || 0,
        today_asset: todayAssetMap.get(item.workbench_id) || 0,
        today_conversion: todayConversionMap.get(item.workbench_id) || 0,
        cv_naukri: cvNaukriMap.get(item.workbench_id) || 0,
        cv_indeed: cvIndeedMap.get(item.workbench_id) || 0,
        cv_other: cvOtherMap.get(item.workbench_id) || 0,
        totalCv: totalCvMap.get(item.workbench_id) || 0
      }
    })

    return NextResponse.json({
      success: true,
      data: transformedData
    })

  } catch (error) {
    console.error('Fetch workbench API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}

export async function POST(request) {
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
    const {
      date,
      client_id,
      req_id,
      package_salary,
      req,
      sent_to_tl,
      sent_to_rc
    } = body

    if (!date || !client_id || !req_id || !sent_to_tl) {
      return NextResponse.json({
        error: 'Date, client_id, req_id, and sent_to_tl are required'
      }, { status: 400 })
    }

    const { data: newWorkbench, error: insertError } = await supabaseServer
      .from('domestic_workbench')
      .insert({
        date,
        client_id,
        req_id,
        package: package_salary,
        req: req ? parseInt(req) : null,
        sent_to_tl,
        sent_to_rc: sent_to_rc || null,
        user_id: user.user_id || user.id
      })
      .select()
      .single()

    if (insertError) {
      console.error('Insert workbench error:', insertError)
      return NextResponse.json({
        error: 'Failed to assign workbench',
        details: insertError.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: newWorkbench
    })

  } catch (error) {
    console.error('Assign workbench API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}

export async function PUT(request) {
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
    const {
      workbench_id,
      date,
      client_id,
      req_id,
      package_salary,
      req,
      sent_to_tl,
      sent_to_rc
    } = body

    if (!workbench_id) {
      return NextResponse.json({
        error: 'workbench_id is required'
      }, { status: 400 })
    }

    const { data: updatedWorkbench, error: updateError } = await supabaseServer
      .from('domestic_workbench')
      .update({
        date,
        client_id,
        req_id,
        package: package_salary,
        req: req ? parseInt(req) : null,
        sent_to_tl,
        sent_to_rc: sent_to_rc || null
      })
      .eq('workbench_id', workbench_id)
      .select()
      .single()

    if (updateError) {
      console.error('Update workbench error:', updateError)
      return NextResponse.json({
        error: 'Failed to update workbench',
        details: updateError.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: updatedWorkbench
    })

  } catch (error) {
    console.error('Update workbench API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}

export async function DELETE(request) {
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

    const { searchParams } = new URL(request.url)
    const workbench_id = searchParams.get('workbench_id')

    if (!workbench_id) {
      return NextResponse.json({
        error: 'workbench_id is required'
      }, { status: 400 })
    }

    const { error: deleteError } = await supabaseServer
      .from('domestic_workbench')
      .delete()
      .eq('workbench_id', workbench_id)

    if (deleteError) {
      console.error('Delete workbench error:', deleteError)
      return NextResponse.json({
        error: 'Failed to delete workbench',
        details: deleteError.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Workbench deleted successfully'
    })

  } catch (error) {
    console.error('Delete workbench API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}