"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Shown on the landing page only while the school's details couldn't be
// loaded (typically: the backend was asleep and is still waking up).
// It re-requests the page every few seconds until the details arrive,
// then disappears by itself — no manual refresh needed, and no blank,
// brandless page left behind. Gives up after about a minute.
export function MetaAutoRetry({ active }: { active: boolean }) {
  const router = useRouter();

  useEffect(() => {
    if (!active) return;
    let tries = 0;
    const id = setInterval(() => {
      tries += 1;
      if (tries > 12) {
        clearInterval(id);
        return;
      }
      router.refresh();
    }, 5000);
    return () => clearInterval(id);
  }, [active, router]);

  if (!active) return null;
  return (
    <div className="bg-indigo-dark text-parchment/70 text-xs text-center py-2 px-4 border-b border-parchment/10">
      Connecting to the school server… this can take a few seconds if it has been idle.
    </div>
  );
}
