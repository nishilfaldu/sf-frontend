import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LanJoinButton from "@/components/contacts/LanJoinButton";

beforeEach(() => {
  jest.spyOn(globalThis, "fetch").mockResolvedValue(
    new Response(
      JSON.stringify({
        addresses: ["192.168.1.42"],
        joinUrl: "http://192.168.1.42:3000/contacts/",
        qrSvg: "<svg xmlns='http://www.w3.org/2000/svg'></svg>",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    ),
  );
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("LanJoinButton", () => {
  it("opens a dialog with the join URL after a click", async () => {
    render(<LanJoinButton />);

    await userEvent.click(
      screen.getByRole("button", { name: /share on this wi-fi/i }),
    );

    expect(await screen.findByRole("dialog")).toHaveTextContent(
      "Join on this Wi-Fi",
    );
    await waitFor(() =>
      expect(screen.getByText("http://192.168.1.42:3000/contacts/")).toBeInTheDocument(),
    );
  });
});
