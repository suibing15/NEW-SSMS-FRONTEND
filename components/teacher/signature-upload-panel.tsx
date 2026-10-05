"use client";

import { useState } from "react";
import { PenTool, UploadCloud } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";

// Only ever rendered once EVERY subject in the class has all its
// scores entered (the parent decides that, from the server's
// class-wide completion check) — never just because one subject is
// done. The signature belongs to the whole class: it's printed on
// every subject's report sheet for these students, so asking for it
// the moment a single subject finished interrupted teachers who still
// had other subjects left to enter.
export function SignatureUploadPanel({
  classId,
  hasSignature = false,
  onUploaded,
}: {
  classId: string;
  hasSignature?: boolean;
  onUploaded?: () => void;
}) {
  const { showToast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const onFile = uploaded || hasSignature;

  async function handleUpload(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    try {
      await api.uploadTeacherSignature(classId, file);
      setUploaded(true);
      showToast("Signature uploaded successfully for this class.");
      onUploaded?.();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Failed to upload signature.", "error");
    } finally {
      setUploading(false);
    }
  }

  return (
    <Card className="mt-4 p-5 border-gold/40 bg-gold/[0.05]">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-full bg-gold/15 text-gold-dark flex items-center justify-center shrink-0">
          <PenTool size={17} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-ink">
            {onFile
              ? "Your signature is on file for this class"
              : "All subjects are complete — upload your signature"}
          </p>
          <p className="text-xs text-ink/55 mt-1 mb-3 max-w-md">
            This signature is printed on every report sheet for this whole class, across all
            subjects. Uploading again replaces the previous one directly.
          </p>
          <label className="inline-flex items-center gap-2 text-sm font-medium text-indigo cursor-pointer hover:text-gold-dark transition-colors">
            <UploadCloud size={15} />
            {uploading ? "Uploading…" : onFile ? "Replace signature" : "Choose signature image"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={uploading}
              onChange={(e) => handleUpload(e.target.files?.[0])}
            />
          </label>
        </div>
      </div>
    </Card>
  );
}
