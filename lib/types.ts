export type InterfaceMode = "access" | "trunk" | "routed" | "unused";
export type RemoteDeviceType = "switch" | "router" | "pc" | "server" | "ap" | "other";
export type RoutingType = "static" | "ospf" | "eigrp";
export type AclType = "standard" | "extended";
export type AclAction = "permit" | "deny";
export type AclProtocol = "ip" | "tcp" | "udp" | "icmp";
export type NatType = "static" | "dynamic" | "pat";
export type QosSetting = "trust-cos" | "trust-dscp" | "auto-voip-phone" | "auto-voip-switch" | "";
export type PortSecurityViolation = "shutdown" | "restrict" | "protect" | "";
export type NatDirection = "inside" | "outside" | "";
export type StpMode = "pvst" | "rapid-pvst" | "mst" | "";

export type BasicInfo = {
  hostname: string;
  domainName: string;
  mgmtVlan: string;
  mgmtIp: string;
  mgmtMask: string;
  mgmtGateway: string;
  enableSecret: string;
  localUsername: string;
  localPassword: string;
  timezone: string;
};

export type CommonSettings = {
  snmpRoCommunity: string;
  snmpRwCommunity: string;
  snmpHost: string;
  ntpServer: string;
  syslogServer: string;
  loggingTrapLevel: string;
  bannerMotd: string;
  sshEnabled: boolean;
  httpServerDisabled: boolean;
  consoleTimeoutMin: string;
  vtyTimeoutMin: string;
  stpMode: StpMode;
  qosEnabled: boolean;
  radiusServerIp: string;
  radiusAuthPort: string;
  radiusAcctPort: string;
  radiusKey: string;
};

export type VlanEntry = {
  vlanId: string;
  name: string;
  sviIp: string;
  sviMask: string;
  description: string;
};

export type InterfaceEntry = {
  name: string;
  mode: InterfaceMode;
  accessVlan: string;
  trunkAllowedVlans: string;
  nativeVlan: string;
  ipAddress: string;
  subnetMask: string;
  description: string;
  shutdown: boolean;
  qos: QosSetting;
  stpPortfast: boolean;
  stpBpduGuard: boolean;
  /** 空欄の場合はポートセキュリティ無効 */
  portSecurityMaxMac: string;
  portSecurityViolation: PortSecurityViolation;
  dot1xEnabled: boolean;
  aclIn: string;
  aclOut: string;
  natDirection: NatDirection;
};

export type RoutingEntry = {
  type: RoutingType;
  network: string;
  mask: string;
  nextHop: string;
  outInterface: string;
  ospfProcessId: string;
  ospfArea: string;
  metric: string;
  description: string;
};

export type TopologyLink = {
  localIf: string;
  remoteHost: string;
  remoteType: RemoteDeviceType;
  remoteIf: string;
  note: string;
};

export type AclEntry = {
  name: string;
  type: AclType;
  /** 空欄の場合は番号なし(IOSが自動採番) */
  sequence: string;
  action: AclAction;
  /** standard時は無視 */
  protocol: AclProtocol;
  source: string;
  sourceWildcard: string;
  /** tcp/udp時のみ有効 */
  sourcePort: string;
  /** extended時のみ使用 */
  destination: string;
  destinationWildcard: string;
  /** tcp/udp時のみ有効 */
  destinationPort: string;
  description: string;
};

export type NatEntry = {
  type: NatType;
  /** static時 */
  localIp: string;
  globalIp: string;
  /** dynamic/pat時(任意。省略時はoutsideインターフェース経由のoverloadにフォールバック) */
  poolName: string;
  poolStart: string;
  poolEnd: string;
  poolMask: string;
  /** dynamic/pat時必須 */
  aclName: string;
  description: string;
};

export type ParameterSheet = {
  deviceId: string;
  basic: BasicInfo;
  common: CommonSettings;
  vlans: VlanEntry[];
  interfaces: InterfaceEntry[];
  routing: RoutingEntry[];
  topology: TopologyLink[];
  acl: AclEntry[];
  nat: NatEntry[];
};

export type ValidationIssue = {
  sheet: string;
  row?: number;
  message: string;
  level: "error" | "warning";
};

export type ParseResult = {
  data: ParameterSheet | null;
  issues: ValidationIssue[];
};
