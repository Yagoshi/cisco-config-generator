import type { ComponentProps } from "react";

export type InputSize = "lg" | "md" | "sm";

export type InputProps = ComponentProps<"input"> & {
  isError?: boolean;
  blockSize?: InputSize;
};

export const Input = ({
  className,
  isError,
  blockSize = "lg",
  ...rest
}: InputProps) => {
  const sizeClass =
    blockSize === "sm" ? "h-10" : blockSize === "md" ? "h-12" : "h-14";

  return (
    <input
      aria-invalid={isError || undefined}
      className={`
        w-full max-w-full rounded-8 border bg-app-surface px-4 py-3
        text-oln-16N-100 text-app-text border-app-border-strong ${sizeClass}
        hover:read-write:border-app-accent-text
        aria-[invalid=true]:border-error-1
        focus:outline focus:outline-4 focus:outline-white focus:outline-offset-[calc(2/16*1rem)] focus:ring-[calc(2/16*1rem)] focus:ring-yellow-300
        disabled:border-app-border disabled:bg-app-surface-2 disabled:text-app-faint disabled:pointer-events-none
        ${className ?? ""}
      `}
      {...rest}
    />
  );
};
