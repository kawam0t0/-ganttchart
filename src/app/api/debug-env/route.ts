import { NextResponse } from "next/server"

export async function GET() {
  try {
    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL
    const privateKey = process.env.GOOGLE_PRIVATE_KEY

    return NextResponse.json({
      hasClientEmail: !!clientEmail,
      clientEmailLength: clientEmail?.length || 0,
      clientEmailPreview: clientEmail ? `${clientEmail.substring(0, 20)}...` : "Not found",
      hasPrivateKey: !!privateKey,
      privateKeyLength: privateKey?.length || 0,
      privateKeyStart: privateKey ? privateKey.substring(0, 50) + "..." : "Not found",
      privateKeyHasNewlines: privateKey ? privateKey.includes("\\n") : false,
    })
  } catch (error) {
    return NextResponse.json({ error: "Debug failed", details: error }, { status: 500 })
  }
}
