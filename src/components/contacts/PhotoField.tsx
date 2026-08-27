"use client";

import { useEffect, useId, useRef, useState, type DragEvent } from "react";
import { Camera } from "lucide-react";
import ContactAvatar from "@/components/contacts/ContactAvatar";
import {
  PHOTO_ACCEPT,
  photoErrorForFile,
  readFileAsDataUrl,
} from "@/lib/contacts/photo";
import type { Contact } from "@/lib/contacts/types";

/**
 * The circle is the only photo control. Empty opens the file picker;
 * a stored photo opens a bottom sheet (Choose / Remove / Cancel).
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
  const [sheetOpen, setSheetOpen] = useState(false);

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

  useEffect(() => {
    if (!sheetOpen) return;

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setSheetOpen(false);
    }

    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [sheetOpen]);

  async function onFileChange(fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file) return;

    cancelPendingRead();
    setSheetOpen(false);

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
    } catch (caught) {
      if (controller.signal.aborted) return;
      if (caught instanceof DOMException && caught.name === "AbortError") return;
      setLocalError("Could not read that file.");
    }
  }

  function clearPhoto() {
    cancelPendingRead();
    setPhoto("");
    setLocalError(null);
    setSheetOpen(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  function openPicker() {
    inputRef.current?.click();
  }

  function onCircleClick() {
    if (photo) {
      setSheetOpen(true);
      return;
    }
    openPicker();
  }

  function onDrop(event: DragEvent<HTMLButtonElement>) {
    event.preventDefault();
    void onFileChange(event.dataTransfer.files);
  }

  return (
    <div className="flex flex-col items-center">
      <button
        type="button"
        onClick={onCircleClick}
        onDragOver={(event) => event.preventDefault()}
        onDrop={onDrop}
        className="rounded-full"
        aria-label={photo ? "Edit photo" : "Add photo"}
      >
        {photo ? (
          <ContactAvatar contact={preview} size="hero" />
        ) : (
          <span
            aria-hidden="true"
            className="inline-flex h-40 w-40 items-center justify-center rounded-full bg-muted text-muted-foreground"
          >
            <Camera className="h-9 w-9" strokeWidth={1.5} />
          </span>
        )}
      </button>

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
      <input type="hidden" name="photo" value={photo} />

      {message ? (
        <p id={errorId} role="alert" className="mt-3 text-[13px] text-destructive">
          {message}
        </p>
      ) : null}

      {sheetOpen ? (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            className="absolute inset-0 bg-black/20"
            aria-label="Dismiss"
            onClick={() => setSheetOpen(false)}
          />
          <div
            role="dialog"
            aria-label="Photo"
            className="absolute inset-x-0 bottom-6 mx-auto w-[min(22rem,calc(100%-2.5rem))]"
          >
            <div className="overflow-hidden rounded-[14px] bg-card/95 backdrop-blur">
              <button
                type="button"
                className="block w-full px-3 py-3.5 text-[17px] text-primary"
                onClick={openPicker}
              >
                Choose Photo
              </button>
              <button
                type="button"
                className="block w-full border-t border-hairline px-3 py-3.5 text-[17px] text-destructive"
                onClick={clearPhoto}
              >
                Remove Photo
              </button>
            </div>
            <button
              type="button"
              className="mt-2 block w-full rounded-[14px] bg-card px-3 py-3.5 text-[17px] font-medium text-primary"
              onClick={() => setSheetOpen(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
