import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import ContactAvatar from "@/components/contacts/ContactAvatar";
import ContactQuickActions from "@/components/contacts/ContactQuickActions";
import DeleteContactButton from "@/components/contacts/DeleteContactButton";
import { getContact } from "@/lib/contacts/api";
import {
  addressLine,
  formatTimestamp,
  groupedAddresses,
  jobLine,
} from "@/lib/contacts/format";

type PageProps = { params: Promise<{ id: string }> };

function parseId(raw: string): number {
  const id = Number.parseInt(raw, 10);
  if (!Number.isInteger(id) || id < 1) notFound();
  return id;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const contact = await getContact(parseId((await params).id));
  return {
    title: contact?.full_name ?? "Contact not found",
    description: contact ? jobLine(contact) ?? undefined : undefined,
  };
}

function Row({
  label,
  children,
  tinted = false,
}: {
  label: string;
  children: ReactNode;
  tinted?: boolean;
}) {
  return (
    <div className="flex flex-col items-start gap-px border-b border-hairline px-4 py-2.5 last:border-b-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd
        className={`break-words text-[17px] ${
          tinted ? "text-primary" : "text-foreground"
        }`}
      >
        {children ?? <span className="text-muted-foreground/50">—</span>}
      </dd>
    </div>
  );
}

export default async function ContactDetailPage({ params }: PageProps) {
  const contact = await getContact(parseId((await params).id));
  if (!contact) notFound();

  const subtitle = jobLine(contact);
  const addressGroups = groupedAddresses(contact.addresses);

  return (
    <div className="mx-auto max-w-lg space-y-4 px-4 py-6">
      <Link
        href="/contacts"
        className="inline-flex items-center gap-1 text-[13px] text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
        All contacts
      </Link>

      <div className="flex justify-end">
        <Link
          href={`/contacts/${contact.id}/edit`}
          className="text-[17px] text-primary"
        >
          Edit
        </Link>
      </div>

      <header className="flex flex-col items-center text-center">
        {contact.photo ? (
          <ContactAvatar contact={contact} size="hero" />
        ) : (
          <Link
            href={`/contacts/${contact.id}/edit`}
            className="rounded-full"
            aria-label="Add photo"
          >
            <ContactAvatar contact={contact} size="hero" />
          </Link>
        )}
        {contact.photo ? null : (
          <Link
            href={`/contacts/${contact.id}/edit`}
            className="mt-2.5 text-[17px] text-primary"
          >
            Add Photo
          </Link>
        )}

        <h1 className="mt-4 font-display text-[28px] font-semibold tracking-tight text-foreground">
          {contact.full_name}
        </h1>
        {subtitle ? (
          <p className="mt-1 text-[15px] text-muted-foreground">{subtitle}</p>
        ) : null}

        <ContactQuickActions email={contact.email} phone={contact.phone} />
      </header>

      <dl className="overflow-hidden rounded-xl bg-card">
        <Row label="email" tinted>
          <a href={`mailto:${contact.email}`}>{contact.email}</a>
        </Row>
        <Row label="phone">
          {contact.phone ? (
            <a href={`tel:${contact.phone}`} className="text-foreground">
              {contact.phone}
            </a>
          ) : null}
        </Row>
        <Row label="company">{contact.company}</Row>
        <Row label="title">{contact.job_title}</Row>
        <Row label="notes">
          {contact.notes ? (
            <span className="whitespace-pre-wrap">{contact.notes}</span>
          ) : null}
        </Row>
      </dl>

      <dl className="overflow-hidden rounded-xl bg-card">
        {addressGroups.length === 0 ? (
          <Row label="address">
            <span className="text-muted-foreground/70">No addresses yet.</span>
          </Row>
        ) : (
          addressGroups.flatMap((group) =>
            group.items.map((item) => (
              <Row key={item.id} label={group.label.toLowerCase()}>
                {addressLine(item) ?? (
                  <span className="text-muted-foreground/50">No details</span>
                )}
              </Row>
            )),
          )
        )}
      </dl>

      <dl className="overflow-hidden rounded-xl bg-card/50 text-[13px]">
        <Row label="id">
          <span className="font-mono text-sm">{contact.id}</span>
        </Row>
        <Row label="created">
          <span className="font-mono text-sm">
            {formatTimestamp(contact.created_at)}
          </span>
        </Row>
        <Row label="updated">
          <span className="font-mono text-sm">
            {formatTimestamp(contact.updated_at)}
          </span>
        </Row>
      </dl>

      <div className="flex justify-center pt-2">
        <DeleteContactButton
          contactId={contact.id}
          contactName={contact.full_name}
          redirectToList
          variant="ghost"
          size="md"
          withLabel
        />
      </div>
    </div>
  );
}
