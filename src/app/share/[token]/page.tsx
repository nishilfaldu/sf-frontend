import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Download } from "lucide-react";
import ContactAvatar from "@/components/contacts/ContactAvatar";
import { buttonClasses } from "@/components/ui/Button";
import { getShare } from "@/lib/contacts/api";
import { addressLine, groupedAddresses, jobLine } from "@/lib/contacts/format";

type PageProps = { params: Promise<{ token: string }> };

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const contact = await getShare((await params).token);
  return {
    title: contact ? `${contact.full_name} · shared` : "Share not found",
  };
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-1 border-b border-hairline px-4 py-3 last:border-b-0 sm:grid-cols-[10rem_1fr] sm:gap-4">
      <dt className="text-[13px] text-muted-foreground">{label}</dt>
      <dd className="break-words text-sm text-foreground">
        {children ?? <span className="text-muted-foreground/50">—</span>}
      </dd>
    </div>
  );
}

export default async function SharedContactPage({ params }: PageProps) {
  const token = (await params).token;
  const contact = await getShare(token);
  if (!contact) notFound();

  const subtitle = jobLine(contact);
  const addressGroups = groupedAddresses(contact.addresses);

  return (
    <div className="mx-auto max-w-xl space-y-6 px-4 py-8">
      <p className="text-[13px] text-muted-foreground">
        Shared on this Wi-Fi · add it to your phone with the button below.
      </p>

      <header className="flex items-center gap-4">
        <ContactAvatar contact={contact} size="xl" />
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
            {contact.full_name}
          </h1>
          {subtitle ? (
            <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>
          ) : null}
        </div>
      </header>

      <a
        href={`/share/${token}/vcard`}
        className={buttonClasses("primary")}
      >
        <Download className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
        Add to phone
      </a>

      <dl className="rounded-lg border border-border bg-card">
        <Row label="Email">
          <a href={`mailto:${contact.email}`} className="text-primary hover:underline">
            {contact.email}
          </a>
        </Row>
        <Row label="Phone">
          {contact.phone ? (
            <a href={`tel:${contact.phone}`} className="text-primary hover:underline">
              {contact.phone}
            </a>
          ) : null}
        </Row>
        <Row label="Company">{contact.company}</Row>
        <Row label="Job title">{contact.job_title}</Row>
        <Row label="Notes">
          {contact.notes ? (
            <span className="whitespace-pre-wrap">{contact.notes}</span>
          ) : null}
        </Row>
      </dl>

      {addressGroups.length > 0 ? (
        <section className="rounded-lg border border-border bg-card">
          <div className="border-b border-hairline px-4 py-3">
            <h2 className="font-display text-sm font-semibold text-foreground">
              Addresses
            </h2>
          </div>
          <div className="divide-y divide-hairline">
            {addressGroups.map((group) => (
              <div key={group.type} className="px-4 py-3">
                <h3 className="text-[13px] font-medium text-muted-foreground">
                  {group.label}
                </h3>
                <ul className="mt-2 space-y-1.5">
                  {group.items.map((item) => (
                    <li key={item.id} className="text-sm text-foreground">
                      {addressLine(item) ?? (
                        <span className="text-muted-foreground/50">No details</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <p className="text-[13px] text-muted-foreground">
        Already on this laptop?{" "}
        <Link href={`/contacts/${contact.id}`} className="text-primary hover:underline">
          Open in the address book
        </Link>
        .
      </p>
    </div>
  );
}
