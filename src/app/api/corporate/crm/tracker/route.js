// import { supabaseServer } from '@/lib/supabase-server';
// import { NextResponse } from 'next/server';
// import { getUser } from '@/lib/auth-helper';
// export async function GET(request) {
//   try {
//     // Authentication
//     const { user, error: authError } = getUser(request);
//     if (authError || !user) {
//       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
//     }

//     // Get current user's ID (CRM user)
//     const currentUserId = user.user_id || user.id

//     // Fetch candidates_conversation where sent_to_crm = current user
//     const { data: conversations, error: fetchError } = await supabaseServer
//       .from('candidates_conversation')
//       .select('*')
//       .eq('sent_to_crm', currentUserId)
//       .order('crm_sent_date', { ascending: false })

//     if (fetchError) {
//       console.error('Fetch CRM tracker conversations error:', fetchError)
//       return NextResponse.json({
//         error: 'Failed to fetch tracker data',
//         details: fetchError.message
//       }, { status: 500 })
//     }

//     if (!conversations || conversations.length === 0) {
//       return NextResponse.json({
//         success: true,
//         data: []
//       })
//     }

//     // Extract unique IDs for joins
//     const tlUserIds = [...new Set(conversations.map(c => c.sent_to_tl).filter(Boolean))]
//     const reqIds = [...new Set(conversations.map(c => c.req_id).filter(Boolean))]
//     const parsingIds = [...new Set(conversations.map(c => c.parsing_id).filter(Boolean))]

//     // Fetch TL names from users table
//     let tlUsersMap = new Map()
//     if (tlUserIds.length > 0) {
//       const { data: tlUsersData } = await supabaseServer
//         .from('users')
//         .select('user_id, name')
//         .in('user_id', tlUserIds)
      
//       if (tlUsersData) {
//         tlUsersMap = new Map(tlUsersData.map(u => [u.user_id, u.name]))
//       }
//     }

//     // Fetch job titles from corporate_crm_reqs
//     let reqsMap = new Map()
//     if (reqIds.length > 0) {
//       const { data: reqsData } = await supabaseServer
//         .from('corporate_crm_reqs')
//         .select('req_id, job_title')
//         .in('req_id', reqIds)
      
//       if (reqsData) {
//         reqsMap = new Map(reqsData.map(r => [r.req_id, r.job_title]))
//       }
//     }

//     // Fetch candidate details from cv_parsing table
//     let cvParsingMap = new Map()
//     if (parsingIds.length > 0) {
//       const { data: cvParsingData } = await supabaseServer
//         .from('cv_parsing')
//         .select('id, name, location, qualification, experience, redacted_cv_url, cv_url')
//         .in('id', parsingIds)
      
//       if (cvParsingData) {
//         cvParsingData.forEach(c => {
//           cvParsingMap.set(c.id, c)
//         })
//       }
//     }

//     const conversationIds = conversations.map(c => c.conversation_id)
    
//     const { data: emailData, error: emailError } = await supabaseServer
//       .from('corporate_crm_emails')
//       .select('conversation_id')
//       .in('conversation_id', conversationIds)
    
//     if (emailError) {
//       console.error('Email count fetch error:', emailError)
//     }
    
//     // Create count map
//     const emailCountMap = {}
    
//     emailData?.forEach(email => {
//       emailCountMap[email.conversation_id] =
//         (emailCountMap[email.conversation_id] || 0) + 1
//     })

//     // Transform the data with joined information
//     const transformedData = conversations.map(conversation => {
//       const cvData = cvParsingMap.get(conversation.parsing_id)
//       return {
//         conversation_id: conversation.conversation_id,
//         // TL Info
//         tl_name: tlUsersMap.get(conversation.sent_to_tl) || 'Unknown',
//         crm_sent_date: conversation.crm_sent_date ? new Date(conversation.crm_sent_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-',
//         // Req Info
//         job_title: reqsMap.get(conversation.req_id) || '-',
//         // TL Evaluation
//         cv_status: conversation.cv_status || '',
//         tl_remarks: conversation.tl_remarks || '',
//         // CTC
//         curr_ctc: conversation.curr_ctc || '-',
//         exp_ctc: conversation.exp_ctc || '-',
//         // Relevant Experience
//         relevant_exp: conversation.relevant_exp || '-',
//         // Candidate Info from cv_parsing
//         candidate_name: cvData?.name || '-',
//         candidate_location: cvData?.location || '-',
//         candidate_qualification: cvData?.qualification || '-',
//         candidate_experience: cvData?.experience !== undefined && cvData?.experience !== null ? cvData.experience : '-',
//         redacted_cv_url: cvData?.redacted_cv_url || '',
//         cv_url: cvData?.cv_url || '',
//         email_count: emailCountMap[conversation.conversation_id] || 0
//       }
//     })

