import { GraduationCap, PenSquare, Users, CalendarCheck } from "lucide-react";
import { PortalCard } from "@/components/portal-card";
import { api, SchoolMeta } from "@/lib/api";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

async function getMeta(): Promise<SchoolMeta> {
  try {
    const res = await api.meta();
    return res.meta || {};
  } catch {
    return {};
  }
}

export default async function HomePage() {
  const meta = await getMeta();
  const schoolName = meta.schoolName || "Assalam International Academic School";
  const motto = meta.motto || "Success comes after tears";
  const address = meta.address || "Behind Garko Motor Park, Opp. Tasidi Filling Station";
  const phone = meta.phone || "";
  const session = meta.session || "";

  return (
    <main className="min-h-screen flex flex-col bg-parchment">
      {/* Banner / letterhead — deep indigo, dominates the top of the
          page the way a real school letterhead or certificate would,
          rather than a thin strip sitting on top of empty space. */}
      <div className="relative bg-indigo-dark overflow-hidden">
        {/* Faint exam-paper grid texture, only inside the banner, at
            low opacity against the dark background */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "linear-gradient(#F8F5EC 1px, transparent 1px), linear-gradient(90deg, #F8F5EC 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
        {/* Soft gold glow behind the crest for focus */}
        <div className="pointer-events-none absolute left-1/2 top-24 -translate-x-1/2 w-72 h-72 rounded-full bg-gold/20 blur-3xl" />

        <div className="relative max-w-4xl mx-auto px-6">
          <div className="flex items-center justify-between py-4 border-b border-parchment/10">
            <span className="font-mono text-[11px] tracking-widest uppercase text-parchment/60">
              {session ? `Session ${session}` : "School Portal"}
            </span>
            <span className="font-mono text-[11px] tracking-widest uppercase text-parchment/40">
              Garko, Kano State
            </span>
          </div>

          <div className="flex flex-col items-center text-center py-14 md:py-20 animate-rise-in">
            <div className="w-20 h-20 rounded-full bg-parchment border-[3px] border-gold shadow-lift flex items-center justify-center overflow-hidden">
              {meta.logo ? (
                <img
                  src={`${API_BASE}${meta.logo}`}
                  alt={`${schoolName} crest`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <GraduationCap size={30} className="text-indigo" strokeWidth={2} />
              )}
            </div>

            <p className="mt-6 font-display italic text-gold-light text-sm tracking-wide">
              Welcome to the
            </p>
            <h1 className="mt-2 font-display font-semibold text-parchment text-[2.1rem] leading-[1.15] md:text-[3rem] max-w-2xl">
              {schoolName}
            </h1>
            <div className="mt-5 flex items-center justify-center gap-3">
              <span className="h-px w-10 bg-gold/60" />
              <p className="font-display italic text-parchment/75 text-base md:text-lg">
                &ldquo;{motto}&rdquo;
              </p>
              <span className="h-px w-10 bg-gold/60" />
            </div>
          </div>
        </div>
      </div>

      {/* Portal cards float up over the banner/parchment boundary */}
      <section className="flex-1 px-6">
        <div className="max-w-4xl mx-auto -mt-12 md:-mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 pb-20">
          <PortalCard
            href="/teacher"
            role="Teacher"
            code="Portal · Staff"
            description="Enter scores and generate report sheets for your class."
            icon={PenSquare}
            delayMs={0}
          />
          <PortalCard
            href="/attendance"
            role="Attendance"
            code="Portal · Daily"
            description="Sign in and mark your class present or absent for today."
            icon={CalendarCheck}
            delayMs={80}
          />
          <PortalCard
            href="/exam"
            role="Student — Exam"
            code="Portal · Exam"
            description="Log in with your class and password to take a test or exam."
            icon={GraduationCap}
            delayMs={160}
          />
          <PortalCard
            href="/parent"
            role="Parent"
            code="Portal · Parent"
            description="View and download your child's results and report sheet."
            icon={Users}
            delayMs={240}
          />
        </div>
      </section>

      {/* Footer — no staff link, admin is reached directly via /manage-unlock */}
      <footer className="border-t border-ink/[0.08] bg-parchment-dim">
        <div className="max-w-4xl mx-auto px-6 py-5 flex flex-col items-center gap-2 text-xs text-ink/50">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-4">
            <span>{address}</span>
            {phone && <span className="font-mono">{phone.split(",")[0].trim()}</span>}
          </div>
          <span className="font-mono text-[11px] text-ink/35">
            © {new Date().getFullYear()} SUIBING IT SERVICES
          </span>
        </div>
      </footer>
    </main>
  );
}
