"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

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

export function ScanCapture() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
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
        setError(("error" in json && json.error) || `Scan failed (${res.status}).`);
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
        })
      );
      router.push(`/expenses/scan/review?id=${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error.");
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm text-muted-foreground">
        Take a photo of your receipt. We&rsquo;ll extract the fields and you can
        review before saving.
      </p>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />

      <Button
        type="button"
        size="lg"
        disabled={pending}
        onClick={() => inputRef.current?.click()}
      >
        {pending ? "Extracting…" : "Take photo / choose file"}
      </Button>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <Link
        href="/"
        className="self-center text-sm text-muted-foreground hover:underline"
      >
        Cancel
      </Link>
    </div>
  );
}
