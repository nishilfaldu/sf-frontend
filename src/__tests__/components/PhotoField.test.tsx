import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PhotoField from "@/components/contacts/PhotoField";
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
});
