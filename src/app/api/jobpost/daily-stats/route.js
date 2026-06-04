import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// GET - Fetch daily platform stats from posting_data for a specific date
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");

    if (!date) {
      return NextResponse.json(
        { error: "Missing required parameter: date" },
        { status: 400 }
      );
    }

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

    // ✅ Step 1: Fetch conversations for specific date
    const { data: conversations, error: conversationsError } = await supabaseAdmin
      .from('candidates_conversation')
      .select('conversation_id, user_id, calling_date, call_respond, parsing_id, created_at, req_id, apply_date')
      .eq('user_id', user.id)
      .not('req_id', 'is', null)
      // Filter by date (using apply_date or created_at)
      .eq('apply_date', date)
      .order('created_at', { ascending: false })

    if (conversationsError) {
      console.error('Error fetching conversations:', conversationsError);
      return NextResponse.json({ error: conversationsError.message }, { status: 500 })
    }

    if (!conversations || conversations.length === 0) {
      return NextResponse.json({ 
        success: true, 
        date: date,
        stats: []
      })
    }

    // ✅ Step 2: Get all unique parsing_ids
    const parsingIds = [...new Set(conversations
      .map(c => c.parsing_id)
      .filter(id => id && typeof id === 'string' && id.length > 0)
    )];

    // ✅ Step 3: Fetch cv_parsing data for portal info
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

    // ✅ Step 4: Track unique candidates for CV, all conversations for calls
    const platformStats = {};

    conversations.forEach(conv => {
      const cvParsing = conv.parsing_id ? cvParsingMap.get(conv.parsing_id) : null;
      const platform = cvParsing?.portal || 'Unknown';
      const platformLower = platform.toLowerCase();
      
      // Normalize platform name
      let normalizedPlatform = 'Unknown';
      if (platformLower.includes('naukri')) {
        normalizedPlatform = 'Naukri';
      } else if (platformLower.includes('indeed')) {
        normalizedPlatform = 'Indeed';
      } else if (platformLower.includes('internshala')) {
        normalizedPlatform = 'Internshala';
      } else {
        return; // Skip other portals
      }

      if (!platformStats[normalizedPlatform]) {
        platformStats[normalizedPlatform] = {
          platform: normalizedPlatform,
          uniqueCandidates: new Set(),  // For CV count (unique parsing_id)
          totalCalls: 0                 // For calls count (all conversations with calls)
        };
      }

      // ✅ CV: Count unique parsing_id (each candidate counted once)
      if (conv.parsing_id) {
        platformStats[normalizedPlatform].uniqueCandidates.add(conv.parsing_id);
      }
      
      // ✅ Calls: Count ALL conversations with calls (every call counted)
      const hasCall = (conv.calling_date || (conv.call_respond && conv.call_respond.trim() !== ''));
      if (hasCall) {
        platformStats[normalizedPlatform].totalCalls++;
      }
    });

    // Convert to array format
    const statsArray = Object.values(platformStats).map(stat => ({
      platform: stat.platform,
      cvsReceived: stat.uniqueCandidates.size,  // Unique candidates count
      callingDone: stat.totalCalls               // All calls count
    }));

    return NextResponse.json({ 
      success: true,
      date: date,
      stats: statsArray,
      summary: {
        totalConversations: conversations.length,
        totalUniqueCVs: statsArray.reduce((sum, s) => sum + s.cvsReceived, 0),
        totalCalls: statsArray.reduce((sum, s) => sum + s.callingDone, 0)
      }
    })

  } catch (error) {
    console.error('Error fetching daily stats:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
