import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import mammoth from "mammoth";
import { supabaseServer } from '@/lib/supabase-server'
import { getUser } from '@/lib/auth-helper'

// export async function GET(request) {
//   try {
//     // Authentication
//     const authHeader = request.headers.get('authorization')
//     if (!authHeader) {
//       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
//     }
//     const token = authHeader.replace('Bearer ', '')
//     const { data: { user }, error: authError } = await supabaseServer.auth.getUser(token)
//     if (authError || !user) {
//       return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
//     }

//     const userId = user.user_id || user.id

//     // First get user's own records
//     const { data: myData, error: myError } = await supabaseServer
//       .from('cv_parsing')
//       .select('*')
//       .eq('user_id', userId)
//       .order('created_at', { ascending: false })

//     // Then get records where other_users contains userId
//     const { data: sharedData, error: sharedError } = await supabaseServer
//       .from('cv_parsing')
//       .select('*')
//       .contains('other_users', [userId])
//       .order('created_at', { ascending: false })

//     if (myError || sharedError) {
//       console.error('Fetch CV parsing error:', myError || sharedError)
//       return NextResponse.json({
//         error: 'Failed to fetch CV parsing data',
//         details: myError?.message || sharedError?.message
//       }, { status: 500 })
//     }

//     // Combine and mark shared records
//     const allData = [...(myData || []), ...(sharedData || [])]
    
//     // Remove duplicates (in case user is in both)
//     const uniqueData = allData.filter((item, index, self) => 
//       index === self.findIndex((t) => t.id === item.id)
//     )

//     // Get all candidate IDs for fetching latest status
//     const candidateIds = uniqueData.map(item => item.id)

//     // Fetch conversations with post_id and remarks
//     let latestStatusMap = new Map()
//     let postIdToJobTitle = new Map()

//     if (candidateIds.length > 0) {
//       const { data: conversations, error: convError } = await supabaseServer
//         .from('candidates_conversation')
//         .select(`
//           parsing_id,
//           candidate_status,
//           calling_date,
//           created_at,
//           remarks,
//           post_id,
//           user_id,
//           users!inner(name)
//         `)
//         .in('parsing_id', candidateIds)
//         .order('created_at', { ascending: false })

//       if (convError) {
//         console.error('[ERROR] Conversations fetch failed:', convError.message)
//       }

//       // Build post_id → job_title lookup using domestic_crm_jd and corporate_crm_jd
//       if (conversations && conversations.length > 0) {
//         const allPostIds = [...new Set(conversations.map(c => c.post_id).filter(id => id != null))]

//         if (allPostIds.length > 0) {
//           // First try domestic_crm_jd
//           const { data: domesticJdData, error: domesticJdError } = await supabaseServer
//             .from('domestic_crm_jd')
//             .select('jd_id, job_title')
//             .in('jd_id', allPostIds)

//           if (!domesticJdError && domesticJdData) {
//             domesticJdData.forEach(jd => postIdToJobTitle.set(jd.jd_id, jd.job_title))
//           }

//           // Then try corporate_crm_jd for any missing ones
//           const remainingPostIds = allPostIds.filter(id => !postIdToJobTitle.has(id))
//           if (remainingPostIds.length > 0) {
//             const { data: corporateJdData, error: corporateJdError } = await supabaseServer
//               .from('corporate_crm_jd')
//               .select('jd_id, job_title')
//               .in('jd_id', remainingPostIds)

//             if (!corporateJdError && corporateJdData) {
//               corporateJdData.forEach(jd => postIdToJobTitle.set(jd.jd_id, jd.job_title))
//             }
//           }
//         }
//       }

//       // Build latest conversation data map per candidate
//       conversations?.forEach(conv => {
//         if (!latestStatusMap.has(conv.parsing_id)) {
//           latestStatusMap.set(conv.parsing_id, {
//             latest_status: conv.candidate_status || '-',
//             latest_user: conv.users?.name || conv.user_id || '-',
//             latest_date: conv.calling_date || '-',
//             latest_remarks: conv.remarks || '-',
//             latest_profile: postIdToJobTitle.get(conv.post_id) || '-'
//           })
//         }
//       })
//     }

