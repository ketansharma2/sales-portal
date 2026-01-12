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

    // Check if user has FSE role
    const { data: userProfile, error: profileError } = await supabaseServer
      .from('users')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (profileError || !userProfile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    if (!userProfile.role || !userProfile.role.includes('FSE')) {
      return NextResponse.json({ error: 'Access denied. FSE role required.' }, { status: 403 })
    }

    const fse_id = user.id

    // Fetch manager name
    const { data: fseUser, error: fseError } = await supabaseServer
      .from('users')
      .select('manager_id')
      .eq('user_id', fse_id)
      .single();

    let managerName = 'Suresh Kumar'; // default
    if (!fseError && fseUser && fseUser.manager_id) {
      const { data: managerUser, error: managerError } = await supabaseServer
        .from('users')
        .select('name')
        .eq('user_id', fseUser.manager_id)
        .single();
      if (!managerError && managerUser) {
        managerName = managerUser.name;
      }
    }

    // Fetch assignments for the FSE
   // Fetch assignments for the FSE
const { data: assignments, error: assignError } = await supabaseServer
  .from('corporate_sm_fse_visits')
  .select(`
    *,
    corporate_leadgen_leads (
      client_id,
      company,
      location,
      state,
      emp_count,
      category,
      sourcing_date,
      reference
    )
  `)
  .eq('fse_id', fse_id)
  .order('date', { ascending: true });

    if (assignError) {
      console.error('Assignments fetch error:', assignError)
      return NextResponse.json({ error: 'Failed to fetch assignments' }, { status: 500 })
    }

    // Fetch latest interactions for the leads
    const leadIds = assignments?.map(a => a.corporate_leadgen_leads?.client_id).filter(id => id) || [];
    let latestRemarks = {};
    if (leadIds.length > 0) {
      const { data: interactions, error: intError } = await supabaseServer
        .from('corporate_leads_interaction')
        .select('client_id, remarks, date')
        .in('client_id', leadIds)
        .order('date', { ascending: false });
      if (!intError && interactions) {
        interactions.forEach(i => {
          if (!latestRemarks[i.client_id]) {
            latestRemarks[i.client_id] = i.remarks;
          }
        });
      }
    }

    // Format the response
    const formattedAssignments = assignments?.map(assignment => ({
      id: assignment.id,
      client_id: assignment.corporate_leadgen_leads?.client_id,
      company: assignment.corporate_leadgen_leads?.company,
      location: assignment.corporate_leadgen_leads?.location,
      state: assignment.corporate_leadgen_leads?.state,
      emp_count: assignment.corporate_leadgen_leads?.emp_count,
      category: assignment.corporate_leadgen_leads?.category,
      sourcing_date: assignment.corporate_leadgen_leads?.sourcing_date,
      reference: assignment.corporate_leadgen_leads?.reference,
      visit_date: assignment.date,
      sm_status: assignment.sm_status,
      fse_status: assignment.fse_status,
      created_at: assignment.created_at,
      latestRemark: latestRemarks[assignment.corporate_leadgen_leads?.client_id] || "Assigned for visit"
    })) || []

    return NextResponse.json({
      success: true,
      data: formattedAssignments,
      managerName: managerName
    })

  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}