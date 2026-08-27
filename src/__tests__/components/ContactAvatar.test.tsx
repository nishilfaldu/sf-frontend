import React from "react";
import { render } from "@testing-library/react";
import ContactAvatar from "@/components/contacts/ContactAvatar";
import { makeContact, TINY_PNG_DATA_URL } from "../mocks/handlers";

describe("ContactAvatar", () => {
  it("shows initials when there is no photo", () => {
    const { container } = render(<ContactAvatar contact={makeContact()} />);

    expect(container.querySelector("img")).toBeNull();
    expect(container.textContent).toBe("AL");
  });

  it("shows a circular photo when one is stored", () => {
    const { container } = render(
      <ContactAvatar contact={makeContact({ photo: TINY_PNG_DATA_URL })} />,
    );

    const image = container.querySelector("img");
    expect(image).toHaveAttribute("src", TINY_PNG_DATA_URL);
    expect(image).toHaveClass("rounded-full", "aspect-square", "object-cover");
    expect(container.textContent).toBe("");
  });
});
