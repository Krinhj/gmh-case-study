import { NextResponse } from "next/server";
import htmlToDocx from "html-to-docx";

export async function POST(request: Request) {
  try {
    const { html } = (await request.json()) as { html?: string };

    if (typeof html !== "string" || !html.trim()) {
      return NextResponse.json({ error: "Invalid HTML payload" }, { status: 400 });
    }

    const arrayBuffer = await htmlToDocx(html);

    return new Response(arrayBuffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Failed to convert HTML to DOCX", error);
    return NextResponse.json({ error: "Failed to convert HTML to DOCX" }, { status: 500 });
  }
}
