// app/api/send-reservation-email/route.ts
import { NextResponse } from 'next/server';
import emailjs from '@emailjs/nodejs';  // ← Change to nodejs version

const EMAILJS_SERVICE_ID = process.env.EMAILJS_SERVICE_ID!;
const EMAILJS_TEMPLATE_ID = process.env.EMAILJS_TEMPLATE_ID!;
const EMAILJS_PUBLIC_KEY = process.env.EMAILJS_PUBLIC_KEY!;
const EMAILJS_PRIVATE_KEY = process.env.EMAILJS_PRIVATE_KEY!;  // Need both for nodejs

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { templateParams } = body;

    // For @emailjs/nodejs, you need to initialize with public and private key
    emailjs.init({
      publicKey: EMAILJS_PUBLIC_KEY,
      privateKey: EMAILJS_PRIVATE_KEY,  // Private key is required for nodejs
    });

    const response = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      templateParams
    );

    return NextResponse.json({ success: true, response });
  } catch (error: any) {
    console.error('Email sending error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}