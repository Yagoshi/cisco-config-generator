export const SHEET_NAMES = {
  cover: "はじめに",
  basic: "基本情報",
  common: "共通設定",
  vlan: "VLAN",
  interfaces: "インターフェース",
  routing: "ルーティング",
  topology: "トポロジー",
} as const;

// 基本情報シートは「項目/値」の2列構成。キーは技術的なID、ラベルは表示名。
export const BASIC_FIELDS: { key: string; label: string; example: string }[] = [
  { key: "deviceId", label: "機器ID(自動入力・編集不要)", example: "" },
  { key: "hostname", label: "ホスト名", example: "SW-CORE-01" },
  { key: "domainName", label: "ドメイン名", example: "example.local" },
  { key: "mgmtVlan", label: "管理VLAN ID", example: "10" },
  { key: "mgmtIp", label: "管理IPアドレス", example: "192.168.10.2" },
  { key: "mgmtMask", label: "管理サブネットマスク", example: "255.255.255.0" },
  { key: "mgmtGateway", label: "デフォルトゲートウェイ", example: "192.168.10.1" },
  { key: "enableSecret", label: "Enableパスワード(secret)", example: "ChangeMe123!" },
  { key: "localUsername", label: "ローカル管理ユーザー名", example: "admin" },
  { key: "localPassword", label: "ローカル管理パスワード", example: "ChangeMe123!" },
  { key: "timezone", label: "タイムゾーン", example: "JST" },
];

export const COMMON_FIELDS: { key: string; label: string; example: string }[] = [
  { key: "snmpRoCommunity", label: "SNMP Read-Onlyコミュニティ", example: "public-ro" },
  { key: "snmpRwCommunity", label: "SNMP Read-Writeコミュニティ", example: "" },
  { key: "snmpHost", label: "SNMPホスト(トラップ送信先)", example: "192.168.1.100" },
  { key: "ntpServer", label: "NTPサーバー", example: "ntp.example.local" },
  { key: "syslogServer", label: "Syslogサーバー", example: "192.168.1.101" },
  { key: "loggingTrapLevel", label: "ログレベル(trap)", example: "informational" },
  { key: "bannerMotd", label: "バナーメッセージ(MOTD)", example: "Authorized access only" },
  { key: "sshEnabled", label: "SSH有効化(TRUE/FALSE)", example: "TRUE" },
  { key: "httpServerDisabled", label: "HTTPサーバー無効化(TRUE/FALSE)", example: "TRUE" },
  { key: "consoleTimeoutMin", label: "コンソールタイムアウト(分)", example: "10" },
  { key: "vtyTimeoutMin", label: "VTYタイムアウト(分)", example: "10" },
];

export const VLAN_HEADERS = [
  "VLAN ID",
  "VLAN名",
  "SVI IPアドレス(任意)",
  "SVIサブネットマスク(任意)",
  "説明",
] as const;

export const INTERFACE_HEADERS = [
  "インターフェース名",
  "モード(access/trunk/routed/unused)",
  "アクセスVLAN",
  "トランク許可VLAN(例 10,20,30-40)",
  "ネイティブVLAN",
  "IPアドレス(routed時)",
  "サブネットマスク(routed時)",
  "説明",
  "シャットダウン(TRUE/FALSE)",
] as const;

export const ROUTING_HEADERS = [
  "種別(static/ospf/eigrp)",
  "宛先ネットワーク",
  "サブネットマスク",
  "ネクストホップIP(任意)",
  "出力インターフェース(任意)",
  "プロセスID/AS番号(ospf/eigrp時)",
  "エリア(ospf時)",
  "メトリック(任意)",
  "説明",
] as const;

export const TOPOLOGY_HEADERS = [
  "自機器インターフェース",
  "接続先ホスト名",
  "接続先種別(switch/router/pc/server/ap/other)",
  "接続先インターフェース(任意)",
  "回線備考(任意)",
] as const;
