import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Get Supabase admin client with service role key for bypassing RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// GET - Fetch platform totals from posting_data
// export async function GET(request) {
//   try {
//     // Fetch all posting_data records using admin client
//     const { data: allData, error } = await supabaseAdmin
//       .from('posting_data')
//       .select('platform, cv_received, calls_done')

//     if (error) {
//       console.error('Error fetching posting_data:', error);
//       return NextResponse.json({ error: error.message }, { status: 500 })
//     }

//     // Calculate totals for each platform
//     const totals = {
//       naukri: { cvs: 0, calls: 0 },
//       indeed: { cvs: 0, calls: 0 },
//       internshala: { cvs: 0, calls: 0 }
//     }

//     // Sum up cv_received and calls_done for each platform
//     allData?.forEach(record => {
//       const platform = (record.platform || '').toLowerCase()
//       const cvs = record.cv_received || 0
//       const calls = record.calls_done || 0

//       if (platform.includes('naukri')) {
//         totals.naukri.cvs += cvs
//         totals.naukri.calls += calls
//       } else if (platform.includes('indeed')) {
//         totals.indeed.cvs += cvs
//         totals.indeed.calls += calls
//       } else if (platform.includes('internshala')) {
//         totals.internshala.cvs += cvs
//         totals.internshala.calls += calls
//       }
//     })

//     return NextResponse.json({ 
//       success: true,
//       platformTotals: totals 
//     })
//   } catch (error) {
//     console.error('Error fetching platform totals:', error)
//     return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
//   }
// }


export async function GET(request) {
  try {
    // ✅ Auth check
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // ✅ Step 1: Fetch all conversations
    const { data: conversations, error: conversationsError } = await supabaseAdmin
      .from('candidates_conversation')
      .select('conversation_id, user_id, calling_date, call_respond, parsing_id, created_at, req_id')
      .eq('user_id', user.id)
      .not('req_id', 'is', null)
      .order('created_at', { ascending: false })
      
    if (conversationsError) {
      console.error('Error fetching conversations:', conversationsError);
      return NextResponse.json({ error: conversationsError.message }, { status: 500 })
    }

    if (!conversations || conversations.length === 0) {
      return NextResponse.json({ 
        success: true, 
        platformTotals: {
          naukri: { cvs: 0, calls: 0 },
          indeed: { cvs: 0, calls: 0 },
          internshala: { cvs: 0, calls: 0 }
        }
      })
    }

    // ✅ Step 2: Get all unique parsing_ids
    const parsingIds = [...new Set(conversations
      .map(c => c.parsing_id)
      .filter(id => id && typeof id === 'string' && id.length > 0)
    )];
                 
    // ✅ Step 3: Fetch cv_parsing data for these parsing_ids
    let cvParsingMap = new Map();
    
    if (parsingIds.length > 0) {
      const batchSize = 100;
      
      for (let i = 0; i < parsingIds.length; i += batchSize) {
        const batch = parsingIds.slice(i, i + batchSize);
        const { data: cvParsingData, error: cvError } = await supabaseAdmin
          .from('cv_parsing')
          .select('id, portal')
          .in('id', batch);
        
        if (!cvError && cvParsingData) {
          cvParsingData.forEach(parsing => {
            cvParsingMap.set(parsing.id, parsing);
          });
        }
      }
    }

    // ✅ FIX: Track unique candidates PER JOB (not globally)
    // Structure: Map<req_id, Map<portal, Set<parsing_id>>>
    const perJobUniqueCandidates = new Map();
    const perJobCalls = new Map(); // Map<req_id, Map<portal, number>>

    conversations.forEach(conv => {
      const cvParsing = conv.parsing_id ? cvParsingMap.get(conv.parsing_id) : null;
      const platform = cvParsing?.portal || 'Unknown';
      const platformLower = platform.toLowerCase();
      
      let portalKey = null;
      if (platformLower.includes('naukri')) portalKey = 'naukri';
      else if (platformLower.includes('indeed')) portalKey = 'indeed';
      else if (platformLower.includes('internshala')) portalKey = 'internshala';
      else return;
      
      const reqId = conv.req_id;
      
      // Initialize per job structures
      if (!perJobUniqueCandidates.has(reqId)) {
        perJobUniqueCandidates.set(reqId, new Map());
        perJobCalls.set(reqId, new Map());
      }
      
      const jobUniqueMap = perJobUniqueCandidates.get(reqId);
      const jobCallsMap = perJobCalls.get(reqId);
      
      if (!jobUniqueMap.has(portalKey)) {
        jobUniqueMap.set(portalKey, new Set());
        jobCallsMap.set(portalKey, 0);
      }
      
      // ✅ Add unique candidate (per job, per portal)
      if (conv.parsing_id) {
        jobUniqueMap.get(portalKey).add(conv.parsing_id);
      }
      
      // ✅ Count calls (all conversations)
      const hasCall = (conv.calling_date || (conv.call_respond && conv.call_respond.trim() !== ''));
      if (hasCall) {
        jobCallsMap.set(portalKey, jobCallsMap.get(portalKey) + 1);
      }
    });

    // ✅ Sum across all jobs
    const totals = {
      naukri: { cvs: 0, calls: 0 },
      indeed: { cvs: 0, calls: 0 },
      internshala: { cvs: 0, calls: 0 }
    };

    // Sum unique candidates per job (not globally unique)
    for (const [reqId, jobUniqueMap] of perJobUniqueCandidates.entries()) {
      for (const [portal, uniqueSet] of jobUniqueMap.entries()) {
        totals[portal].cvs += uniqueSet.size;
      }
    }

    // Sum calls per job
    for (const [reqId, jobCallsMap] of perJobCalls.entries()) {
      for (const [portal, callCount] of jobCallsMap.entries()) {
        totals[portal].calls += callCount;
      }
    }

    return NextResponse.json({ 
      success: true,
      platformTotals: totals,
      summary: {
        totalConversations: conversations.length,
        totalUniqueCVs: Object.values(totals).reduce((sum, t) => sum + t.cvs, 0),
        totalCalls: Object.values(totals).reduce((sum, t) => sum + t.calls, 0)
      }
    })

  } catch (error) {
    console.error('Error fetching platform totals:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}