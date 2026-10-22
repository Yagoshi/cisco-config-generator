"use client";

import { useMemo, useState } from "react";
import { StepDeviceSelect } from "@/components/features/StepDeviceSelect";
import { StepResults } from "@/components/features/StepResults";
import { StepReview } from "@/components/features/StepReview";
import { StepUpload } from "@/components/features/StepUpload";
import { Button } from "@/components/ui/Button";
import {
  ProgressIndicator,
  ProgressIndicatorDescription,
  ProgressIndicatorLabel,
  ProgressIndicatorSpinner,
} from "@/components/ui/ProgressIndicator";
import { StepNavigation } from "@/components/ui/StepNavigation";
import { buildCheckItems, type CheckItem } from "@/lib/checksheet";
import { generateConfig } from "@/lib/configGenerator";
import { getDevice, type DeviceCategory } from "@/lib/devices";
import { parseParameterSheet } from "@/lib/excelParser";
import { downloadTemplate } from "@/lib/excelTemplate";
import { buildMermaidDiagram } from "@/lib/mermaidDiagram";
import { withMinDuration } from "@/lib/minDuration";
import type { ParseResult } from "@/lib/types";

const STEPS = [
  { title: "機器を選択", description: "スイッチ/ルーター" },
  { title: "シート準備", description: "DL・アップロード" },
  { title: "内容確認", description: "入力値の検証" },
  { title: "生成結果", description: "コンフィグ出力" },
];

export default function Home() {
  const [stepIndex, setStepIndex] = useState(0);
  const [category, setCategory] = useState<DeviceCategory | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);

  const [fileName, setFileName] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);

  const [isGenerating, setIsGenerating] = useState(false);
  const [generated, setGenerated] = useState<{
    config: string;
    checkItems: CheckItem[];
    mermaidDefinition: string;
  } | null>(null);

  const device = useMemo(() => (deviceId ? getDevice(deviceId) : undefined), [deviceId]);

  const hasBlockingErrors = useMemo(
    () => (parseResult?.issues ?? []).some((i) => i.level === "error"),
    [parseResult],
  );

  const resetFromStep = (from: number) => {
    if (from <= 0) {
      setFileName(null);
      setParseResult(null);
      setGenerated(null);
    }
    if (from <= 1) {
      setGenerated(null);
    }
  };

  const handleCategoryChange = (c: DeviceCategory) => {
    setCategory(c);
    setDeviceId(null);
    resetFromStep(0);
  };

  const handleDeviceChange = (id: string) => {
    setDeviceId(id);
    resetFromStep(0);
  };

  const handleFileSelected = async (file: File) => {
    setFileName(file.name);
    setIsParsing(true);
    const result = await withMinDuration(parseParameterSheet(file), 700);
    if (result.data && device && result.data.deviceId && result.data.deviceId !== device.id) {
      result.issues = [
        {
          sheet: "基本情報",
          message: `このファイルは別の機種(${result.data.deviceId})用に生成されたテンプレートの可能性があります。インターフェース一覧が選択中の機種と一致しない場合は、テンプレートを取得し直してください。`,
          level: "warning",
        },
        ...result.issues,
      ];
    }
    setParseResult(result);
    setIsParsing(false);
  };

  const handleGenerate = async () => {
    if (!device || !parseResult?.data) return;
    setIsGenerating(true);
    const result = await withMinDuration(
      Promise.resolve().then(() => {
        const data = parseResult.data!;
        return {
          config: generateConfig(data, device),
          checkItems: buildCheckItems(data),
          mermaidDefinition: buildMermaidDiagram(data, device),
        };
      }),
      900,
    );
    setGenerated(result);
    setIsGenerating(false);
    setStepIndex(3);
  };

  const goBack = () => setStepIndex((i) => Math.max(0, i - 1));

  const handleReset = () => {
    setStepIndex(0);
    setCategory(null);
    setDeviceId(null);
    setFileName(null);
    setParseResult(null);
    setGenerated(null);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-app-border bg-app-surface/70 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-6 py-5">
          <div className="grid size-10 place-content-center rounded-8 bg-app-accent text-white shadow-[0_0_20px_rgba(52,96,251,0.55)]">
            <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M4 6h16M4 12h16M4 18h16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <circle cx="7" cy="6" r="1.6" fill="currentColor" />
              <circle cx="15" cy="12" r="1.6" fill="currentColor" />
              <circle cx="10" cy="18" r="1.6" fill="currentColor" />
            </svg>
          </div>
          <div>
            <p className="text-std-18B-160 text-app-text">Cisco Config Studio</p>
            <p className="text-std-16N-170 text-app-muted">
              パラメーターシートからコンフィグ・チェックシート・構成図を生成
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
        <div className="mb-10">
          <StepNavigation steps={STEPS} currentIndex={stepIndex} />
        </div>

        <div className="rounded-16 border border-app-border bg-app-surface p-8 shadow-[0_8px_40px_rgba(0,0,0,0.35)]">
          {stepIndex === 0 && (
            <StepDeviceSelect
              category={category}
              deviceId={deviceId}
              onCategoryChange={handleCategoryChange}
              onDeviceChange={handleDeviceChange}
            />
          )}

          {stepIndex === 1 && device && (
            <StepUpload
              device={device}
              fileName={fileName}
              isParsing={isParsing}
              onDownloadTemplate={() => downloadTemplate(device)}
              onFileSelected={handleFileSelected}
            />
          )}

          {stepIndex === 2 && parseResult?.data && (
            <>
              {isGenerating ? (
                <ProgressIndicator type="stacked-underlay" className="mx-auto py-14">
                  <ProgressIndicatorSpinner />
                  <ProgressIndicatorLabel>コンフィグを生成しています</ProgressIndicatorLabel>
                  <ProgressIndicatorDescription>
                    コマンド・チェックシート・構成図を組み立てています…
                  </ProgressIndicatorDescription>
                </ProgressIndicator>
              ) : (
                <StepReview data={parseResult.data} issues={parseResult.issues} />
              )}
            </>
          )}

          {stepIndex === 3 && device && generated && (
            <StepResults
              config={generated.config}
              checkItems={generated.checkItems}
              mermaidDefinition={generated.mermaidDefinition}
              device={device}
              hostname={parseResult?.data?.basic.hostname ?? ""}
            />
          )}
        </div>

        <div className="mt-6 flex items-center justify-between">
          <div>
            {stepIndex > 0 && stepIndex !== 2 && !isGenerating && (
              <Button variant="text" onClick={goBack}>
                戻る
              </Button>
            )}
            {stepIndex === 2 && !isGenerating && (
              <Button variant="text" onClick={goBack}>
                戻ってファイルを選び直す
              </Button>
            )}
            {stepIndex === 3 && (
              <Button variant="text" onClick={handleReset}>
                最初からやり直す
              </Button>
            )}
          </div>

          <div>
            {stepIndex === 0 && (
              <Button disabled={!deviceId} onClick={() => setStepIndex(1)}>
                次へ
              </Button>
            )}
            {stepIndex === 1 && (
              <Button disabled={!parseResult?.data} onClick={() => setStepIndex(2)}>
                次へ
              </Button>
            )}
            {stepIndex === 2 && !isGenerating && (
              <Button disabled={hasBlockingErrors} onClick={handleGenerate}>
                コンフィグを生成する
              </Button>
            )}
          </div>
        </div>
      </main>

      <footer className="border-t border-app-border bg-app-surface/70 py-6 text-center text-std-16N-170 text-app-muted">
        入力されたデータはお使いの端末内でのみ処理されます。外部サーバーへは送信されません。
      </footer>
    </div>
  );
}
