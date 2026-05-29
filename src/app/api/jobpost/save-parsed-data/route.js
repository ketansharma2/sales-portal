import { supabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

function getNormalizedEmailForDuplicateCheck(email, name, portal) {
  // Handle Indeed's random email pattern (e.g., rimpithakurxgcmg_zqd@indeedemail.com)
  if (portal === 'Indeed' && email && email.includes('@indeedemail.com')) {
    // Clean the name: lowercase, remove spaces, keep only letters
    const cleanName = name
      .toLowerCase()
      .replace(/\s/g, '')
      .replace(/[^a-z]/g, '')
    
    return `${cleanName}@indeedemail.normalized`
  }
  

  
  return email
}

export async function POST(request) {
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
    const userId = user.user_id || user.id

    const data = await request.json()

    // Validate required fields
    if (!data.name || !data.email) {
      return NextResponse.json(
        { error: 'Name and Email are required' },
        { status: 400 }
      )
    }

    // Check for duplicate entry (name, email, and mobile) - case insensitive for name
   let existingRecord = null
    let checkError = null

    const normalizedName = data.name
  ?.trim()
  .toLowerCase()

const normalizedMobile = (data.mobile || 'NA')
  .replace(/\D/g, '')

const normalizedEmail = getNormalizedEmailForDuplicateCheck(
  data.email,
  data.name,
  data.portal
)?.toLowerCase()
    
    // For Indeed users - check by name and mobile only (ignore the random email)
    if (data.portal === 'Indeed' && data.email.includes('@indeedemail.com')) {
      // Check if same name AND same mobile already exists (regardless of Indeed email)
      const { data: record, error } = await supabaseServer
        .from('cv_parsing')
        .select('id, user_id, users(name), name, email, mobile, location, qualification, experience, portal, portal_date, cv_url')
        .ilike('name', normalizedName)
        .eq('mobile', normalizedMobile)

          if (!error && record && record.length > 0) {
        existingRecord = record[0]
      }
    
      checkError = error
      
      // Also check if same name exists with any Indeed email (different random emails but same person)
      if (!existingRecord) {
        const { data: recordByName, error: errorByName } = await supabaseServer
          .from('cv_parsing')
          .select('id, user_id, users(name), name, email, mobile, location, qualification, experience, portal, portal_date, cv_url')
          .ilike('name', normalizedName)
          .ilike('email', '%@indeedemail.com')

            if (!error && recordByName && recordByName.length > 0) {
        existingRecord = recordByName[0]
      }
      checkError =  errorByName
        
      }
    } 
    // For non-Indeed users, do normal check
    else {
      const normalizedEmail = data.email?.toLowerCase()
      
      const { data: record, error } = await supabaseServer
        .from('cv_parsing')
        .select('id, user_id, users(name), name, email, mobile, location, qualification, experience, portal, portal_date, cv_url')
        .ilike('name', normalizedName)
        .eq('email', normalizedEmail)
        .eq('mobile', normalizedMobile)

         if (!error && record && record.length > 0) {
        existingRecord = record[0]
      }
      
      checkError = error
    }

    if (checkError) {
      console.error('Duplicate check error:', checkError)
      return NextResponse.json(
        { error: 'Failed to check for duplicates', details: checkError.message },
        { status: 500 }
      )
    }

    if (existingRecord) {
      // Check if it's the same user
      const isSameUser = existingRecord.user_id === userId;
      
      // Fetch conversation history for this candidate (ordered by created_at descending)
      const { data: conversations, error: convError } = await supabaseServer
        .from('candidates_conversation')
        .select(`
          conversation_id,
          parsing_id,
          user_id,
          candidate_status,
          remarks,
          relevant_exp,
          curr_ctc,
          exp_ctc,
          calling_date,
          apply_date,
          created_at,
          users!inner(name)
        `)
        .eq('parsing_id', existingRecord.id)
        .order('created_at', { ascending: false })

      console.log('Conversations fetched:', conversations)

      const userName = existingRecord.users?.name || existingRecord.user_id
      
      // If same user, return a specific error code
      if (isSameUser) {
        return NextResponse.json(
          {
            success: false,
            error: 'Already exists by same user',
            details: 'This candidate is already in your database',
            existing_candidate: {
              id: existingRecord.id,
              name: existingRecord.name,
              email: existingRecord.email,
              mobile: existingRecord.mobile,
              location: existingRecord.location,
              qualification: existingRecord.qualification,
              experience: existingRecord.experience,
              portal: existingRecord.portal,
              portal_date: existingRecord.portal_date,
              cv_url: existingRecord.cv_url
            }
          },
          { status: 200 }
        )
      }
      
      // Different user - return the full duplicate info for modal
      return NextResponse.json(
        {
          success: false,
          error: 'Data already exists',
          details: 'A record with this name, email, and mobile already exists',
          existing_user_id: existingRecord.user_id,
          existing_user_name: userName,
          existing_candidate: {
            id: existingRecord.id,
            name: existingRecord.name,
            email: existingRecord.email,
            mobile: existingRecord.mobile,
            location: existingRecord.location,
            qualification: existingRecord.qualification,
            experience: existingRecord.experience,
            portal: existingRecord.portal,
            portal_date: existingRecord.portal_date,
            cv_url: existingRecord.cv_url
          },
          conversations: conversations || []
        },
        { status: 200 }
      )
    }

    // Extract experience years from text (e.g., "2 yrs" -> 2, "Fresher" -> 0)
    let experienceYears = 0
    if (data.experience && data.experience !== 'NA') {
      const match = data.experience.match(/(\d+)/)
      if (match) {
        experienceYears = parseInt(match[1], 10)
      }
    }

    // Insert data into cv_parsing table
    const { data: result, error } = await supabaseServer
      .from('cv_parsing')
      .insert({
        user_id: userId,
        sector: data.sector || 'corporate',
        portal: data.portal || 'Other',
        portal_date: data.portal_date || new Date().toISOString().split('T')[0],
        name: data.name,
        email: data.email,
        mobile: data.mobile || 'NA',
        location: data.location || 'NA',
        gender: data.gender || 'NA',
        qualification: data.qualification || 'NA',
        experience: experienceYears,
        company_names_all: data.allCompanies || 'NA',
        designation: data.designation || 'NA',
        top_skills: data.topSkills || 'NA',
        college_name: data.collegeName || 'NA',
        skills_all: data.allSkills || 'NA',
        recent_company: data.recentCompany || 'NA',
        cv_url: data.cv_url || null,
      })
      .select()

    if (error) {
      console.error('Insert error:', error)
      return NextResponse.json(
        { error: 'Failed to save data', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Data saved successfully',
      insertedId: result[0].id,
    })
  } catch (error) {
    console.error('Save data API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
