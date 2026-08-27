"use client";

import { useId, useRef, useState } from "react";
import { ImagePlus } from "lucide-react";
import ContactAvatar from "@/components/contacts/ContactAvatar";
import Button from "@/components/ui/Button";
import {
  PHOTO_ACCEPT,
  photoErrorForFile,
  readFileAsDataUrl,
} from "@/lib/contacts/photo";
import type { Contact } from "@/lib/contacts/types";

/**
 * File picker that writes a data URL into a hidden `photo` input so the
 * existing create/replace server action (and PUT) keep the photo field.
 */
export default function PhotoField({
  defaultPhoto,
  contact,
  error,
}: {
  defaultPhoto: string;
  contact?: Pick<Contact, "first_name" | "last_name" | "email">;
  error?: string;
}) {
  const fileId = useId();
  const errorId = `${fileId}-error`;
  const inputRef = useRef<HTMLInputElement>(null);
  const readAbortRef = useRef<AbortController | null>(null);
  const [photo, setPhoto] = useState(defaultPhoto);
  const [localError, setLocalError] = useState<string | null>(null);

  function cancelPendingRead() {
    readAbortRef.current?.abort();
    readAbortRef.current = null;
  }

  const message = localError ?? error;
  const preview = {
    first_name: contact?.first_name ?? "",
    last_name: contact?.last_name ?? "",
    email: contact?.email ?? "",
    photo: photo || null,
  };

  async function onFileChange(fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file) return;

    cancelPendingRead();

    const problem = photoErrorForFile(file);
    if (problem) {
      setLocalError(problem);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    const controller = new AbortController();
    readAbortRef.current = controller;
    try {
      const dataUrl = await readFileAsDataUrl(file, controller.signal);
      if (controller.signal.aborted) return;
      setPhoto(dataUrl);
      setLocalError(null);
    } catch (error) {
      if (controller.signal.aborted) return;
      if (error instanceof DOMException && error.name === "AbortError") return;
      setLocalError("Could not read that file.");
    }
  }

  function clearPhoto() {
    cancelPendingRead();
    setPhoto("");
    setLocalError(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-4">
        <ContactAvatar contact={preview} size="xl" />

        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={inputRef}
            id={fileId}
            type="file"
            accept={PHOTO_ACCEPT}
            className="sr-only"
            aria-label="Contact photo"
            aria-invalid={message ? true : undefined}
            aria-describedby={message ? errorId : undefined}
            onChange={(event) => void onFileChange(event.target.files)}
          />
          <Button
            type="button"
            variant="secondary"
            onClick={() => inputRef.current?.click()}
          >
            <ImagePlus className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
            {photo ? "Change photo" : "Choose photo"}
          </Button>
          {photo ? (
            <Button type="button" variant="ghost" onClick={clearPhoto}>
              Remove
            </Button>
          ) : null}
        </div>
      </div>

      <input type="hidden" name="photo" value={photo} />

      {message ? (
        <p id={errorId} role="alert" className="text-[13px] text-destructive">
          {message}
        </p>
      ) : null}
    </div>
  );
}
