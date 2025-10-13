import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { gstNo } = await req.json();
    
    if (!gstNo || gstNo.length !== 15) {
        return NextResponse.json({ success: false, error: "Invalid GST Number provided." }, { status: 400 });
    }

    const apiKey = process.env.APPYFLOW_API_KEY;
    if (!apiKey) {
        throw new Error("Missing Appyflow API Key in environment variables");
    }

    // Construct the URL with query parameters
    const verifyUrl = `https://appyflow.in/api/verifyGST?key_secret=${apiKey}&gstNo=${gstNo}`;

    const res = await fetch(verifyUrl, { method: "GET" });

    const data = await res.json();
    console.log("data", data)

    if (res.ok && data.taxpayerInfo && data.taxpayerInfo.lgnm) {
      console.log("GST Verification successful (backend):", data);
      // Return the full taxpayerInfo object to the frontend
      return NextResponse.json({ success: true, taxpayerInfo: data.taxpayerInfo }, { status: 200 });
    } else {
      console.error("GST Verification failed (backend):", data);
      const errorMessage = data.error || "Invalid GST Number or API error.";
      return NextResponse.json({ success: false, error: errorMessage }, { status: res.status });
    }

  } catch (error) {
    console.error("Internal server error in GST verification:", error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
