"use client";

import { useRef, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import Button from "@/components/ui/Button";
import Field from "@/components/ui/Field";
import { ADDRESS_FIELDS, EMPTY_ADDRESS } from "@/lib/contacts/schema";
import {
  ADDRESS_TYPE_LABELS,
  ADDRESS_TYPES,
  MAX_ADDRESSES,
  type AddressFormEcho,
} from "@/lib/contacts/types";

type AddressRow = { key: string; initial: AddressFormEcho };

const TYPE_OPTIONS = ADDRESS_TYPES.map((value) => ({
  value,
  label: ADDRESS_TYPE_LABELS[value],
}));

/**
 * Repeatable Home / Work / Other address blocks. Indexed hidden-compatible
 * inputs (`addresses.0.city`, …) so the existing create/replace server action
 * can rebuild the list from FormData.
 */
export default function AddressesField({
  defaultAddresses,
  fieldErrors,
}: {
  defaultAddresses: AddressFormEcho[];
  fieldErrors?: Partial<Record<string, string>>;
}) {
  const nextKey = useRef(defaultAddresses.length || 1);
  const [rows, setRows] = useState<AddressRow[]>(() =>
    defaultAddresses.length
      ? defaultAddresses.map((initial, index) => ({
          key: String(index),
          initial,
        }))
      : [{ key: "0", initial: { ...EMPTY_ADDRESS } }],
  );

  function addRow() {
    setRows((current) => {
      if (current.length >= MAX_ADDRESSES) return current;
      const key = String(nextKey.current++);
      return [...current, { key, initial: { ...EMPTY_ADDRESS } }];
    });
  }

  function removeRow(key: string) {
    setRows((current) => current.filter((row) => row.key !== key));
  }

  return (
    <fieldset className="space-y-4">
      <legend className="sr-only">Addresses</legend>

      <div className="flex items-end justify-between gap-3 border-b border-hairline pb-2">
        <div>
          <h2 className="font-display text-sm font-semibold text-foreground">
            Addresses
          </h2>
          <p className="text-[13px] text-muted-foreground">
            Home, work, or other. A contact can have several.
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={addRow}
          disabled={rows.length >= MAX_ADDRESSES}
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
          Add address
        </Button>
      </div>

      <input type="hidden" name="address_count" value={rows.length} />

      {rows.length === 0 ? (
        <p className="text-[13px] text-muted-foreground">No addresses yet.</p>
      ) : (
        <div className="space-y-4">
          {rows.map((row, index) => (
            <div
              key={row.key}
              className="space-y-4 rounded-lg border border-border bg-card/40 p-4"
            >
              <div className="flex items-end justify-between gap-3">
                <div className="min-w-[10rem] flex-1">
                  <Field
                    field={{
                      name: `addresses.${index}.type`,
                      label: "Type",
                      required: true,
                      options: TYPE_OPTIONS,
                    }}
                    defaultValue={row.initial.type}
                    error={fieldErrors?.[`addresses.${index}.type`]}
                  />
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeRow(row.key)}
                  aria-label={`Remove address ${index + 1}`}
                >
                  <Trash2 className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                  Remove
                </Button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {ADDRESS_FIELDS.map((field) => (
                  <Field
                    key={field.name}
                    field={{ ...field, name: `addresses.${index}.${field.name}` }}
                    defaultValue={row.initial[field.name]}
                    error={fieldErrors?.[`addresses.${index}.${field.name}`]}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </fieldset>
  );
}
