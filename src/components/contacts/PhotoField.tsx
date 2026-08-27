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

function sheetButtons(root: HTMLElement): HTMLButtonElement[] {
  return Array.from(root.querySelectorAll("button"));
}

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
  const triggerRef = useRef<HTMLButtonElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef(false);
  const readAbortRef = useRef<AbortController | null>(null);
  const [photo, setPhoto] = useState(defaultPhoto);
  const [localError, setLocalError] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  function cancelPendingRead() {
    readAbortRef.current?.abort();
    readAbortRef.current = null;
  }

  function closeSheet() {
    if (!sheetOpen) return;
    restoreFocusRef.current = true;
    setSheetOpen(false);
  }

  const message = localError ?? error;
  const preview = {
    first_name: contact?.first_name ?? "",
    last_name: contact?.last_name ?? "",
    email: contact?.email ?? "",
    photo: photo || null,
  };

  useEffect(() => {
    if (sheetOpen) {
      const root = sheetRef.current;
      if (!root) return;
      sheetButtons(root)[0]?.focus();
      return;
    }
    if (!restoreFocusRef.current) return;
    restoreFocusRef.current = false;
    triggerRef.current?.focus();
  }, [sheetOpen]);

  useEffect(() => {
    if (!sheetOpen) return;

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        restoreFocusRef.current = true;
        setSheetOpen(false);
        return;
      }

      if (event.key !== "Tab" || !sheetRef.current) return;

      const buttons = sheetButtons(sheetRef.current);
      if (buttons.length === 0) return;

      const first = buttons[0];
      const last = buttons[buttons.length - 1];
      if (!first || !last) return;

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [sheetOpen]);

  async function onFileChange(fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file) return;

    cancelPendingRead();
    closeSheet();

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
    closeSheet();
    if (inputRef.current) inputRef.current.value = "";
  }

  function openPicker() {
    closeSheet();
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
        ref={triggerRef}
        type="button"
        onClick={onCircleClick}
        onDragOver={(event) => event.preventDefault()}
        onDrop={onDrop}
        className="rounded-full"
        aria-label={photo ? "Edit photo" : "Add photo"}
        aria-haspopup={photo ? "dialog" : undefined}
        aria-expanded={photo ? sheetOpen : undefined}
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
            tabIndex={-1}
            className="absolute inset-0 bg-black/20"
            aria-label="Dismiss"
            onClick={closeSheet}
          />
          <div
            ref={sheetRef}
            role="dialog"
            aria-modal="true"
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
              onClick={closeSheet}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
