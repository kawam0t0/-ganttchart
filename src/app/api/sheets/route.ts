import { type NextRequest, NextResponse } from "next/server"
import { google } from "googleapis"

// 環境変数から設定を取得
const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID || "1CeBtnqQMXNbU4ar3fdfefdkcIAjm7yVc9xl-EYEbkMM"
const SHEET_NAME = process.env.GOOGLE_SHEET_NAME || "default_schedule"
const RANGE = `${SHEET_NAME}!A:N`

export async function GET(request: NextRequest) {
  try {
    // 環境変数の確認
    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL
    const privateKey = process.env.GOOGLE_PRIVATE_KEY

    console.log("=== Environment Check ===")
    console.log("- Client Email exists:", !!clientEmail)
    console.log("- Private Key exists:", !!privateKey)
    console.log("- Spreadsheet ID:", SPREADSHEET_ID)
    console.log("- Sheet Name:", SHEET_NAME)

    if (!clientEmail || !privateKey) {
      return NextResponse.json(
        {
          error: "Missing environment variables",
          hasClientEmail: !!clientEmail,
          hasPrivateKey: !!privateKey,
        },
        { status: 500 },
      )
    }

    // 改行文字を確実に処理
    const processedPrivateKey = privateKey.replace(/\\n/g, "\n")

    console.log("=== Creating Google Auth Client ===")

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
    let authClient
    try {
      authClient = await auth.getClient()
      console.log("✓ Auth client obtained")

      // アクセストークンを取得してテスト
      const accessToken = await authClient.getAccessToken()
      console.log("✓ Access token obtained:", !!accessToken.token)
    } catch (authError) {
      console.error("❌ Authentication failed:", authError)
      return NextResponse.json(
        {
          error: "Authentication failed",
          authError: authError instanceof Error ? authError.message : "Unknown auth error",
          suggestions: [
            "Check if the service account email is correct",
            "Verify that the private key is properly formatted",
            "Ensure the service account has access to the spreadsheet",
            "Check if Google Sheets API is enabled in your project",
          ],
        },
        { status: 401 },
      )
    }

    // Google Sheets APIクライアントの初期化
    const sheets = google.sheets({ version: "v4", auth })

    console.log("=== Fetching Spreadsheet Data ===")
    console.log("- Spreadsheet ID:", SPREADSHEET_ID)
    console.log("- Range:", RANGE)

    // スプレッドシートからデータを取得
    let response
    try {
      response = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: RANGE,
      })
      console.log("✓ Spreadsheet data fetched successfully")
    } catch (sheetsError) {
      console.error("❌ Failed to fetch spreadsheet data:", sheetsError)
      return NextResponse.json(
        {
          error: "Failed to fetch spreadsheet data",
          sheetsError: sheetsError instanceof Error ? sheetsError.message : "Unknown sheets error",
          suggestions: [
            "Check if the spreadsheet ID is correct",
            "Verify that the sheet name exists in the spreadsheet",
            "Ensure the service account has 'Viewer' access to the spreadsheet",
            "Check if the spreadsheet is shared with the service account email",
          ],
        },
        { status: 403 },
      )
    }

    const rows = response.data.values
    if (!rows || rows.length === 0) {
      return NextResponse.json(
        {
          error: "No data found in spreadsheet",
          spreadsheetId: SPREADSHEET_ID,
          range: RANGE,
          suggestion: "Please check if the spreadsheet contains data and the sheet name is correct",
        },
        { status: 404 },
      )
    }

    console.log(`- Found ${rows.length} rows`)

    // ヘッダー行を除いてデータを処理
    const [header, ...dataRows] = rows
    console.log("- Header:", header)

    const tasks = dataRows.map((row, index) => {
      const subTasks = []
      // C列からL列までのサブタスクを取得（空でないもののみ）
      for (let i = 2; i <= 11; i++) {
        if (row[i] && row[i].trim()) {
          subTasks.push({
            id: `${row[1]}-sub-${i - 1}`,
            name: row[i].trim(),
            completed: false,
          })
        }
      }

      return {
        category: row[0] || "", // A列: category
        mainTask: row[1] || "", // B列: main_task
        subTasks: subTasks, // C-L列: サブタスク
        period: Number.parseInt(row[12]) || 1, // M列: period（日数）
        fromOpen: Number.parseInt(row[13]) || 0, // N列: from_open（OPEN日からの逆算日数）
      }
    })

    console.log(`✓ Successfully processed ${tasks.length} tasks`)

    return NextResponse.json({
      success: true,
      tasks,
      metadata: {
        totalRows: rows.length,
        totalTasks: tasks.length,
        spreadsheetId: SPREADSHEET_ID,
        sheetName: SHEET_NAME,
        header: header,
      },
    })
  } catch (error) {
    console.error("❌ Detailed error:", error)

    const errorInfo = {
      message: error instanceof Error ? error.message : "Unknown error",
      code: (error as any)?.code,
      status: (error as any)?.status,
      details: (error as any)?.response?.data,
    }

    return NextResponse.json(
      {
        error: "Failed to fetch data",
        errorInfo,
        timestamp: new Date().toISOString(),
        suggestion: "Please check your Google Sheets API setup and service account permissions",
      },
      { status: 500 },
    )
  }
}
