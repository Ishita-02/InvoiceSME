import { NextRequest, NextResponse } from 'next/server';
import { IVerifyResponse, verifyCloudProof } from '@worldcoin/idkit';

export async function POST(req) {
  try {
    const proof = await req.json();
    
    const app_id = process.env.NEXT_PUBLIC_WLD_APP_ID;
    const action = 'verifysmeowner';
    const signal = "verifysmeowner"
    
    if (!app_id) {
        throw new Error("Missing Worldcoin App ID in environment variables");
    }

    console.log("Verifying proof with:", { app_id, action });

    const verifyRes = (await verifyCloudProof(
      proof,
      app_id,
      action,
      signal
    )) ;

    if (verifyRes.success || verifyRes.detail == "This person has already verified for this action."
    ) {
      console.log("Verification successful (backend):", verifyRes);
      
      const { nullifier_hash } = proof;
      
      return NextResponse.json({ 
        success: true, 
        nullifier_hash 
      }, { status: 200 });
    } else {
      // The proof was invalid
      console.error("Verification failed (backend):", verifyRes);
      return NextResponse.json({ 
        success: false, 
        code: verifyRes.code,
        detail: verifyRes.detail 
      }, { status: 400 });
    }

  } catch (error) {
    console.error("Internal server error:", error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}