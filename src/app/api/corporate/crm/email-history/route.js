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

    const currentUserId = user.user_id || user.id

    // Fetch all emails for this user
    const { data: emails, error: emailsError } = await supabaseServer
      .from('corporate_crm_emails')
      .select('*')
      .eq('user_id', currentUserId)
      .order('created_at', { ascending: false });

    if (emailsError) throw emailsError;

    // For each email, get the latest interview status, candidate contact info, and RC/TL details
     const processedData = await Promise.all(
       (emails || []).map(async (email) => {
         // Get the latest interview for this email_draft
         const { data: latestInterview } = await supabaseServer
           .from('corporate_crm_interview')
           .select('interview_status, date, client_remark, created_at')
           .eq('email_draft_id', email.id)
           .order('created_at', { ascending: false })
           .limit(1)
           .single();

         // Get candidate contact info and RC/TL details through conversation_id -> candidates_conversation
         let candidateEmail = null;
         let candidateMobile = null;
         let rcId = null;
         let tlId = null;
         let rcName = null;
         let tlName = null;
         let convData = null;
         
         if (email.conversation_id) {
           // First, get rc_id (user_id), tl_id (sent_to_tl), and parsing_id from candidates_conversation table
           const { data: convDataResult, error: convError } = await supabaseServer
             .from('candidates_conversation')
             .select('user_id, sent_to_tl, parsing_id')
             .eq('conversation_id', email.conversation_id)
             .single();
             
           convData = convDataResult;
           
           if (!convError && convData) {
            // Extract IDs
            rcId = convData.user_id || null;
            tlId = convData.sent_to_tl || null;
            
            // Get email and mobile from cv_parsing table using parsing_id
            if (convData.parsing_id) {
              const { data: parsingData, error: parsingError } = await supabaseServer
                .from('cv_parsing')
                .select('email, mobile')
                .eq('id', convData.parsing_id)
                .single();
                
              if (!parsingError && parsingData) {
                candidateEmail = parsingData.email || null;
                candidateMobile = parsingData.mobile || null;
              }
            }
            
             // Get RC name from users table (using user_id/rc_id)
             if (rcId) {
               const { data: rcUserData, error: rcUserError } = await supabaseServer
                 .from('users')
                 .select('name')
                 .eq('user_id', rcId)
                 .single();
                 
               if (!rcUserError && rcUserData) {
                 rcName = rcUserData.name || null;
               }
             }
             
             // Get TL name from users table (using sent_to_tl/tl_id)
             if (tlId) {
               const { data: tlUserData, error: tlUserError } = await supabaseServer
                 .from('users')
                 .select('name')
                 .eq('user_id', tlId)
                 .single();
                 
               if (!tlUserError && tlUserData) {
                 tlName = tlUserData.name || null;
               }
             }
          }
        }

        // Get client info (email, phone, kyc_doc) from corporate_crm_clients table using client_id
        let clientEmail = null;
        let clientPhone = null;
        let kycDoc = null;
        
        if (email.client_id) {
          const { data: clientData, error: clientError } = await supabaseServer
            .from('corporate_crm_clients')
            .select('email, phone, kyc_doc')
            .eq('client_id', email.client_id)
            .single();
            
          if (!clientError && clientData) {
            clientEmail = clientData.email || null;
            clientPhone = clientData.phone || null;
            kycDoc = clientData.kyc_doc || null;
          }
        }

         return {
           ...email,
           latest_interview_status: latestInterview?.interview_status || null,
           latest_interview_date: latestInterview?.date || null,
           latest_interview_remark: latestInterview?.client_remark || null,
           candidate_email: candidateEmail,
           candidate_mobile: candidateMobile,
           rc_id: rcId,
           tl_id: tlId,
           rc_name: rcName,
           tl_name: tlName,
           client_email: clientEmail,
           client_phone: clientPhone,
           kyc_doc: kycDoc,
           parsing_id: convData?.parsing_id || null,
         };
      })
    );

    return NextResponse.json({
      success: true,
      data: processedData,
    });
  } catch (error) {
    console.error("Error fetching email history:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch email history" },
      { status: 500 }
    );
  }
}