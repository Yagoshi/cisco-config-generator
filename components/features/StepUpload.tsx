import type { DeviceModel } from "@/lib/devices";
import { Button } from "../ui/Button";
import {
  ProgressIndicator,
  ProgressIndicatorDescription,
  ProgressIndicatorLabel,
  ProgressIndicatorSpinner,
} from "../ui/ProgressIndicator";
import { FileDropzone } from "./FileDropzone";

export const StepUpload = ({
  device,
  onDownloadTemplate,
  onFileSelected,
  fileName,
  isParsing,
}: {
  device: DeviceModel;
  onDownloadTemplate: () => void;
  onFileSelected: (file: File) => void;
  fileName: string | null;
  isParsing: boolean;
}) => {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-std-20B-150 text-app-text">パラメーターシートを準備してください</h2>
        <p className="mt-1 text-std-16N-170 text-app-muted">
          {device.series} ({device.model}) 用のテンプレートに設定値を入力し、アップロードしてください。
        </p>
      </div>

      <div className="rounded-16 border border-app-border bg-app-surface-2 p-6">
        <p className="text-std-17B-170 text-app-text">1. テンプレートをダウンロード</p>
        <p className="mt-1 text-std-16N-170 text-app-muted">
          選択した機種のポート構成があらかじめ展開された、記入用Excelファイルを取得します。
        </p>
        <Button className="mt-4" variant="outline" onClick={onDownloadTemplate}>
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M12 15V3m0 12-4-4m4 4 4-4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          テンプレートをダウンロード
        </Button>
      </div>

      <div className="rounded-16 border border-app-border p-6">
        <p className="text-std-17B-170 text-app-text">2. 記入済みファイルをアップロード</p>
        <p className="mt-1 mb-4 text-std-16N-170 text-app-muted">
          入力が完了したExcelファイルをこの画面にアップロードしてください。ファイルはお使いの端末内でのみ処理され、外部には送信されません。
        </p>
        {isParsing ? (
          <ProgressIndicator type="stacked-underlay" className="mx-auto py-10">
            <ProgressIndicatorSpinner />
            <ProgressIndicatorLabel>パラメーターシートを解析しています</ProgressIndicatorLabel>
            <ProgressIndicatorDescription>入力内容を確認しています。しばらくお待ちください…</ProgressIndicatorDescription>
          </ProgressIndicator>
        ) : (
          <FileDropzone onFileSelected={onFileSelected} fileName={fileName} />
        )}
      </div>
    </div>
  );
};
