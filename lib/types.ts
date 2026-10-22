export type InterfaceMode = "access" | "trunk" | "routed" | "unused";
export type RemoteDeviceType = "switch" | "router" | "pc" | "server" | "ap" | "other";
export type RoutingType = "static" | "ospf" | "eigrp";

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

export type ParameterSheet = {
  deviceId: string;
  basic: BasicInfo;
  common: CommonSettings;
  vlans: VlanEntry[];
  interfaces: InterfaceEntry[];
  routing: RoutingEntry[];
  topology: TopologyLink[];
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
