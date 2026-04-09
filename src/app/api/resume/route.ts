import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";
import { extractText } from "unpdf";

function getGeminiClient() {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY || "";
  if (!apiKey) throw new Error("GOOGLE_GEMINI_API_KEY not set");
  return new GoogleGenerativeAI(apiKey);
}

const ANALYSIS_PROMPT = `Analyze this resume thoroughly and return ONLY valid JSON (no markdown formatting, no code blocks, just raw JSON).

Your response MUST match this exact structure:

{
  "overallScore": <number 0-100>,
  "summary": "<2-3 sentence overview of the resume quality>",
  "sections": [
    {
      "name": "<section name like Contact Info, Summary, Experience, Education, Skills, etc.>",
      "score": <number 0-100>,
      "status": "<good|warning|critical>",
      "feedback": "<specific feedback about this section>",
      "improvements": ["<specific improvement 1>", "<specific improvement 2>"]
    }
  ],
  "criticalIssues": ["<issue 1>", "<issue 2>"],
  "strengths": ["<strength 1>", "<strength 2>"],
  "missingElements": ["<missing element 1>", "<missing element 2>"],
  "formattingIssues": ["<formatting issue 1>", "<formatting issue 2>"],
  "keywordSuggestions": ["<keyword 1>", "<keyword 2>"],
  "actionPlan": [
    {
      "priority": "<high|medium|low>",
      "action": "<specific action to take>",
      "impact": "<expected impact of this action>"
    }
  ],
  "atsScore": <number 0-100>,
  "atsIssues": ["<ATS issue 1>", "<ATS issue 2>"]
}

Be brutally specific. Don't say "improve your experience section" — say exactly WHAT to improve and HOW.`;

async function generateWithRetry(
  model: GenerativeModel,
  content: string,
  retries = 3,
  baseDelay = 3000
): Promise<string> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const result = await model.generateContent(content);
      return result.response.text();
    } catch (error: unknown) {
      const err = error as { message?: string; status?: number };
      const is429 =
        err.status === 429 ||
        (err.message && err.message.includes("429"));

      if (is429 && attempt < retries) {
        const delay = baseDelay * Math.pow(2, attempt);
        console.warn(
          `[Resume] Rate limited. Retrying in ${delay}ms (attempt ${attempt + 1}/${retries})...`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
  throw new Error("Exhausted retries");
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
          // unpdf returns { totalPages, text: string[] } — text is array of strings per page
          resumeText = Array.isArray(pdfResult.text)
            ? pdfResult.text.join("\n\n")
            : String(pdfResult.text);
        } catch (pdfErr) {
          console.error("PDF extraction error:", pdfErr);
          return NextResponse.json(
            {
              error:
                "Could not read the PDF file. Please try a different file or paste the text directly.",
            },
            { status: 400 }
          );
        }
      } else {
        // Text files
        resumeText = new TextDecoder().decode(arrayBuffer);
      }
    }

    if (!resumeText || resumeText.trim().length < 30) {
      return NextResponse.json(
        {
          error:
            "Could not extract enough text from the file. Please upload a valid resume PDF with readable text.",
        },
        { status: 400 }
      );
    }

    const genAI = getGeminiClient();
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: {
        parts: [
          {
            text: "You are an expert resume reviewer and career coach. Analyze resumes with precision and return ONLY valid JSON — no markdown code blocks, no extra text.",
          },
        ],
        role: "user",
      },
    });

    // Send only extracted text (much lighter on tokens than base64 PDF)
    const responseText = await generateWithRetry(
      model,
      `${ANALYSIS_PROMPT}\n\n--- RESUME TEXT ---\n\n${resumeText.substring(0, 8000)}`
    );

    // Parse JSON from response
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
            "Analysis returned unstructured feedback — see summary for details",
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
    console.error("Resume analysis error:", error);
    const errMsg = error instanceof Error ? error.message : "Unknown error";
    const isRateLimit = errMsg.includes("429");
    return NextResponse.json(
      {
        error: isRateLimit
          ? "AI is temporarily busy due to high usage. Please wait 15-30 seconds and try again."
          : "Failed to analyze resume. Please try again.",
      },
      { status: isRateLimit ? 429 : 500 }
    );
  }
}
