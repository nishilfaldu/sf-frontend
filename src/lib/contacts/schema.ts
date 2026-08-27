import { z } from "zod";
import {
  decodedPhotoByteLength,
  MAX_PHOTO_BYTES,
  MAX_PHOTO_DATA_URL_CHARS,
  PHOTO_DATA_URL_PATTERN,
} from "./photo";
import {
  ADDRESS_TYPES,
  MAX_ADDRESSES,
  type AddressFormEcho,
  type AddressInput,
  type ContactFormEcho,
  type ContactInput,
} from "./types";

/**
 * Client/server-shared validation for the contact form.
 *
 * The rules mirror the API's Pydantic models (`ContactCreate` / `ContactReplace`)
 * so the user sees a mistake before a round trip — the API stays the authority,
 * and anything it rejects anyway is surfaced by `toFieldErrors` in `./api.ts`.
 */

/** Optional text: trimmed, and blank becomes `null` (the API clears the field). */
function optionalText(max: number, label: string) {
  return z
    .string()
    .trim()
    .max(max, `${label} must be ${max} characters or fewer`)
    .transform((value) => value || null)
    .nullable()
    .default(null);
}

function requiredText(max: number, label: string) {
  return z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .max(max, `${label} must be ${max} characters or fewer`);
}

export const addressInputSchema = z.object({
  type: z.enum(ADDRESS_TYPES),
  address: optionalText(300, "Street address"),
  city: optionalText(120, "City"),
  state: optionalText(120, "State"),
  postal_code: optionalText(20, "Postal code"),
  country: optionalText(120, "Country"),
}) satisfies z.ZodType<AddressInput, unknown>;

function isBlankAddress(
  row: Pick<AddressInput, "address" | "city" | "state" | "postal_code" | "country">,
) {
  return !row.address && !row.city && !row.state && !row.postal_code && !row.country;
}

export const contactInputSchema = z.object({
  first_name: requiredText(100, "First name"),
  last_name: requiredText(100, "Last name"),
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .max(320, "Email must be 320 characters or fewer")
    .pipe(z.email("Enter a valid email address"))
    .transform((value) => value.toLowerCase()),
  phone: optionalText(40, "Phone"),
  company: optionalText(200, "Company"),
  job_title: optionalText(200, "Job title"),
  notes: z
    .string()
    .trim()
    .transform((value) => value || null)
    .nullable()
    .default(null),
  photo: z
    .string()
    .trim()
    .max(MAX_PHOTO_DATA_URL_CHARS, "Photo is too large to send")
    .refine(
      (value) => value === "" || PHOTO_DATA_URL_PATTERN.test(value),
      "Photo must be a JPEG, PNG, GIF, or WebP image",
    )
    .refine(
      (value) => value === "" || decodedPhotoByteLength(value) <= MAX_PHOTO_BYTES,
      "Photo must be 512 KB or smaller",
    )
    .transform((value) => value || null)
    .nullable()
    .default(null),
  addresses: z
    .array(addressInputSchema)
    .max(MAX_ADDRESSES, `A contact can have at most ${MAX_ADDRESSES} addresses`)
    .transform((rows) => rows.filter((row) => !isBlankAddress(row)))
    .default([]),
}) satisfies z.ZodType<ContactInput, unknown>;

export type ContactFormValues = z.input<typeof contactInputSchema>;

/** Collapse a ZodError into one message per field, keyed by input name. */
export function zodFieldErrors(
  error: z.ZodError,
): Partial<Record<string, string>> {
  const fieldErrors: Partial<Record<string, string>> = {};
  for (const issue of error.issues) {
    const key = issue.path
      .filter((part): part is string | number => part !== undefined)
      .join(".");
    if (key && !(key in fieldErrors)) {
      fieldErrors[key] = issue.message;
    }
  }
  return fieldErrors;
}

/* ------------------------------------------------------------------ */
/* Form metadata — one source of truth for the fields and their limits */
/* ------------------------------------------------------------------ */

export type ScalarFieldName = Exclude<keyof ContactInput, "addresses">;

export type FormControlSpec = {
  name: string;
  label: string;
  type?: "text" | "email" | "tel" | "textarea";
  required?: boolean;
  maxLength?: number;
  placeholder?: string;
  autoComplete?: string;
  /** Column span inside the section grid. */
  wide?: boolean;
  options?: { value: string; label: string }[];
};

export type TextFieldSpec = FormControlSpec & {
  name: Exclude<ScalarFieldName, "photo">;
  maxLength: number;
};

export type PhotoFieldSpec = {
  name: "photo";
  label: string;
  type: "photo";
  maxLength: number;
  wide?: boolean;
};

export type ContactFieldSpec = TextFieldSpec | PhotoFieldSpec;

export interface ContactFieldGroup {
  title: string;
  description: string;
  fields: ContactFieldSpec[];
}

export type FormSection =
  | { type: "group"; group: ContactFieldGroup }
  | { type: "addresses" };

