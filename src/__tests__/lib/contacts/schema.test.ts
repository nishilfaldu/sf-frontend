import {
  CONTACT_FIELDS,
  contactInputSchema,
  formDataToValues,
  zodFieldErrors,
} from "@/lib/contacts/schema";
import { MAX_PHOTO_BYTES } from "@/lib/contacts/photo";
import { TINY_PNG_DATA_URL } from "../../mocks/handlers";

function values(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    first_name: "Ada",
    last_name: "Lovelace",
    email: "Ada@Example.com",
    phone: "",
    company: "",
    job_title: "",
    notes: "",
    photo: "",
    addresses: [],
    ...overrides,
  };
}

describe("contactInputSchema", () => {
  it("lowercases the email and nulls out the blanks", () => {
    const parsed = contactInputSchema.parse(values());

    expect(parsed.email).toBe("ada@example.com");
    expect(parsed.phone).toBeNull();
    expect(parsed.notes).toBeNull();
    expect(parsed.photo).toBeNull();
    expect(parsed.addresses).toEqual([]);
  });

  it("trims what the user typed", () => {
    expect(contactInputSchema.parse(values({ company: "  Acme  " })).company).toBe(
      "Acme",
    );
  });

  it("requires the three fields the API requires", () => {
    const result = contactInputSchema.safeParse(
      values({ first_name: " ", last_name: "", email: "" }),
    );

    expect(result.success).toBe(false);
    expect(zodFieldErrors(result.error!)).toEqual({
      first_name: "First name is required",
      last_name: "Last name is required",
      email: "Email is required",
    });
  });

  it("rejects a malformed email", () => {
    const result = contactInputSchema.safeParse(values({ email: "not-an-email" }));
    expect(zodFieldErrors(result.error!).email).toBe("Enter a valid email address");
  });

  it("enforces the API's length limits", () => {
    const result = contactInputSchema.safeParse(
      values({
        first_name: "a".repeat(101),
        addresses: [{ type: "home", postal_code: "9".repeat(21) }],
      }),
    );

    expect(zodFieldErrors(result.error!)).toEqual({
      first_name: "First name must be 100 characters or fewer",
      "addresses.0.postal_code": "Postal code must be 20 characters or fewer",
    });
  });

  it("keeps typed addresses and drops blank rows", () => {
    const parsed = contactInputSchema.parse(
      values({
        addresses: [
          {
            type: "work",
            address: "1 Market St",
            city: "San Francisco",
            state: "CA",
            postal_code: "94105",
            country: "USA",
          },
          {
            type: "home",
            address: "",
            city: "",
            state: "",
            postal_code: "",
            country: "",
          },
        ],
      }),
    );

    expect(parsed.addresses).toEqual([
      {
        type: "work",
        address: "1 Market St",
        city: "San Francisco",
        state: "CA",
        postal_code: "94105",
        country: "USA",
      },
    ]);
  });

  it("rejects an unknown address type", () => {
    const result = contactInputSchema.safeParse(
      values({ addresses: [{ type: "vacation", city: "Tahoe" }] }),
    );

    expect(result.success).toBe(false);
    expect(zodFieldErrors(result.error!)["addresses.0.type"]).toBeTruthy();
  });

  it("accepts a JPEG/PNG/GIF/WebP data URL and rejects the rest", () => {
    expect(contactInputSchema.parse(values({ photo: TINY_PNG_DATA_URL })).photo).toBe(
      TINY_PNG_DATA_URL,
    );

    expect(
      zodFieldErrors(
        contactInputSchema.safeParse(values({ photo: "https://cdn.example/ada.png" }))
          .error!,
      ).photo,
    ).toBe("Photo must be a JPEG, PNG, GIF, or WebP image");

    expect(
      zodFieldErrors(
        contactInputSchema.safeParse(
          values({ photo: "data:image/svg+xml;base64,PHN2Zy8+" }),
        ).error!,
      ).photo,
    ).toBe("Photo must be a JPEG, PNG, GIF, or WebP image");
  });

  it("rejects a data URL whose decoded payload exceeds 512 KB", () => {
    const payload = "A".repeat(Math.ceil(((MAX_PHOTO_BYTES + 1) * 4) / 3));
    const result = contactInputSchema.safeParse(
      values({ photo: `data:image/png;base64,${payload}` }),
    );

    expect(zodFieldErrors(result.error!).photo).toBe(
      "Photo must be 512 KB or smaller",
    );
  });
});

describe("formDataToValues", () => {
  it("pulls every known field out, defaulting to an empty string", () => {
    const formData = new FormData();
    formData.set("first_name", "Grace");
    formData.set("email", "grace@example.com");
    formData.set("ignored", "nope");

    const extracted = formDataToValues(formData);

    expect(extracted.first_name).toBe("Grace");
    expect(extracted.last_name).toBe("");
    expect(extracted.photo).toBe("");
    expect(extracted.addresses).toEqual([]);
    expect(Object.keys(extracted).sort()).toEqual(
      [...CONTACT_FIELDS.map((field) => field.name), "addresses"].sort(),
    );
  });

  it("rebuilds indexed address rows from FormData", () => {
    const formData = new FormData();
    formData.set("address_count", "2");
    formData.set("addresses.0.type", "home");
    formData.set("addresses.0.city", "San Francisco");
    formData.set("addresses.1.type", "work");
    formData.set("addresses.1.address", "1 Market St");
    formData.set("addresses.1.city", "San Francisco");

    expect(formDataToValues(formData).addresses).toEqual([
      {
        type: "home",
        address: "",
        city: "San Francisco",
        state: "",
        postal_code: "",
        country: "",
      },
      {
        type: "work",
        address: "1 Market St",
        city: "San Francisco",
        state: "",
        postal_code: "",
        country: "",
      },
    ]);
  });
});