//     return NextResponse.json({
//       success: true,
//       data: transformedData
//     })

//   } catch (error) {
//     console.error('CRM Tracker API error:', error)
//     return NextResponse.json({
//       error: 'Internal server error',
//       details: error.message
//     }, { status: 500 })
//   }
// }


// import { supabaseServer } from '@/lib/supabase-server';
// import { NextResponse } from 'next/server';
// import { getUser } from '@/lib/auth-helper';

// const BATCH_SIZE = 500;

// const chunkArray = (array, size) => {
//   const chunks = [];

//   for (let i = 0; i < array.length; i += size) {
//     chunks.push(array.slice(i, i + size));
//   }

//   return chunks;
// };

// export async function GET(request) {
//   try {
//     // ==========================================
//     // AUTHENTICATION
//     // ==========================================

//     const { user, error: authError } = getUser(request);

//     if (authError || !user) {
//       return NextResponse.json(
//         { error: 'Unauthorized' },
//         { status: 401 }
//       );
//     }

//     const currentUserId = user.user_id || user.id;

//     // ==========================================
//     // 1. FETCH CRM CONVERSATIONS
//     // ==========================================

//     const { data: conversations, error: fetchError } =
//       await supabaseServer
//         .from('candidates_conversation')
//         .select(`
//           conversation_id,
//           sent_to_tl,
//           req_id,
//           parsing_id,
//           crm_sent_date,
//           cv_status,
//           tl_remarks,
//           curr_ctc,
//           exp_ctc,
//           relevant_exp
//         `)
//         .eq('sent_to_crm', currentUserId)
//         .order('crm_sent_date', { ascending: false });

//     if (fetchError) {
//       console.error(
//         'Fetch CRM tracker conversations error:',
//         fetchError
//       );

//       return NextResponse.json(
//         {
//           error: 'Failed to fetch tracker data',
//           details: fetchError.message
//         },
//         { status: 500 }
//       );
//     }

//     if (!conversations || conversations.length === 0) {
//       return NextResponse.json({
//         success: true,
//         data: []
//       });
//     }

//     console.log(
//       `CRM Tracker: ${conversations.length} conversations found`
//     );

//     // ==========================================
//     // 2. EXTRACT UNIQUE IDS
//     // ==========================================

//     const tlUserIds = [
//       ...new Set(
//         conversations
//           .map(c => c.sent_to_tl)
//           .filter(Boolean)
//       )
//     ];

//     const reqIds = [
//       ...new Set(
//         conversations
//           .map(c => c.req_id)
//           .filter(Boolean)
//       )
//     ];

//     const parsingIds = [
//       ...new Set(
//         conversations
//           .map(c => c.parsing_id)
//           .filter(Boolean)
//       )
//     ];

//     const conversationIds = [
//       ...new Set(
//         conversations
//           .map(c => c.conversation_id)
//           .filter(Boolean)
//       )
//     ];

//     // ==========================================
//     // 3. CREATE MAPS
//     // ==========================================

//     const tlUsersMap = new Map();
//     const reqsMap = new Map();
//     const cvParsingMap = new Map();
//     const emailCountMap = {};

//     // ==========================================
//     // 4. FETCH TL USERS IN BATCHES
//     // ==========================================

//     const tlBatches = chunkArray(
//       tlUserIds,
//       BATCH_SIZE
//     );

//     for (const batch of tlBatches) {
//       const { data, error } = await supabaseServer
//         .from('users')
//         .select('user_id, name')
//         .in('user_id', batch);

//       if (error) {
//         console.error(
//           'TL users fetch error:',
//           error
//         );
//         continue;
//       }

