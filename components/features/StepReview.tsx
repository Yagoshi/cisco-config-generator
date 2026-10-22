import type { ParameterSheet, ValidationIssue } from "@/lib/types";
import { NotificationBanner } from "../ui/NotificationBanner";
import { Card } from "../ui/Field";

const SummaryTile = ({ label, value }: { label: string; value: number }) => (
  <div className="rounded-12 border border-app-border bg-app-surface px-5 py-4 text-center">
    <p className="text-std-28B-150 text-app-accent-text">{value}</p>
    <p className="text-std-16N-170 text-app-muted">{label}</p>
  </div>
);

export const StepReview = ({
  data,
  issues,
}: {
  data: ParameterSheet;
  issues: ValidationIssue[];
}) => {
  const errors = issues.filter((i) => i.level === "error");
  const warnings = issues.filter((i) => i.level === "warning");
  const usedInterfaces = data.interfaces.filter((i) => i.mode !== "unused");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-std-20B-150 text-app-text">内容を確認してください</h2>
        <p className="mt-1 text-std-16N-170 text-app-muted">
          読み込んだパラメーターシートの内容です。問題がなければ次のステップでコンフィグを生成します。
        </p>
      </div>

      {errors.length > 0 && (
        <NotificationBanner type="error" title={`${errors.length}件のエラーがあります。修正後に再アップロードしてください`}>
          <ul className="list-disc space-y-1 pl-5">
            {errors.map((i, idx) => (
              <li key={idx}>
                【{i.sheet}
                {i.row ? ` ${i.row}行目` : ""}】{i.message}
              </li>
            ))}
          </ul>
        </NotificationBanner>
      )}

      {warnings.length > 0 && (
        <NotificationBanner type="warning" title={`${warnings.length}件の確認事項があります`}>
          <ul className="list-disc space-y-1 pl-5">
            {warnings.map((i, idx) => (
              <li key={idx}>
                【{i.sheet}
                {i.row ? ` ${i.row}行目` : ""}】{i.message}
              </li>
            ))}
          </ul>
        </NotificationBanner>
      )}

      {errors.length === 0 && warnings.length === 0 && (
        <NotificationBanner type="success" title="入力内容に問題は見つかりませんでした" />
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <SummaryTile label="VLAN" value={data.vlans.length} />
        <SummaryTile label="使用インターフェース" value={usedInterfaces.length} />
        <SummaryTile label="ルーティング設定" value={data.routing.length} />
        <SummaryTile label="接続先(トポロジー)" value={data.topology.length} />
        <SummaryTile label="検出された指摘" value={issues.length} />
      </div>

      <Card>
        <p className="mb-3 text-std-17B-170 text-app-text">基本情報</p>
        <dl className="grid grid-cols-1 gap-x-8 gap-y-2 text-std-16N-170 sm:grid-cols-2">
          {[
            ["ホスト名", data.basic.hostname],
            ["ドメイン名", data.basic.domainName],
            ["管理VLAN", data.basic.mgmtVlan],
            ["管理IPアドレス", data.basic.mgmtIp],
            ["サブネットマスク", data.basic.mgmtMask],
            ["デフォルトゲートウェイ", data.basic.mgmtGateway],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between gap-4 border-b border-app-border pb-2">
              <dt className="text-app-muted">{label}</dt>
              <dd className="font-mono text-app-text">{value || "—"}</dd>
            </div>
          ))}
        </dl>
      </Card>
    </div>
  );
};
