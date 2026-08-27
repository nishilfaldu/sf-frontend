import type { LanJoinPayload } from "@/lib/lanHosts";

/** Browser helper: ask the Next server for a LAN join URL and QR. */
export async function fetchLanJoin(path: string): Promise<LanJoinPayload> {
  const port = window.location.port || "3000";
  const res = await fetch(
    `/api/lan?port=${encodeURIComponent(port)}&path=${encodeURIComponent(path)}`,
  );
  if (!res.ok) {
    throw new Error("Could not read this laptop's Wi-Fi address.");
  }
  return (await res.json()) as LanJoinPayload;
}
