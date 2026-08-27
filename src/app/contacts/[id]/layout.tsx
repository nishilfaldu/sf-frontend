import type { ReactNode } from "react";
import ContactsRail from "@/components/contacts/ContactsRail";
import { listContacts } from "@/lib/contacts/api";
import type { Contact } from "@/lib/contacts/types";

/**
 * Split view for a single contact: the directory stays in a left rail on large
 * screens; the card (or edit form) is the pane. Narrow screens keep the
 * existing stacked pages.
 */
export default async function ContactRecordLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ id: string }>;
}) {
  const rawId = Number.parseInt((await params).id, 10);
  const selectedId = Number.isInteger(rawId) && rawId > 0 ? rawId : null;

  let contacts: Contact[] = [];
  try {
    const page = await listContacts({
      limit: 100,
      sortBy: "last_name",
      order: "asc",
    });
    contacts = page.items;
  } catch {
    contacts = [];
  }

  return (
    <div className="lg:grid lg:min-h-[calc(100dvh-3.5rem)] lg:grid-cols-[17.5rem_minmax(0,1fr)]">
      <div className="hidden lg:flex lg:min-h-0 lg:flex-col">
        <ContactsRail contacts={contacts} selectedId={selectedId} />
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