//       if (data) {
//         data.forEach(user => {
//           tlUsersMap.set(
//             user.user_id,
//             user.name
//           );
//         });
//       }
//     }

//     // ==========================================
//     // 5. FETCH REQUIREMENTS IN BATCHES
//     // ==========================================

//     const reqBatches = chunkArray(
//       reqIds,
//       BATCH_SIZE
//     );

//     for (const batch of reqBatches) {
//       const { data, error } = await supabaseServer
//         .from('corporate_crm_reqs')
//         .select('req_id, job_title')
//         .in('req_id', batch);

//       if (error) {
//         console.error(
//           'Requirements fetch error:',
//           error
//         );
//         continue;
//       }

//       if (data) {
//         data.forEach(req => {
//           reqsMap.set(
//             req.req_id,
//             req.job_title
//           );
//         });
//       }
//     }

//     // ==========================================
//     // 6. FETCH CV DATA IN BATCHES
//     // ==========================================

//     const parsingBatches = chunkArray(
//       parsingIds,
//       BATCH_SIZE
//     );

//     for (const batch of parsingBatches) {
//       const { data, error } = await supabaseServer
//         .from('cv_parsing')
//         .select(`
//           id,
//           name,
//           location,
//           qualification,
//           experience,
//           redacted_cv_url,
//           cv_url
//         `)
//         .in('id', batch);

//       if (error) {
//         console.error(
//           'CV parsing fetch error:',
//           error
//         );
//         continue;
//       }

//       if (data) {
//         data.forEach(candidate => {
//           cvParsingMap.set(
//             candidate.id,
//             candidate
//           );
//         });
//       }
//     }

//     // ==========================================
//     // 7. FETCH EMAIL COUNTS IN BATCHES
//     // ==========================================

//     const conversationBatches = chunkArray(
//       conversationIds,
//       BATCH_SIZE
//     );

//     for (const batch of conversationBatches) {
//       const { data, error } = await supabaseServer
//         .from('corporate_crm_emails')
//         .select('conversation_id')
//         .in('conversation_id', batch);

//       if (error) {
//         console.error(
//           'Email count fetch error:',
//           error
//         );
//         continue;
//       }

//       if (data) {
//         data.forEach(email => {
//           const conversationId =
//             email.conversation_id;

//           emailCountMap[conversationId] =
//             (emailCountMap[conversationId] || 0) + 1;
//         });
//       }
//     }

//     // ==========================================
//     // 8. TRANSFORM DATA
//     // ==========================================

//     const transformedData = conversations.map(
//       conversation => {

//         const cvData =
//           cvParsingMap.get(
//             conversation.parsing_id
//           );

//         return {
//           conversation_id:
//             conversation.conversation_id,

//           // TL Info
//           tl_name:
//             tlUsersMap.get(
//               conversation.sent_to_tl
//             ) || 'Unknown',

//           crm_sent_date:
//             conversation.crm_sent_date
//               ? new Date(
//                   conversation.crm_sent_date
//                 ).toLocaleDateString(
//                   'en-GB',
//                   {
//                     day: '2-digit',
//                     month: 'short',
//                     year: 'numeric'
//                   }
//                 )
//               : '-',

//           // Requirement Info
//           job_title:
//             reqsMap.get(
//               conversation.req_id
//             ) || '-',

//           // TL Evaluation
//           cv_status:
//             conversation.cv_status || '',

//           tl_remarks:
//             conversation.tl_remarks || '',

//           // CTC
//           curr_ctc:
//             conversation.curr_ctc || '-',

//           exp_ctc:
//             conversation.exp_ctc || '-',

//           // Relevant Experience
//           relevant_exp:
//             conversation.relevant_exp || '-',

//           // Candidate Info
//           candidate_name:
//             cvData?.name || '-',

//           candidate_location:
//             cvData?.location || '-',

//           candidate_qualification:
//             cvData?.qualification || '-',

//           candidate_experience:
//             cvData?.experience !== undefined &&
//             cvData?.experience !== null
//               ? cvData.experience
//               : '-',

//           redacted_cv_url:
//             cvData?.redacted_cv_url || '',

//           cv_url:
//             cvData?.cv_url || '',

