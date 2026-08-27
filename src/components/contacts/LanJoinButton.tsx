"use client";

import { useState } from "react";
import { Wifi } from "lucide-react";
import Button from "@/components/ui/Button";
import WifiShareDialog from "@/components/contacts/WifiShareDialog";
import { fetchLanJoin } from "@/lib/fetchLanJoin";
import type { LanJoinPayload } from "@/lib/lanHosts";

/** Header control: QR + URL so phones on this Wi-Fi can open the address book. */
export default function LanJoinButton() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [payload, setPayload] = useState<LanJoinPayload | null>(null);

  async function show() {
    setOpen(true);
    setLoading(true);
    setError(null);
    try {
      setPayload(await fetchLanJoin("/contacts/"));
    } catch (cause) {
      setPayload(null);
      setError(cause instanceof Error ? cause.message : "Could not start Wi-Fi sharing.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button variant="ghost" size="sm" onClick={show} aria-label="Share on this Wi-Fi">
        <Wifi className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
        <span className="hidden sm:inline">Wi-Fi</span>
      </Button>
      <WifiShareDialog
        open={open}
        title="Join on this Wi-Fi"
        hint="Anyone on the same network can scan this and open the live address book."
        url={payload?.joinUrl ?? null}
        qrSvg={payload?.qrSvg ?? null}
        error={error}
        loading={loading}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
