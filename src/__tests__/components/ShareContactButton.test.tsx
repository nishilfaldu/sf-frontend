import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ShareContactButton from "@/components/contacts/ShareContactButton";
import { createShareAction } from "@/app/contacts/actions";

jest.mock("@/app/contacts/actions", () => ({
  createShareAction: jest.fn(),
}));

const mockedShare = createShareAction as jest.MockedFunction<
  typeof createShareAction
>;

beforeEach(() => {
  mockedShare.mockReset();
  mockedShare.mockResolvedValue({
    share: {
      token: "shareTok",
      expires_at: "2026-08-27T03:22:58.189507Z",
      contact_id: 1,
    },
  });
  jest.spyOn(globalThis, "fetch").mockResolvedValue(
    new Response(
      JSON.stringify({
        addresses: ["192.168.1.42"],
        joinUrl: "http://192.168.1.42:3000/share/shareTok/",
        qrSvg: "<svg xmlns='http://www.w3.org/2000/svg'></svg>",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    ),
  );
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("ShareContactButton", () => {
  it("mints a token then shows the share URL", async () => {
    render(
      <ShareContactButton contactId={1} contactName="Ada Lovelace" />,
    );

    await userEvent.click(
      screen.getByRole("button", { name: /share ada lovelace on this wi-fi/i }),
    );

    await waitFor(() => expect(mockedShare).toHaveBeenCalledWith(1));
    expect(await screen.findByText("http://192.168.1.42:3000/share/shareTok/")).toBeInTheDocument();
  });

  it("surfaces an API failure", async () => {
    mockedShare.mockResolvedValue({ error: "That contact is no longer in the address book." });
    render(
      <ShareContactButton contactId={9} contactName="Ghost" />,
    );

    await userEvent.click(
      screen.getByRole("button", { name: /share ghost on this wi-fi/i }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "That contact is no longer in the address book.",
    );
  });
});
