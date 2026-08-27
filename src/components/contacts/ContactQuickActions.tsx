import type { ReactNode } from "react";
import { Mail, MessageCircle, Phone } from "lucide-react";

function Action({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      className="flex flex-col items-center gap-1.5 text-[11px] text-primary"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
        {children}
      </span>
      {label}
    </a>
  );
}

/** iOS-style mail / call / message row. Only real destinations. */
export default function ContactQuickActions({
  email,
  phone,
}: {
  email: string;
  phone: string | null;
}) {
  return (
    <div className="mt-6 flex justify-center gap-7">
      <Action href={`mailto:${email}`} label="mail">
        <Mail className="h-[18px] w-[18px]" strokeWidth={1.65} aria-hidden="true" />
      </Action>
      {phone ? (
        <Action href={`tel:${phone}`} label="call">
          <Phone className="h-[18px] w-[18px]" strokeWidth={1.65} aria-hidden="true" />
        </Action>
      ) : null}
      {phone ? (
        <Action href={`sms:${phone}`} label="message">
          <MessageCircle className="h-[18px] w-[18px]" strokeWidth={1.65} aria-hidden="true" />
        </Action>
      ) : null}
    </div>
  );
}
