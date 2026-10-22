import type { ComponentProps } from "react";

export type SelectSize = "lg" | "md" | "sm";

export type SelectProps = ComponentProps<"select"> & {
  isError?: boolean;
  blockSize?: SelectSize;
};

export const Select = ({
  className,
  isError,
  blockSize = "lg",
  disabled,
  children,
  ...rest
}: SelectProps) => {
  const sizeClass =
    blockSize === "sm" ? "h-10" : blockSize === "md" ? "h-12" : "h-14";

  return (
    <select
      disabled={disabled}
      aria-invalid={isError || undefined}
      className={`
        inline-block w-full max-w-full appearance-none rounded-8 border bg-app-surface pl-4 pr-10 py-[calc(11/16*1rem)]
        text-oln-16N-100 text-app-text border-app-border-strong ${sizeClass}
        bg-[url("data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%2024%2024'%3E%3Cpath%20fill='%239aa4b2'%20d='M12%2017.1%203%208l1-1%208%208%208-8%201%201z'/%3E%3C/svg%3E")]
        bg-no-repeat bg-[length:1rem_1rem] bg-[position:right_1rem_center]
        hover:border-app-accent-text
        aria-[invalid=true]:border-error-1 aria-[invalid=true]:hover:border-red-400
        focus:outline focus:outline-4 focus:outline-white focus:outline-offset-[calc(2/16*1rem)] focus:ring-[calc(2/16*1rem)] focus:ring-yellow-300
        disabled:border-app-border disabled:bg-app-surface-2 disabled:text-app-faint disabled:pointer-events-none
        ${className ?? ""}
      `}
      {...rest}
    >
      {children}
    </select>
  );
};
