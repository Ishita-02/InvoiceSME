import {PinataSDK} from 'pinata';
import { NextResponse } from "next/server";

const pinata = new PinataSDK({
  pinataJwt: process.env.NEXT_PUBLIC_PINATA_JWT,
  pinataGateway: process.env.NEXT_PUBLIC_PINATA_GATEWAY
})

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get('file');

    const { cid } = await pinata.upload.public.file(file)
    const url = await pinata.gateways.public.convert(cid);
    return NextResponse.json(cid, { status: 200 });
  } catch (err) {
    console.error('Pinata upload failed:', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
