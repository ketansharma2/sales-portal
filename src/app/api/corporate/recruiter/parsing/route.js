import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import mammoth from "mammoth";
import { supabaseServer } from '@/lib/supabase-server'

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

    const userId = user.user_id || user.id

    // First get user's own records
    const { data: myData, error: myError } = await supabaseServer
      .from('cv_parsing')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    // Then get records where other_users contains userId
    const { data: sharedData, error: sharedError } = await supabaseServer
      .from('cv_parsing')
      .select('*')
      .contains('other_users', [userId])
      .order('created_at', { ascending: false })

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
    console.log('Candidate IDs for status fetch:', candidateIds.length)

    // Fetch latest status from candidates_conversation
    let latestStatusMap = new Map()
    if (candidateIds.length > 0) {
      const { data: conversations, error: convError } = await supabaseServer
        .from('candidates_conversation')
        .select(`
          parsing_id,
          candidate_status,
          calling_date,
          created_at,
          user_id,
          users!inner(name)
        `)
        .in('parsing_id', candidateIds)
        .order('created_at', { ascending: false })

      console.log('Conversations fetched:', conversations?.length || 0, 'Error:', convError)
      
      if (!convError && conversations) {
        // For each candidate, get the latest conversation
        conversations.forEach(conv => {
          if (!latestStatusMap.has(conv.parsing_id)) {
            latestStatusMap.set(conv.parsing_id, {
              latest_status: conv.candidate_status || '-',
              latest_user: conv.users?.name || conv.user_id || '-',
              latest_date: conv.calling_date || '-'
            })
          }
        })
      }
    }

    const processedData = uniqueData.map(item => {
      const statusInfo = latestStatusMap.get(item.id) || { latest_status: '-', latest_user: '-', latest_date: '-' }
      return {
        ...item,
        is_shared: item.other_users && item.other_users.includes(userId) && item.user_id !== userId,
        latest_status: statusInfo.latest_status,
        latest_user: statusInfo.latest_user,
        latest_date: statusInfo.latest_date
      }
    })

    return NextResponse.json({
      success: true,
      data: processedData
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
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

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
      const fields = {
        name: "NA",
        email: "NA",
        mobile: "NA",
        location: "NA",
        gender: "NA",
        highest_qualification: "NA",
        experience: "NA",
        company_names: "NA",
        designation: "NA",
        skills: "NA",
        college: "NA",
        top_skills: "NA",
        recent_company: "NA"
      };
      
      // Try to extract each field using regex patterns (handles both JSON and plain text formats)
      const patterns = {
        name: /["']?Name["']?\s*:\s*["']([^"']+)["']/i,
        email: /["']?Email["']?\s*:\s*["']([^"']+)["']/i,
        mobile: /["']?Mobile["']?\s*:\s*["']([^"']+)["']/i,
        location: /["']?Location["']?\s*:\s*["']([^"']+)["']/i,
        gender: /["']?Gender["']?\s*:\s*["']([^"']+)["']/i,
        highest_qualification: /["']?Highest Qualification["']?\s*:\s*["']([^"']+)["']/i,
        experience: /["']?Years of Experience["']?\s*:\s*["']([^"']+)["']/i,
        company_names: /["']?Company Names["']?\s*:\s*["']([^"']+)["']/i,
        designation: /["']?Latest Designation["']?\s*:\s*["']([^"']+)["']/i,
        skills: /["']?Skills["']?\s*:\s*["']([^"']+)["']/i,
        college: /["']?College Name["']?\s*:\s*["']([^"']+)["']/i,
        top_skills: /["']?Top Skills["']?\s*:\s*["']([^"']+)["']/i,
        recent_company: /["']?Recent Company["']?\s*:\s*["']([^"']+)["']/i
      };
      
      for (const [key, pattern] of Object.entries(patterns)) {
        const match = text.match(pattern);
        if (match && match[1]) {
          fields[key] = match[1].trim();
        }
      }
      
      return fields;
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
