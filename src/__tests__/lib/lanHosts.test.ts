import { joinUrl } from "@/lib/lanHosts";

describe("joinUrl", () => {
  it("builds a trailing-slash LAN URL", () => {
    expect(joinUrl("192.168.1.42", "3000", "/contacts")).toBe(
      "http://192.168.1.42:3000/contacts/",
    );
  });

  it("does not double the trailing slash", () => {
    expect(joinUrl("10.0.0.8", "3000", "/share/abc/")).toBe(
      "http://10.0.0.8:3000/share/abc/",
    );
  });
});
