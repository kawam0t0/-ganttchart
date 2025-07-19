import { NextResponse } from "next/server"
import { google } from "googleapis"

export async function GET() {
  try {
    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL
    const privateKey = process.env.GOOGLE_PRIVATE_KEY

    console.log("=== Service Account Test ===")
    console.log("Client Email:", clientEmail)
    console.log("Private Key Length:", privateKey?.length)

    if (!clientEmail || !privateKey) {
      return NextResponse.json({
        error: "Missing credentials",
        hasClientEmail: !!clientEmail,
        hasPrivateKey: !!privateKey,
      })
    }

    // 改行文字を処理
    const processedPrivateKey = privateKey.replace(/\\n/g, "\n")

    // GoogleAuth を使用（推奨方法）
    const auth = new google.auth.GoogleAuth({
      credentials: {
        type: "service_account",
        client_email: clientEmail,
        private_key: processedPrivateKey,
      },
      scopes: [
        "https://www.googleapis.com/auth/spreadsheets.readonly",
        "https://www.googleapis.com/auth/drive.readonly",
      ],
    })

    console.log("✓ Auth object created")

    // 認証クライアントを取得
    const authClient = await auth.getClient()
    console.log("✓ Auth client obtained")

    // アクセストークンを取得してテスト
    const accessToken = await authClient.getAccessToken()
    console.log("✓ Access token obtained:", !!accessToken.token)

    // Google Sheets API のテスト
    const sheets = google.sheets({ version: "v4", auth })
    console.log("✓ Sheets API client created")

    return NextResponse.json({
      success: true,
      clientEmail: clientEmail,
      privateKeyLength: privateKey.length,
      accessTokenObtained: !!accessToken.token,
      authClientType: authClient.constructor.name,
    })
  } catch (error) {
    console.error("❌ Service account test error:", error)
    return NextResponse.json({
      error: "Service account test failed",
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    })
  }
}
