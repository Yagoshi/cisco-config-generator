import type { DeviceModel } from "./devices";
import type { AclEntry, InterfaceEntry, NatEntry, ParameterSheet, RoutingEntry, VlanEntry } from "./types";

const line = (indent: number, text: string) => `${" ".repeat(indent)}${text}`;

const section = (title: string): string[] => [`!`, `! --- ${title} ---`];

const maskToWildcard = (mask: string): string | null => {
  const parts = mask.split(".").map(Number);
  if (parts.length !== 4 || parts.some((p) => Number.isNaN(p))) return null;
  return parts.map((p) => 255 - p).join(".");
};

const buildAclCommands = (acl: AclEntry[]): string[] => {
  if (acl.length === 0) return [];
  const out = section("ACL");
  const names = Array.from(new Set(acl.map((a) => a.name)));
  for (const name of names) {
    const entries = acl.filter((a) => a.name === name);
    out.push(`!`, `ip access-list ${entries[0].type} ${name}`);
    for (const e of entries) {
      const seq = e.sequence ? `${e.sequence} ` : "";
      if (e.type === "standard") {
        out.push(line(1, `${seq}${e.action} ${e.source} ${e.sourceWildcard}`));
      } else {
        const isPortAware = e.protocol === "tcp" || e.protocol === "udp";
        const srcPort = isPortAware && e.sourcePort ? ` eq ${e.sourcePort}` : "";
        const dstPort = isPortAware && e.destinationPort ? ` eq ${e.destinationPort}` : "";
        out.push(
          line(
            1,
            `${seq}${e.action} ${e.protocol} ${e.source} ${e.sourceWildcard}${srcPort} ${e.destination} ${e.destinationWildcard}${dstPort}`,
          ),
        );
      }
    }
  }
  return out;
};

const buildNatCommands = (nat: NatEntry[], interfaces: InterfaceEntry[], device: DeviceModel): string[] => {
  if (nat.length === 0 || !device.supportsLayer3) return [];
  const out = section("NAT");
  const outsideInterface = interfaces.find((i) => i.natDirection === "outside");

  for (const n of nat) {
    if (n.type === "static") {
      if (n.localIp && n.globalIp) out.push(`ip nat inside source static ${n.localIp} ${n.globalIp}`);
    } else {
      const hasPool = n.poolName && n.poolStart && n.poolEnd && n.poolMask;
      if (hasPool) out.push(`ip nat pool ${n.poolName} ${n.poolStart} ${n.poolEnd} netmask ${n.poolMask}`);
      if (!n.aclName) continue;
      if (n.type === "dynamic" && hasPool) {
        out.push(`ip nat inside source list ${n.aclName} pool ${n.poolName}`);
      } else if (n.type === "pat") {
        if (hasPool) {
          out.push(`ip nat inside source list ${n.aclName} pool ${n.poolName} overload`);
        } else if (outsideInterface) {
          out.push(`ip nat inside source list ${n.aclName} interface ${outsideInterface.name} overload`);
        }
      }
    }
  }
  return out;
};

const buildVlanCommands = (vlans: VlanEntry[], device: DeviceModel): string[] => {
  if (device.category !== "switch" || vlans.length === 0) return [];
  const out = section("VLAN");
  const svisToCreate = vlans.filter((v) => v.sviIp && v.sviMask);
  if (device.supportsLayer3 && svisToCreate.length > 0) {
    out.push(`!`, `ip routing`);
  }
  for (const v of vlans) {
    out.push(`!`, `vlan ${v.vlanId}`, line(1, `name ${v.name}`));
  }
  for (const v of svisToCreate) {
    if (!device.supportsLayer3) continue;
    out.push(
      `!`,
      `interface Vlan${v.vlanId}`,
      ...(v.description ? [line(1, `description ${v.description}`)] : []),
      line(1, `ip address ${v.sviIp} ${v.sviMask}`),
      line(1, `no shutdown`),
    );
  }
  return out;
};

