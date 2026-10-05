import type { ReactNode } from "react";

function Icon({ children, className = "size-6" }: { children: ReactNode; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {children}
    </svg>
  );
}
type P = { className?: string };

export const IconCar = (p: P) => (
  <Icon {...p}>
    <path d="M4 17v-5l2.2-5.2A1 1 0 0 1 7.1 6h9.8a1 1 0 0 1 .9.6L20 12v5" />
    <path d="M4 12h16M5 17v2M19 17v2" />
    <circle cx="7.5" cy="15" r=".6" />
    <circle cx="16.5" cy="15" r=".6" />
  </Icon>
);
export const IconBike = (p: P) => (
  <Icon {...p}>
    <circle cx="6" cy="16" r="3" />
    <circle cx="18" cy="16" r="3" />
    <path d="M6 16l3-6h4l2 3 3 3M9 10L8 8H6M13 10l1-3h2" />
  </Icon>
);
export const IconDash = (p: P) => (
  <Icon {...p}>
    <path d="M4 17a8 8 0 1 1 16 0" />
    <path d="M12 17l4-5" />
  </Icon>
);
export const IconLedger = (p: P) => (
  <Icon {...p}>
    <path d="M5 20V11M12 20V4M19 20v-6" />
  </Icon>
);
export const IconGarage = (p: P) => (
  <Icon {...p}>
    <path d="M3 11l9-7 9 7v9H3z" />
    <path d="M8 20v-6h8v6" />
  </Icon>
);
export const IconBell = (p: P) => (
  <Icon {...p}>
    <path d="M6 16v-5a6 6 0 1 1 12 0v5l2 2H4z" />
    <path d="M10 21h4" />
  </Icon>
);
export const IconPlus = (p: P) => (
  <Icon {...p}>
    <path d="M12 5v14M5 12h14" />
  </Icon>
);
export const IconShield = (p: P) => (
  <Icon {...p}>
    <path d="M12 3l8 3v6c0 4.5-3.2 8-8 9-4.8-1-8-4.5-8-9V6z" />
    <path d="M9 12l2 2 4-4" />
  </Icon>
);
export const IconChat = (p: P) => (
  <Icon {...p}>
    <path d="M4 5h16v11H9l-5 4z" />
    <path d="M8 9.5h8M8 12.5h5" />
  </Icon>
);
export const IconFuel = (p: P) => (
  <Icon {...p}>
    <path d="M5 20V5a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v15M4 20h10" />
    <path d="M7 8h4M13 9h2.5a1.5 1.5 0 0 1 1.5 1.5V16a1.5 1.5 0 0 0 3 0V9l-2-2" />
  </Icon>
);
export const IconOdo = (p: P) => (
  <Icon {...p}>
    <path d="M20 12a8 8 0 1 1-2.3-5.7M20 4v4h-4" />
  </Icon>
);
export const IconChevron = (p: P) => (
  <Icon {...p}>
    <path d="M9 6l6 6-6 6" />
  </Icon>
);
export const IconChevronBack = (p: P) => (
  <Icon {...p}>
    <path d="M15 6l-6 6 6 6" />
  </Icon>
);
export const IconUser = (p: P) => (
  <Icon {...p}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c1.5-3.5 4.5-5 8-5s6.5 1.5 8 5" />
  </Icon>
);
export const IconSend = (p: P) => (
  <Icon {...p}>
    <path d="M4 12l16-8-6 16-3-7z" />
  </Icon>
);
export const IconCopy = (p: P) => (
  <Icon {...p}>
    <rect x="8" y="8" width="12" height="12" rx="1" />
    <path d="M6 16H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" />
  </Icon>
);
export const IconShare = (p: P) => (
  <Icon {...p}>
    <path d="M12 16V4m0 0l4 4m-4-4L8 8" />
    <path d="M4 14v4h16v-4" />
  </Icon>
);
export const IconPencil = (p: P) => (
  <Icon {...p}>
    <path d="M4 20h4l10-10-4-4L4 16v4z" />
    <path d="M13 7l4 4" />
  </Icon>
);
export const IconSmile = (p: P) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M8 14s1.5 2 4 2 4-2 4-2" />
    <path d="M9 9h.01M15 9h.01" />
  </Icon>
);
