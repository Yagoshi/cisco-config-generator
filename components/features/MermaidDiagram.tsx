"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Button } from "../ui/Button";
import { ProgressIndicator, ProgressIndicatorSpinner } from "../ui/ProgressIndicator";

export const MermaidDiagram = ({ definition }: { definition: string }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const renderId = useId().replace(/[:]/g, "");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setSvg(null);
      setError(null);
      const mermaid = (await import("mermaid")).default;
      mermaid.initialize({
        startOnLoad: false,
        theme: "base",
        securityLevel: "strict",
        fontFamily: "var(--font-sans)",
        themeVariables: {
          background: "#121826",
          primaryColor: "#182033",
          primaryTextColor: "#f5f7fa",
          primaryBorderColor: "#3460fb",
          lineColor: "#6b7585",
          textColor: "#f5f7fa",
          edgeLabelBackground: "#182033",
        },
      });
      try {
        const { svg } = await mermaid.render(`diagram-${renderId}`, definition);
        if (!cancelled) setSvg(svg);
      } catch {
        if (!cancelled) setError("ネットワーク図の生成に失敗しました。トポロジーシートの入力内容を確認してください。");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [definition, renderId]);

  const handleDownloadSvg = () => {
    if (!svg) return;
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "network-diagram.svg";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyCode = async () => {
    await navigator.clipboard.writeText(definition);
  };

  if (error) {
    return <p className="text-std-16N-170 text-app-error">{error}</p>;
  }

  if (!svg) {
    return (
      <ProgressIndicator type="stacked" className="py-12">
        <ProgressIndicatorSpinner size="sm" />
        <span className="text-std-16N-170 text-app-muted">図を描画しています…</span>
      </ProgressIndicator>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={handleDownloadSvg}>
          SVGをダウンロード
        </Button>
        <Button size="sm" variant="text" onClick={handleCopyCode}>
          Mermaidコードをコピー
        </Button>
      </div>
      <div
        ref={containerRef}
        className="scroll-thin overflow-auto rounded-12 border border-app-border bg-app-surface-2 p-6 [&_svg]:max-w-none"
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    </div>
  );
};
