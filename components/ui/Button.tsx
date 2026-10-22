import type { ComponentProps } from "react";

export type ButtonVariant = "solid-fill" | "outline" | "text";
export type ButtonSize = "lg" | "md" | "sm" | "xs";

const baseStyle = `
  inline-flex items-center justify-center gap-x-2 w-fit max-w-full
  underline-offset-[calc(3/16*1rem)] transition-colors duration-150
  focus-visible:outline focus-visible:outline-4 focus-visible:outline-white focus-visible:outline-offset-[calc(2/16*1rem)] focus-visible:ring-[calc(2/16*1rem)] focus-visible:ring-yellow-300
  disabled:pointer-events-none
`;

const variantStyle: Record<ButtonVariant, string> = {
  "solid-fill": `
    border-4 border-double border-transparent bg-app-accent text-white
    hover:bg-app-accent-hover
    active:bg-app-accent-active
    disabled:bg-app-surface-2 disabled:text-app-faint
  `,
  outline: `
    border border-app-accent-text bg-transparent text-app-accent-text
    hover:bg-app-surface-2 hover:text-white hover:border-white
    active:bg-app-surface active:text-white
    disabled:bg-transparent disabled:text-app-faint disabled:border-app-border
  `,
  text: `
    text-app-accent-text underline
    hover:bg-app-surface-2 hover:text-white
    active:bg-app-surface
    disabled:bg-transparent disabled:text-app-faint
  `,
};

const sizeStyle: Record<ButtonSize, string> = {
  lg: "min-w-34 min-h-14 rounded-8 px-5 py-3 text-oln-16B-100",
  md: "min-w-24 min-h-12 rounded-8 px-4 py-2 text-oln-16B-100",
  sm: "min-w-20 min-h-9 rounded-6 px-3 py-0.5 text-oln-16B-100",
  xs: "min-w-18 min-h-7 rounded-4 px-2 py-0.5 text-dns-14B-120",
};

export type ButtonProps = ComponentProps<"button"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
};

export const Button = ({
  variant = "solid-fill",
  size = "md",
  loading,
  disabled,
  className,
  children,
  ...rest
}: ButtonProps) => {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`${baseStyle} ${sizeStyle[size]} ${variantStyle[variant]} ${className ?? ""}`}
      {...rest}
    >
      {loading && (
        <svg
          className="size-4 shrink-0 animate-spin motion-reduce:animate-none"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <circle
            className="opacity-30"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="3"
          />
          <path
            d="M22 12a10 10 0 0 0-10-10"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
      )}
      {children}
    </button>
  );
};
