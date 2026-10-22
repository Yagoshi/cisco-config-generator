"use client";

import { useState } from "react";
import type { CheckItem } from "@/lib/checksheet";
import { downloadCheckSheet } from "@/lib/checksheet";
import type { DeviceModel } from "@/lib/devices";
import { Button } from "../ui/Button";
import { Tabs } from "../ui/Tab";
import { MermaidDiagram } from "./MermaidDiagram";

const ConfigPanel = ({ config, hostname }: { config: string; hostname: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(config);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([config], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${hostname || "config"}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={handleCopy}>
          {copied ? "コピーしました" : "コンフィグをコピー"}
        </Button>
        <Button size="sm" variant="text" onClick={handleDownload}>
          .txtでダウンロード
        </Button>
      </div>
      <pre className="scroll-thin max-h-[32rem] overflow-auto rounded-12 border border-app-border bg-app-bg p-5 text-dns-14N-130 text-app-text">
        <code className="font-mono whitespace-pre">{config}</code>
      </pre>
    </div>
  );
};

const CheckSheetPanel = ({
  items,
  device,
  hostname,
}: {
  items: CheckItem[];
  device: DeviceModel;
  hostname: string;
}) => (
  <div className="flex flex-col gap-4">
    <div className="flex gap-2">
      <Button size="sm" variant="outline" onClick={() => downloadCheckSheet(items, device, hostname)}>
        Excelでダウンロード
      </Button>
    </div>
    <div className="scroll-thin max-h-[32rem] overflow-auto rounded-12 border border-app-border">
      <table className="w-full border-collapse text-std-16N-170">
        <thead className="sticky top-0 bg-app-surface-2 text-std-16B-170 text-app-text">
          <tr>
            <th className="p-3 text-left whitespace-nowrap">分類</th>
            <th className="p-3 text-left whitespace-nowrap">確認項目</th>
            <th className="p-3 text-left whitespace-nowrap">確認コマンド</th>
            <th className="p-3 text-left whitespace-nowrap">期待値</th>
            <th className="p-3 text-left whitespace-nowrap">結果</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr key={i} className="border-t border-app-border even:bg-app-surface-2/60">
              <td className="p-3 whitespace-nowrap text-app-muted">{item.category}</td>
              <td className="p-3 text-app-text">{item.item}</td>
              <td className="p-3 font-mono text-dns-14N-130 text-app-accent-text">{item.command}</td>
              <td className="p-3 text-app-text">{item.expected}</td>
              <td className="p-3 text-app-faint">未確認</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export const StepResults = ({
  config,
  checkItems,
  mermaidDefinition,
  device,
  hostname,
}: {
  config: string;
  checkItems: CheckItem[];
  mermaidDefinition: string;
  device: DeviceModel;
  hostname: string;
}) => {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-std-20B-150 text-app-text">生成結果</h2>
        <p className="mt-1 text-std-16N-170 text-app-muted">
          コンフィグ・チェックシート・ネットワーク構成図をタブで切り替えて確認できます。
        </p>
      </div>
      <Tabs
        tabs={[
          { id: "config", label: "コンフィグ", content: <ConfigPanel config={config} hostname={hostname} /> },
          {
            id: "checksheet",
            label: "チェックシート",
            content: <CheckSheetPanel items={checkItems} device={device} hostname={hostname} />,
          },
          {
            id: "diagram",
            label: "ネットワーク図",
            content: <MermaidDiagram definition={mermaidDefinition} />,
          },
        ]}
      />
    </div>
  );
};
