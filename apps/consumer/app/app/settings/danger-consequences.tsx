/**
 * "What gets deleted" preview card for the Danger Zone.
 *
 * Read-only visual block listing the data classes that go away when
 * the account is deleted. Doesn't trigger anything — sits *next to*
 * the existing DangerZone form.
 */

import * as React from "react";
import {
  Trash2,
  User,
  Briefcase,
  FileText,
  Folder,
  MessageSquare,
  CreditCard,
  Database,
} from "lucide-react";

const ITEMS: { icon: React.ReactNode; label: string; detail: string }[] = [
  { icon: <User className="h-4 w-4" />, label: "Profile + Twin", detail: "Identity, headline, bio, household, target corridors" },
  { icon: <Briefcase className="h-4 w-4" />, label: "Career history", detail: "Applications, interviews, offers" },
  { icon: <FileText className="h-4 w-4" />, label: "Workflow analyses", detail: "Country, finance, visa, family, culture, documents" },
  { icon: <Folder className="h-4 w-4" />, label: "Document vault", detail: "Uploaded checklists and parsed files" },
  { icon: <MessageSquare className="h-4 w-4" />, label: "Copilot threads", detail: "Past conversations and notes" },
  { icon: <CreditCard className="h-4 w-4" />, label: "Subscription", detail: "Cancelled at period end (if active)" },
  { icon: <Database className="h-4 w-4" />, label: "Account auth", detail: "Sessions, passwords, social links" },
];

export function DangerConsequences() {
  return (
    <div
      data-danger-consequences
      className="mt-5 rounded-2xl border border-danger-200 bg-white p-4"
    >
      <div className="flex items-center gap-2">
        <span
          aria-hidden="true"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-danger-100 text-danger-700"
        >
          <Trash2 className="h-4 w-4" />
        </span>
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-danger-800">
          What gets erased · the unrecoverable list
        </p>
      </div>

      <ul className="mt-3 grid gap-1.5 md:grid-cols-2">
        {ITEMS.map((it) => (
          <li
            key={it.label}
            data-danger-item={it.label}
            className="flex items-start gap-2 rounded-xl border border-danger-100 bg-danger-50/30 p-2.5"
          >
            <span
              aria-hidden="true"
              className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-danger-600"
            >
              {it.icon}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[12.5px] font-semibold text-ink-900">{it.label}</p>
              <p className="mt-0.5 text-[11px] leading-[1.45] text-ink-600">{it.detail}</p>
            </div>
          </li>
        ))}
      </ul>

      <p className="mt-3 rounded-xl bg-danger-50 px-3 py-2 font-mono text-[10.5px] uppercase tracking-[0.18em] text-danger-700">
        ⚠ Irreversible · we can't restore any of this once it's gone
      </p>
    </div>
  );
}
