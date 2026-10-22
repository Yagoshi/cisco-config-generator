import type { ReactNode } from "react";

export type NotificationBannerType = "success" | "error" | "warning" | "info";

const typeStyle: Record<NotificationBannerType, string> = {
  success: "border-app-success bg-app-surface text-app-success",
  error: "border-app-error bg-app-surface text-app-error",
  warning: "border-app-warning bg-app-surface text-app-warning",
  info: "border-app-accent-text bg-app-surface text-app-accent-text",
};

const icons: Record<NotificationBannerType, ReactNode> = {
  success: (
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
      <circle cx="12" cy="12" r="11" fill="currentColor" />
      <path d="M7 12.5 10.3 16 17 8.5" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  error: (
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
      <circle cx="12" cy="12" r="11" fill="currentColor" />
      <path d="M12 7v6" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="16.5" r="1.2" fill="white" />
    </svg>
  ),
  warning: (
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
      <path d="M12 2 23 21H1Z" fill="currentColor" />
      <path d="M12 9v5" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="17" r="1.1" fill="white" />
    </svg>
  ),
  info: (
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
      <circle cx="12" cy="12" r="11" fill="currentColor" />
      <circle cx="12" cy="7.5" r="1.2" fill="white" />
      <path d="M12 11v6" stroke="white" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
};

export type NotificationBannerProps = {
  type: NotificationBannerType;
  title: string;
  children?: ReactNode;
  className?: string;
};

export const NotificationBanner = ({ type, title, children, className }: NotificationBannerProps) => {
  return (
    <div
      role={type === "error" ? "alert" : "status"}
      className={`flex gap-3 rounded-12 border-l-4 px-4 py-4 ${typeStyle[type]} ${className ?? ""}`}
    >
      <div className="shrink-0">{icons[type]}</div>
      <div className="flex flex-col gap-1">
        <p className="text-std-17B-170">{title}</p>
        {children && <div className="text-std-16N-170">{children}</div>}
      </div>
    </div>
  );
};
