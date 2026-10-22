import * as XLSX from "xlsx";
import {
  BASIC_FIELDS,
  COMMON_FIELDS,
  INTERFACE_HEADERS,
  ROUTING_HEADERS,
  SHEET_NAMES,
  TOPOLOGY_HEADERS,
  VLAN_HEADERS,
} from "./excelSchema";
import type {
  BasicInfo,
  CommonSettings,
  InterfaceEntry,
  InterfaceMode,
  ParameterSheet,
  ParseResult,
  RemoteDeviceType,
  RoutingEntry,
  RoutingType,
  TopologyLink,
  ValidationIssue,
  VlanEntry,
} from "./types";

const IPV4_RE = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;

const isValidIPv4 = (value: string) => {
  if (!IPV4_RE.test(value.trim())) return false;
  return value
    .trim()
    .split(".")
    .every((part) => Number(part) >= 0 && Number(part) <= 255);
};

const toBool = (value: unknown): boolean => {
  const v = String(value ?? "").trim().toUpperCase();
  return v === "TRUE" || v === "1" || v === "YES" || v === "はい";
};

const norm = (value: unknown) => String(value ?? "").trim();

const getSheetAoa = (wb: XLSX.WorkBook, name: string): string[][] | null => {
  const ws = wb.Sheets[name];
  if (!ws) return null;
  return XLSX.utils.sheet_to_json<string[]>(ws, { header: 1, defval: "", raw: false });
};

/** 行/値の2列シート(基本情報・共通設定)をラベルで引けるMapに変換 */
const toLabelValueMap = (rows: string[][]): Map<string, string> => {
  const map = new Map<string, string>();
  for (const row of rows) {
    const label = norm(row[0]);
    if (!label) continue;
    map.set(label, norm(row[1]));
  }
  return map;
};

/** ヘッダー行から期待するヘッダー名→列indexを解決する。見つからない場合は定義順にフォールバック */
const resolveColumns = (
  headerRow: string[],
  expected: readonly string[],
  sheetName: string,
  issues: ValidationIssue[],
): number[] => {
  const normalizedHeader = headerRow.map((h) => norm(h));
  return expected.map((label, i) => {
    const idx = normalizedHeader.findIndex((h) => h === label);
    if (idx === -1) {
      issues.push({
        sheet: sheetName,
        message: `列「${label}」が見つからなかったため、${i + 1}列目として読み込みます。テンプレートの見出し行は変更しないことを推奨します。`,
        level: "warning",
      });
      return i;
    }
    return idx;
  });
};

