import OpenAI from "openai";

export const runtime = "nodejs";

type Answers = Record<string, string>;

type Generation = {
  name: string;
  headline: string;
  bio: string;
  sections: Array<{
    title: string;
    items: string[];
  }>;
  callToAction: string;
};

const clamp = (value: string, max: number) =>
  value.length > max ? `${value.slice(0, max - 1).trim()}…` : value.trim();

const sanitizeGeneration = (data: Generation): Generation => ({
  name: clamp(data.name || "Your Name", 48),
  headline: clamp(data.headline || "Your one-line headline", 72),
  bio: clamp(
    data.bio ||
      "A concise bio that highlights your strengths, focus areas, and what you’re looking to build next.",
    220
  ),
  sections: (data.sections || [])
    .slice(0, 4)
    .map((section) => ({
      title: clamp(section.title || "Section", 28),
      items: (section.items || [])
        .map((item) => clamp(item, 60))
        .filter(Boolean)
        .slice(0, 3),
    })),
  callToAction: clamp(data.callToAction || "Get in touch to collaborate.", 80),
});

const fallbackGeneration = (answers: Answers): Generation => ({
  name: answers.name?.trim() || "Your Name",
  headline: answers.headline?.trim() || "Your one-line headline",
  bio:
    "A concise bio that highlights your strengths, focus areas, and what you’re looking to build next.",
  sections: [
    {
      title: "Highlights",
      items: [
        answers.project?.trim() || "Top project",
        answers.stack?.trim() || "Primary tools",
        answers.goal?.trim() || "Primary goal",
      ],
    },
    {
      title: "Background",
      items: [
        answers.role?.trim() || "Role",
        answers.location?.trim() || "Location",
        answers.website?.trim() || "Website",
      ],
    },
  ],
  callToAction: "Get in touch to collaborate.",
});

export async function POST(req: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return Response.json(
      { ok: false, error: "Missing OPENAI_API_KEY" },
      { status: 500 }
    );
  }

  let body: { answers?: Answers } = {};
  try {
    body = await req.json();
  } catch {
    return Response.json(
      { ok: false, error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const answers = body.answers ?? {};
  const client = new OpenAI();

  const prompt = `
You are generating copy for a personal portfolio site. Use the user's answers to draft concise, premium-sounding content.
Keep it SHORT. Each item should be 2–6 words max. Each section title 1–3 words. Bio 1–2 sentences.
Return ONLY valid JSON with this shape:
{
  "name": string,
  "headline": string,
  "bio": string,
  "sections": [{ "title": string, "items": string[] }],
  "callToAction": string
}
User answers:
${JSON.stringify(answers, null, 2)}
`;

  try {
    const response = await client.responses.create({
      model: "gpt-5-mini",
      input: prompt,
    });

    const text = response.output_text?.trim() ?? "";
    let data: Generation | null = null;
    try {
      data = JSON.parse(text) as Generation;
    } catch {
      data = null;
    }

    const safeData = sanitizeGeneration(data ?? fallbackGeneration(answers));

    return Response.json({
      ok: true,
      data: safeData,
      raw: data ? undefined : text,
    });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error: "Generation failed",
        data: sanitizeGeneration(fallbackGeneration(answers)),
      },
      { status: 500 }
    );
  }
}
