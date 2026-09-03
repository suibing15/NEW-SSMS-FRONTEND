"use client";

import { useEffect, useState, FormEvent } from "react";
import {
  Save,
  Image as ImageIcon,
  ToggleLeft,
  ListChecks,
  Radio,
  ShieldAlert,
  KeyRound,
  MessageSquareWarning,
  Phone,
  Mail,
  Skull,
} from "lucide-react";
import { api, ApiError, SchoolMeta, API_BASE } from "@/lib/api";
import { resolveMediaUrl } from "@/lib/media-url";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

const PORTAL_LABELS: Record<string, string> = {
  teacherPortal: "Teacher Portal",
  examPortal: "Exam Portal",
  parentPortal: "Parent Portal",
  attendancePortal: "Attendance Portal",
};

export default function SettingsPage() {
  const { showToast } = useToast();
  const [meta, setMeta] = useState<SchoolMeta>({});
  const [loading, setLoading] = useState(true);
  const [locked, setLocked] = useState(false);

  async function loadAll() {
    setLoading(true);
    try {
      const [{ meta: m }, { locked: l }] = await Promise.all([api.meta(), api.systemStatus()]);
      setMeta(m);
      setLocked(l);
    } catch {
      // form still renders with blanks if this fails
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-8">
        <p className="font-mono text-[11px] uppercase tracking-widest text-ink/40">Manage</p>
        <h1 className="font-display text-2xl font-semibold text-ink mt-1">School Settings</h1>
      </div>

      {loading ? (
        <p className="text-sm text-ink/45">Loading…</p>
      ) : (
        <div className="space-y-6">
          <SchoolInfoSection meta={meta} onSaved={loadAll} />
          <ReportSheetSection meta={meta} onSaved={loadAll} />
          <BrandingSection meta={meta} onSaved={loadAll} />
          <PortalTogglesSection meta={meta} onSaved={loadAll} />
          <TestTogglesSection />
          <BroadcastSection />
          <DataManagerSection locked={locked} onChanged={loadAll} />
          <AccountSecuritySection />
          <SoftwareManagementSection />
        </div>
      )}
    </div>
  );
}

function SectionCard({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ElementType;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-indigo/[0.08] text-indigo flex items-center justify-center shrink-0">
            <Icon size={17} />
          </div>
          <div>
            <h2 className="font-display font-semibold text-ink">{title}</h2>
            {description && <p className="text-xs text-ink/50 mt-0.5">{description}</p>}
          </div>
        </div>
      </CardHeader>
      <CardBody className="pt-4">{children}</CardBody>
    </Card>
  );
}

const inputCls =
  "w-full rounded-[8px] border border-ink/15 px-3 py-2 text-sm focus:border-indigo focus:outline-none focus:ring-2 focus:ring-indigo/15";
const labelCls = "block text-xs font-medium text-ink/60 mb-1.5";

function SchoolInfoSection({ meta, onSaved }: { meta: SchoolMeta; onSaved: () => void }) {
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setSaving(true);
    try {
      await api.saveSchoolInfo({
        name: String(fd.get("name") || ""),
        address: String(fd.get("address") || ""),
        phone: String(fd.get("phone") || ""),
        motto: String(fd.get("motto") || ""),
      });
      showToast("School information saved successfully.");
      onSaved();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Failed to save.", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <SectionCard icon={ImageIcon} title="School Information" description="Shown across every portal, PDF, and report sheet.">
      <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className={labelCls}>School name</label>
          <input name="name" defaultValue={meta.schoolName} className={inputCls} />
        </div>
        <div className="sm:col-span-2">
          <label className={labelCls}>Address</label>
          <input name="address" defaultValue={meta.address} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Phone</label>
          <input name="phone" defaultValue={meta.phone} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Motto</label>
          <input name="motto" defaultValue={meta.motto} className={inputCls} />
        </div>
        <div className="sm:col-span-2">
          <Button type="submit" disabled={saving}>
            <Save size={14} /> {saving ? "Saving…" : "Save school information"}
          </Button>
        </div>
      </form>
    </SectionCard>
  );
}

function ReportSheetSection({ meta, onSaved }: { meta: SchoolMeta; onSaved: () => void }) {
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setSaving(true);
    try {
      await api.saveSchoolInfo({
        term: String(fd.get("term") || ""),
        session: String(fd.get("session") || ""),
        nextTermBegins: String(fd.get("nextTermBegins") || ""),
      });
      showToast("Report sheet settings saved successfully.");
      onSaved();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Failed to save.", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <SectionCard icon={Save} title="Report Sheet Settings" description="Term, session, and next term date shown on every report sheet.">
      <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className={labelCls}>Term</label>
          <input name="term" defaultValue={meta.term} placeholder="e.g. Second Term" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Session</label>
          <input name="session" defaultValue={meta.session} placeholder="e.g. 2025/2026" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Next term begins</label>
          <input name="nextTermBegins" defaultValue={meta.nextTermBegins} placeholder="e.g. 12th January 2026" className={inputCls} />
        </div>
        <div className="sm:col-span-3">
          <Button type="submit" disabled={saving}>
            <Save size={14} /> {saving ? "Saving…" : "Save report sheet settings"}
          </Button>
        </div>
      </form>
    </SectionCard>
  );
}

function BrandingSection({ meta, onSaved }: { meta: SchoolMeta; onSaved: () => void }) {
  const { showToast } = useToast();
  const [uploading, setUploading] = useState<string | null>(null);

  async function handleUpload(type: "logo" | "principal", file: File | undefined) {
    if (!file) return;
    setUploading(type);
    try {
      await api.uploadBranding(type, file);
      showToast(`${type === "logo" ? "School logo" : "Principal's signature"} uploaded successfully.`);
      onSaved();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Upload failed.", "error");
    } finally {
      setUploading(null);
    }
  }

  return (
    <SectionCard icon={ImageIcon} title="Logo / Signatures" description="A separate image for each — re-uploading overwrites the old one directly.">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="border border-ink/[0.08] rounded-[8px] p-4">
          <p className="text-sm font-medium text-ink mb-2">🏫 School Logo / Crest</p>
          {meta.logo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={resolveMediaUrl(meta.logo)} alt="Current logo" className="w-14 h-14 rounded-full object-cover mb-2 border border-ink/10" />
          )}
          <input
            type="file"
            accept="image/*"
            disabled={uploading === "logo"}
            onChange={(e) => handleUpload("logo", e.target.files?.[0])}
            className="text-sm"
          />
        </div>
        <div className="border border-ink/[0.08] rounded-[8px] p-4">
          <p className="text-sm font-medium text-ink mb-2">✍️ Principal&apos;s Signature</p>
          {meta.signaturePrincipal && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={resolveMediaUrl(meta.signaturePrincipal)} alt="Current signature" className="h-10 object-contain mb-2" />
          )}
          <input
            type="file"
            accept="image/*"
            disabled={uploading === "principal"}
            onChange={(e) => handleUpload("principal", e.target.files?.[0])}
            className="text-sm"
          />
        </div>
      </div>
    </SectionCard>
  );
}