//     const processedData = uniqueData.map(item => {
//       const statusInfo = latestStatusMap.get(item.id) || { 
//         latest_status: '-', 
//         latest_user: '-', 
//         latest_date: '-',
//         latest_remarks: '-',
//         latest_profile: '-'
//       }
//       return {
//         ...item,
//         is_shared: item.other_users && item.other_users.includes(userId) && item.user_id !== userId,
//         latest_status: statusInfo.latest_status,
//         latest_user: statusInfo.latest_user,
//         latest_date: statusInfo.latest_date,
//         latest_remarks: statusInfo.latest_remarks,
//         latest_profile: statusInfo.latest_profile
//       }
//     })

//     return NextResponse.json({
//       success: true,
//       data: processedData
//     })

//   } catch (error) {
//     console.error('Fetch CV parsing API error:', error)
//     return NextResponse.json({
//       error: 'Internal server error',
//       details: error.message
//     }, { status: 500 })
//   }
// }

export async function GET(request) {
  try {
    // Authentication - user injected by middleware (no auth calls needed!)
    const { user, error: authError } = getUser(request);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.user_id || user.id

    // Batch 1: Fetch CV parsing records in parallel
    const [myResult, sharedResult] = await Promise.all([
      supabaseServer
        .from('cv_parsing')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false }),
      supabaseServer
        .from('cv_parsing')
        .select('*')
        .contains('other_users', [userId])
        .order('created_at', { ascending: false })
    ])

    const { data: myData, error: myError } = myResult
    const { data: sharedData, error: sharedError } = sharedResult

    if (myError || sharedError) {
      console.error('Fetch CV parsing error:', myError || sharedError)
      return NextResponse.json({
        error: 'Failed to fetch CV parsing data',
        details: myError?.message || sharedError?.message
      }, { status: 500 })
    }

    // Combine and mark shared records
    const allData = [...(myData || []), ...(sharedData || [])]
    
    // Remove duplicates (in case user is in both)
    const uniqueData = allData.filter((item, index, self) => 
      index === self.findIndex((t) => t.id === item.id)
    )

    // Get all candidate IDs for fetching latest status
    const candidateIds = uniqueData.map(item => item.id)

    // If no candidates, return early
    if (candidateIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: []
      })
    }

    // Batch 2: Fetch conversations
    const batchSize = 50
    const conversationBatches = []

    console.log('Total candidate IDs to fetch conversations for:', candidateIds.length);  
    
    // Split candidate IDs into batches
    for (let i = 0; i < candidateIds.length; i += batchSize) {
      const batch = candidateIds.slice(i, i + batchSize)
      conversationBatches.push(
        supabaseServer
          .from('candidates_conversation')
          .select(`
            parsing_id,
            candidate_status,
            calling_date,
            created_at,
            remarks,
            req_id,
            user_id,
            users!inner(name)
          `)
          .in('parsing_id', batch)
          .order('created_at', { ascending: false })
      )
    }

    // Execute conversation batches in parallel
    const conversationResults = await Promise.allSettled(conversationBatches)
    
    // Collect all successful conversations
    let allConversations = []
    conversationResults.forEach(result => {
      if (result.status === 'fulfilled' && !result.value.error) {
        allConversations = [...allConversations, ...(result.value.data || [])]
      } else if (result.status === 'rejected') {
        console.error('Conversation batch failed:', result.reason)
      }
    })

    console.log('Total conversations fetched:', allConversations.length);

    // Extract unique jobpost IDs (req_id in conversation is actually jobpost_id)
    const allJobpostIds = [...new Set(allConversations.map(c => c.req_id).filter(id => id != null))]
    console.log('Unique jobpost IDs found:', allJobpostIds.length);
    console.log('Sample jobpost IDs:', allJobpostIds.slice(0, 5));

    // Step 1: Get req_id from jobpost tables
    let jobpostIdToReqId = new Map() // Maps jobpost_id -> req_id
    
    if (allJobpostIds.length > 0) {
      const domesticJobpostBatches = []
      const corporateJobpostBatches = []
      
      // Split jobpost IDs into batches
      for (let i = 0; i < allJobpostIds.length; i += batchSize) {
        const batch = allJobpostIds.slice(i, i + batchSize)
        
        // Get req_id from domestic_crm_jobpost
        domesticJobpostBatches.push(
          supabaseServer
            .from('domestic_crm_jobpost')
            .select('id, req_id')
            .in('id', batch)
        )
        
        // Get req_id from corporate_crm_jobpost
        corporateJobpostBatches.push(
          supabaseServer
            .from('corporate_crm_jobpost')
            .select('id, req_id')
            .in('id', batch)
        )
      }

      // Execute all jobpost batches in parallel
      const [domesticJobpostResults, corporateJobpostResults] = await Promise.all([
        Promise.allSettled(domesticJobpostBatches),
        Promise.allSettled(corporateJobpostBatches)
      ])

      // Process domestic jobpost results
      domesticJobpostResults.forEach(result => {
        if (result.status === 'fulfilled' && !result.value.error && result.value.data) {
          console.log('Domestic jobposts found:', result.value.data.length);
          result.value.data.forEach(jobpost => {
            jobpostIdToReqId.set(jobpost.id, jobpost.req_id)
          })
        }
      })
    
      // Process corporate jobpost results for missing IDs
      const remainingJobpostIds = allJobpostIds.filter(id => !jobpostIdToReqId.has(id))
      console.log('Remaining jobpost IDs for corporate:', remainingJobpostIds.length);
      
      if (remainingJobpostIds.length > 0) {
        corporateJobpostResults.forEach(result => {
          if (result.status === 'fulfilled' && !result.value.error && result.value.data) {
            console.log('Corporate jobposts found:', result.value.data.length);
            result.value.data.forEach(jobpost => {
              if (!jobpostIdToReqId.has(jobpost.id)) {
                jobpostIdToReqId.set(jobpost.id, jobpost.req_id)
              }
            })
          }
        })
      }
    }

    console.log('Total jobpost to req_id mappings:', jobpostIdToReqId.size);

    // Step 2: Get all unique req_ids from the jobpost mappings
    const allReqIds = [...new Set(jobpostIdToReqId.values())]
    console.log('Unique req_ids found from jobposts:', allReqIds.length);

    // Step 3: Fetch job titles from reqs tables using the req_ids
    let reqIdToJobTitle = new Map()

    if (allReqIds.length > 0) {
      const domesticReqBatches = []
      const corporateReqBatches = []
      
      // Split req IDs into batches
      for (let i = 0; i < allReqIds.length; i += batchSize) {
        const batch = allReqIds.slice(i, i + batchSize)
        
        // Get job_title from domestic_crm_reqs
        domesticReqBatches.push(
          supabaseServer
            .from('domestic_crm_reqs')
            .select('req_id, job_title')
            .in('req_id', batch)
        )
        
        // Get job_title from corporate_crm_reqs
        corporateReqBatches.push(
          supabaseServer
            .from('corporate_crm_reqs')
            .select('req_id, job_title')
            .in('req_id', batch)
        )
      }

      // Execute all req batches in parallel
      const [domesticReqResults, corporateReqResults] = await Promise.all([
        Promise.allSettled(domesticReqBatches),
        Promise.allSettled(corporateReqBatches)
      ])

      // Process domestic req results
      domesticReqResults.forEach(result => {
        if (result.status === 'fulfilled' && !result.value.error && result.value.data) {
          console.log('Domestic reqs with job titles:', result.value.data.length);
          result.value.data.forEach(req => {
            reqIdToJobTitle.set(req.req_id, req.job_title)
          })
        }
      })
    
      // Process corporate req results for missing IDs
      const remainingReqIds = allReqIds.filter(id => !reqIdToJobTitle.has(id))
      console.log('Remaining req_ids for corporate:', remainingReqIds.length);
      
      if (remainingReqIds.length > 0) {
        corporateReqResults.forEach(result => {
          if (result.status === 'fulfilled' && !result.value.error && result.value.data) {
            console.log('Corporate reqs with job titles:', result.value.data.length);
            result.value.data.forEach(req => {
              if (!reqIdToJobTitle.has(req.req_id)) {
                reqIdToJobTitle.set(req.req_id, req.job_title)
              }
            })
          }
        })
      }
    }

    console.log('Total job titles mapped:', reqIdToJobTitle.size);

    // Batch 3: Fetch user names for all user_ids in conversations
    const allUserIds = [...new Set(allConversations.map(c => c.user_id).filter(Boolean))]
    let userMap = new Map()

    if (allUserIds.length > 0) {
      const userBatches = []
      for (let i = 0; i < allUserIds.length; i += batchSize) {
        const batch = allUserIds.slice(i, i + batchSize)
        userBatches.push(
          supabaseServer
            .from('users')
            .select('user_id, name')
            .in('user_id', batch)
        )
      }

      const userResults = await Promise.allSettled(userBatches)
      userResults.forEach(result => {
        if (result.status === 'fulfilled' && !result.value.error) {
          result.value.data?.forEach(user => {
            userMap.set(user.user_id, user.name)
          })
        }
      })
    }

    // Build latest conversation data map per candidate
    let latestStatusMap = new Map()
    
    // Sort by created_at to ensure we take the latest
    const sortedConversations = [...allConversations].sort((a, b) => 
      new Date(b.created_at) - new Date(a.created_at)
    );
    
    sortedConversations.forEach(conv => {
      if (!latestStatusMap.has(conv.parsing_id)) {
        // Get req_id from jobpost_id, then get job_title from req_id
        const reqId = jobpostIdToReqId.get(conv.req_id)
        const jobTitle = reqId ? reqIdToJobTitle.get(reqId) : '-'
        
        console.log(`Mapping: parsing_id=${conv.parsing_id}, jobpost_id=${conv.req_id}, req_id=${reqId}, job_title=${jobTitle}`);
        
        latestStatusMap.set(conv.parsing_id, {
          latest_status: conv.candidate_status || '-',
          latest_user: userMap.get(conv.user_id) || conv.user_id || '-',
          latest_date: conv.calling_date || '-',
          latest_remarks: conv.remarks || '-',
          latest_profile: jobTitle
        })
      }
    })

    // Process final data
    const processedData = uniqueData.map(item => {
      const statusInfo = latestStatusMap.get(item.id) || { 
        latest_status: '-', 
        latest_user: '-', 
        latest_date: '-',
        latest_remarks: '-',
        latest_profile: '-'
      }
      
      return {
        ...item,
        is_shared: item.other_users && item.other_users.includes(userId) && item.user_id !== userId,
        latest_status: statusInfo.latest_status,
        latest_user: statusInfo.latest_user,
        latest_date: statusInfo.latest_date,
        latest_remarks: statusInfo.latest_remarks,
        latest_profile: statusInfo.latest_profile
      }
    })

    return NextResponse.json({
      success: true,
      data: processedData,
      meta: {
        total: processedData.length,
        conversations_fetched: allConversations.length,
        jobpost_ids_fetched: allJobpostIds.length,
        req_ids_fetched: allReqIds.length,
        job_titles_mapped: reqIdToJobTitle.size,
        users_fetched: allUserIds.length
      }
    })

  } catch (error) {
    console.error('Fetch CV parsing API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    // Authentication - user injected by middleware (no auth calls needed!)
    const { user, error: authError } = getUser(request);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY is not configured" }, { status: 500 });
    }

    // Determine file type for proper handling
    const fileType = file.type;
    const fileName = file.name;
    console.log("File type:", fileType);
    console.log("File name:", fileName);

    // Read file as buffer for mammoth/PDF processing
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString("base64");
    
    console.log("File size:", arrayBuffer.byteLength);

    // Check if it's a Word document and convert to text
    const isWordDoc = file.type === 'application/msword' || 
                      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    
    // Check if it's an image file
    const isImage = file.type === 'image/jpeg' || 
                    file.type === 'image/jpg' || 
                    file.type === 'image/png' || 
                    file.type === 'image/gif' || 
                    file.type === 'image/webp';
    
    let textContent = "";
    let mimeType = file.type;
    
    if (isWordDoc) {
      // Convert Word document to text using mammoth
      console.log("Converting Word document to text...");
      try {
        const result = await mammoth.extractRawText({ buffer: buffer });
        textContent = result.value;
        console.log("Extracted text length:", textContent.length);
        mimeType = "text/plain";
      } catch (mammothError) {
        console.error("Error converting Word document:", mammothError);
        return NextResponse.json({ 
          error: "Failed to read Word document. Please convert to PDF and try again.", 
          details: mammothError.message 
        }, { status: 400 });
      }
    }
    
    // Use Gemini 1.5 with direct PDF input
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

    // Create inline data for the file
    let inlineData;
    let documentType;
    
    if (isWordDoc) {
      // For Word docs, send the extracted text
      inlineData = {
        mimeType: mimeType,
        data: Buffer.from(textContent).toString("base64")
      };
      documentType = "resume text extracted from Word document";
    } else if (isImage) {
      // For images, send directly to Gemini (it can read images)
      inlineData = {
        mimeType: file.type,
        data: base64
      };
      documentType = "resume image (scanned document photo)";
    } else {
      // For PDF, send the file directly
      inlineData = {
        mimeType: file.type,
        data: base64
      };
      documentType = "resume PDF";
    }

    const prompt = `
You are an expert resume parser. Extract information from this ${documentType} and return ONLY a valid JSON object.
    
    ${isWordDoc ? 'This file contains resume text extracted from a Word document. Parse the extracted text accordingly.' : isImage ? 'This is an image of a resume (scanned or photographed). Read the image carefully and extract all visible text and information.' : 'Parse the PDF content to extract resume information.'}

CRITICAL JSON FORMATTING RULES:
- Return ONLY a valid JSON object with double quotes around ALL keys and ALL string values
- NO explanations, NO markdown, NO code blocks, NO extra text
- Start with { and end with }
- Each key-value pair must be separated by commas
- NO trailing commas after the last value
- Example format: {"Name": "John Doe", "Email ID": "john@example.com", "Mobile No": "9876543210"}

REQUIRED FIELDS (use "NA" if not found):
- "Name": Full name only
- "Email ID": Email address in lowercase (xxx@xxx.com)
- "Mobile No": Phone number - 10 digits ONLY, NO country code, NO +91, NO 0 prefix
- "Location": ONLY city/district and state - NO house number, street, pincode, or full address
- "Gender": Male/Female/Other only
- "Highest Qualification": Short format only (e.g., MBA, BCA, 12th, ITI, B.Tech, M.Sc)
- "Years of Experience": Just years or "Fresher" (e.g., "1 yr", "2 yrs", "Fresher")
- "Company Names": All company names as comma separated list
- "Latest Designation": For latest company, or a common recent designation if multiple
- "Skills": All professional skills from the Skills section, if available
- "College Name": Short name only (e.g., "IIT Delhi", "Delhi University")
- "Top Skills": 3–4 key skills from the Professional Key Skills section or Skills section
- "Recent Company": Only the most recent one; latest company name

FORMATTING RULES:
- For any field not available, output "NA"
- All fields should be in proper capitalization (e.g., "Rahul Sharma", "Panipat")
- Email should be in lowercase
- For Mobile No: Return ONLY 10 digits WITHOUT country code, WITHOUT +91, WITHOUT 0 prefix (e.g., "9876543210")
- For Location: Extract ONLY city/district and state (e.g., "Panipat, Haryana")
- For Years of Experience: Return only the years or "Fresher" (e.g., "2 yrs", "Fresher")
- For Recent Company: Return ONLY one company name (the most recent one)
- For Company Names: List each company only ONCE, no duplicates

EXAMPLE OUTPUT:
{"Name": "PRIYANSHU VERMA", "Email ID": "pverma0922@gmail.com", "Mobile No": "7889140922", "Location": "Jagraon, PB", "Gender": "NA", "Highest Qualification": "MCom", "Years of Experience": "NA", "Company Names": "Hero Motors, SS Periwal & Co.", "Latest Designation": "Automobile Sales Manager", "Skills": "Customer Service, Cash Handling, Product Knowledge", "College Name": "LRM DAV College", "Top Skills": "Customer Service, Cash Handling, Product Knowledge", "Recent Company": "Hero Motors"}

IMPORTANT: Return ONLY the JSON object, nothing else. No markdown, no code blocks, no explanations.
`;

    const result = await model.generateContent([
      { inlineData },
      prompt
    ]);

    const responseText = result.response.text();
    console.log("Gemini response:", responseText.substring(0, 500));

    let parsedData = [];
    
    // Helper function to clean JSON string
    const cleanJsonString = (str) => {
      // First, try to extract JSON object or array
      let jsonMatch = str.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        jsonMatch = str.match(/\[[\s\S]*\]/);
      }
      
      if (jsonMatch) {
        str = jsonMatch[0];
      }
      
      return str
        .replace(/```json\s*/g, '')  // Remove ```json
        .replace(/```\s*/g, '')      // Remove closing ```
        .replace(/\n/g, ' ')         // Replace newlines with spaces
        .replace(/\r/g, '')          // Remove carriage returns
        .replace(/\t/g, ' ')         // Replace tabs with spaces
        .replace(/\s+/g, ' ')        // Collapse multiple spaces
        .replace(/,\s*}/g, '}')      // Remove trailing commas before }
        .replace(/,\s*]/g, ']')      // Remove trailing commas before ]
        .replace(/'/g, '"')          // Replace single quotes with double quotes
        // Fix common JSON issues: replace unquoted keys with quoted keys
        .replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)(\s*:)/g, '$1"$2"$3')
        // Fix common JSON issues: replace unquoted string values with quoted values
        .replace(/:\s*([^",\[\]{}]+)(?=\s*[,}\]])/g, (match, value) => {
          // Add quotes around unquoted string values
          if (value === 'true' || value === 'false' || value === 'null' || !isNaN(value)) {
            return ': ' + value;
          }
          return ': "' + value + '"';
        })
        // Fix Gemini API issue: replace "key": "value": "next_key" with "key": "value", "next_key":
        .replace(/"([^"]+)"\s*:\s*"([^"]+)"\s*:\s*"([^"]+)"/g, '"$1": "$2", "$3":')
        // Fix common JSON issues: add missing closing parenthesis to any key that starts with " and ends with (s"
        .replace(/"([^"]*\(s)"/g, '"$1)"')
        .trim();
    };
    
    // Helper function to extract fields manually if JSON parsing fails
     const extractFieldsManually = (text) => {
       // Match Gemini's exact output format
       const patterns = {
         "Name": /["']?Name["']?\s*:\s*["']([^"']+)["']/i,
         "Email ID": /["']?Email\s*ID["']?\s*:\s*["']([^"']+)["']/i,
         "Mobile No": /["']?Mobile\s*No["']?\s*:\s*["']([^"']+)["']/i,
         "Location": /["']?Location["']?\s*:\s*["']([^"']+)["']/i,
         "Gender": /["']?Gender["']?\s*:\s*["']([^"']+)["']/i,
         "Highest Qualification": /["']?Highest\s*Qualification["']?\s*:\s*["']([^"']+)["']/i,
         "Years of Experience": /["']?Years\s*of\s*Experience["']?\s*:\s*["']([^"']+)["']/i,
         "Company Names": /["']?Company\s*Names["']?\s*:\s*["']([^"']+)["']/i,
         "Latest Designation": /["']?Latest\s*Designation["']?\s*:\s*["']([^"']+)["']/i,
         "Skills": /["']?Skills["']?\s*:\s*["']([^"']+)["']/i,
         "College Name": /["']?College\s*Name["']?\s*:\s*["']([^"']+)["']/i,
         "Top Skills": /["']?Top\s*Skills["']?\s*:\s*["']([^"']+)["']/i,
         "Recent Company": /["']?Recent\s*Company["']?\s*:\s*["']([^"']+)["']/i
       };
       
       const result = {};
       for (const [key, pattern] of Object.entries(patterns)) {
         const match = text.match(pattern);
         if (match && match[1]) {
           result[key] = match[1].trim();
         } else {
           result[key] = "NA";
         }
       }
       
       return result;
     };
    
    try {
      // Clean the response text
      let cleanedResponse = cleanJsonString(responseText);

      console.log("Cleaned response (first 500 chars):", cleanedResponse.substring(0, 500));

      // Try to find JSON array first
      const jsonMatch = cleanedResponse.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        let jsonStr = cleanJsonString(jsonMatch[0]);
        parsedData = JSON.parse(jsonStr);
        if (!Array.isArray(parsedData)) parsedData = [parsedData];
      } else {
        // Try to find JSON object
        const objectMatch = cleanedResponse.match(/\{[\s\S]*\}/);
        if (objectMatch) {
          let jsonStr = cleanJsonString(objectMatch[0]);
          parsedData = [JSON.parse(jsonStr)];
        }
      }
    } catch (e) {
      console.error("Parse error:", e);
      console.error("Response that failed:", responseText.substring(0, 1000));
      
      // Fallback: try to extract fields manually
      console.log("Attempting manual field extraction as fallback...");
      const manualData = extractFieldsManually(responseText);
      console.log("Manual extraction result:", manualData);
      parsedData = [manualData];
    }

    return NextResponse.json({
      success: true,
      data: parsedData,
      debug: { 
        extractedText: fileType.includes('image') ? "[Image sent to Gemini]" : (fileType.includes('word') ? "[Word document sent to Gemini]" : "[PDF sent to Gemini]"),
        geminiRawResponse: responseText, 
        pdfParseSuccess: true, 
        textLength: arrayBuffer.byteLength,
        fileType: fileType
      },
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
