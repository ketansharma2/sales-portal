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

    // Fetch posting_data records for the specific date
    const { data: allData, error } = await supabaseAdmin
      .from('posting_data')
      .select('platform, cv_received, calls_done, date')
      .eq('date', date)

    if (error) {
      console.error('Error fetching daily stats:', error);
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Group by platform and sum up cv_received and calls_done
    const platformStats = {};

    allData?.forEach(record => {
      const platform = (record.platform || '').toLowerCase();
      
      // Normalize platform name
      let normalizedPlatform = 'Unknown';
      if (platform.includes('naukri')) {
        normalizedPlatform = 'Naukri';
      } else if (platform.includes('indeed')) {
        normalizedPlatform = 'Indeed';
      } else if (platform.includes('internshala')) {
        normalizedPlatform = 'Internshala';
      }

      if (!platformStats[normalizedPlatform]) {
        platformStats[normalizedPlatform] = {
          platform: normalizedPlatform,
          cvsReceived: 0,
          callingDone: 0
        };
      }

      platformStats[normalizedPlatform].cvsReceived += record.cv_received || 0;
      platformStats[normalizedPlatform].callingDone += record.calls_done || 0;
    });

    // Convert to array
    const statsArray = Object.values(platformStats);

    return NextResponse.json({ 
      success: true,
      date: date,
      stats: statsArray
    })
  } catch (error) {
    console.error('Error fetching daily stats:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
