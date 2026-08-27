import { http, HttpResponse } from "msw";
import { apiBaseUrl } from "@/lib/apiClient";
import type { Address, AddressInput, Contact, ContactPage } from "@/lib/contacts/types";

/** Prefix a path with the configured API base so handlers match apiClient URLs. */
export function api(path: string): string {
  return `${apiBaseUrl}${path}`;
}

/** 1×1 PNG used in tests as a known-good data URL. */
export const TINY_PNG_DATA_URL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

export function makeContact(overrides: Partial<Contact> = {}): Contact {
  const first_name = overrides.first_name ?? "Ada";
  const last_name = overrides.last_name ?? "Lovelace";

  return {
    id: 1,
    first_name,
    last_name,
    email: "ada@example.com",
    phone: "+1-415-555-0101",
    company: "Analytical Engines",
    job_title: "Mathematician",
    notes: null,
    photo: null,
    addresses: [
      {
        id: 1,
        type: "home",
        address: null,
        city: "San Francisco",
        state: "CA",
        postal_code: null,
        country: "USA",
      },
    ],
    created_at: "2026-08-19T17:04:53.743932Z",
    updated_at: "2026-08-19T17:04:53.743936Z",
    full_name: `${first_name} ${last_name}`,
    ...overrides,
  };
}

export function makePage(items: Contact[], total = items.length): ContactPage {
  return { items, total, limit: 25, offset: 0 };
}

function withAddressIds(addresses: AddressInput[] | Address[] | undefined): Address[] {
  return (addresses ?? []).map((row, index) => ({
    id: "id" in row && typeof row.id === "number" ? row.id : index + 1,
    type: row.type,
    address: row.address ?? null,
    city: row.city ?? null,
    state: row.state ?? null,
    postal_code: row.postal_code ?? null,
    country: row.country ?? null,
  }));
}

export const CONTACTS: Contact[] = [
  makeContact(),
  makeContact({
    id: 2,
    first_name: "Grace",
    last_name: "Hopper",
    email: "grace@example.com",
    company: "US Navy",
    job_title: "Rear Admiral",
    full_name: "Grace Hopper",
  }),
];

export const handlers = [
  http.get(api("/health"), () =>
    HttpResponse.json({ status: "ok", database: "sqlite", contacts: 2 }),
  ),

  http.get(api("/api/v1/contacts"), ({ request }) => {
    const search = new URL(request.url).searchParams.get("search")?.toLowerCase();
    const items = search
      ? CONTACTS.filter((contact) =>
          `${contact.full_name} ${contact.email} ${contact.company ?? ""}`
            .toLowerCase()
            .includes(search),
        )
      : CONTACTS;

    return HttpResponse.json(makePage(items));
  }),

  http.get(api("/api/v1/contacts/:id"), ({ params }) => {
    const contact = CONTACTS.find((c) => c.id === Number(params.id));
    return contact
      ? HttpResponse.json(contact)
      : HttpResponse.json(
          { detail: `Contact ${params.id} not found` },
          { status: 404 },
        );
  }),

  http.post(api("/api/v1/contacts"), async ({ request }) => {
    const body = (await request.json()) as Partial<Contact> & {
      addresses?: AddressInput[];
    };
    const { addresses, ...rest } = body;
    return HttpResponse.json(
      makeContact({ ...rest, id: 99, addresses: withAddressIds(addresses) }),
      { status: 201 },
    );
  }),

  http.put(api("/api/v1/contacts/:id"), async ({ request, params }) => {
    const body = (await request.json()) as Partial<Contact> & {
      addresses?: AddressInput[];
    };
    const { addresses, ...rest } = body;
    return HttpResponse.json(
      makeContact({
        ...rest,
        id: Number(params.id),
        addresses: withAddressIds(addresses),
      }),
    );
  }),

  http.delete(api("/api/v1/contacts/:id"), () => new HttpResponse(null, { status: 204 })),
];