export const parseParameterSheet = async (file: File): Promise<ParseResult> => {
  const issues: ValidationIssue[] = [];
  let wb: XLSX.WorkBook;
  try {
    const buf = await file.arrayBuffer();
    wb = XLSX.read(buf, { type: "array" });
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    return {
      data: null,
      issues: [
        {
          sheet: "ファイル",
          message: `Excelファイルとして読み込めませんでした。.xlsx形式か確認してください。(詳細: ${detail})`,
          level: "error",
        },
      ],
    };
  }

  const requiredSheets = Object.values(SHEET_NAMES).filter((s) => s !== SHEET_NAMES.cover);
  for (const s of requiredSheets) {
    if (!wb.Sheets[s]) {
      issues.push({ sheet: s, message: `シート「${s}」が見つかりません。テンプレートから作り直してください。`, level: "error" });
    }
  }
  if (issues.some((i) => i.level === "error")) {
    return { data: null, issues };
  }

  // --- 基本情報 ---
  const basicRows = getSheetAoa(wb, SHEET_NAMES.basic)!.slice(1);
  const basicMap = toLabelValueMap(basicRows);
  const basicGet = (key: string) => {
    const field = BASIC_FIELDS.find((f) => f.key === key)!;
    return basicMap.get(field.label) ?? "";
  };

  const deviceId = basicGet("deviceId");
  if (!deviceId) {
    issues.push({ sheet: SHEET_NAMES.basic, message: "機器IDが空です。テンプレートをダウンロードし直してください。", level: "error" });
  }

  const basic: BasicInfo = {
    hostname: basicGet("hostname"),
    domainName: basicGet("domainName"),
    mgmtVlan: basicGet("mgmtVlan"),
    mgmtIp: basicGet("mgmtIp"),
    mgmtMask: basicGet("mgmtMask"),
    mgmtGateway: basicGet("mgmtGateway"),
    enableSecret: basicGet("enableSecret"),
    localUsername: basicGet("localUsername"),
    localPassword: basicGet("localPassword"),
    timezone: basicGet("timezone"),
  };

  if (!basic.hostname) {
    issues.push({ sheet: SHEET_NAMES.basic, message: "ホスト名が入力されていません。", level: "error" });
  }
  if (basic.mgmtIp && !isValidIPv4(basic.mgmtIp)) {
    issues.push({ sheet: SHEET_NAMES.basic, message: `管理IPアドレス「${basic.mgmtIp}」の形式が不正です。`, level: "error" });
  }
  if (basic.mgmtMask && !isValidIPv4(basic.mgmtMask)) {
    issues.push({ sheet: SHEET_NAMES.basic, message: `管理サブネットマスク「${basic.mgmtMask}」の形式が不正です。`, level: "error" });
  }
  if (basic.mgmtGateway && !isValidIPv4(basic.mgmtGateway)) {
    issues.push({ sheet: SHEET_NAMES.basic, message: `デフォルトゲートウェイ「${basic.mgmtGateway}」の形式が不正です。`, level: "error" });
  }
  if (basic.mgmtVlan && !/^\d+$/.test(basic.mgmtVlan)) {
    issues.push({ sheet: SHEET_NAMES.basic, message: "管理VLAN IDは数値で入力してください。", level: "error" });
  }
  if (!basic.enableSecret) {
    issues.push({ sheet: SHEET_NAMES.basic, message: "Enableパスワードが未入力です。設定すると機器のセキュリティが向上します。", level: "warning" });
  }

  // --- 共通設定 ---
  const commonRows = getSheetAoa(wb, SHEET_NAMES.common)!.slice(1);
  const commonMap = toLabelValueMap(commonRows);
  const commonGet = (key: string) => {
    const field = COMMON_FIELDS.find((f) => f.key === key)!;
    return commonMap.get(field.label) ?? "";
  };
  const common: CommonSettings = {
    snmpRoCommunity: commonGet("snmpRoCommunity"),
    snmpRwCommunity: commonGet("snmpRwCommunity"),
    snmpHost: commonGet("snmpHost"),
    ntpServer: commonGet("ntpServer"),
    syslogServer: commonGet("syslogServer"),
    loggingTrapLevel: commonGet("loggingTrapLevel") || "informational",
    bannerMotd: commonGet("bannerMotd"),
    sshEnabled: toBool(commonGet("sshEnabled") || "TRUE"),
    httpServerDisabled: toBool(commonGet("httpServerDisabled") || "TRUE"),
    consoleTimeoutMin: commonGet("consoleTimeoutMin") || "10",
    vtyTimeoutMin: commonGet("vtyTimeoutMin") || "10",
  };

  // --- VLAN ---
  const vlanAoa = getSheetAoa(wb, SHEET_NAMES.vlan)!;
  const vlanCols = resolveColumns(vlanAoa[0] ?? [], VLAN_HEADERS, SHEET_NAMES.vlan, issues);
  const vlans: VlanEntry[] = [];
  vlanAoa.slice(1).forEach((row, i) => {
    const [vlanId, name, sviIp, sviMask, description] = vlanCols.map((c) => norm(row[c]));
    if (!vlanId && !name) return;
    if (!/^\d+$/.test(vlanId) || Number(vlanId) < 1 || Number(vlanId) > 4094) {
      issues.push({ sheet: SHEET_NAMES.vlan, row: i + 2, message: `VLAN ID「${vlanId}」は1〜4094の数値で指定してください。`, level: "error" });
    }
    if (!name) {
      issues.push({ sheet: SHEET_NAMES.vlan, row: i + 2, message: "VLAN名が未入力です。", level: "error" });
    }
    vlans.push({ vlanId, name, sviIp, sviMask, description });
  });

  // --- インターフェース ---
  const ifAoa = getSheetAoa(wb, SHEET_NAMES.interfaces)!;
  const ifCols = resolveColumns(ifAoa[0] ?? [], INTERFACE_HEADERS, SHEET_NAMES.interfaces, issues);
  const validModes: InterfaceMode[] = ["access", "trunk", "routed", "unused"];
  const interfaces: InterfaceEntry[] = [];
  ifAoa.slice(1).forEach((row, i) => {
    const [name, modeRaw, accessVlan, trunkAllowedVlans, nativeVlan, ipAddress, subnetMask, description, shutdownRaw] =
      ifCols.map((c) => norm(row[c]));
    if (!name) return;
    const mode = (modeRaw.toLowerCase() || "unused") as InterfaceMode;
    if (!validModes.includes(mode)) {
      issues.push({
        sheet: SHEET_NAMES.interfaces,
        row: i + 2,
        message: `${name}: モード「${modeRaw}」は不正です。access/trunk/routed/unused のいずれかにしてください。`,
        level: "error",
      });
    }
    if (mode === "access" && !accessVlan) {
      issues.push({ sheet: SHEET_NAMES.interfaces, row: i + 2, message: `${name}: アクセスモードですがアクセスVLANが未入力です。`, level: "error" });
    }
    if (mode === "routed" && (!ipAddress || !subnetMask)) {
      issues.push({ sheet: SHEET_NAMES.interfaces, row: i + 2, message: `${name}: routedモードですがIPアドレス/サブネットマスクが未入力です。`, level: "error" });
    }
    if (ipAddress && !isValidIPv4(ipAddress)) {
      issues.push({ sheet: SHEET_NAMES.interfaces, row: i + 2, message: `${name}: IPアドレス「${ipAddress}」の形式が不正です。`, level: "error" });
    }
    interfaces.push({
      name,
      mode: validModes.includes(mode) ? mode : "unused",
      accessVlan,
      trunkAllowedVlans,
      nativeVlan,
      ipAddress,
      subnetMask,
      description,
      shutdown: shutdownRaw ? toBool(shutdownRaw) : mode === "unused",
    });
  });

  // --- ルーティング ---
  const routingAoa = getSheetAoa(wb, SHEET_NAMES.routing)!;
  const routingCols = resolveColumns(routingAoa[0] ?? [], ROUTING_HEADERS, SHEET_NAMES.routing, issues);
  const validRoutingTypes: RoutingType[] = ["static", "ospf", "eigrp"];
  const routing: RoutingEntry[] = [];
  routingAoa.slice(1).forEach((row, i) => {
    const [type, network, mask, nextHop, outInterface, ospfProcessId, ospfArea, metric, description] =
      routingCols.map((c) => norm(row[c]));
    if (!type && !network) return;
    const t = type.toLowerCase();
    if (!validRoutingTypes.includes(t as RoutingType)) {
      issues.push({ sheet: SHEET_NAMES.routing, row: i + 2, message: `種別「${type}」は不正です。static/ospf/eigrp のいずれかにしてください。`, level: "error" });
    }
    if (t === "static" && (!network || !mask || (!nextHop && !outInterface))) {
      issues.push({ sheet: SHEET_NAMES.routing, row: i + 2, message: "staticルートには宛先ネットワーク・マスクと、ネクストホップまたは出力インターフェースが必要です。", level: "error" });
    }
    if (t === "ospf" && !ospfProcessId) {
      issues.push({ sheet: SHEET_NAMES.routing, row: i + 2, message: "ospfルートにはプロセスIDが必要です。", level: "error" });
    }
    routing.push({
      type: (validRoutingTypes.includes(t as RoutingType) ? t : "static") as RoutingType,
      network,
      mask,
      nextHop,
      outInterface,
      ospfProcessId,
      ospfArea,
      metric,
      description,
    });
  });

  // --- トポロジー ---
  const topoAoa = getSheetAoa(wb, SHEET_NAMES.topology)!;
  const topoCols = resolveColumns(topoAoa[0] ?? [], TOPOLOGY_HEADERS, SHEET_NAMES.topology, issues);
  const validRemoteTypes: RemoteDeviceType[] = ["switch", "router", "pc", "server", "ap", "other"];
  const topology: TopologyLink[] = [];
  topoAoa.slice(1).forEach((row, i) => {
    const [localIf, remoteHost, remoteTypeRaw, remoteIf, note] = topoCols.map((c) => norm(row[c]));
    if (!localIf && !remoteHost) return;
    if (!remoteHost) {
      issues.push({ sheet: SHEET_NAMES.topology, row: i + 2, message: "接続先ホスト名が未入力です。", level: "error" });
    }
    const remoteType = remoteTypeRaw.toLowerCase();
    if (remoteType && !validRemoteTypes.includes(remoteType as RemoteDeviceType)) {
      issues.push({ sheet: SHEET_NAMES.topology, row: i + 2, message: `接続先種別「${remoteTypeRaw}」は不明な値のため other として扱います。`, level: "warning" });
    }
    topology.push({
      localIf,
      remoteHost,
      remoteType: (validRemoteTypes.includes(remoteType as RemoteDeviceType) ? remoteType : "other") as RemoteDeviceType,
      remoteIf,
      note,
    });
  });

  const data: ParameterSheet = { deviceId, basic, common, vlans, interfaces, routing, topology };

  return { data, issues };
};