type AddressPostalName = keyof Omit<AddressFormEcho, "type">;

export const ADDRESS_FIELDS: Array<FormControlSpec & { name: AddressPostalName }> = [
  {
    name: "address",
    label: "Street address",
    maxLength: 300,
    placeholder: "1 Market St, Suite 400",
    autoComplete: "street-address",
    wide: true,
  },
  {
    name: "city",
    label: "City",
    maxLength: 120,
    placeholder: "San Francisco",
    autoComplete: "address-level2",
  },
  {
    name: "state",
    label: "State / region",
    maxLength: 120,
    placeholder: "CA",
    autoComplete: "address-level1",
  },
  {
    name: "postal_code",
    label: "Postal code",
    maxLength: 20,
    placeholder: "94105",
    autoComplete: "postal-code",
  },
  {
    name: "country",
    label: "Country",
    maxLength: 120,
    placeholder: "USA",
    autoComplete: "country-name",
  },
];

export const CONTACT_FORM_SECTIONS: FormSection[] = [
  {
    type: "group",
    group: {
      title: "Photo",
      description: "Shown as a circular avatar. JPEG, PNG, GIF, or WebP up to 512 KB.",
      fields: [
        {
          name: "photo",
          label: "Photo",
          type: "photo",
          maxLength: MAX_PHOTO_DATA_URL_CHARS,
          wide: true,
        },
      ],
    },
  },
  {
    type: "group",
    group: {
      title: "Identity",
      description: "First name, last name, and email are required.",
      fields: [
        {
          name: "first_name",
          label: "First name",
          required: true,
          maxLength: 100,
          placeholder: "Ada",
          autoComplete: "given-name",
        },
        {
          name: "last_name",
          label: "Last name",
          required: true,
          maxLength: 100,
          placeholder: "Lovelace",
          autoComplete: "family-name",
        },
        {
          name: "email",
          label: "Email",
          type: "email",
          required: true,
          maxLength: 320,
          placeholder: "ada@example.com",
          autoComplete: "email",
        },
        {
          name: "phone",
          label: "Phone",
          type: "tel",
          maxLength: 40,
          placeholder: "+1-415-555-0101",
          autoComplete: "tel",
        },
      ],
    },
  },
  {
    type: "group",
    group: {
      title: "Work",
      description: "Where they work and what they do.",
      fields: [
        {
          name: "company",
          label: "Company",
          maxLength: 200,
          placeholder: "Analytical Engines",
          autoComplete: "organization",
        },
        {
          name: "job_title",
          label: "Job title",
          maxLength: 200,
          placeholder: "Mathematician",
          autoComplete: "organization-title",
        },
      ],
    },
  },
  { type: "addresses" },
  {
    type: "group",
    group: {
      title: "Notes",
      description: "Anything worth remembering. No length limit.",
      fields: [
        {
          name: "notes",
          label: "Notes",
          type: "textarea",
          maxLength: 10_000,
          placeholder: "Met at the SF hackathon.",
          wide: true,
        },
      ],
    },
  },
];

export const CONTACT_FIELD_GROUPS: ContactFieldGroup[] = CONTACT_FORM_SECTIONS.flatMap(
  (section) => (section.type === "group" ? [section.group] : []),
);

export const CONTACT_FIELDS: ContactFieldSpec[] = CONTACT_FIELD_GROUPS.flatMap(
  (group) => group.fields,
);

export const EMPTY_ADDRESS: AddressFormEcho = {
  type: "home",
  address: "",
  city: "",
  state: "",
  postal_code: "",
  country: "",
};

function addressesFromFormData(formData: FormData): AddressFormEcho[] {
  const count = Number(formData.get("address_count") ?? 0);
  if (!Number.isInteger(count) || count < 1) return [];

  return Array.from({ length: Math.min(count, MAX_ADDRESSES) }, (_, index) => {
    const row: AddressFormEcho = {
      type: String(formData.get(`addresses.${index}.type`) ?? "home"),
      address: "",
      city: "",
      state: "",
      postal_code: "",
      country: "",
    };
    for (const field of ADDRESS_FIELDS) {
      row[field.name] = String(formData.get(`addresses.${index}.${field.name}`) ?? "");
    }
    return row;
  });
}

function scalarFromForm(formData: FormData, name: ScalarFieldName): string {
  return String(formData.get(name) ?? "");
}

/** Pull the contact fields out of a submitted form, as raw strings. */
export function formDataToValues(formData: FormData): ContactFormEcho {
  return {
    first_name: scalarFromForm(formData, "first_name"),
    last_name: scalarFromForm(formData, "last_name"),
    email: scalarFromForm(formData, "email"),
    phone: scalarFromForm(formData, "phone"),
    company: scalarFromForm(formData, "company"),
    job_title: scalarFromForm(formData, "job_title"),
    notes: scalarFromForm(formData, "notes"),
    photo: scalarFromForm(formData, "photo"),
    addresses: addressesFromFormData(formData),
  };
}
