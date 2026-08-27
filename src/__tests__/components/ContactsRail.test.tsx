import React from "react";
import { render, screen } from "@testing-library/react";
import ContactsRail from "@/components/contacts/ContactsRail";
import { CONTACTS } from "../mocks/handlers";

describe("ContactsRail", () => {
  it("lists each contact and marks the selected one", () => {
    render(<ContactsRail contacts={CONTACTS} selectedId={1} />);

    const ada = screen.getByRole("link", { name: /ada lovelace/i });
    expect(ada).toHaveAttribute("href", "/contacts/1");
    expect(ada).toHaveAttribute("aria-current", "page");

    const grace = screen.getByRole("link", { name: /grace hopper/i });
    expect(grace).toHaveAttribute("href", "/contacts/2");
    expect(grace).not.toHaveAttribute("aria-current");
  });

  it("links the heading back to the full directory", () => {
    render(<ContactsRail contacts={CONTACTS} selectedId={null} />);

    expect(screen.getByRole("link", { name: "Contacts" })).toHaveAttribute(
      "href",
      "/contacts",
    );
  });
});
