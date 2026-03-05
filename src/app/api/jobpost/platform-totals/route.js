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
export async function GET(request) {
  try {
    // Fetch all posting_data records using admin client
    const { data: allData, error } = await supabaseAdmin
      .from('posting_data')
      .select('platform, cv_received, calls_done')

    if (error) {
      console.error('Error fetching posting_data:', error);
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Calculate totals for each platform
    const totals = {
      naukri: { cvs: 0, calls: 0 },
      indeed: { cvs: 0, calls: 0 },
      internshala: { cvs: 0, calls: 0 }
    }

    // Sum up cv_received and calls_done for each platform
    allData?.forEach(record => {
      const platform = (record.platform || '').toLowerCase()
      const cvs = record.cv_received || 0
      const calls = record.calls_done || 0

      if (platform.includes('naukri')) {
        totals.naukri.cvs += cvs
        totals.naukri.calls += calls
      } else if (platform.includes('indeed')) {
        totals.indeed.cvs += cvs
        totals.indeed.calls += calls
      } else if (platform.includes('internshala')) {
        totals.internshala.cvs += cvs
        totals.internshala.calls += calls
      }
    })

    return NextResponse.json({ 
      success: true,
      platformTotals: totals 
    })
  } catch (error) {
    console.error('Error fetching platform totals:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
