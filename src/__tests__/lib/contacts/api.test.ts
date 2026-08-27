import { http, HttpResponse } from "msw";
import { server } from "../../mocks/server";
import { api } from "../../mocks/handlers";
import { ApiError } from "@/lib/apiClient";
import {
  apiErrorMessage,
  createContact,
  createShare,
  deleteContact,
  getContact,
  getHealth,
  getLan,
  getQrSvg,
  getShare,
  listContacts,
  replaceContact,
  toFieldErrors,
} from "@/lib/contacts/api";
import type { ContactInput } from "@/lib/contacts/types";

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const INPUT: ContactInput = {
  first_name: "Grace",
  last_name: "Hopper",
  email: "grace@example.com",
  phone: null,
  company: null,
  job_title: null,
  notes: null,
  photo: null,
  addresses: [],
};

describe("listContacts", () => {
  it("returns the page envelope", async () => {
    const page = await listContacts();
    expect(page.total).toBe(2);
    expect(page.items).toHaveLength(2);
  });

  it("forwards search, paging and sorting as query params", async () => {
    let seen: URLSearchParams | undefined;
    server.use(
      http.get(api("/api/v1/contacts"), ({ request }) => {
        seen = new URL(request.url).searchParams;
        return HttpResponse.json({ items: [], total: 0, limit: 10, offset: 20 });
      }),
    );

    await listContacts({
      search: "ada",
      limit: 10,
      offset: 20,
      sortBy: "email",
      order: "desc",
    });

    expect(Object.fromEntries(seen!)).toEqual({
      search: "ada",
      limit: "10",
      offset: "20",
      sort_by: "email",
      order: "desc",
    });
  });
});

describe("getContact", () => {
  it("returns the contact", async () => {
    await expect(getContact(1)).resolves.toMatchObject({ id: 1 });
  });

  it("returns null on 404 rather than throwing", async () => {
    await expect(getContact(4242)).resolves.toBeNull();
  });

  it("still throws on other failures", async () => {
    server.use(
      http.get(api("/api/v1/contacts/:id"), () =>
        HttpResponse.json({ detail: "nope" }, { status: 500 }),
      ),
    );

    await expect(getContact(1)).rejects.toBeInstanceOf(ApiError);
  });
});

describe("createContact", () => {
  it("posts the input and returns the stored contact", async () => {
    await expect(createContact(INPUT)).resolves.toMatchObject({ id: 99 });
  });

  it("gives submitted addresses server ids in the response", async () => {
    const created = await createContact({
      ...INPUT,
      addresses: [
        {
          type: "home",
          address: null,
          city: "San Francisco",
          state: "CA",
          postal_code: null,
          country: "USA",
        },
      ],
    });

    expect(created.addresses).toEqual([
      {
        id: 1,
        type: "home",
        address: null,
        city: "San Francisco",
        state: "CA",
        postal_code: null,
        country: "USA",
      },
    ]);
  });

  it("surfaces a 409 as an ApiError", async () => {
    server.use(
      http.post(api("/api/v1/contacts"), () =>
        HttpResponse.json(
          { detail: "Email grace@example.com is already in use" },
          { status: 409 },
        ),
      ),
    );

    await expect(createContact(INPUT)).rejects.toMatchObject({ status: 409 });
  });
});

describe("replaceContact", () => {
  it("puts the input and returns addresses with server ids", async () => {
    const replaced = await replaceContact(1, {
      ...INPUT,
      addresses: [
        {
          type: "work",
          address: "1 Market St",
          city: "San Francisco",
          state: "CA",
          postal_code: "94105",
          country: "USA",
        },
      ],
    });

    expect(replaced.id).toBe(1);
    expect(replaced.addresses).toEqual([
      {
        id: 1,
        type: "work",
        address: "1 Market St",
        city: "San Francisco",
        state: "CA",
        postal_code: "94105",
        country: "USA",
      },
    ]);
  });
});

describe("deleteContact", () => {
  it("resolves on 204", async () => {
    await expect(deleteContact(1)).resolves.toBeUndefined();
  });

  it("throws on 404", async () => {
    server.use(
      http.delete(api("/api/v1/contacts/:id"), () =>
        HttpResponse.json({ detail: "Contact 9 not found" }, { status: 404 }),
      ),
    );

    await expect(deleteContact(9)).rejects.toMatchObject({ status: 404 });
  });
});

describe("getHealth", () => {
  it("returns the probe result", async () => {
    await expect(getHealth()).resolves.toMatchObject({ status: "ok" });
  });

  it("returns null instead of throwing when the probe fails", async () => {
    server.use(http.get(api("/health"), () => HttpResponse.error()));
    await expect(getHealth()).resolves.toBeNull();
  });
});

describe("Wi-Fi share helpers", () => {
  it("reads LAN addresses", async () => {
    await expect(getLan()).resolves.toMatchObject({
      addresses: ["192.168.1.42"],
      bind_port: 8000,
    });
  });

  it("returns QR markup as text", async () => {
    await expect(getQrSvg("http://192.168.1.42:3000/contacts/")).resolves.toContain(
      "<svg",
    );
  });

  it("mints a share token", async () => {
    await expect(createShare(1)).resolves.toMatchObject({
      token: "shareTok",
      contact_id: 1,
    });
  });

  it("returns a snapshot for a live token and null for an unknown one", async () => {
    await expect(getShare("shareTok")).resolves.toMatchObject({ id: 1 });
    await expect(getShare("nope")).resolves.toBeNull();
  });
});

describe("error translation", () => {
  it("reads the API's detail string", () => {
    const error = new ApiError(409, JSON.stringify({ detail: "taken" }));
    expect(apiErrorMessage(error, "fallback")).toBe("taken");
  });

  it("falls back when the body has no usable detail", () => {
    expect(apiErrorMessage(new ApiError(500, "boom"), "fallback")).toBe(
      "fallback",
    );
  });

  it("maps a 422 body onto field names", () => {
    const error = new ApiError(
      422,
      JSON.stringify({
        detail: [
          { loc: ["body", "email"], msg: "value is not a valid email address" },
          { loc: ["body", "first_name"], msg: "String should have at least 1 character" },
        ],
      }),
    );

    expect(toFieldErrors(error)).toEqual({
      email: "value is not a valid email address",
      first_name: "String should have at least 1 character",
    });
  });

  it("returns nothing for a non-validation body", () => {
    expect(toFieldErrors(new ApiError(500, "boom"))).toEqual({});
  });
});
