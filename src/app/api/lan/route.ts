import { getLan, getQrSvg } from "@/lib/contacts/api";
import { joinUrl, type LanJoinPayload } from "@/lib/lanHosts";

/**
 * Same-origin helper the Wi-Fi dialogs call from the browser.
 *
 * The Next server already knows this laptop's LAN IPs (and can mint a QR via
 * the Contacts API). The client only supplies the port it is actually on and
 * the path the phone should open.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const port = searchParams.get("port") || "3000";
  const path = searchParams.get("path") || "/contacts/";

  const lan = await getLan();
  const ip = lan.addresses[0];
  const url = ip ? joinUrl(ip, port, path) : null;
  let qrSvg: string | null = null;
  if (url) {
    try {
      qrSvg = await getQrSvg(url);
    } catch {
      qrSvg = null;
    }
  }

  const body: LanJoinPayload = {
    addresses: lan.addresses,
    joinUrl: url,
    qrSvg,
  };
  return Response.json(body);
}
