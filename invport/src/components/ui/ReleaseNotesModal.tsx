"use client";

import { useEffect, useState } from "react";
import { CURRENT_RELEASE_NOTES_VERSION, RELEASE_NOTES_ITEMS } from "@/constants/releaseNotes";

type Props = {
  storageKey?: string;
};

export default function ReleaseNotesModal({ storageKey = "releaseNotesSeenVersion" }: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      const seen = localStorage.getItem(storageKey);
      if (seen !== CURRENT_RELEASE_NOTES_VERSION) {
        setOpen(true);
      }
    } catch {}
  }, [storageKey]);

  const dismiss = () => {
    try {
      localStorage.setItem(storageKey, CURRENT_RELEASE_NOTES_VERSION);
    } catch {}
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={dismiss} />
      <div className="relative bg-white rounded-lg shadow-xl border border-gray-200 w-[92vw] max-w-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold text-gray-900">What’s New</h2>
          <button
            onClick={dismiss}
            className="px-2 py-1 text-sm rounded border border-gray-300 hover:bg-gray-50"
          >
            Close
          </button>
        </div>
        <p className="text-xs text-gray-600 mb-3">Version {CURRENT_RELEASE_NOTES_VERSION}</p>
        <ul className="space-y-2">
          {RELEASE_NOTES_ITEMS.map((item, idx) => (
            <li key={idx} className="flex gap-2">
              <span className="mt-1 inline-block w-2 h-2 rounded-full bg-blue-500 shrink-0" />
              <div>
                <div className="text-sm font-medium text-gray-900">{item.title}</div>
                {item.details && (
                  <div className="text-xs text-gray-700">{item.details}</div>
                )}
              </div>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            onClick={dismiss}
            className="px-3 py-1.5 text-sm rounded bg-blue-600 text-white hover:bg-blue-700"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
