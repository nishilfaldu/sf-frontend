"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import QrCode from "@/components/contacts/QrCode";

export default function WifiShareDialog({
  open,
  title,
  hint,
  url,
  qrSvg,
  error,
  loading,
  onClose,
}: {
  open: boolean;
  title: string;
  hint: string;
  url: string | null;
  qrSvg: string | null;
  error: string | null;
  loading: boolean;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  if (!open) return null;

  async function copy() {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-20">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="Close"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="wifi-share-title"
        className="relative w-full max-w-sm rounded-lg border border-border bg-card p-5 shadow-xl"
      >
        <h2
          id="wifi-share-title"
          className="font-display text-lg font-semibold text-foreground"
        >
          {title}
        </h2>
        <p className="mt-1 text-[13px] text-muted-foreground">{hint}</p>

        <div className="mt-4">
          {loading ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Finding this Wi-Fi…
            </p>
          ) : error ? (
            <p role="alert" className="py-6 text-sm text-destructive">
              {error}
            </p>
          ) : (
            <>
              {qrSvg ? <QrCode svg={qrSvg} label={`QR code for ${url ?? title}`} /> : null}
              {url ? (
                <p className="mt-3 break-all text-center font-mono text-[13px] text-foreground">
                  {url}
                </p>
              ) : (
                <p className="py-6 text-sm text-muted-foreground">
                  Could not find a Wi-Fi address on this laptop. Connect to a
                  network and try again. Guest Wi-Fi with client isolation also
                  blocks phones from reaching you.
                </p>
              )}
            </>
          )}
        </div>

        <div className="mt-4 flex justify-end gap-2">
          {url ? (
            <Button variant="secondary" size="sm" onClick={copy}>
              {copied ? "Copied" : "Copy link"}
            </Button>
          ) : null}
          <Button variant="primary" size="sm" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}
