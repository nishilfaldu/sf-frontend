import Link from "next/link";
import ContactAvatar from "@/components/contacts/ContactAvatar";
import type { Contact } from "@/lib/contacts/types";

/** macOS Contacts-style sidebar. Hidden below `lg`; the table remains the small-screen list. */
export default function ContactsRail({
  contacts,
  selectedId,
}: {
  contacts: Contact[];
  selectedId: number | null;
}) {
  return (
    <aside className="flex min-h-0 flex-1 flex-col border-r border-hairline bg-card/80">
      <div className="px-5 pb-3 pt-5">
        <Link
          href="/contacts"
          className="font-display text-[28px] font-bold tracking-tight text-foreground"
        >
          Contacts
        </Link>
      </div>

      <nav aria-label="Contacts" className="min-h-0 flex-1 overflow-y-auto pb-6">
        {contacts.length === 0 ? (
          <p className="px-5 py-3 text-[13px] text-muted-foreground">
            No contacts to show.
          </p>
        ) : (
          contacts.map((contact) => {
            const selected = contact.id === selectedId;

            return (
              <Link
                key={contact.id}
                href={`/contacts/${contact.id}`}
                aria-current={selected ? "page" : undefined}
                className={`mx-2 flex items-center gap-2.5 rounded-[10px] px-2.5 py-1.5 ${
                  selected
                    ? "bg-primary/10"
                    : "hover:bg-secondary/50"
                }`}
              >
                <ContactAvatar contact={contact} size="sm" />
                <span className="min-w-0">
                  <span
                    className={`block truncate text-[15px] ${
                      selected ? "font-medium" : "font-normal"
                    } text-foreground`}
                  >
                    {contact.full_name}
                  </span>
                  {contact.company ? (
                    <span className="block truncate text-[12px] text-muted-foreground">
                      {contact.company}
                    </span>
                  ) : null}
                </span>
              </Link>
            );
          })
        )}
      </nav>
    </aside>
  );
}
