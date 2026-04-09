import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

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

Analyze these aspects:
1. Contact information completeness
2. Professional summary/objective quality
3. Work experience (action verbs, quantified achievements, relevance)
4. Education section
5. Skills section (relevance, completeness, hard vs soft skills)
6. Formatting and readability
7. Grammar and spelling errors you can detect
8. ATS (Applicant Tracking System) compatibility
9. Missing common sections
10. Overall impact and professional presentation

Be brutally specific. Don't say "improve your experience section" — say exactly WHAT to improve and HOW.`;

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

    const genAI = getGeminiClient();
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: {
        parts: [
          {
            text: "You are an expert resume reviewer and career coach. You analyze resumes with extreme precision and provide actionable, specific feedback. You identify weaknesses, missing elements, formatting issues, and content problems. You also highlight strengths. You are honest and direct. Always return ONLY valid JSON — no markdown code blocks, no extra text.",
          },
        ],
        role: "user",
      },
    });

    let result;

    if (file) {
      // Use Gemini's native multimodal capability to read PDF/images directly
      const arrayBuffer = await file.arrayBuffer();
      const base64Data = Buffer.from(arrayBuffer).toString("base64");
      const mimeType = file.type || "application/pdf";

      result = await model.generateContent([
        ANALYSIS_PROMPT,
        {
          inlineData: {
            data: base64Data,
            mimeType: mimeType,
          },
        },
      ]);
    } else {
      // Text-only analysis
      result = await model.generateContent(
        `${ANALYSIS_PROMPT}\n\nResume text:\n\n${rawText}`
      );
    }

    const responseText = result.response.text();

    // Parse JSON from response (strip any markdown code blocks if present)
    let cleanJson = responseText;
    if (cleanJson.includes("```")) {
      cleanJson = cleanJson.replace(/```json?\n?/g, "").replace(/```\n?/g, "");
    }
    cleanJson = cleanJson.trim();

    try {
      const analysis = JSON.parse(cleanJson);
      return NextResponse.json({ analysis });
    } catch {
      // If JSON parsing fails, return the raw text as a fallback
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
    const errMsg =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        error: `Failed to analyze resume: ${errMsg.includes("429") ? "AI rate limit reached. Please try again in a minute." : "Please try again."}`,
      },
      { status: 500 }
    );
  }
}
