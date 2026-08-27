import os from "node:os";

/** IPv4 addresses other devices on this Wi-Fi can use to reach this machine. */

function rank(ip: string): number {
  if (ip.startsWith("192.168.")) return 0;
  if (ip.startsWith("10.")) return 1;
  const parts = ip.split(".");
  if (parts[0] === "172") {
    const second = Number(parts[1]);
    if (second >= 16 && second <= 31) return 2;
  }
  return 9;
}

export function lanIPv4Addresses(): string[] {
  const found = new Set<string>();
  for (const addrs of Object.values(os.networkInterfaces())) {
    for (const addr of addrs ?? []) {
      const v4 = addr.family === "IPv4" || addr.family === 4;
      if (!v4 || addr.internal) continue;
      if (addr.address.startsWith("169.254.")) continue;
      found.add(addr.address);
    }
  }
  return [...found].sort((a, b) => rank(a) - rank(b) || a.localeCompare(b));
}

export function joinUrl(ip: string, port: string, path: string): string {
  const withLead = path.startsWith("/") ? path : `/${path}`;
  const withSlash = withLead.endsWith("/") ? withLead : `${withLead}/`;
  return `http://${ip}:${port}${withSlash}`;
}

export interface LanJoinPayload {
  addresses: string[];
  joinUrl: string | null;
  qrSvg: string | null;
}
