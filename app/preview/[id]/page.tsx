import { getGeneration } from "@/app/lib/storage";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function PreviewPage({ params }: PageProps) {
  const { id } = await params;
  const data = await getGeneration(id);

  if (!data) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center text-white">
        <div className="text-center">
          <h1 className="text-2xl font-semibold mb-2">Preview not found</h1>
          <p className="text-white/60">
            This link may be expired or invalid.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-4xl px-6 py-20">
        <p className="text-white/50 text-sm mb-3">Buildfolio Preview</p>
        <h1 className="text-4xl font-semibold tracking-tight">{data.name}</h1>
        <p className="text-white/70 mt-3 text-lg">{data.headline}</p>

        <p className="text-white/70 mt-8 text-base leading-relaxed">
          {data.bio}
        </p>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {data.sections.map((section) => (
            <div
              key={section.title}
              className="rounded-2xl border border-white/10 bg-white/5 p-6"
            >
              <p className="text-white/50 text-xs mb-3">{section.title}</p>
              <div className="space-y-2 text-white/90">
                {section.items.map((item) => (
                  <p key={item}>{item}</p>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-6 text-white/80">
          {data.callToAction}
        </div>
      </div>
    </main>
  );
}
