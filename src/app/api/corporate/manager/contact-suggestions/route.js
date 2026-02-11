import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseServer = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("client_id");

    if (!clientId) {
      return new Response(
        JSON.stringify({ success: false, error: "client_id is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Fetch contact person, email, and contact_no from corporate_leads_interaction
    const { data: leadgenData, error: leadgenError } = await supabaseServer
      .from('corporate_leads_interaction')
      .select('contact_person, email, contact_no')
      .eq('client_id', clientId);

    if (leadgenError) {
      console.error("Error fetching from corporate_leads_interaction:", leadgenError);
    }

    // Fetch contact person, email, and contact_no from corporate_manager_interaction
    const { data: managerData, error: managerError } = await supabaseServer
      .from('corporate_manager_interaction')
      .select('contact_person, email, contact_no')
      .eq('client_id', clientId);

    if (managerError) {
      console.error("Error fetching from corporate_manager_interaction:", managerError);
    }

    // Combine and deduplicate contact persons
    const allContactPersons = [
      ...(leadgenData || []).map(d => d.contact_person).filter(Boolean),
      ...(managerData || []).map(d => d.contact_person).filter(Boolean)
    ];
    const uniqueContactPersons = [...new Set(allContactPersons)];

    // Combine and deduplicate emails
    const allEmails = [
      ...(leadgenData || []).map(d => d.email).filter(Boolean),
      ...(managerData || []).map(d => d.email).filter(Boolean)
    ];
    const uniqueEmails = [...new Set(allEmails)];

    // Combine and deduplicate contact numbers
    const allContactNos = [
      ...(leadgenData || []).map(d => d.contact_no).filter(Boolean),
      ...(managerData || []).map(d => d.contact_no).filter(Boolean)
    ];
    const uniqueContactNos = [...new Set(allContactNos)];

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          contactPersons: uniqueContactPersons,
          emails: uniqueEmails,
          contactNos: uniqueContactNos
        }
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in contact-suggestions API:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
