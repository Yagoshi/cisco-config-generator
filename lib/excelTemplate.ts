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
import { DeviceModel, listInterfaceOptions } from "./devices";

const autoWidth = (rows: (string | number)[][]) => {
  const widths: number[] = [];
  for (const row of rows) {
    row.forEach((cell, i) => {
      const len = String(cell ?? "").length;
      widths[i] = Math.max(widths[i] ?? 8, Math.min(len + 2, 50));
    });
  }
  return widths.map((w) => ({ wch: w }));
};

/** セルに入力ガイド用のコメント(ノート)を付与する。xlsx(無料版)は書式・条件付き書式は書けないが、コメントは書ける */
const setComment = (ws: XLSX.WorkSheet, addr: string, text: string) => {
  if (!ws[addr]) return;
  ws[addr].c = [{ a: "Cisco Config Studio", t: text }];
};

/** ヘッダー行(1行目)の指定列に、入力ガイド用のコメントをまとめて付与する */
const setHeaderComments = (ws: XLSX.WorkSheet, hints: [col: number, text: string][]) => {
  for (const [col, text] of hints) {
    const addr = XLSX.utils.encode_cell({ r: 0, c: col });
    setComment(ws, addr, text);
  }
};

export const buildTemplateWorkbook = (device: DeviceModel): XLSX.WorkBook => {
  const wb = XLSX.utils.book_new();

  // --- はじめに ---
  const coverRows = [
    ["Cisco Config Studio パラメーターシート"],
    [""],
    [`対象機種: ${device.series} (${device.model})`],
    [""],
    ["このシートの使い方"],
    ["1. 各シートの「値」列・空欄セルに設定値を入力してください。"],
    ["   セル右上に赤い印が付いているところは、クリックすると入力例や注意事項が見られます。"],
    ["2. 「インターフェース」シートは選択した機種の物理ポートが自動で一覧表示されています。"],
    ["   使用しない行はモードを unused のままにしてください。"],
    ["3. 入力が終わったらファイルを保存し、アプリの「アップロード」からこのファイルを読み込んでください。"],
    ["4. 「機器ID」のセルは自動入力されています。編集しないでください。"],
    [""],
    ["※ このファイルはお使いの端末上でのみ処理され、外部には送信されません。"],
  ];
  const coverWs = XLSX.utils.aoa_to_sheet(coverRows);
  coverWs["!cols"] = [{ wch: 90 }];
  XLSX.utils.book_append_sheet(wb, coverWs, SHEET_NAMES.cover);

  // --- 基本情報 ---
  // 「値」列1本だけに入力させ、入力例はその場でホバーして見られるコメントとして埋め込む
  // (以前、別列の「入力例」を見て「すでに入力済み」と誤解されたため、列自体を無くした)
  const basicRows: (string | number)[][] = [["項目", "値(ここに入力してください)"]];
  for (const f of BASIC_FIELDS) {
    basicRows.push([f.label, f.key === "deviceId" ? device.id : ""]);
  }
  const basicWs = XLSX.utils.aoa_to_sheet(basicRows);
  basicWs["!cols"] = autoWidth(basicRows.map((r) => [r[0], String(r[1] ?? "").padEnd(24)]));
  BASIC_FIELDS.forEach((f, i) => {
    const addr = XLSX.utils.encode_cell({ r: i + 1, c: 1 });
    if (f.key === "deviceId") {
      setComment(basicWs, addr, "自動入力されています。編集しないでください。");
    } else if (f.example) {
      setComment(basicWs, addr, `入力例: ${f.example}`);
    }
  });
  XLSX.utils.book_append_sheet(wb, basicWs, SHEET_NAMES.basic);

  // --- 共通設定 ---
  const commonRows: (string | number)[][] = [["項目", "値(ここに入力してください)"]];
  for (const f of COMMON_FIELDS) {
    commonRows.push([f.label, ""]);
  }
  const commonWs = XLSX.utils.aoa_to_sheet(commonRows);
  commonWs["!cols"] = autoWidth(commonRows.map((r) => [r[0], String(r[1] ?? "").padEnd(24)]));
  COMMON_FIELDS.forEach((f, i) => {
    const addr = XLSX.utils.encode_cell({ r: i + 1, c: 1 });
    setComment(commonWs, addr, f.example ? `入力例: ${f.example}` : "任意項目です。不要であれば空欄のままでOKです。");
  });
  XLSX.utils.book_append_sheet(wb, commonWs, SHEET_NAMES.common);

  // --- VLAN ---
  const vlanRows: (string | number)[][] = [[...VLAN_HEADERS]];
  if (device.category === "switch") {
    vlanRows.push(["10", "MGMT", "192.168.10.1", "255.255.255.0", "管理VLAN"]);
    vlanRows.push(["20", "USERS", "192.168.20.1", "255.255.255.0", "ユーザーVLAN"]);
  }
  const vlanWs = XLSX.utils.aoa_to_sheet(vlanRows);
  vlanWs["!cols"] = autoWidth(vlanRows);
  setHeaderComments(vlanWs, [
    [0, "1〜4094の整数で入力してください。"],
    [2, "SVI(VLANにIPを持たせる)が不要な行は空欄のままでOKです。"],
  ]);
  XLSX.utils.book_append_sheet(wb, vlanWs, SHEET_NAMES.vlan);

  // --- インターフェース (機種のポート構成を自動展開) ---
  const ifRows: (string | number)[][] = [[...INTERFACE_HEADERS]];
  for (const name of listInterfaceOptions(device)) {
    ifRows.push([name, "unused", "", "", "", "", "", "", "TRUE"]);
  }
  const ifWs = XLSX.utils.aoa_to_sheet(ifRows);
  ifWs["!cols"] = autoWidth(ifRows);
  setHeaderComments(ifWs, [
    [1, "access / trunk / routed / unused のいずれかを入力してください。\n使わないポートは unused のままでOKです。"],
    [8, "TRUE(シャットダウンする) または FALSE(有効化する) を入力してください。"],
  ]);
  XLSX.utils.book_append_sheet(wb, ifWs, SHEET_NAMES.interfaces);

  // --- ルーティング ---
  const routingRows: (string | number)[][] = [[...ROUTING_HEADERS]];
  routingRows.push(["static", "0.0.0.0", "0.0.0.0", "192.168.10.1", "", "", "", "", "デフォルトルート"]);
  const routingWs = XLSX.utils.aoa_to_sheet(routingRows);
  routingWs["!cols"] = autoWidth(routingRows);
  setHeaderComments(routingWs, [[0, "static / ospf / eigrp のいずれかを入力してください。"]]);
  XLSX.utils.book_append_sheet(wb, routingWs, SHEET_NAMES.routing);

  // --- トポロジー ---
  const topoRows: (string | number)[][] = [[...TOPOLOGY_HEADERS]];
  const firstIf = listInterfaceOptions(device)[0];
  if (firstIf) {
    topoRows.push([firstIf, "SW-ACCESS-01", "switch", "GigabitEthernet1/0/1", "フロア1 アクセススイッチ"]);
  }
  const topoWs = XLSX.utils.aoa_to_sheet(topoRows);
  topoWs["!cols"] = autoWidth(topoRows);
  setHeaderComments(topoWs, [[2, "switch / router / pc / server / ap / other のいずれかを入力してください。"]]);
  XLSX.utils.book_append_sheet(wb, topoWs, SHEET_NAMES.topology);

  return wb;
};

export const downloadTemplate = (device: DeviceModel) => {
  const wb = buildTemplateWorkbook(device);
  const fileName = `parameter-sheet_${device.id}.xlsx`;
  XLSX.writeFile(wb, fileName);
};
