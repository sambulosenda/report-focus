/** Inline SVG icons. All are decorative (aria-hidden); the control around them carries the label. */

type IconProps = { size?: number; className?: string; color?: string };

const base = (size: number, className?: string) => ({ width: size, height: size, viewBox: "0 0 24 24", "aria-hidden": true, className, focusable: false as const });

export function XIcon({ size = 16, className, color = "currentColor" }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M17.8 3h3.1l-6.8 7.7 8 10.3h-6.2l-4.9-6.3L5.4 21H2.3l7.3-8.3L2 3h6.4l4.4 5.8L17.8 3Zm-1.1 16.2h1.7L7.4 4.7H5.6l11.1 14.5Z" fill={color} />
    </svg>
  );
}

export function FacebookIcon({ size = 16, className, color = "currentColor" }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M14 8.5V6.8c0-.8.5-1 1-1h2.5V2.1L14.2 2C10.7 2 10 4.6 10 6.3v2.2H7.5V12H10v10h4V12h3.1l.4-3.5H14Z" fill={color} />
    </svg>
  );
}

export function InstagramIcon({ size = 16, className, color = "currentColor" }: IconProps) {
  return (
    <svg {...base(size, className)} fill="none" stroke={color} strokeWidth={2}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill={color} stroke="none" />
    </svg>
  );
}

export function YouTubeIcon({ size = 16, className, color = "currentColor" }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path
        d="M22 8.2a3 3 0 0 0-2.1-2.1C18 5.6 12 5.6 12 5.6s-6 0-7.9.5A3 3 0 0 0 2 8.2 31 31 0 0 0 1.6 12 31 31 0 0 0 2 15.8a3 3 0 0 0 2.1 2.1c1.9.5 7.9.5 7.9.5s6 0 7.9-.5a3 3 0 0 0 2.1-2.1 31 31 0 0 0 .4-3.8 31 31 0 0 0-.4-3.8ZM10 15V9l5.2 3L10 15Z"
        fill={color}
      />
    </svg>
  );
}

export function TikTokIcon({ size = 16, className, color = "currentColor" }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M16.5 2h-3.3v13.4a2.9 2.9 0 1 1-2.1-2.8V9.2a6.2 6.2 0 1 0 5.4 6.2V8.7a7.6 7.6 0 0 0 4.5 1.4V6.8a4.5 4.5 0 0 1-4.5-4.8Z" fill={color} />
    </svg>
  );
}

export function WhatsAppIcon({ size = 16, className, color = "currentColor" }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path
        d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3Z"
        fill={color}
      />
    </svg>
  );
}

export function MailIcon({ size = 16, className, color = "currentColor" }: IconProps) {
  return (
    <svg {...base(size, className)} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  );
}

export function LinkIcon({ size = 16, className, color = "currentColor" }: IconProps) {
  return (
    <svg {...base(size, className)} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" />
      <path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />
    </svg>
  );
}

export function ShareIcon({ size = 18, className, color = "currentColor" }: IconProps) {
  return (
    <svg {...base(size, className)} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v12M7 8l5-5 5 5" />
      <path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" />
    </svg>
  );
}

export function CheckIcon({ size = 16, className, color = "currentColor" }: IconProps) {
  return (
    <svg {...base(size, className)} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="m5 12 5 5 9-10" />
    </svg>
  );
}

export function SearchIcon({ size = 18, className, color = "currentColor" }: IconProps) {
  return (
    <svg {...base(size, className)} fill="none" stroke={color} strokeWidth={2}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

export function MenuIcon({ size = 24, className, color = "currentColor" }: IconProps) {
  return (
    <svg {...base(size, className)} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round">
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

export function CloseIcon({ size = 24, className, color = "currentColor" }: IconProps) {
  return (
    <svg {...base(size, className)} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round">
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

export function ChevronRightIcon({ size = 18, className, color = "currentColor" }: IconProps) {
  return (
    <svg {...base(size, className)} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}

export function ChevronLeftIcon({ size = 18, className, color = "currentColor" }: IconProps) {
  return (
    <svg {...base(size, className)} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="m15 6-6 6 6 6" />
    </svg>
  );
}

export function PlayIcon({ size = 10, className, color = "currentColor" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 10 10" aria-hidden className={className} focusable={false}>
      <path d="M1 0l9 5-9 5z" fill={color} />
    </svg>
  );
}

export function EyeIcon({ size = 16, className, color = "currentColor" }: IconProps) {
  return (
    <svg {...base(size, className)} fill="none" stroke={color} strokeWidth={2}>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function PinIcon({ size = 14, className, color = "currentColor" }: IconProps) {
  return (
    <svg {...base(size, className)} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 17v5M5 17h14l-2-4V5h1V3H6v2h1v8l-2 4Z" />
    </svg>
  );
}

export function LinkedInIcon({ size = 16, className, color = "currentColor" }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M3.5 8.5h4V21h-4V8.5ZM5.5 2.5a2.3 2.3 0 1 1 0 4.6 2.3 2.3 0 0 1 0-4.6ZM10 8.5h3.8v1.7h.1c.5-1 1.8-2 3.8-2 4 0 4.8 2.6 4.8 6V21h-4v-6c0-1.4 0-3.3-2-3.3s-2.3 1.6-2.3 3.2V21h-4V8.5Z" fill={color} />
    </svg>
  );
}

export const SOCIAL_ICONS = { X: XIcon, Facebook: FacebookIcon, Instagram: InstagramIcon, LinkedIn: LinkedInIcon, YouTube: YouTubeIcon, TikTok: TikTokIcon };