const buildInterfaceCommands = (interfaces: InterfaceEntry[], device: DeviceModel): string[] => {
  if (interfaces.length === 0) return [];
  const out = section("インターフェース");
  const isSwitch = device.category === "switch";

  for (const entry of interfaces) {
    let mode = entry.mode;
    // ルーターにはswitchportの概念がないため、access/trunkはrouted相当として扱う
    if (!isSwitch && (mode === "access" || mode === "trunk")) {
      mode = entry.ipAddress ? "routed" : "unused";
    }

    if (mode === "unused") {
      out.push(
        `!`,
        `interface ${entry.name}`,
        line(1, `description ${entry.description || "Unused"}`),
        line(1, `shutdown`),
      );
      continue;
    }

    const body: string[] = [`!`, `interface ${entry.name}`];
    if (entry.description) body.push(line(1, `description ${entry.description}`));

    if (mode === "access") {
      body.push(line(1, `switchport mode access`));
      if (entry.accessVlan) body.push(line(1, `switchport access vlan ${entry.accessVlan}`));
    } else if (mode === "trunk") {
      body.push(line(1, `switchport mode trunk`));
      if (entry.trunkAllowedVlans) body.push(line(1, `switchport trunk allowed vlan ${entry.trunkAllowedVlans}`));
      if (entry.nativeVlan) body.push(line(1, `switchport trunk native vlan ${entry.nativeVlan}`));
    } else if (mode === "routed") {
      if (isSwitch) body.push(line(1, `no switchport`));
      if (entry.ipAddress && entry.subnetMask) {
        body.push(line(1, `ip address ${entry.ipAddress} ${entry.subnetMask}`));
      }
    }

    if (isSwitch && entry.qos === "trust-cos") body.push(line(1, `mls qos trust cos`));
    else if (isSwitch && entry.qos === "trust-dscp") body.push(line(1, `mls qos trust dscp`));
    else if (isSwitch && entry.qos === "auto-voip-phone") body.push(line(1, `auto qos voip cisco-phone`));
    else if (isSwitch && entry.qos === "auto-voip-switch") body.push(line(1, `auto qos voip cisco-switch`));

    if (isSwitch && entry.stpPortfast) body.push(line(1, `spanning-tree portfast`));
    if (isSwitch && entry.stpBpduGuard) body.push(line(1, `spanning-tree bpduguard enable`));

    if (isSwitch && entry.portSecurityMaxMac) {
      body.push(
        line(1, `switchport port-security`),
        line(1, `switchport port-security maximum ${entry.portSecurityMaxMac}`),
        line(1, `switchport port-security mac-address sticky`),
      );
      if (entry.portSecurityViolation) {
        body.push(line(1, `switchport port-security violation ${entry.portSecurityViolation}`));
      }
    }

    if (isSwitch && entry.dot1xEnabled) {
      body.push(line(1, `authentication port-control auto`), line(1, `dot1x pae authenticator`));
    }

    if (entry.aclIn) body.push(line(1, `ip access-group ${entry.aclIn} in`));
    if (entry.aclOut) body.push(line(1, `ip access-group ${entry.aclOut} out`));

    if (entry.natDirection === "inside") body.push(line(1, `ip nat inside`));
    else if (entry.natDirection === "outside") body.push(line(1, `ip nat outside`));

    body.push(line(1, entry.shutdown ? `shutdown` : `no shutdown`));
    out.push(...body);
  }
  return out;
};

const buildRoutingCommands = (routing: RoutingEntry[]): string[] => {
  if (routing.length === 0) return [];
  const out = section("ルーティング");

  const staticRoutes = routing.filter((r) => r.type === "static");
  for (const r of staticRoutes) {
    const target = r.nextHop || r.outInterface;
    if (!r.network || !r.mask || !target) continue;
    out.push(`ip route ${r.network} ${r.mask} ${target}${r.metric ? ` ${r.metric}` : ""}`);
  }

  const ospfRoutes = routing.filter((r) => r.type === "ospf" && r.ospfProcessId);
  const ospfProcesses = Array.from(new Set(ospfRoutes.map((r) => r.ospfProcessId)));
  for (const processId of ospfProcesses) {
    out.push(`!`, `router ospf ${processId}`);
    for (const r of ospfRoutes.filter((r) => r.ospfProcessId === processId)) {
      const wildcard = r.mask ? maskToWildcard(r.mask) : null;
      if (!r.network || !wildcard) continue;
      out.push(line(1, `network ${r.network} ${wildcard} area ${r.ospfArea || 0}`));
    }
  }

  const eigrpRoutes = routing.filter((r) => r.type === "eigrp" && r.ospfProcessId);
  const eigrpAsNumbers = Array.from(new Set(eigrpRoutes.map((r) => r.ospfProcessId)));
  for (const asNumber of eigrpAsNumbers) {
    out.push(`!`, `router eigrp ${asNumber}`);
    for (const r of eigrpRoutes.filter((r) => r.ospfProcessId === asNumber)) {
      if (!r.network) continue;
      out.push(line(1, `network ${r.network}${r.mask ? ` ${maskToWildcard(r.mask) ?? ""}` : ""}`));
    }
  }

  return out;
};

