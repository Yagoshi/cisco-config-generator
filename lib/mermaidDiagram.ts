import type { DeviceModel } from "./devices";
import type { ParameterSheet, RemoteDeviceType } from "./types";

const sanitizeId = (value: string) => `N_${value.replace(/[^a-zA-Z0-9_]/g, "_") || "node"}`;
const escapeLabel = (value: string) => value.replace(/"/g, "'");

const typeLabel: Record<RemoteDeviceType, string> = {
  switch: "スイッチ",
  router: "ルーター",
  pc: "PC",
  server: "サーバー",
  ap: "無線AP",
  other: "その他機器",
};

/** ネットワーク機器(中継層)か、末端の端末かでレイヤーを分け、上→下の階層レイアウトにする */
const INFRA_TYPES: RemoteDeviceType[] = ["switch", "router", "ap"];

export const buildMermaidDiagram = (params: ParameterSheet, device: DeviceModel): string => {
  const hostname = params.basic.hostname || device.id;
  const selfLabel = escapeLabel(`${hostname}\\n${device.series}`);

  const lines: string[] = ["graph TD", `  SELF["${selfLabel}"]:::self`];

  const seen = new Map<string, string>();
  const infraNodeIds: string[] = [];
  const terminalNodeIds: string[] = [];

  for (const link of params.topology) {
    if (!link.remoteHost) continue;
    let nodeId = seen.get(link.remoteHost);
    if (!nodeId) {
      nodeId = sanitizeId(link.remoteHost);
      seen.set(link.remoteHost, nodeId);
      const label = escapeLabel(`${link.remoteHost}\\n(${typeLabel[link.remoteType]})`);
      lines.push(`  ${nodeId}["${label}"]:::${link.remoteType}`);
      if (INFRA_TYPES.includes(link.remoteType)) {
        infraNodeIds.push(nodeId);
      } else {
        terminalNodeIds.push(nodeId);
      }
    }
    const edgeLabelParts = [link.localIf, link.remoteIf].filter(Boolean);
    const edgeLabel = edgeLabelParts.length > 0 ? ` -- "${escapeLabel(edgeLabelParts.join(" — "))}" ---` : " ---";
    lines.push(`  SELF${edgeLabel} ${nodeId}`);
  }

  // 端末がネットワーク機器より下段に来るよう、見えない補助リンクで階層を強制する
  if (infraNodeIds.length > 0 && terminalNodeIds.length > 0) {
    const anchor = infraNodeIds[infraNodeIds.length - 1];
    for (const terminalId of terminalNodeIds) {
      lines.push(`  ${anchor} ~~~ ${terminalId}`);
    }
  }

  lines.push(
    "  classDef self fill:#3460fb,stroke:#9db7f9,stroke-width:2px,color:#ffffff,font-weight:bold;",
    "  classDef switch fill:#d9e6ff,stroke:#264af4,color:#0A0E17;",
    "  classDef router fill:#ffe380,stroke:#b78f00,color:#0A0E17;",
    "  classDef pc fill:#e6e6e6,stroke:#767676,color:#0A0E17;",
    "  classDef server fill:#c2e5d1,stroke:#197a4b,color:#0A0E17;",
    "  classDef ap fill:#ecddff,stroke:#6f23d0,color:#0A0E17;",
    "  classDef other fill:#e6e6e6,stroke:#949494,color:#0A0E17;",
  );

  return lines.join("\n");
};
