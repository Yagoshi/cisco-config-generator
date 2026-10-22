import * as XLSX from "xlsx";
import {
  ACL_HEADERS,
  BASIC_FIELDS,
  COMMON_FIELDS,
  INTERFACE_HEADERS,
  NAT_HEADERS,
  ROUTING_HEADERS,
  SHEET_NAMES,
  TOPOLOGY_HEADERS,
  VLAN_HEADERS,
} from "./excelSchema";
import type {
  AclAction,
  AclEntry,
  AclProtocol,
  AclType,
  BasicInfo,
  CommonSettings,
  InterfaceEntry,
  InterfaceMode,
  NatEntry,
  NatType,
  ParameterSheet,
  ParseResult,
  PortSecurityViolation,
  QosSetting,
  RemoteDeviceType,
  RoutingEntry,
  RoutingType,
  StpMode,
  TopologyLink,
  ValidationIssue,
  VlanEntry,
} from "./types";

const IPV4_RE = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;

// OLE2/CFB (Compound File Binary) のマジックナンバー。
// パスワード保護・機密度ラベル(Microsoft Purview/AIP等)で暗号化されたOfficeファイルはこの形式でラップされる。
const OLE2_SIGNATURE = [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1];

const isEncryptedOfficeContainer = (buf: ArrayBuffer): boolean => {
  if (buf.byteLength < OLE2_SIGNATURE.length) return false;
  const bytes = new Uint8Array(buf, 0, OLE2_SIGNATURE.length);
  return OLE2_SIGNATURE.every((b, i) => bytes[i] === b);
};

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
    if (isEncryptedOfficeContainer(buf)) {
      return {
        data: null,
        issues: [
          {
            sheet: "ファイル",
            message:
              "このファイルはAIP(Azure Information Protection/Microsoft Purview)の機密度ラベルによって暗号化されているため、ブラウザ上では読み込めません。外部からダウンロードしたファイルに自動で保護がかかる設定になっている可能性があります。Excelでファイルを開き、リボンの「機密度」またはAIPの「保護」ボタンから、ラベルを「制限なし」などの保護がかからない区分に変更したうえで保存し、再度アップロードしてください。(パスワード保護が原因の場合は、ファイル→情報→ブックの保護からパスワードを解除してください)",
            level: "error",
          },
        ],
      };
    }
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
  const validStpModes: StpMode[] = ["pvst", "rapid-pvst", "mst"];
  const stpModeRaw = commonGet("stpMode").toLowerCase();
  if (stpModeRaw && !validStpModes.includes(stpModeRaw as StpMode)) {
    issues.push({ sheet: SHEET_NAMES.common, message: `STPモード「${stpModeRaw}」は不正です。pvst/rapid-pvst/mst のいずれかにしてください。`, level: "error" });
  }

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
    stpMode: (validStpModes.includes(stpModeRaw as StpMode) ? stpModeRaw : "") as StpMode,
    qosEnabled: toBool(commonGet("qosEnabled")),
    radiusServerIp: commonGet("radiusServerIp"),
    radiusAuthPort: commonGet("radiusAuthPort") || "1812",
    radiusAcctPort: commonGet("radiusAcctPort") || "1813",
    radiusKey: commonGet("radiusKey"),
  };

  if (common.radiusServerIp && !isValidIPv4(common.radiusServerIp)) {
    issues.push({ sheet: SHEET_NAMES.common, message: `RADIUSサーバーIP「${common.radiusServerIp}」の形式が不正です。`, level: "error" });
  }

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
  const validQos: QosSetting[] = ["trust-cos", "trust-dscp", "auto-voip-phone", "auto-voip-switch"];
  const validPortSecurityViolation: PortSecurityViolation[] = ["shutdown", "restrict", "protect"];
  const validNatDirection: ("inside" | "outside")[] = ["inside", "outside"];
  const interfaces: InterfaceEntry[] = [];
  ifAoa.slice(1).forEach((row, i) => {
    const [
      name,
      modeRaw,
      accessVlan,
      trunkAllowedVlans,
      nativeVlan,
      ipAddress,
      subnetMask,
      description,
      shutdownRaw,
      qosRaw,
      stpPortfastRaw,
      stpBpduGuardRaw,
      portSecurityMaxMac,
      portSecurityViolationRaw,
      dot1xEnabledRaw,
      aclIn,
      aclOut,
      natDirectionRaw,
    ] = ifCols.map((c) => norm(row[c]));
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

    const qos = qosRaw.toLowerCase();
    if (qos && !validQos.includes(qos as QosSetting)) {
      issues.push({ sheet: SHEET_NAMES.interfaces, row: i + 2, message: `${name}: QoS設定「${qosRaw}」は不正です。trust-cos/trust-dscp/auto-voip-phone/auto-voip-switch のいずれかにしてください。`, level: "error" });
    }
    if (portSecurityMaxMac && !/^\d+$/.test(portSecurityMaxMac)) {
      issues.push({ sheet: SHEET_NAMES.interfaces, row: i + 2, message: `${name}: ポートセキュリティ最大MAC数は数値で入力してください。`, level: "error" });
    }
    const portSecurityViolation = portSecurityViolationRaw.toLowerCase();
    if (portSecurityMaxMac && !validPortSecurityViolation.includes(portSecurityViolation as PortSecurityViolation)) {
      issues.push({ sheet: SHEET_NAMES.interfaces, row: i + 2, message: `${name}: ポートセキュリティを使う場合、違反時動作(shutdown/restrict/protect)の入力が必要です。`, level: "error" });
    }
    const natDirection = natDirectionRaw.toLowerCase();
    if (natDirection && !validNatDirection.includes(natDirection as "inside" | "outside")) {
      issues.push({ sheet: SHEET_NAMES.interfaces, row: i + 2, message: `${name}: NAT方向「${natDirectionRaw}」は不正です。inside/outside のいずれかにしてください。`, level: "error" });
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
      qos: (validQos.includes(qos as QosSetting) ? qos : "") as QosSetting,
      stpPortfast: toBool(stpPortfastRaw),
      stpBpduGuard: toBool(stpBpduGuardRaw),
      portSecurityMaxMac,
      portSecurityViolation: (validPortSecurityViolation.includes(portSecurityViolation as PortSecurityViolation)
        ? portSecurityViolation
        : "") as PortSecurityViolation,
      dot1xEnabled: toBool(dot1xEnabledRaw),
      aclIn,
      aclOut,
      natDirection: (validNatDirection.includes(natDirection as "inside" | "outside") ? natDirection : "") as
        | "inside"
        | "outside"
        | "",
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

  // --- ACL ---
  const aclAoa = getSheetAoa(wb, SHEET_NAMES.acl)!;
  const aclCols = resolveColumns(aclAoa[0] ?? [], ACL_HEADERS, SHEET_NAMES.acl, issues);
  const validAclTypes: AclType[] = ["standard", "extended"];
  const validAclActions: AclAction[] = ["permit", "deny"];
  const validAclProtocols: AclProtocol[] = ["ip", "tcp", "udp", "icmp"];
  const acl: AclEntry[] = [];
  aclAoa.slice(1).forEach((row, i) => {
    const [
      name,
      typeRaw,
      sequence,
      actionRaw,
      protocolRaw,
      source,
      sourceWildcard,
      sourcePort,
      destination,
      destinationWildcard,
      destinationPort,
      description,
    ] = aclCols.map((c) => norm(row[c]));
    if (!name && !source) return;
    const type = typeRaw.toLowerCase();
    const action = actionRaw.toLowerCase();
    const protocol = protocolRaw.toLowerCase();
    if (!name) {
      issues.push({ sheet: SHEET_NAMES.acl, row: i + 2, message: "ACL名が未入力です。", level: "error" });
    }
    if (!validAclTypes.includes(type as AclType)) {
      issues.push({ sheet: SHEET_NAMES.acl, row: i + 2, message: `${name}: 種別「${typeRaw}」は不正です。standard/extended のいずれかにしてください。`, level: "error" });
    }
    if (!validAclActions.includes(action as AclAction)) {
      issues.push({ sheet: SHEET_NAMES.acl, row: i + 2, message: `${name}: アクション「${actionRaw}」は不正です。permit/deny のいずれかにしてください。`, level: "error" });
    }
    if (type === "extended" && !validAclProtocols.includes(protocol as AclProtocol)) {
      issues.push({ sheet: SHEET_NAMES.acl, row: i + 2, message: `${name}: extended種別にはプロトコル(ip/tcp/udp/icmp)の指定が必要です。`, level: "error" });
    }
    if (!source || !sourceWildcard) {
      issues.push({ sheet: SHEET_NAMES.acl, row: i + 2, message: `${name}: 送信元と送信元ワイルドカードマスクは必須です。`, level: "error" });
    }
    acl.push({
      name,
      type: (validAclTypes.includes(type as AclType) ? type : "extended") as AclType,
      sequence,
      action: (validAclActions.includes(action as AclAction) ? action : "permit") as AclAction,
      protocol: (validAclProtocols.includes(protocol as AclProtocol) ? protocol : "ip") as AclProtocol,
      source,
      sourceWildcard,
      sourcePort,
      destination,
      destinationWildcard,
      destinationPort,
      description,
    });
  });

  // --- NAT ---
  const natAoa = getSheetAoa(wb, SHEET_NAMES.nat)!;
  const natCols = resolveColumns(natAoa[0] ?? [], NAT_HEADERS, SHEET_NAMES.nat, issues);
  const validNatTypes: NatType[] = ["static", "dynamic", "pat"];
  const aclNames = new Set(acl.map((a) => a.name));
  const nat: NatEntry[] = [];
  natAoa.slice(1).forEach((row, i) => {
    const [type, localIp, globalIp, poolName, poolStart, poolEnd, poolMask, aclName, description] = natCols.map((c) =>
      norm(row[c]),
    );
    if (!type) return;
    const t = type.toLowerCase();
    if (!validNatTypes.includes(t as NatType)) {
      issues.push({ sheet: SHEET_NAMES.nat, row: i + 2, message: `種別「${type}」は不正です。static/dynamic/pat のいずれかにしてください。`, level: "error" });
    }
    if (t === "static" && (!localIp || !globalIp)) {
      issues.push({ sheet: SHEET_NAMES.nat, row: i + 2, message: "static種別には内部ローカルIP・内部グローバルIPが必須です。", level: "error" });
    }
    if ((t === "dynamic" || t === "pat") && !aclName) {
      issues.push({ sheet: SHEET_NAMES.nat, row: i + 2, message: "dynamic/pat種別には参照ACL名が必須です。", level: "error" });
    }
    if (aclName && !aclNames.has(aclName)) {
      issues.push({ sheet: SHEET_NAMES.nat, row: i + 2, message: `参照ACL名「${aclName}」が「ACL」シートに見つかりません。`, level: "error" });
    }
    nat.push({
      type: (validNatTypes.includes(t as NatType) ? t : "static") as NatType,
      localIp,
      globalIp,
      poolName,
      poolStart,
      poolEnd,
      poolMask,
      aclName,
      description,
    });
  });

  for (const entry of interfaces) {
    if (entry.aclIn && !aclNames.has(entry.aclIn)) {
      issues.push({ sheet: SHEET_NAMES.interfaces, message: `${entry.name}: ACL(in)「${entry.aclIn}」が「ACL」シートに見つかりません。`, level: "error" });
    }
    if (entry.aclOut && !aclNames.has(entry.aclOut)) {
      issues.push({ sheet: SHEET_NAMES.interfaces, message: `${entry.name}: ACL(out)「${entry.aclOut}」が「ACL」シートに見つかりません。`, level: "error" });
    }
  }

  const data: ParameterSheet = { deviceId, basic, common, vlans, interfaces, routing, topology, acl, nat };

  return { data, issues };
};
