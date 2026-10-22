export type StepState = "reached" | "completed" | "upcoming" | "error";

export type Step = {
  title: string;
  description?: string;
};

export type StepNavigationProps = {
  steps: Step[];
  currentIndex: number;
  errorIndex?: number;
};

export const StepNavigation = ({ steps, currentIndex, errorIndex }: StepNavigationProps) => {
  return (
    <ol className="flex w-full items-start" aria-label="進行ステップ">
      {steps.map((step, i) => {
        const state: StepState =
          errorIndex === i ? "error" : i < currentIndex ? "completed" : i === currentIndex ? "reached" : "upcoming";
        const isLast = i === steps.length - 1;

        return (
          <li key={step.title} className="relative flex-1">
            <div className="flex items-center">
              <div
                aria-current={i === currentIndex ? "step" : undefined}
                className={`
                  grid size-10 shrink-0 place-content-center rounded-full border-2 text-std-16B-170
                  ${state === "completed" ? "border-app-accent bg-app-accent text-white" : ""}
                  ${state === "reached" ? "border-app-accent-text bg-app-surface text-app-accent-text outline outline-2 outline-offset-2 outline-app-accent-text shadow-[0_0_16px_rgba(52,96,251,0.5)]" : ""}
                  ${state === "upcoming" ? "border-app-border bg-app-surface text-app-faint" : ""}
                  ${state === "error" ? "border-app-error bg-app-surface text-app-error" : ""}
                `}
              >
                {state === "completed" ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      d="M5 13l5 5L19 7"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  i + 1
                )}
              </div>
              {!isLast && (
                <div
                  aria-hidden="true"
                  className={`mx-2 h-0.5 flex-1 ${i < currentIndex ? "bg-app-accent" : "bg-app-border"}`}
                />
              )}
            </div>
            <div className="mt-2 pr-4">
              <p
                className={`text-std-16B-170 ${
                  state === "upcoming" ? "text-app-faint" : "text-app-text"
                }`}
              >
                {step.title}
              </p>
              {step.description && (
                <p className="mt-0.5 text-std-16N-170 text-app-muted">{step.description}</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
};
