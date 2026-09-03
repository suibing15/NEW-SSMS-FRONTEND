import { ToastProvider } from "@/components/ui/toast";

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  return <ToastProvider>{children}</ToastProvider>;
}
