"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { AlertCircle, Loader2 } from "lucide-react";
import AddressesField from "@/components/contacts/AddressesField";
import PhotoField from "@/components/contacts/PhotoField";
import Field from "@/components/ui/Field";
import Button, { buttonClasses } from "@/components/ui/Button";
import {
  CONTACT_FORM_SECTIONS,
  type ContactFieldGroup,
  type ContactFieldSpec,
  type ScalarFieldName,
} from "@/lib/contacts/schema";
import {
  EMPTY_FORM_STATE,
  toAddressFormEcho,
  type Contact,
  type FormState,
} from "@/lib/contacts/types";

export type ContactFormAction = (
  state: FormState,
  formData: FormData,
) => Promise<FormState>;

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      {pending ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : null}
      {pending ? "Saving…" : label}
    </Button>
  );
}

function ContactFieldControl({
  field,
  contact,
  value,
  error,
}: {
  field: ContactFieldSpec;
  contact?: Contact;
  value: string;
  error?: string;
}) {
  switch (field.type) {
    case "photo":
      return (
        <div className={field.wide ? "sm:col-span-2" : undefined}>
          <PhotoField defaultPhoto={value} contact={contact} error={error} />
        </div>
      );
    case "textarea":
    case "email":
    case "tel":
    case "text":
    case undefined:
      return <Field field={field} defaultValue={value} error={error} />;
    default: {
      const _exhaustive: never = field;
      return _exhaustive;
    }
  }
}

function ContactFieldset({
  group,
  contact,
  valueFor,
  fieldErrors,
}: {
  group: ContactFieldGroup;
  contact?: Contact;
  valueFor: (name: ScalarFieldName) => string;
  fieldErrors?: Partial<Record<string, string>>;
}) {
  const photoOnly =
    group.fields.length === 1 && group.fields[0]?.type === "photo";

  return (
    <fieldset className="space-y-4">
      <legend className="sr-only">{group.title}</legend>
      {photoOnly ? (
        <h2 className="sr-only">{group.title}</h2>
      ) : (
        <div className="border-b border-hairline pb-2">
          <h2 className="font-display text-sm font-semibold text-foreground">
            {group.title}
          </h2>
          <p className="text-[13px] text-muted-foreground">{group.description}</p>
        </div>
      )}
      <div className={photoOnly ? undefined : "grid gap-4 sm:grid-cols-2"}>
        {group.fields.map((field) => (
          <ContactFieldControl
            key={field.name}
            field={field}
            contact={contact}
            value={valueFor(field.name)}
            error={fieldErrors?.[field.name]}
          />
        ))}
      </div>
    </fieldset>
  );
}

/**
 * Create/edit form. The section list comes from `CONTACT_FORM_SECTIONS`, and the
 * action is a bound server action — so a submit is a plain POST that works
 * before hydration and reports errors through `useActionState`.
 */
export default function ContactForm({
  action,
  contact,
  submitLabel,
  cancelHref,
}: {
  action: ContactFormAction;
  contact?: Contact;
  submitLabel: string;
  cancelHref: string;
}) {
  const [state, formAction] = useActionState(action, EMPTY_FORM_STATE);

  function valueFor(name: ScalarFieldName): string {
    return state.values?.[name] ?? contact?.[name] ?? "";
  }

  const addressRows = (state.values?.addresses ?? contact?.addresses ?? []).map(
    toAddressFormEcho,
  );

  return (
    <form action={formAction} noValidate className="space-y-8">
      {state.status === "error" && state.message ? (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2.5 text-sm text-foreground"
        >
          <AlertCircle
            className="mt-0.5 h-4 w-4 shrink-0 text-destructive"
            strokeWidth={2}
            aria-hidden="true"
          />
          <span>{state.message}</span>
        </div>
      ) : null}

      {CONTACT_FORM_SECTIONS.map((section) => {
        switch (section.type) {
          case "group":
            return (
              <ContactFieldset
                key={section.group.title}
                group={section.group}
                contact={contact}
                valueFor={valueFor}
                fieldErrors={state.fieldErrors}
              />
            );
          case "addresses":
            return (
              <AddressesField
                key="addresses"
                defaultAddresses={addressRows}
                fieldErrors={state.fieldErrors}
              />
            );
          default: {
            const _exhaustive: never = section;
            return _exhaustive;
          }
        }
      })}

      <div className="flex items-center gap-2 border-t border-hairline pt-4">
        <SubmitButton label={submitLabel} />
        <Link href={cancelHref} className={buttonClasses("secondary")}>
          Cancel
        </Link>
      </div>
    </form>
  );
}
