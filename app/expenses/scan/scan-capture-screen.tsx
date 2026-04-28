"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Loader, Sparkles, Upload, X } from "lucide-react";
import { IconButton } from "@/components/ui/icon-button";
import { ScreenHeader } from "@/components/ui/screen-header";
import { SectionLabel } from "@/components/ui/section-label";

type ScanResponse = {
  id: string;
  photo_path: string;
  extraction: {
    amount: number | null;
    date: string | null;
    merchant: string | null;
    category_hint: string | null;
  };
  extraction_raw: unknown;
};

export function ScanCaptureScreen() {
  const router = useRouter();
  const cameraInput = useRef<HTMLInputElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setPending(true);
    setError(null);

    const fd = new FormData();
    fd.append("file", file);

    try {
      const res = await fetch("/api/scan", { method: "POST", body: fd });
      const json = (await res.json()) as ScanResponse | { error: string };

      if (!res.ok) {
        setError(
          ("error" in json && json.error) || `Scan failed (${res.status}).`,
        );
        setPending(false);
        return;
      }

      const data = json as ScanResponse;
      sessionStorage.setItem(
        `scan:${data.id}`,
        JSON.stringify({
          photo_path: data.photo_path,
          extraction: data.extraction,
          extraction_raw: data.extraction_raw,
        }),
      );
      router.push(`/expenses/scan/review?id=${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error.");
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 w-full">
      <ScreenHeader
        label={pending ? "Reading receipt" : "Scan receipt"}
        right={
          <IconButton
            type="button"
            onClick={() => router.back()}
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </IconButton>
        }
      />

      {pending ? (
        <LoadingView />
      ) : (
        <CaptureView
          onCamera={() => cameraInput.current?.click()}
          onUpload={() => fileInput.current?.click()}
          error={error}
        />
      )}

      <input
        ref={cameraInput}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = "";
        }}
      />
      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}

function CaptureView({
  onCamera,
  onUpload,
  error,
}: {
  onCamera: () => void;
  onUpload: () => void;
  error: string | null;
}) {
  return (
    <div className="flex-1 px-6 flex flex-col overflow-y-auto pb-6">
      <div className="mt-6">
        <h2 className="font-serif italic text-stone-100 text-[42px] leading-[1.05] tracking-tight">
          Snap it.
          <br />
          <span className="text-stone-500">We&rsquo;ll read it.</span>
        </h2>
        <p className="mt-3 text-stone-400 text-[14px] leading-relaxed max-w-[320px]">
          We&rsquo;ll extract amount, merchant and date. You confirm before
          anything is saved.
        </p>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={onCamera}
          className="aspect-[4/5] rounded-3xl border border-dashed border-white/15 bg-white/[0.02] flex flex-col items-center justify-center gap-3 hover:bg-white/[0.04] transition"
        >
          <div className="w-12 h-12 rounded-2xl bg-stone-100 text-stone-950 flex items-center justify-center">
            <Camera className="w-5 h-5" />
          </div>
          <div className="text-stone-100 text-[13px] tracking-tight">
            Take photo
          </div>
          <div className="text-stone-500 text-[11px]">Camera</div>
        </button>
        <button
          type="button"
          onClick={onUpload}
          className="aspect-[4/5] rounded-3xl border border-dashed border-white/15 bg-white/[0.02] flex flex-col items-center justify-center gap-3 hover:bg-white/[0.04] transition"
        >
          <div className="w-12 h-12 rounded-2xl bg-white/[0.06] border border-white/10 text-stone-100 flex items-center justify-center">
            <Upload className="w-5 h-5" />
          </div>
          <div className="text-stone-100 text-[13px] tracking-tight">Upload</div>
          <div className="text-stone-500 text-[11px]">From library</div>
        </button>
      </div>

      {error ? (
        <p className="mt-4 text-[13px] text-rose-300/80 tracking-tight">
          {error}
        </p>
      ) : null}

      <div className="mt-8 border border-white/[0.06] rounded-2xl p-4 flex gap-3">
        <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center shrink-0">
          <Sparkles className="w-4 h-4 text-stone-300" />
        </div>
        <div>
          <div className="text-[13px] text-stone-100 tracking-tight">
            Reviewed before saved
          </div>
          <div className="text-[12px] text-stone-500 leading-relaxed mt-0.5">
            AI suggests fields. Nothing is logged until you confirm.
          </div>
        </div>
      </div>
    </div>
  );
}

function LoadingView() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6">
      <div className="relative mb-10">
        <ReceiptMockup />
        <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
          <div
            className="absolute inset-x-0 h-1 bg-stone-100/90 shadow-[0_0_20px_4px_rgba(255,255,255,0.4)]"
            style={{ animation: "scanLine 1.6s ease-in-out infinite" }}
          />
        </div>
      </div>
      <SectionLabel className="mb-2">Reading receipt</SectionLabel>
      <div className="font-serif italic text-stone-100 text-[24px]">
        Just a moment…
      </div>
      <div className="mt-1 text-[12px] text-stone-500 flex items-center gap-2">
        <Loader className="w-3 h-3 animate-spin" /> Extracting amount, date,
        merchant
      </div>
    </div>
  );
}

function ReceiptMockup() {
  return (
    <div className="w-44 h-56 rounded-2xl bg-gradient-to-b from-stone-200 to-stone-300 shadow-2xl shadow-black/40 overflow-hidden relative">
      <div className="absolute inset-x-0 top-0 h-6 bg-stone-100" />
      <div className="absolute inset-x-3 top-8 space-y-1.5">
        <div className="h-1.5 bg-stone-400/60 rounded w-3/4" />
        <div className="h-1.5 bg-stone-400/60 rounded w-1/2" />
        <div className="h-1.5 bg-stone-400/60 rounded w-2/3" />
        <div className="h-1.5 bg-stone-400/60 rounded w-1/3" />
        <div className="h-3" />
        <div className="h-1.5 bg-stone-400/60 rounded w-5/6" />
        <div className="h-1.5 bg-stone-400/60 rounded w-3/4" />
        <div className="h-3" />
        <div className="h-2 bg-stone-700/70 rounded w-1/2" />
      </div>
    </div>
  );
}