function PortalTogglesSection({ meta, onSaved }: { meta: SchoolMeta; onSaved: () => void }) {
  const { showToast } = useToast();
  const [busyKey, setBusyKey] = useState<string | null>(null);

  async function handleToggle(key: string, current: boolean) {
    setBusyKey(key);
    try {
      await api.setPortalToggle(key, !current);
      showToast(`${PORTAL_LABELS[key] || key} ${!current ? "enabled" : "disabled"} successfully.`);
      onSaved();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Failed to update toggle.", "error");
    } finally {
      setBusyKey(null);
    }
  }

  const toggles = meta.portalToggles || {};

  return (
    <SectionCard icon={ToggleLeft} title="Portal Toggles" description="Turn each public portal on or off.">
      <div className="space-y-2">
        {Object.keys(PORTAL_LABELS).map((key) => {
          const enabled = toggles[key] !== false;
          return (
            <div key={key} className="flex items-center justify-between py-2 border-b border-ink/[0.06] last:border-0">
              <span className="text-sm text-ink">{PORTAL_LABELS[key]}</span>
              <button
                onClick={() => handleToggle(key, enabled)}
                disabled={busyKey === key}
                className={`relative w-11 h-6 rounded-full transition-colors ${enabled ? "bg-sage" : "bg-ink/15"}`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                    enabled ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}

const TEST_TYPE_LABELS: Record<string, string> = {
  test1: "Test 1",
  test2: "Test 2",
  test3: "Test 3",
  exam: "Exam",
};

function TestTogglesSection() {
  const { showToast } = useToast();
  const [toggles, setToggles] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  useEffect(() => {
    api
      .getTestToggles()
      .then((r) => setToggles(r.testToggles))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleToggle(key: "test1" | "test2" | "test3" | "exam", current: boolean) {
    setBusyKey(key);
    try {
      const { testToggles } = await api.setTestToggle(key, !current);
      setToggles(testToggles);
      showToast(`${TEST_TYPE_LABELS[key]} ${!current ? "enabled" : "disabled"} successfully.`);
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Failed to update toggle.", "error");
    } finally {
      setBusyKey(null);
    }
  }

  return (
    <SectionCard
      icon={ListChecks}
      title="Test / Exam Toggles"
      description="Turn a test type off school-wide — students can't submit it in the exam portal while it's disabled."
    >
      {loading ? (
        <p className="text-sm text-ink/45">Loading…</p>
      ) : (
        <div className="space-y-2">
          {(["test1", "test2", "test3", "exam"] as const).map((key) => {
            const enabled = toggles[key] !== false;
            return (
              <div
                key={key}
                className="flex items-center justify-between py-2 border-b border-ink/[0.06] last:border-0"
              >
                <span className="text-sm text-ink">{TEST_TYPE_LABELS[key]}</span>
                <button
                  onClick={() => handleToggle(key, enabled)}
                  disabled={busyKey === key}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    enabled ? "bg-sage" : "bg-ink/15"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                      enabled ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </SectionCard>
  );
}

function BroadcastSection() {
  const { showToast } = useToast();
  const [sending, setSending] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const text = String(fd.get("text") || "").trim();
    const seconds = Number(fd.get("seconds")) || 30;
    if (!text) return;

    setSending(true);
    try {
      await api.sendBroadcast(text, seconds);
      showToast("Broadcast sent to all portals successfully.");
      e.currentTarget.reset();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Failed to send broadcast.", "error");
    } finally {
      setSending(false);
    }
  }

  return (
    <SectionCard icon={Radio} title="Broadcast Message" description="Shows as an overlay on every open portal for a set duration.">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className={labelCls}>Message</label>
          <input name="text" required placeholder="e.g. School closes early today at 1pm" className={inputCls} />
        </div>
        <div className="max-w-[160px]">
          <label className={labelCls}>Duration (seconds)</label>
          <input name="seconds" type="number" defaultValue={30} min={5} className={inputCls} />
        </div>
        <Button type="submit" disabled={sending}>
          {sending ? "Sending…" : "Send broadcast"}
        </Button>
      </form>
    </SectionCard>
  );
}

function DataManagerSection({ locked, onChanged }: { locked: boolean; onChanged: () => void }) {
  const { showToast } = useToast();
  const [busy, setBusy] = useState(false);
  const [unlockPassword, setUnlockPassword] = useState("");
  const [resetConfirmText, setResetConfirmText] = useState("");
  const [resetting, setResetting] = useState(false);
  const RESET_PHRASE = "RESET SCHOOL DATA";

  async function handleFreeze() {
    if (!confirm("Freeze the whole system? Only admin routes will remain accessible until unlocked.")) return;
    setBusy(true);
    try {
      await api.systemLock();
      showToast("System frozen successfully.");
      onChanged();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Failed to freeze.", "error");
    } finally {
      setBusy(false);
    }
  }

  async function handleUnlock() {
    if (!unlockPassword) return;
    setBusy(true);
    try {
      await api.systemUnlock(unlockPassword);
      showToast("System unlocked successfully.");
      setUnlockPassword("");
      onChanged();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Incorrect unlock password.", "error");
    } finally {
      setBusy(false);
    }
  }

  async function handleFactoryReset() {
    if (resetConfirmText !== RESET_PHRASE) return;
    if (
      !confirm(
        "This permanently erases every class, teacher, student, subject, question, result, and attendance record in the entire school. Your own admin login stays intact so you aren't locked out. This cannot be undone. Continue?"
      )
    )
      return;

    setResetting(true);
    try {
      await api.factoryReset(resetConfirmText);
      showToast("Factory reset complete. Every piece of school data has been cleared.");
      setResetConfirmText("");
      onChanged();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Factory reset failed.", "error");
    } finally {
      setResetting(false);
    }
  }

  return (
    <SectionCard icon={ShieldAlert} title="Data Manager" description="Freeze the system to pause every non-admin portal.">
      {locked ? (
        <div className="space-y-3">
          <p className="text-sm text-clay bg-clay/[0.06] border border-clay/20 rounded-[8px] px-3 py-2">
            The system is currently frozen. Enter the unlock password to restore access.
          </p>
          <div className="flex items-center gap-2">
            <input
              type="password"
              value={unlockPassword}
              onChange={(e) => setUnlockPassword(e.target.value)}
              placeholder="Unlock password"
              className={inputCls}
            />
            <Button onClick={handleUnlock} disabled={busy || !unlockPassword}>
              Unlock
            </Button>
          </div>
        </div>
      ) : (
        <Button variant="danger" onClick={handleFreeze} disabled={busy}>
          Freeze data display
        </Button>
      )}

      <div className="mt-6 pt-5 border-t border-clay/20">
        <p className="text-sm font-medium text-clay flex items-center gap-1.5">
          <Skull size={15} /> Factory reset
        </p>
        <p className="text-xs text-ink/55 mt-1 mb-3 max-w-md">
          Permanently erases every class, teacher, student, subject, question, result, and
          attendance record in the entire school, back to a blank slate. Your own admin login is
          kept, so you won&apos;t be locked out. This cannot be undone.
        </p>
        <label className="block text-xs font-medium text-ink/60 mb-1.5">
          Type <span className="font-mono font-semibold">{RESET_PHRASE}</span> to enable the button
        </label>
        <div className="flex items-center gap-2">
          <input
            value={resetConfirmText}
            onChange={(e) => setResetConfirmText(e.target.value)}
            placeholder={RESET_PHRASE}
            className={inputCls + " max-w-xs"}
          />
          <Button
            variant="danger"
            onClick={handleFactoryReset}
            disabled={resetConfirmText !== RESET_PHRASE || resetting}
          >
            {resetting ? "Resetting…" : "Factory reset everything"}
          </Button>
        </div>
      </div>
    </SectionCard>
  );
}

function AccountSecuritySection() {
  const { showToast } = useToast();
  const [savingPw, setSavingPw] = useState(false);
  const [savingUnlock, setSavingUnlock] = useState(false);

  async function handleChangePassword(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const currentPassword = String(fd.get("currentPassword") || "");
    const newPassword = String(fd.get("newPassword") || "");
    setSavingPw(true);
    try {
      await api.changeAdminPassword(currentPassword, newPassword);
      showToast("Login password changed successfully.");
      e.currentTarget.reset();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Failed to change password.", "error");
    } finally {
      setSavingPw(false);
    }
  }

  async function handleSetUnlockPassword(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const newUnlockPassword = String(fd.get("newUnlockPassword") || "");
    setSavingUnlock(true);
    try {
      await api.setUnlockPassword(newUnlockPassword);
      showToast("Unlock password set successfully.");
      e.currentTarget.reset();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Failed to set unlock password.", "error");
    } finally {
      setSavingUnlock(false);
    }
  }

  return (
    <SectionCard icon={KeyRound} title="Account Security">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <form onSubmit={handleChangePassword} className="space-y-3">
          <p className="text-sm font-medium text-ink">Change my login password</p>
          <input name="currentPassword" type="password" required placeholder="Current password" className={inputCls} />
          <input name="newPassword" type="password" required placeholder="New password" className={inputCls} />
          <Button type="submit" size="sm" disabled={savingPw}>
            {savingPw ? "Saving…" : "Change password"}
          </Button>
        </form>
        <form onSubmit={handleSetUnlockPassword} className="space-y-3">
          <p className="text-sm font-medium text-ink">Set / change unlock password</p>
          <input name="newUnlockPassword" type="password" required placeholder="New unlock password" className={inputCls} />
          <Button type="submit" size="sm" disabled={savingUnlock}>
            {savingUnlock ? "Saving…" : "Set unlock password"}
          </Button>
        </form>
      </div>
    </SectionCard>
  );
}

function SoftwareManagementSection() {
  return (
    <SectionCard icon={MessageSquareWarning} title="Software Management" description="Reach the developer for support or a feature request.">
      <div className="flex flex-wrap gap-3">
        <a
          href="https://wa.me/2348165789331"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-[8px] border border-ink/15 px-4 py-2 text-sm font-medium text-ink hover:bg-ink/[0.03] transition-colors"
        >
          <Phone size={15} /> WhatsApp
        </a>
        <a
          href="mailto:suibing15@gmail.com"
          className="inline-flex items-center gap-2 rounded-[8px] border border-ink/15 px-4 py-2 text-sm font-medium text-ink hover:bg-ink/[0.03] transition-colors"
        >
          <Mail size={15} /> Email
        </a>
      </div>
    </SectionCard>
  );
}
