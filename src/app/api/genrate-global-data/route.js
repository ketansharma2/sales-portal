// import { NextResponse } from 'next/server'
// import { supabaseServer } from '@/lib/supabase-server'
// import * as XLSX from 'xlsx'

// export const dynamic = 'force-dynamic'
// export const runtime = 'nodejs'

// export async function GET() {
//   try {
//     const startDate = '2026-04-01'
//     const endDate = '2026-05-16'

//     console.log(`Fetching data from ${startDate} to ${endDate}`)

//     /*
//      |--------------------------------------------------------------------------
//      | Fetch CV Parsing Data
//      |--------------------------------------------------------------------------
//      */

//     const { data: cvData, error: cvError } = await supabaseServer
//       .from('cv_parsing')
//       .select(`
//         id,
//         name,
//         email,
//         mobile,
//         cv_url,
//         designation,
//         location,
//         top_skills,
//         skills_all,
//         company_names_all,
//         recent_company,
//         portal,
//         portal_date,
//         experience
//       `)
//       .gte('portal_date', startDate)
//       .lte('portal_date', endDate)
//       .order('portal_date', { ascending: false })

//     if (cvError) {
//       console.error('CV Fetch Error:', cvError)

//       return NextResponse.json(
//         { error: cvError.message },
//         { status: 500 }
//       )
//     }

//     if (!cvData || cvData.length === 0) {
//       return NextResponse.json(
//         { message: 'No data found' },
//         { status: 200 }
//       )
//     }

//     console.log(`Found ${cvData.length} CV records`)

//     /*
//      |--------------------------------------------------------------------------
//      | Get Parsing IDs
//      |--------------------------------------------------------------------------
//      */

//     const parsingIds = cvData.map(item => item.id)

//     /*
//      |--------------------------------------------------------------------------
//      | Fetch Conversations
//      |--------------------------------------------------------------------------
//      */

//     const chunkSize = 50
//     let conversations = []

//     for (let i = 0; i < parsingIds.length; i += chunkSize) {
//       const chunk = parsingIds.slice(i, i + chunkSize)

//       const { data, error } = await supabaseServer
//         .from('candidates_conversation')
//         .select(`
//           parsing_id,
//           apply_date,
//           relevant_exp,
//           curr_ctc,
//           exp_ctc,
//           remarks,
//           candidate_status,
//           created_at
//         `)
//         .in('parsing_id', chunk)
//         .order('created_at', { ascending: false })

//       if (error) {
//         console.error('Conversation Fetch Error:', error)
//         continue
//       }

//       if (data && data.length > 0) {
//         conversations.push(...data)
//       }
//     }

//     console.log(`Found ${conversations.length} conversations`)

//     /*
//      |--------------------------------------------------------------------------
//      | Latest Conversation Per Candidate
//      |--------------------------------------------------------------------------
//      */

//     const latestConv = {}

//     conversations.forEach(conv => {
//       if (!latestConv[conv.parsing_id]) {
//         latestConv[conv.parsing_id] = conv
//       }
//     })

//     /*
//      |--------------------------------------------------------------------------
//      | Prepare Excel Data
//      |--------------------------------------------------------------------------
//      */

//     const excelData = cvData.map(cv => {
//       const conv = latestConv[cv.id] || {}

//       return {
//         "Unique ID": cv.id || "",
//         "Name": cv.name || "",
//         "Email ID": cv.email || "",
//         "Mobile No": cv.mobile || "",
//         "Resume URL": cv.cv_url || "",
//         "Designation": cv.designation || "",
//         "Location": cv.location || "",
//         "Top Skills": cv.top_skills || "",
//         "Skills (All)": cv.skills_all || "",
//         "Company Names (All)": cv.company_names_all || "",
//         "Recent Company": cv.recent_company || "",
//         "Experience": cv.experience || "",
//         "Portal": cv.portal || "",
//         "Portal Date": cv.portal_date || "",
//         "Apply Date": conv.apply_date || null,
//         "Relevant Exp": conv.relevant_exp  || "",
//         "Curr CTC": conv.curr_ctc || "",
//         "Exp CTC": conv.exp_ctc || "",
//         "Feedback": conv.remarks || "",
//         "Remark": conv.candidate_status || ""
//       }
//     })

//     /*
//      |--------------------------------------------------------------------------
//      | Create Excel Sheet
//      |--------------------------------------------------------------------------
//      */

//     const worksheet = XLSX.utils.json_to_sheet(excelData)

//     worksheet['!cols'] = [
//       { wch: 40 },
//       { wch: 25 },
//       { wch: 30 },
//       { wch: 18 },
//       { wch: 45 },
//       { wch: 25 },
//       { wch: 20 },
//       { wch: 35 },
//       { wch: 50 },
//       { wch: 40 },
//       { wch: 30 },
//       { wch: 15 },
//       { wch: 15 },
//       { wch: 15 },
//       { wch: 15 },
//       { wch: 15 },
//       { wch: 15 },
//       { wch: 40 },
//       { wch: 20 },
//     ]

//     const workbook = XLSX.utils.book_new()

//     XLSX.utils.book_append_sheet(
//       workbook,
//       worksheet,
//       'Candidate History'
//     )

//     /*
//      |--------------------------------------------------------------------------
//      | Generate Excel Buffer
//      |--------------------------------------------------------------------------
//      */

//     const excelBuffer = XLSX.write(workbook, {
//       type: 'buffer',
//       bookType: 'xlsx'
//     })

//     /*
//      |--------------------------------------------------------------------------
//      | Return Response
//      |--------------------------------------------------------------------------
//      */

//     return new NextResponse(excelBuffer, {
//       status: 200,
//       headers: {
//         'Content-Type':
//           'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
//         'Content-Disposition': `attachment; filename="candidates_${startDate}_to_${endDate}.xlsx"`
//       }
//     })

//   } catch (error) {
//     console.error('Export Error:', error)

//     return NextResponse.json(
//       {
//         error:
//           error instanceof Error
//             ? error.message
//             : 'Something went wrong'
//       },
//       { status: 500 }
//     )
//   }
// }