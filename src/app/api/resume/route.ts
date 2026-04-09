import { NextRequest, NextResponse } from "next/server";
import { extractText } from "unpdf";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";

function getGroqKey(): string {
  return process.env.GROQ_API_KEY || "";
}

const SYSTEM_PROMPT = `You are an expert resume reviewer and career coach. You analyze resumes with extreme precision and provide actionable, specific feedback. You identify weaknesses, missing elements, formatting issues, and content problems. You also highlight strengths. You are honest and direct.

Your response MUST be ONLY valid JSON — no markdown code blocks, no extra text, no explanation outside the JSON. Return this exact structure:

{
  "overallScore": <number 0-100>,
  "summary": "<2-3 sentence overview>",
  "sections": [
    {
      "name": "<section name>",
      "score": <number 0-100>,
      "status": "<good|warning|critical>",
      "feedback": "<specific feedback>",
      "improvements": ["<improvement 1>", "<improvement 2>"]
    }
  ],
  "criticalIssues": ["<issue 1>", "<issue 2>"],
  "strengths": ["<strength 1>", "<strength 2>"],
  "missingElements": ["<missing 1>", "<missing 2>"],
  "formattingIssues": ["<issue 1>", "<issue 2>"],
  "keywordSuggestions": ["<keyword 1>", "<keyword 2>"],
  "actionPlan": [
    {
      "priority": "<high|medium|low>",
      "action": "<specific action>",
      "impact": "<expected impact>"
    }
  ],
  "atsScore": <number 0-100>,
  "atsIssues": ["<ATS issue 1>", "<ATS issue 2>"]
}

Analyze: contact info, summary quality, experience (action verbs, quantified achievements), education, skills, formatting, grammar, ATS compatibility, missing sections, overall impact. Be brutally specific.`;

async function callGroq(resumeText: string): Promise<string> {
  const apiKey = getGroqKey();
  if (!apiKey) throw new Error("GROQ_API_KEY not set");

  const res = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Analyze this resume and return ONLY valid JSON:\n\n${resumeText.substring(0, 6000)}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 4096,
    }),
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Groq API ${res.status}: ${errBody.substring(0, 200)}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || "";
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const rawText = formData.get("text") as string | null;

    if (!file && !rawText) {
      return NextResponse.json(
        { error: "Please upload a resume file or provide text." },
        { status: 400 }
      );
    }

    // Extract text from file
    let resumeText = rawText || "";

    if (file) {
      const arrayBuffer = await file.arrayBuffer();

      if (file.type === "application/pdf") {
        try {
          const uint8 = new Uint8Array(arrayBuffer);
          const pdfResult = await extractText(uint8);
          resumeText = Array.isArray(pdfResult.text)
            ? pdfResult.text.join("\n\n")
            : String(pdfResult.text);
        } catch (pdfErr) {
          console.error("PDF extraction error:", pdfErr);
          return NextResponse.json(
            {
              error:
                "Could not read the PDF. Please try a different file or paste text directly.",
            },
            { status: 400 }
          );
        }
      } else {
        resumeText = new TextDecoder().decode(arrayBuffer);
      }
    }

    if (!resumeText || resumeText.trim().length < 30) {
      return NextResponse.json(
        {
          error:
            "Could not extract enough text. Please upload a valid resume PDF with readable text.",
        },
        { status: 400 }
      );
    }

    // Call Groq AI (much faster than Gemini, ~2-3 seconds)
    const responseText = await callGroq(resumeText);

    // Parse JSON
    let cleanJson = responseText;
    if (cleanJson.includes("```")) {
      cleanJson = cleanJson.replace(/```json?\n?/g, "").replace(/```\n?/g, "");
    }
    cleanJson = cleanJson.trim();

    try {
      const analysis = JSON.parse(cleanJson);
      return NextResponse.json({ analysis });
    } catch {
      return NextResponse.json({
        analysis: {
          overallScore: 50,
          summary: responseText.substring(0, 500),
          sections: [],
          criticalIssues: [
            "Analysis returned unstructured feedback — see summary",
          ],
          strengths: [],
          missingElements: [],
          formattingIssues: [],
          keywordSuggestions: [],
          actionPlan: [],
          atsScore: 50,
          atsIssues: [],
        },
        rawResponse: responseText,
      });
    }
  } catch (error) {
    const errObj = error instanceof Error ? error : new Error(String(error));
    console.error("Resume analysis error:", errObj.message);
    return NextResponse.json(
      { error: `Resume analysis failed: ${errObj.message.substring(0, 150)}` },
      { status: 500 }
    );
  }
}
