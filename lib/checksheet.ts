import * as XLSX from "xlsx";
import type { DeviceModel } from "./devices";
import type { ParameterSheet } from "./types";

export type CheckItem = {
  category: string;
  item: string;
  command: string;
  expected: string;
};

export const buildCheckItems = (params: ParameterSheet): CheckItem[] => {
  const { basic, common, vlans, interfaces, routing } = params;
  const items: CheckItem[] = [];

  items.push({
    category: "基本情報",
    item: "ホスト名",
    command: "show running-config | include ^hostname",
    expected: `hostname ${basic.hostname}`,
  });
  if (basic.mgmtIp) {
    items.push({
      category: "基本情報",
      item: "管理IPへの疎通",
      command: `ping ${basic.mgmtIp}`,
      expected: "Success rate is 100 percent",
    });
  }
  if (basic.enableSecret) {
    items.push({
      category: "基本情報",
      item: "Enableパスワード設定",
      command: "show running-config | include enable secret",
      expected: "enable secret が設定されていること",
    });
  }

  if (common.ntpServer) {
    items.push({
      category: "共通設定",
      item: "NTP同期状態",
      command: "show ntp status",
      expected: "Clock is synchronized",
    });
  }
  if (common.syslogServer) {
    items.push({
      category: "共通設定",
      item: "Syslog転送先",
      command: "show logging | include Logging to",
      expected: `${common.syslogServer} 宛にログが送信されていること`,
    });
  }
  if (common.snmpRoCommunity || common.snmpRwCommunity) {
    items.push({
      category: "共通設定",
      item: "SNMPコミュニティ",
      command: "show snmp community",
      expected: "設定したコミュニティ名が表示されること",
    });
  }
  if (common.sshEnabled) {
    items.push({
      category: "共通設定",
      item: "SSHサービス",
      command: "show ip ssh",
      expected: "SSH Enabled - version 2.0",
    });
  }

  for (const v of vlans) {
    items.push({
      category: "VLAN",
      item: `VLAN ${v.vlanId} (${v.name}) の作成`,
      command: "show vlan brief",
      expected: `VLAN ${v.vlanId} ${v.name} が active であること`,
    });
    if (v.sviIp) {
      items.push({
        category: "VLAN",
        item: `VLAN ${v.vlanId} SVIのIP疎通`,
        command: `ping ${v.sviIp}`,
        expected: "Success rate is 100 percent",
      });
    }
  }

  for (const i of interfaces.filter((i) => i.mode !== "unused")) {
    items.push({
      category: "インターフェース",
      item: `${i.name} のステータス`,
      command: `show interfaces ${i.name} status`,
      expected: i.shutdown ? "disabled" : "connected",
    });
    if (i.mode === "routed" && i.ipAddress) {
      items.push({
        category: "インターフェース",
        item: `${i.name} のIPアドレス`,
        command: "show ip interface brief",
        expected: `${i.name} ${i.ipAddress} up up`,
      });
    }
  }

  for (const r of routing) {
    if (r.type === "static" && r.network) {
      items.push({
        category: "ルーティング",
        item: `静的経路 ${r.network}/${r.mask}`,
        command: `show ip route ${r.network}`,
        expected: `${r.network} 宛の経路が経路表に存在すること`,
      });
    }
    if (r.type === "ospf" && r.network) {
      items.push({
        category: "ルーティング",
        item: `OSPF近隣関係(エリア${r.ospfArea || 0})`,
        command: "show ip ospf neighbor",
        expected: "State が FULL であること",
      });
    }
    if (r.type === "eigrp" && r.network) {
      items.push({
        category: "ルーティング",
        item: "EIGRP近隣関係",
        command: "show ip eigrp neighbors",
        expected: "近隣ルーターが表示されること",
      });
    }
  }

  return items;
};

export const downloadCheckSheet = (items: CheckItem[], device: DeviceModel, hostname: string) => {
  const headerRows: (string | number)[][] = [
    ["分類", "確認項目", "確認コマンド", "期待値", "結果(OK/NG)", "備考"],
    ...items.map((i) => [i.category, i.item, i.command, i.expected, "", ""]),
  ];
  const ws = XLSX.utils.aoa_to_sheet(headerRows);
  ws["!cols"] = [{ wch: 12 }, { wch: 30 }, { wch: 36 }, { wch: 36 }, { wch: 12 }, { wch: 24 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "チェックシート");
  XLSX.writeFile(wb, `check-sheet_${hostname || device.id}.xlsx`);
};
