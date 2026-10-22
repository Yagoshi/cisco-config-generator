import { DEVICE_CATALOG, DeviceCategory, getDevicesByCategory } from "@/lib/devices";
import { Card, FieldGroup, Label, SupportText } from "../ui/Field";
import { Select } from "../ui/Select";

export const StepDeviceSelect = ({
  category,
  deviceId,
  onCategoryChange,
  onDeviceChange,
}: {
  category: DeviceCategory | null;
  deviceId: string | null;
  onCategoryChange: (c: DeviceCategory) => void;
  onDeviceChange: (id: string) => void;
}) => {
  const devices = category ? getDevicesByCategory(category) : [];
  const device = DEVICE_CATALOG.find((d) => d.id === deviceId);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-std-20B-150 text-app-text">機器を選択してください</h2>
        <p className="mt-1 text-std-16N-170 text-app-muted">
          設定を投入する機器のカテゴリと機種を選択します。選択内容に応じて、次のステップで取得できるパラメーターシートのインターフェース一覧が自動生成されます。
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <FieldGroup>
          <Label htmlFor="category">機器カテゴリ</Label>
          <Select
            id="category"
            value={category ?? ""}
            onChange={(e) => onCategoryChange(e.target.value as DeviceCategory)}
          >
            <option value="" disabled>
              選択してください
            </option>
            <option value="switch">スイッチ</option>
            <option value="router">ルーター</option>
          </Select>
        </FieldGroup>

        <FieldGroup>
          <Label htmlFor="model">機種</Label>
          <Select
            id="model"
            value={deviceId ?? ""}
            disabled={!category}
            onChange={(e) => onDeviceChange(e.target.value)}
          >
            <option value="" disabled>
              {category ? "選択してください" : "先にカテゴリを選択してください"}
            </option>
            {devices.map((d) => (
              <option key={d.id} value={d.id}>
                {d.series} ({d.model})
              </option>
            ))}
          </Select>
        </FieldGroup>
      </div>

      {device && (
        <Card className="bg-app-surface-2 border-app-border-strong">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-std-18B-160 text-app-text">
                {device.series} <span className="text-app-muted">({device.model})</span>
              </p>
              {device.notes && <SupportText className="mt-1">{device.notes}</SupportText>}
            </div>
            <dl className="grid grid-cols-2 gap-x-8 gap-y-1 text-std-16N-170 sm:grid-cols-4">
              <div>
                <dt className="text-app-muted">OS</dt>
                <dd className="text-std-16B-170">{device.os}</dd>
              </div>
              <div>
                <dt className="text-app-muted">ポート数</dt>
                <dd className="text-std-16B-170">{device.portCount}</dd>
              </div>
              <div>
                <dt className="text-app-muted">L3対応</dt>
                <dd className="text-std-16B-170">{device.supportsLayer3 ? "可" : "不可"}</dd>
              </div>
              <div>
                <dt className="text-app-muted">最大VLAN数</dt>
                <dd className="text-std-16B-170">{device.maxVlans || "-"}</dd>
              </div>
            </dl>
          </div>
        </Card>
      )}
    </div>
  );
};
