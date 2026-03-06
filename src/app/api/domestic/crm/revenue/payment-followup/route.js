import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const revenue_id = searchParams.get('revenue_id');
    
    let query = supabase
      .from('domestic_payment_followup')
      .select('*')
      .order('contact_date', { ascending: false });
    
    if (revenue_id) {
      query = query.eq('id', revenue_id);
    }
    
    const { data, error } = await query;

    if (error) {
      console.error("Supabase error:", error);
      return Response.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      data: data || []
    });

  } catch (error) {
    console.error("Error fetching payment followups:", error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    // Get the user from the token
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return Response.json({ success: false, error: 'No authorization header' }, { status: 401 });
    }
    
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return Response.json({ success: false, error: 'Invalid token' }, { status: 401 });
    }
    
    // Get user_id from users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('user_id')
      .eq('email', user.email)
      .single();
    
    const crmId = userError ? user.id : userData?.user_id;
    
    const body = await request.json();
    
    const {
      revenue_id,
      contact_date,
      remarks,
      next_follow_up,
      payment_status
    } = body;

    // Validate required fields
    if (!contact_date || !remarks || !payment_status) {
      return Response.json(
        { success: false, error: "Contact date, remarks, and payment status are required" },
        { status: 400 }
      );
    }

    // Insert the payment followup record
    const { data, error } = await supabase
      .from("domestic_payment_followup")
      .insert({
        id: revenue_id || null,
        contact_date,
        remarks,
        next_follow_up: next_follow_up || null,
        payment_status,
        crm_id: crmId || null
      })
      .select();

    if (error) {
      console.error("Supabase error:", error);
      return Response.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      data: data[0]
    });

  } catch (error) {
    console.error("Error creating payment followup:", error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