export const generateConfig = (params: ParameterSheet, device: DeviceModel): string => {
  const { basic, common, vlans, interfaces, routing, acl, nat } = params;
  const isSwitch = device.category === "switch";
  const lines: string[] = [];

  lines.push(`! ${device.series} (${device.model}) 設定コマンド`);
  lines.push(`! 生成日時: ${new Date().toLocaleString("ja-JP")}`);
  lines.push(`configure terminal`);

  lines.push(...section("基本情報"));
  if (basic.hostname) lines.push(`hostname ${basic.hostname}`);
  if (basic.domainName) lines.push(`ip domain-name ${basic.domainName}`);
  if (basic.enableSecret) lines.push(`enable secret ${basic.enableSecret}`);
  if (basic.localUsername) {
    lines.push(`username ${basic.localUsername} privilege 15 secret ${basic.localPassword || basic.enableSecret}`);
  }
  if (basic.timezone) lines.push(`clock timezone ${basic.timezone} 9`);

  const hasDefaultRoute = routing.some((r) => r.type === "static" && r.network === "0.0.0.0" && r.mask === "0.0.0.0");
  if (basic.mgmtGateway && !hasDefaultRoute) {
    if (device.supportsLayer3) {
      lines.push(`ip route 0.0.0.0 0.0.0.0 ${basic.mgmtGateway}`);
    } else {
      lines.push(`ip default-gateway ${basic.mgmtGateway}`);
    }
  }

  lines.push(...section("共通設定"));
  if (common.httpServerDisabled) {
    lines.push(`no ip http server`, `no ip http secure-server`);
  }
  if (common.sshEnabled) {
    lines.push(`ip ssh version 2`);
  }
  if (common.bannerMotd) {
    lines.push(`banner motd ^C${common.bannerMotd}^C`);
  }
  if (common.snmpRoCommunity) lines.push(`snmp-server community ${common.snmpRoCommunity} RO`);
  if (common.snmpRwCommunity) lines.push(`snmp-server community ${common.snmpRwCommunity} RW`);
  if (common.snmpHost) {
    lines.push(`snmp-server host ${common.snmpHost} version 2c ${common.snmpRoCommunity || common.snmpRwCommunity || "public"}`);
  }
  if (common.ntpServer) lines.push(`ntp server ${common.ntpServer}`);
  if (common.syslogServer) {
    lines.push(`logging host ${common.syslogServer}`, `logging trap ${common.loggingTrapLevel}`);
  }
  if (isSwitch && common.stpMode) {
    lines.push(`spanning-tree mode ${common.stpMode}`);
  }
  if (isSwitch && common.qosEnabled) {
    lines.push(`mls qos`);
  }
  const dot1xInUse = interfaces.some((i) => i.dot1xEnabled);
  if (isSwitch && (dot1xInUse || common.radiusServerIp)) {
    lines.push(
      `!`,
      `aaa new-model`,
      `aaa authentication dot1x default group radius`,
      `dot1x system-auth-control`,
    );
    if (common.radiusServerIp) {
      lines.push(
        `!`,
        `radius server RADIUS-SERVER1`,
        line(1, `address ipv4 ${common.radiusServerIp} auth-port ${common.radiusAuthPort} acct-port ${common.radiusAcctPort}`),
        ...(common.radiusKey ? [line(1, `key ${common.radiusKey}`)] : []),
      );
    }
  }
  lines.push(
    `!`,
    `line con 0`,
    line(1, `exec-timeout ${common.consoleTimeoutMin} 0`),
    `!`,
    `line vty 0 15`,
    line(1, `exec-timeout ${common.vtyTimeoutMin} 0`),
    line(1, `login local`),
    ...(common.sshEnabled ? [line(1, `transport input ssh`)] : []),
  );

  lines.push(...buildAclCommands(acl));
  lines.push(...buildNatCommands(nat, interfaces, device));
  lines.push(...buildVlanCommands(vlans, device));
  lines.push(...buildInterfaceCommands(interfaces, device));
  lines.push(...buildRoutingCommands(routing));

  lines.push(`!`, `end`, `write memory`);

  return lines.join("\n");
};
