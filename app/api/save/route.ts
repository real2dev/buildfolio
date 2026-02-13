import { saveGeneration } from "@/app/lib/storage";

type Generation = {
  name: string;
  headline: string;
  bio: string;
  sections: Array<{ title: string; items: string[] }>;
  callToAction: string;
};

export async function POST(req: Request) {
  let body: { data?: Generation } = {};
  try {
    body = await req.json();
  } catch {
    return Response.json(
      { ok: false, error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const data = body.data;
  if (!data) {
    return Response.json(
      { ok: false, error: "Missing data" },
      { status: 400 }
    );
  }

  const id = crypto.randomUUID();
  await saveGeneration(id, data);

  return Response.json({ ok: true, id });
}
