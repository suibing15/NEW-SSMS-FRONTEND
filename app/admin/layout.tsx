import { AdminShell } from "@/components/layout/admin-shell";
import { ToastProvider } from "@/components/ui/toast";
import { api } from "@/lib/api";
import { cookies } from "next/headers";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieHeader = cookies().toString();
  let schoolName = "School Portal";
  try {
    const { meta } = await api.meta(cookieHeader);
    if (meta.schoolName) schoolName = meta.schoolName;
  } catch {
    // fall back to the default name above if the API isn't reachable
  }

  return (
    <ToastProvider>
      <AdminShell schoolName={schoolName}>{children}</AdminShell>
    </ToastProvider>
  );
}
