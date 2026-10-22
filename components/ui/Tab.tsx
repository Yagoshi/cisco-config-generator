"use client";

import { useState, type ReactNode } from "react";

export type TabDefinition = {
  id: string;
  label: string;
  icon?: ReactNode;
  content: ReactNode;
};

export const Tabs = ({
  tabs,
  defaultTabId,
}: {
  tabs: TabDefinition[];
  defaultTabId?: string;
}) => {
  const [activeId, setActiveId] = useState(defaultTabId ?? tabs[0]?.id);
  const active = tabs.find((t) => t.id === activeId) ?? tabs[0];

  return (
    <div>
      <div role="tablist" aria-label="出力結果" className="flex gap-1 border-b border-app-border">
        {tabs.map((tab) => {
          const selected = tab.id === active?.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setActiveId(tab.id)}
              className={`
                relative flex items-center gap-2 rounded-t-8 px-5 py-3 text-std-16B-170 transition-colors
                focus-visible:outline focus-visible:outline-4 focus-visible:outline-white focus-visible:outline-offset-[-2px]
                ${
                  selected
                    ? "bg-app-surface text-app-accent-text border border-b-0 border-app-border"
                    : "text-app-muted hover:bg-app-surface-2"
                }
              `}
              style={selected ? { marginBottom: -1 } : undefined}
            >
              {tab.icon}
              {tab.label}
            </button>
          );
        })}
      </div>
      <div role="tabpanel" className="rounded-b-16 rounded-tr-16 border border-app-border bg-app-surface p-6">
        {active?.content}
      </div>
    </div>
  );
};