//           // Email Count
//           email_count:
//             emailCountMap[
//               conversation.conversation_id
//             ] || 0
//         };
//       }
//     );

//     // ==========================================
//     // 9. RESPONSE
//     // ==========================================

//     return NextResponse.json({
//       success: true,
//       data: transformedData
//     });

//   } catch (error) {
//     console.error(
//       'CRM Tracker API error:',
//       error
//     );

//     return NextResponse.json(
//       {
//         error: 'Internal server error',
//         details: error?.message || 'Unknown error'
//       },
//       { status: 500 }
//     );
//   }
// }

import { supabaseServer } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';
import { getUser } from '@/lib/auth-helper';

const BATCH_SIZE = 500;

const chunkArray = (array, size) => {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};

export async function GET(request) {
  try {
    // ==========================================
    // AUTHENTICATION
    // ==========================================
    const { user, error: authError } = getUser(request);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUserId = user.user_id || user.id;

    // ==========================================
    // 1. FETCH CRM CONVERSATIONS
    // ==========================================
    const { data: conversations, error: fetchError } = await supabaseServer
      .from('candidates_conversation')
      .select(`
        conversation_id,
        sent_to_tl,
        req_id,
        parsing_id,
        crm_sent_date,
        cv_status,
        tl_remarks,
        curr_ctc,
        exp_ctc,
        relevant_exp
      `)
      .eq('sent_to_crm', currentUserId)
      .order('crm_sent_date', { ascending: false });

    if (fetchError) {
      console.error('Fetch CRM tracker conversations error:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch tracker data', details: fetchError.message },
        { status: 500 }
      );
    }

    if (!conversations || conversations.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }

    console.log(`CRM Tracker: ${conversations.length} conversations found`);

    // ==========================================
    // 2. EXTRACT UNIQUE IDS
    // ==========================================
    const tlUserIds = [...new Set(conversations.map(c => c.sent_to_tl).filter(Boolean))];
    const reqIds = [...new Set(conversations.map(c => c.req_id).filter(Boolean))];
    const parsingIds = [...new Set(conversations.map(c => c.parsing_id).filter(Boolean))];
    const conversationIds = [...new Set(conversations.map(c => c.conversation_id).filter(Boolean))];

    // ==========================================
    // 3. CREATE MAPS (all at top level)
    // ==========================================
    const tlUsersMap = new Map();
    const reqsMap = new Map();
    const cvParsingMap = new Map();
    const emailCountMap = {};
    const conversationToEmailIds = new Map();
    const latestInterviewByEmail = new Map();

    // ==========================================
    // 4. FETCH TL USERS IN BATCHES
    // ==========================================
    const tlBatches = chunkArray(tlUserIds, BATCH_SIZE);
    for (const batch of tlBatches) {
      const { data, error } = await supabaseServer
        .from('users')
        .select('user_id, name')
        .in('user_id', batch);

      if (error) {
        console.error('TL users fetch error:', error);
        continue;
      }
      if (data) {
        data.forEach(u => tlUsersMap.set(u.user_id, u.name));
      }
    }

    // ==========================================
    // 5. FETCH REQUIREMENTS IN BATCHES
    // ==========================================
    const reqBatches = chunkArray(reqIds, BATCH_SIZE);
    for (const batch of reqBatches) {
      const { data, error } = await supabaseServer
        .from('corporate_crm_reqs')
        .select('req_id, job_title')
        .in('req_id', batch);

      if (error) {
        console.error('Requirements fetch error:', error);
        continue;
      }
      if (data) {
        data.forEach(req => reqsMap.set(req.req_id, req.job_title));
      }
    }

    // ==========================================
    // 6. FETCH CV DATA IN BATCHES
    // ==========================================
    const parsingBatches = chunkArray(parsingIds, BATCH_SIZE);
    for (const batch of parsingBatches) {
      const { data, error } = await supabaseServer
        .from('cv_parsing')
        .select(`
          id,
          name,
          location,
          qualification,
          experience,
          redacted_cv_url,
          cv_url
        `)
        .in('id', batch);

      if (error) {
        console.error('CV parsing fetch error:', error);
        continue;
      }
      if (data) {
        data.forEach(c => cvParsingMap.set(c.id, c));
      }
    }

    // ==========================================
    // 7. FETCH EMAILS (id + conversation_id)
    // ==========================================
    const conversationBatches = chunkArray(conversationIds, BATCH_SIZE);
    for (const batch of conversationBatches) {
      const { data, error } = await supabaseServer
        .from('corporate_crm_emails')
        .select('id, conversation_id')
        .in('conversation_id', batch);

      if (error) {
        console.error('Email fetch error:', error);
        continue;
      }
      if (data) {
        data.forEach(email => {
          const cid = email.conversation_id;
          emailCountMap[cid] = (emailCountMap[cid] || 0) + 1;

          if (!conversationToEmailIds.has(cid)) {
            conversationToEmailIds.set(cid, []);
          }
          conversationToEmailIds.get(cid).push(email.id);
        });
      }
    }

    // ==========================================
    // 8. FETCH LATEST INTERVIEW VIA email_draft_id
    // ==========================================
    const allEmailIds = [];
    conversationToEmailIds.forEach(ids => allEmailIds.push(...ids));

    if (allEmailIds.length > 0) {
      const emailIdBatches = chunkArray(allEmailIds, BATCH_SIZE);

      for (const batch of emailIdBatches) {
        const { data, error } = await supabaseServer
          .from('corporate_crm_interview')
          .select('email_draft_id, interview_status, date, client_remark, created_at')
          .in('email_draft_id', batch)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Interview fetch error:', error);
          continue;
        }

        if (data) {
          data.forEach(item => {
            const eid = item.email_draft_id;
            // Latest only (order desc hai)
            if (!latestInterviewByEmail.has(eid)) {
              latestInterviewByEmail.set(eid, item);
            }
          });
        }
      }
    }

    // ==========================================
    // 9. TRANSFORM DATA
    // ==========================================
    const transformedData = conversations.map(conversation => {
      const cvData = cvParsingMap.get(conversation.parsing_id);

      // Is conversation ke saare email IDs
      const emailIdsForConv = conversationToEmailIds.get(conversation.conversation_id) || [];

      // Inme se latest interview nikalo
      let latestInterview = null;
      let latestTime = 0;

      emailIdsForConv.forEach(eid => {
        const iv = latestInterviewByEmail.get(eid);
        if (iv) {
          const t = new Date(iv.created_at).getTime();
          if (t > latestTime) {
            latestTime = t;
            latestInterview = iv;
          }
        }
      });

      return {
        conversation_id: conversation.conversation_id,

        // TL Info
        tl_name: tlUsersMap.get(conversation.sent_to_tl) || 'Unknown',

        crm_sent_date: conversation.crm_sent_date
          ? new Date(conversation.crm_sent_date).toLocaleDateString('en-GB', {
              day: '2-digit',
              month: 'short',
              year: 'numeric'
            })
          : '-',

        // Requirement Info
        job_title: reqsMap.get(conversation.req_id) || '-',

        // TL Evaluation
        cv_status: conversation.cv_status || '',
        tl_remarks: conversation.tl_remarks || '',

        // CTC
        curr_ctc: conversation.curr_ctc || '-',
        exp_ctc: conversation.exp_ctc || '-',

        // Relevant Experience
        relevant_exp: conversation.relevant_exp || '-',

        // Candidate Info
        candidate_name: cvData?.name || '-',
        candidate_location: cvData?.location || '-',
        candidate_qualification: cvData?.qualification || '-',
        candidate_experience:
          cvData?.experience !== undefined && cvData?.experience !== null
            ? cvData.experience
            : '-',

        redacted_cv_url: cvData?.redacted_cv_url || '',
        cv_url: cvData?.cv_url || '',

        // Email Count
        email_count: emailCountMap[conversation.conversation_id] || 0,

        // 👇 Latest Interview Info
        latest_interview_status: latestInterview?.interview_status || null,
        latest_interview_date: latestInterview?.date || null,
        latest_interview_remark: latestInterview?.client_remark || null,
      };
    });

    // ==========================================
    // 10. RESPONSE
    // ==========================================
    return NextResponse.json({
      success: true,
      data: transformedData
    });

  } catch (error) {
    console.error('CRM Tracker API error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error?.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
}