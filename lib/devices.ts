export type DeviceCategory = "switch" | "router";

export type DeviceModel = {
  id: string;
  category: DeviceCategory;
  series: string;
  model: string;
  os: "IOS" | "IOS-XE";
  /** 代表的なインターフェース命名(ポート番号は除く接頭辞) 例: GigabitEthernet1/0/ */
  interfacePrefixes: string[];
  /** 管理/アップリンク用の高速ポート接頭辞(任意) */
  uplinkPrefixes?: string[];
  portCount: number;
  supportsLayer3: boolean;
  maxVlans: number;
  notes?: string;
};

export const DEVICE_CATALOG: DeviceModel[] = [
  // --- スイッチ ---
  {
    id: "c9200-24p",
    category: "switch",
    series: "Catalyst 9200",
    model: "C9200-24P",
    os: "IOS-XE",
    interfacePrefixes: ["GigabitEthernet1/0/"],
    uplinkPrefixes: ["TenGigabitEthernet1/1/"],
    portCount: 24,
    supportsLayer3: true,
    maxVlans: 1024,
    notes: "アクセス層向けエントリーL3スイッチ",
  },
  {
    id: "c9200l-48p",
    category: "switch",
    series: "Catalyst 9200L",
    model: "C9200L-48P",
    os: "IOS-XE",
    interfacePrefixes: ["GigabitEthernet1/0/"],
    uplinkPrefixes: ["TenGigabitEthernet1/1/"],
    portCount: 48,
    supportsLayer3: true,
    maxVlans: 1024,
  },
  {
    id: "c9300-24t",
    category: "switch",
    series: "Catalyst 9300",
    model: "C9300-24T",
    os: "IOS-XE",
    interfacePrefixes: ["GigabitEthernet1/0/"],
    uplinkPrefixes: ["TenGigabitEthernet1/1/"],
    portCount: 24,
    supportsLayer3: true,
    maxVlans: 4094,
    notes: "スタック対応 中規模拠点の集約層に多用",
  },
  {
    id: "c9300-48p",
    category: "switch",
    series: "Catalyst 9300",
    model: "C9300-48P",
    os: "IOS-XE",
    interfacePrefixes: ["GigabitEthernet1/0/"],
    uplinkPrefixes: ["TenGigabitEthernet1/1/"],
    portCount: 48,
    supportsLayer3: true,
    maxVlans: 4094,
  },
  {
    id: "c9300x-24y",
    category: "switch",
    series: "Catalyst 9300X",
    model: "C9300X-24Y",
    os: "IOS-XE",
    interfacePrefixes: ["TwentyFiveGigE1/0/"],
    uplinkPrefixes: ["HundredGigE1/1/"],
    portCount: 24,
    supportsLayer3: true,
    maxVlans: 4094,
    notes: "10/25G高密度モデル",
  },
  {
    id: "c9400-sup",
    category: "switch",
    series: "Catalyst 9400",
    model: "C9400 (モジュラーシャーシ)",
    os: "IOS-XE",
    interfacePrefixes: ["GigabitEthernet1/0/", "TenGigabitEthernet1/0/"],
    uplinkPrefixes: ["FortyGigabitEthernet1/1/"],
    portCount: 48,
    supportsLayer3: true,
    maxVlans: 4094,
    notes: "コア/集約層向けモジュラーシャーシ",
  },
  {
    id: "c9500-24y4c",
    category: "switch",
    series: "Catalyst 9500",
    model: "C9500-24Y4C",
    os: "IOS-XE",
    interfacePrefixes: ["TwentyFiveGigE1/0/"],
    uplinkPrefixes: ["HundredGigE1/0/"],
    portCount: 24,
    supportsLayer3: true,
    maxVlans: 4094,
    notes: "コア層向け固定シャーシ",
  },
  {
    id: "c3850-48p",
    category: "switch",
    series: "Catalyst 3850",
    model: "WS-C3850-48P",
    os: "IOS-XE",
    interfacePrefixes: ["GigabitEthernet1/0/"],
    uplinkPrefixes: ["TenGigabitEthernet1/1/"],
    portCount: 48,
    supportsLayer3: true,
    maxVlans: 4094,
    notes: "レガシー機種(EoL) 更新検討を推奨",
  },
  {
    id: "c2960x-48",
    category: "switch",
    series: "Catalyst 2960-X",
    model: "WS-C2960X-48TS-L",
    os: "IOS",
    interfacePrefixes: ["GigabitEthernet0/"],
    uplinkPrefixes: ["TenGigabitEthernet1/0/"],
    portCount: 48,
    supportsLayer3: false,
    maxVlans: 1024,
    notes: "L2専用 小規模アクセス層向け",
  },
  {
    id: "c2960l-24",
    category: "switch",
    series: "Catalyst 2960-L",
    model: "WS-C2960L-24TS-LL",
    os: "IOS",
    interfacePrefixes: ["GigabitEthernet1/0/"],
    uplinkPrefixes: ["GigabitEthernet1/1/"],
    portCount: 24,
    supportsLayer3: false,
    maxVlans: 255,
  },

  // --- ルーター ---
  {
    id: "isr1100-4g",
    category: "router",
    series: "ISR 1100",
    model: "C1111-4P",
    os: "IOS-XE",
    interfacePrefixes: ["GigabitEthernet0/0/"],
    portCount: 4,
    supportsLayer3: true,
    maxVlans: 0,
    notes: "小規模拠点向け統合サービスルーター",
  },
  {
    id: "isr4321",
    category: "router",
    series: "ISR 4000",
    model: "ISR4321",
    os: "IOS-XE",
    interfacePrefixes: ["GigabitEthernet0/0/"],
    portCount: 2,
    supportsLayer3: true,
    maxVlans: 0,
    notes: "小〜中規模拠点向け",
  },
  {
    id: "isr4331",
    category: "router",
    series: "ISR 4000",
    model: "ISR4331",
    os: "IOS-XE",
    interfacePrefixes: ["GigabitEthernet0/0/"],
    portCount: 3,
    supportsLayer3: true,
    maxVlans: 0,
  },
  {
    id: "isr4351",
    category: "router",
    series: "ISR 4000",
    model: "ISR4351",
    os: "IOS-XE",
    interfacePrefixes: ["GigabitEthernet0/0/"],
    portCount: 3,
    supportsLayer3: true,
    maxVlans: 0,
    notes: "中規模拠点/WANアグリゲーション向け",
  },
  {
    id: "isr4431",
    category: "router",
    series: "ISR 4000",
    model: "ISR4431",
    os: "IOS-XE",
    interfacePrefixes: ["GigabitEthernet0/0/"],
    portCount: 3,
    supportsLayer3: true,
    maxVlans: 0,
  },
  {
    id: "asr1001-x",
    category: "router",
    series: "ASR 1000",
    model: "ASR1001-X",
    os: "IOS-XE",
    interfacePrefixes: ["GigabitEthernet0/0/"],
    uplinkPrefixes: ["TenGigabitEthernet0/1/"],
    portCount: 6,
    supportsLayer3: true,
    maxVlans: 0,
    notes: "拠点/データセンター境界向け大規模ルーター",
  },
];

export const getDevice = (id: string) => DEVICE_CATALOG.find((d) => d.id === id);

export const getDevicesByCategory = (category: DeviceCategory) =>
  DEVICE_CATALOG.filter((d) => d.category === category);

export const listInterfaceOptions = (device: DeviceModel, count = device.portCount): string[] => {
  const prefix = device.interfacePrefixes[0];
  const names: string[] = [];
  for (let i = 1; i <= count; i++) {
    names.push(`${prefix}${i}`);
  }
  if (device.uplinkPrefixes) {
    for (const up of device.uplinkPrefixes) {
      names.push(`${up}1`, `${up}2`);
    }
  }
  return names;
};
