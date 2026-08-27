import { initials } from "@/lib/contacts/format";
import type { Contact } from "@/lib/contacts/types";

const SIZES = {
  sm: "h-8 w-8 text-[11px]",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-lg",
  xl: "h-20 w-20 text-xl",
  hero: "h-40 w-40 text-[52px]",
} as const;

type AvatarContact = Pick<Contact, "first_name" | "last_name" | "email" | "photo">;

/** Initials bubble, or a circular photo when the contact has one. */
export default function ContactAvatar({
  contact,
  size = "md",
}: {
  contact: AvatarContact;
  size?: keyof typeof SIZES;
}) {
  const sizeClass = SIZES[size];

  if (contact.photo) {
    return (
      // Data URLs can't be optimized by next/image.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={contact.photo}
        alt=""
        aria-hidden="true"
        className={`contact-photo inline-block shrink-0 overflow-hidden rounded-full aspect-square object-cover ${sizeClass}`}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className={`contact-avatar inline-flex shrink-0 select-none items-center justify-center rounded-full ${sizeClass}`}
    >
      {initials(contact)}
    </span>
  );
}
