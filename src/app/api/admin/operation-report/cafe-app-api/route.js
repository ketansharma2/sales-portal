import { NextResponse } from "next/server";
import crypto from "crypto";

function generateSignature(timestamp) {
  return crypto
    .createHmac("sha256", process.env.THIRD_PARTY_SECRET_KEY)
    .update(timestamp)
    .digest("hex");
}

export async function GET(req) {
  try {


     const { searchParams } = new URL(req.url);
    const timestamp = Date.now().toString();
    const signature = generateSignature(timestamp);
    const tablesParam = searchParams.get('tables');
  
    const kpiFlag = searchParams.get('kpiFlag');
    const dataFlag = searchParams.get('dataFlag');
    console.log("tablesParam:",tablesParam);


    const baseUrl = process.env.THIRD_PARTY_API_URL;

    // Make specific calls for each metric
    const  allTableResponse= await fetch(`${process.env.THIRD_PARTY_API_URL}?tables=${tablesParam}&kpiFlag=${kpiFlag}&dataFlag=${dataFlag}`, getOptions(timestamp, signature));

    const allTableData = await allTableResponse.json();

 
  

    console.log("Dashboard data:", allTableData);
    
    return NextResponse.json({
      success: true,
      data: allTableData,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch dashboard data",
      },
      {
        status: 500,
      }
    );
  }
}

function getOptions(timestamp, signature) {
  return {
    method: "GET",
    headers: {
      "x-api-key": process.env.THIRD_PARTY_SECRET_KEY,
      "x-timestamp": timestamp,
      "x-signature": signature,
    },
    cache: "no-store",
  };
}