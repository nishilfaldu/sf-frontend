import { notFound } from "next/navigation";
import { ApiError, apiFetch } from "@/lib/apiClient";

type RouteContext = { params: Promise<{ token: string }> };

/** Proxy the snapshot vCard so the phone download stays same-origin. */
export async function GET(_request: Request, { params }: RouteContext) {
  const { token } = await params;
  const res = await apiFetch(`/api/v1/shares/${token}/vcard`);
  if (res.status === 404) notFound();
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new ApiError(res.status, body);
  }

  return new Response(await res.arrayBuffer(), {
    status: 200,
    headers: {
      "Content-Type": res.headers.get("Content-Type") ?? "text/vcard; charset=utf-8",
      "Content-Disposition":
        res.headers.get("Content-Disposition") ?? 'attachment; filename="contact.vcf"',
    },
  });
}
