import {
  decodedPhotoByteLength,
  MAX_PHOTO_BYTES,
  photoErrorForFile,
} from "@/lib/contacts/photo";

describe("photoErrorForFile", () => {
  it("accepts a small PNG", () => {
    expect(
      photoErrorForFile(new File(["x"], "ada.png", { type: "image/png" })),
    ).toBeNull();
  });

  it("rejects a non-image type", () => {
    expect(
      photoErrorForFile(new File(["x"], "ada.svg", { type: "image/svg+xml" })),
    ).toBe("Photo must be a JPEG, PNG, GIF, or WebP image");
  });

  it("rejects a file over 512 KB", () => {
    const tooBig = new File(["x"], "ada.png", { type: "image/png" });
    Object.defineProperty(tooBig, "size", { value: MAX_PHOTO_BYTES + 1 });

    expect(photoErrorForFile(tooBig)).toBe("Photo must be 512 KB or smaller");
  });
});

describe("decodedPhotoByteLength", () => {
  it("counts decoded bytes, not the encoded character length", () => {
    expect(decodedPhotoByteLength("data:image/png;base64,AAAA")).toBe(3);
    expect(decodedPhotoByteLength("data:image/png;base64,AQ==")).toBe(1);
  });
});
