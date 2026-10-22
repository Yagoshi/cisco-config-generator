import type { ComponentProps, ReactNode } from "react";

export const FieldGroup = ({ className, children, ...rest }: ComponentProps<"div">) => (
  <div className={`flex flex-col gap-y-2 ${className ?? ""}`} {...rest}>
    {children}
  </div>
);

export const Label = ({
  className,
  required,
  optional,
  children,
  ...rest
}: ComponentProps<"label"> & { required?: boolean; optional?: boolean }) => (
  <label className={`text-std-17B-170 text-app-text ${className ?? ""}`} {...rest}>
    {children}
    {required && (
      <span className="ml-1 text-app-error text-std-16N-170" aria-hidden="true">
        必須
      </span>
    )}
    {optional && (
      <span className="ml-1 text-app-muted text-std-16N-170" aria-hidden="true">
        任意
      </span>
    )}
  </label>
);

export const SupportText = ({ className, children, ...rest }: ComponentProps<"p">) => (
  <p className={`text-std-16N-170 text-app-muted ${className ?? ""}`} {...rest}>
    {children}
  </p>
);

export const ErrorText = ({ className, children, ...rest }: ComponentProps<"p">) => (
  <p
    className={`flex items-center gap-1 text-std-16B-170 text-app-error ${className ?? ""}`}
    {...rest}
  >
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" className="shrink-0">
      <circle cx="12" cy="12" r="11" fill="currentColor" />
      <path d="M12 7v6" stroke="#0A0E17" strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="16.5" r="1.2" fill="#0A0E17" />
    </svg>
    {children}
  </p>
);

export const Card = ({
  className,
  children,
  ...rest
}: ComponentProps<"div"> & { children: ReactNode }) => (
  <div
    className={`rounded-16 border border-app-border bg-app-surface p-6 shadow-[0_1px_3px_rgba(0,0,0,0.3)] ${className ?? ""}`}
    {...rest}
  >
    {children}
  </div>
);
