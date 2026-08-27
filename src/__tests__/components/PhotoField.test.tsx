import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PhotoField from "@/components/contacts/PhotoField";
import { TINY_PNG_DATA_URL } from "../mocks/handlers";
import { readFileAsDataUrl } from "@/lib/contacts/photo";

jest.mock("@/lib/contacts/photo", () => {
  const actual = jest.requireActual("@/lib/contacts/photo");
  return {
    ...actual,
    readFileAsDataUrl: jest.fn(),
  };
});

const readFileAsDataUrlMock = jest.mocked(readFileAsDataUrl);

function pngFile(name: string) {
  return new File(["x"], name, { type: "image/png" });
}

describe("PhotoField", () => {
  beforeEach(() => {
    readFileAsDataUrlMock.mockReset();
  });

  it("keeps the later selection when an earlier read finishes last", async () => {
    let finishFirst: ((value: string) => void) | undefined;
    readFileAsDataUrlMock
      .mockImplementationOnce(
        (_file, signal) =>
          new Promise((resolve, reject) => {
            signal?.addEventListener("abort", () => {
              reject(new DOMException("Aborted", "AbortError"));
            });
            finishFirst = resolve;
          }),
      )
      .mockResolvedValueOnce("data:image/png;base64,SECOND");

    const user = userEvent.setup();
    render(<PhotoField defaultPhoto="" />);
    const input = screen.getByLabelText(/contact photo/i);

    await user.upload(input, pngFile("first.png"));
    await user.upload(input, pngFile("second.png"));

    finishFirst?.("data:image/png;base64,FIRST");

    await waitFor(() => {
      expect(document.querySelector('input[name="photo"]')).toHaveValue(
        "data:image/png;base64,SECOND",
      );
    });
  });

  it("opens a sheet when the stored photo is tapped", async () => {
    const user = userEvent.setup();
    render(<PhotoField defaultPhoto={TINY_PNG_DATA_URL} />);

    await user.click(screen.getByRole("button", { name: /edit photo/i }));

    const dialog = screen.getByRole("dialog", { name: /photo/i });
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(screen.getByRole("button", { name: /choose photo/i })).toHaveFocus();
    expect(screen.getByRole("button", { name: /remove photo/i })).toBeInTheDocument();
  });

  it("keeps tab focus inside the sheet", async () => {
    const user = userEvent.setup();
    render(<PhotoField defaultPhoto={TINY_PNG_DATA_URL} />);

    await user.click(screen.getByRole("button", { name: /edit photo/i }));
    expect(screen.getByRole("button", { name: /choose photo/i })).toHaveFocus();

    await user.tab();
    expect(screen.getByRole("button", { name: /remove photo/i })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("button", { name: /cancel/i })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("button", { name: /choose photo/i })).toHaveFocus();
  });

  it("returns focus to the photo after the sheet closes", async () => {
    const user = userEvent.setup();
    render(<PhotoField defaultPhoto={TINY_PNG_DATA_URL} />);

    await user.click(screen.getByRole("button", { name: /edit photo/i }));
    await user.click(screen.getByRole("button", { name: /cancel/i }));

    expect(screen.queryByRole("dialog", { name: /photo/i })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /edit photo/i })).toHaveFocus();
  });

  it("clears the photo from the sheet", async () => {
    const user = userEvent.setup();
    render(<PhotoField defaultPhoto={TINY_PNG_DATA_URL} />);

    await user.click(screen.getByRole("button", { name: /edit photo/i }));
    await user.click(screen.getByRole("button", { name: /remove photo/i }));

    expect(document.querySelector('input[name="photo"]')).toHaveValue("");
    expect(screen.queryByRole("dialog", { name: /photo/i })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /add photo/i })).toHaveFocus();
  });
});
