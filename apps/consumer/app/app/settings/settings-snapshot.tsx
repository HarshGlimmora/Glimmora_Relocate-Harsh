/**
 * Visual at-a-glance Settings snapshot.
 *
 * Sits above the editable forms and shows the current preferences as
 * read-only attribute cards — same pattern as the Profile snapshot,
 * but tuned for notifications / privacy / appearance.
 */

import * as React from "react";
import {
  Bell,
  Mail,
  Globe2,
  Shield,
  Eye,
  Sun,
  Moon,
  Monitor,
  LayoutGrid,
  Activity,
} from "lucide-react";

interface Props {
  emailNotifications: boolean;
  pushNotifications: boolean;
  weeklyDigest: boolean;
  productUpdates: boolean;
  marketingEmails: boolean;
  shareWithPartners: boolean;
  allowFamilyView: boolean;
  twinShareWithCoach: boolean;
  theme: "light" | "dark" | "system";
  density: "comfortable" | "compact";
  reduceMotion: boolean;
}

export function SettingsSnapshot(props: Props) {
  const notifBundle = [
    props.emailNotifications && "Email",
    props.pushNotifications && "Push",
    props.weeklyDigest && "Digest",
  ].filter(Boolean) as string[];

  const sharingBundle = [
    props.shareWithPartners && "Partners",
    props.allowFamilyView && "Family",
    props.twinShareWithCoach && "Coach",
  ].filter(Boolean) as string[];

  const themeIcon =
    props.theme === "dark" ? <Moon className="h-4 w-4" /> :
    props.theme === "light" ? <Sun className="h-4 w-4" /> :
    <Monitor className="h-4 w-4" />;

  const cards: { icon: React.ReactNode; label: string; value: string; sub?: string; tone: "neutral" | "info" | "good" | "warn" | "off" }[] = [
    {
      icon: <Bell className="h-4 w-4" />,
      label: "Notifications",
      value: notifBundle.length > 0 ? `${notifBundle.length} channel${notifBundle.length === 1 ? "" : "s"}` : "Silent",
      sub: notifBundle.length > 0 ? notifBundle.join(" · ") : "All notifications off",
      tone: notifBundle.length > 0 ? "info" : "off",
    },
    {
      icon: <Mail className="h-4 w-4" />,
      label: "Email pulse",
      value: props.weeklyDigest ? "Weekly" : props.productUpdates ? "Updates only" : "Off",
      sub: props.marketingEmails ? "Marketing on" : "No marketing",
      tone: props.weeklyDigest ? "good" : props.productUpdates ? "info" : "off",
    },
    {
      icon: <Shield className="h-4 w-4" />,
      label: "Sharing",
      value: sharingBundle.length > 0 ? `${sharingBundle.length} audience${sharingBundle.length === 1 ? "" : "s"}` : "Private",
      sub: sharingBundle.length > 0 ? sharingBundle.join(" · ") : "Locked down",
      tone: sharingBundle.length > 0 ? "warn" : "good",
    },
    {
      icon: <Globe2 className="h-4 w-4" />,
      label: "Family view",
      value: props.allowFamilyView ? "Allowed" : "Disabled",
      sub: props.allowFamilyView ? "Family members can see your plan" : "Only you can see your plan",
      tone: props.allowFamilyView ? "info" : "neutral",
    },
    {
      icon: themeIcon,
      label: "Theme",
      value: props.theme === "system" ? "System" : props.theme === "dark" ? "Dark" : "Light",
      sub: "Follows your selection across devices",
      tone: "neutral",
    },
    {
      icon: <LayoutGrid className="h-4 w-4" />,
      label: "Density",
      value: props.density === "compact" ? "Compact" : "Comfortable",
      sub: props.density === "compact" ? "More on screen" : "More breathing room",
      tone: "neutral",
    },
    {
      icon: <Activity className="h-4 w-4" />,
      label: "Motion",
      value: props.reduceMotion ? "Reduced" : "Full",
      sub: props.reduceMotion ? "Fewer animations" : "Default animations",
      tone: props.reduceMotion ? "info" : "neutral",
    },
    {
      icon: <Eye className="h-4 w-4" />,
      label: "Twin sharing",
      value: props.twinShareWithCoach ? "Coach can read" : "Coach blocked",
      sub: props.twinShareWithCoach ? "Verified experts get context" : "Only you see Twin context",
      tone: props.twinShareWithCoach ? "warn" : "good",
    },
  ];

  return (
    <section data-settings-snapshot className="mb-6">
      <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-700">
        Snapshot · what's switched on right now
      </p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
        {cards.map((c) => (
          <AttributeCard key={c.label} {...c} />
        ))}
      </div>
    </section>
  );
}

const TONE_PALETTE: Record<
  "neutral" | "info" | "good" | "warn" | "off",
  { card: string; iconWrap: string; iconColor: string; value: string }
> = {
  neutral: {
    card: "border-ink-200 bg-white",
    iconWrap: "bg-ink-50",
    iconColor: "text-ink-700",
    value: "text-ink-900",
  },
  info: {
    card: "border-lagoon-200 bg-lagoon-50/40",
    iconWrap: "bg-lagoon-100",
    iconColor: "text-lagoon-700",
    value: "text-lagoon-800",
  },
  good: {
    card: "border-success-200 bg-success-50/40",
    iconWrap: "bg-success-100",
    iconColor: "text-success-700",
    value: "text-success-800",
  },
  warn: {
    card: "border-gilt-200 bg-gilt-50/40",
    iconWrap: "bg-gilt-100",
    iconColor: "text-gilt-700",
    value: "text-gilt-800",
  },
  off: {
    card: "border-ink-200 bg-ink-50/40",
    iconWrap: "bg-ink-100",
    iconColor: "text-ink-500",
    value: "text-ink-500",
  },
};

function AttributeCard({
  icon,
  label,
  value,
  sub,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  tone: "neutral" | "info" | "good" | "warn" | "off";
}) {
  const p = TONE_PALETTE[tone];
  return (
    <div
      data-attribute={label}
      data-attribute-tone={tone}
      className={`rounded-2xl border ${p.card} p-3 transition-all hover:-translate-y-0.5 hover:shadow-sm`}
    >
      <div className="flex items-center gap-2">
        <span
          aria-hidden="true"
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${p.iconWrap} ${p.iconColor}`}
        >
          {icon}
        </span>
        <p className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-ink-500">
          {label}
        </p>
      </div>
      <p className={`mt-2 font-sans text-[14px] font-semibold leading-snug tracking-[-0.005em] ${p.value}`}>
        {value}
      </p>
      {sub ? (
        <p className="mt-1 text-[10.5px] leading-[1.4] text-ink-600 truncate" title={sub}>
          {sub}
        </p>
      ) : null}
    </div>
  );
}
