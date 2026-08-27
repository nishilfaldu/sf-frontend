"use client";

import { useState, useTransition } from "react";
import { Share2 } from "lucide-react";
import { createShareAction } from "@/app/contacts/actions";
import Button, { type ButtonSize, type ButtonVariant } from "@/components/ui/Button";
import WifiShareDialog from "@/components/contacts/WifiShareDialog";
import type { LanJoinPayload } from "@/lib/lanHosts";

async function loadJoin(path: string): Promise<LanJoinPayload> {
  const port = window.location.port || "3000";
  const res = await fetch(`/api/lan?port=${encodeURIComponent(port)}&path=${encodeURIComponent(path)}`);
  if (!res.ok) {
    throw new Error("Could not read this laptop's Wi-Fi address.");
  }
  return (await res.json()) as LanJoinPayload;
}

/** Detail-page control: QR for a 30-minute snapshot of this one contact. */
export default function ShareContactButton({
  contactId,
  contactName,
  variant = "secondary",
  size = "md",
}: {
  contactId: number;
  contactName: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [payload, setPayload] = useState<LanJoinPayload | null>(null);
  const [isPending, startTransition] = useTransition();

  function show() {
    setOpen(true);
    setError(null);
    setPayload(null);
    startTransition(async () => {
      const result = await createShareAction(contactId);
      if (result.error || !result.share) {
        setError(result.error ?? "The contact could not be shared.");
        return;
      }
      try {
        setPayload(await loadJoin(`/share/${result.share.token}/`));
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Could not build a join link.");
      }
    });
  }

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={show}
        aria-label={`Share ${contactName} on this Wi-Fi`}
      >
        <Share2 className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
        Share
      </Button>
      <WifiShareDialog
        open={open}
        title={`Share ${contactName}`}
        hint="Scan to open this card. It stays available for 30 minutes, then the link expires."
        url={payload?.joinUrl ?? null}
        qrSvg={payload?.qrSvg ?? null}
        error={error}
        loading={isPending}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
