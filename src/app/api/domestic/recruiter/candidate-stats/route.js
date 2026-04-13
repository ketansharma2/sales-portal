import { supabaseServer } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

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

    const currentUserId = user.user_id || user.id
    const { searchParams } = new URL(request.url)
    const fromDate = searchParams.get('fromDate')
    const toDate = searchParams.get('toDate')

    let trackerQuery = supabaseServer
      .from('candidates_conversation')
      .select('*')
      .eq('user_id', currentUserId)
      .not('sent_to_tl', 'is', null)

    if (fromDate && toDate) {
      trackerQuery = trackerQuery.gte('calling_date', fromDate).lte('calling_date', toDate)
    }

    const { data: conversations, error: convError } = await trackerQuery

    if (convError) {
      console.error('Fetch conversations error:', convError)
    }

    const filteredConversations = (conversations || []).filter(conv => {
      if (!conv.calling_date || !conv.sent_date) return false
      const callingDateStr = conv.calling_date.split('T')[0]
      const sentDateStr = conv.sent_date.split('T')[0]
      return callingDateStr === sentDateStr
    })

    let callsQuery = supabaseServer
      .from('candidates_conversation')
      .select('*')
      .eq('user_id', currentUserId)

    if (fromDate && toDate) {
      callsQuery = callsQuery.gte('calling_date', fromDate).lte('calling_date', toDate)
    }

    const { data: allConversations, error: allConvError } = await callsQuery

    if (allConvError) {
      console.error('Fetch all conversations error:', allConvError)
    }

    let newTrackerCount = 0
    let oldTrackerCount = 0
    let portalDateMap = new Map()

    if (filteredConversations && filteredConversations.length > 0) {
      const parsingIds = [...new Set(filteredConversations.map(c => c.parsing_id).filter(Boolean))]
      
      if (parsingIds.length > 0) {
        const { data: cvData } = await supabaseServer
          .from('cv_parsing')
          .select('id, portal_date')
          .in('id', parsingIds)
        
        if (cvData) {
          portalDateMap = new Map(cvData.map(c => [c.id, c.portal_date]))
          
          filteredConversations.forEach(conv => {
            if (conv.parsing_id && conv.calling_date) {
              const portalDate = portalDateMap.get(conv.parsing_id)
              if (portalDate) {
                const callingDateStr = conv.calling_date.split('T')[0]
                const portalDateStr = portalDate.split('T')[0]
                if (callingDateStr === portalDateStr) {
                  newTrackerCount++
                } else {
                  oldTrackerCount++
                }
              }
            }
          })
        }
      }
    }

    const trackerSent = newTrackerCount + oldTrackerCount

    let newCalls = 0
    let followUpCalls = 0

    if (allConversations && allConversations.length > 0) {
      const convByParsingId = {}
      allConversations.forEach(conv => {
        if (conv.parsing_id) {
          if (!convByParsingId[conv.parsing_id]) {
            convByParsingId[conv.parsing_id] = []
          }
          convByParsingId[conv.parsing_id].push(conv)
        }
      })

      Object.values(convByParsingId).forEach(convs => {
        const sortedConvs = convs.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
        
        sortedConvs.forEach((conv, index) => {
          if (index === 0) {
            newCalls++
          } else {
            followUpCalls++
          }
        })
      })
    }

    const totalCalls = newCalls + followUpCalls

    let assetQuery = supabaseServer
      .from('candidates_conversation')
      .select('calling_date, sent_date')
      .eq('user_id', currentUserId)
      .eq('candidate_status', 'Asset')

    if (fromDate && toDate) {
      assetQuery = assetQuery.gte('calling_date', fromDate).lte('calling_date', toDate)
    }

    const { data: assetData } = await assetQuery
    
    const totalAssets = (assetData || []).filter(conv => {
      if (!conv.calling_date || !conv.sent_date) return false
      const callingDateStr = conv.calling_date.split('T')[0]
      const sentDateStr = conv.sent_date.split('T')[0]
      return callingDateStr === sentDateStr
    }).length

    let conversionQuery = supabaseServer
      .from('candidates_conversation')
      .select('calling_date, sent_date')
      .eq('user_id', currentUserId)
      .eq('candidate_status', 'Conversion')

    if (fromDate && toDate) {
      conversionQuery = conversionQuery.gte('calling_date', fromDate).lte('calling_date', toDate)
    }

    const { data: conversionData } = await conversionQuery
    
    const conversions = (conversionData || []).filter(conv => {
      if (!conv.calling_date || !conv.sent_date) return false
      const callingDateStr = conv.calling_date.split('T')[0]
      const sentDateStr = conv.sent_date.split('T')[0]
      return callingDateStr === sentDateStr
    }).length

    let jdMatchQuery = supabaseServer
      .from('candidates_conversation')
      .select('calling_date, sent_date')
      .eq('user_id', currentUserId)
      .eq('cv_status', 'JD Match')
      .not('sent_to_tl', 'is', null)

    if (fromDate && toDate) {
      jdMatchQuery = jdMatchQuery.gte('calling_date', fromDate).lte('calling_date', toDate)
    }

    const { data: jdMatchData } = await jdMatchQuery
    
    const jdMatchCount = (jdMatchData || []).filter(conv => {
      if (!conv.calling_date || !conv.sent_date) return false
      const callingDateStr = conv.calling_date.split('T')[0]
      const sentDateStr = conv.sent_date.split('T')[0]
      return callingDateStr === sentDateStr
    }).length

    let detailsQuery = supabaseServer
      .from('candidates_conversation')
      .select('conversation_id, calling_date, sent_date, cv_status, req_id, parsing_id')
      .eq('user_id', currentUserId)
      .not('sent_to_tl', 'is', null)

    if (fromDate && toDate) {
      detailsQuery = detailsQuery.gte('calling_date', fromDate).lte('calling_date', toDate)
    }

    const { data: conversationData, error: detailsError } = await detailsQuery

    if (detailsError) {
      console.error('Fetch details error:', detailsError)
    }

    const filteredConversationData = (conversationData || []).filter(conv => {
      if (!conv.calling_date || !conv.sent_date) return false
      const callingDateStr = conv.calling_date.split('T')[0]
      const sentDateStr = conv.sent_date.split('T')[0]
      return callingDateStr === sentDateStr
    })

    const parsingIds = [...new Set(filteredConversationData.map(c => c.parsing_id).filter(Boolean) || [])]
    const reqIds = [...new Set(filteredConversationData.map(c => c.req_id).filter(Boolean) || [])]

    let cvParsingMap = new Map()
    if (parsingIds.length > 0) {
      const { data: cvData } = await supabaseServer
        .from('cv_parsing')
        .select('id, name, cv_url')
        .in('id', parsingIds)
      if (cvData) {
        cvData.forEach(c => cvParsingMap.set(c.id, c))
      }
    }

    let reqsMap = new Map()
    if (reqIds.length > 0) {
      const { data: reqData } = await supabaseServer
        .from('domestic_crm_reqs')
        .select('req_id, job_title')
        .in('req_id', reqIds)
      if (reqData) {
        reqData.forEach(r => reqsMap.set(r.req_id, r))
      }
    }

    const trackerDetails = filteredConversationData.map((item, index) => {
      const cvData = cvParsingMap.get(item.parsing_id)
      const reqData = reqsMap.get(item.req_id)
      return {
        sno: index + 1,
        date: item.calling_date,
        profile: reqData?.job_title || '-',
        candidateName: cvData?.name || '-',
        cvUrl: cvData?.cv_url || '',
        cvStatus: item.cv_status || '-'
      }
    })

    const accuracy = trackerSent > 0 ? Math.round((jdMatchCount / trackerSent) * 100) : 0

    return NextResponse.json({ 
      success: true, 
      trackerSent: trackerSent || 0,
      newTrackerSent: newTrackerCount || 0,
      oldTrackerSent: oldTrackerCount || 0,
      totalCalls: totalCalls || 0,
      newCalls: newCalls || 0,
      followUpCalls: followUpCalls || 0,
      totalAssets: totalAssets || 0,
      conversions: conversions || 0,
      accuracy: accuracy,
      jdMatchCount: jdMatchCount || 0,
      trackerDetails: trackerDetails
    })

  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 })
  }
}