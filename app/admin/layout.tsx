import { Sidebar } from "@/components/layout/sidebar";
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
      <div className="flex bg-parchment min-h-screen">
        <Sidebar schoolName={schoolName} />
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </ToastProvider>
  );
}
