import type { ArchitectureNode, ArchitectureEdge } from "./architecture-types";

export interface ExportOptions {
  format: "png" | "json" | "svg";
  filename?: string;
  backgroundColor?: string;
  scale?: number;
}

export async function exportToPng(
  element: HTMLElement,
  filename = "architecture-diagram"
): Promise<void> {
  const { toPng } = await import("html-to-image");

  try {
    const dataUrl = await toPng(element, {
      backgroundColor: "#0a0a0a",
      pixelRatio: 2,
      cacheBust: true,
      fetchRequestInit: {
        mode: "cors",
        credentials: "omit",
      },
      filter: (node) => {
        if (node instanceof HTMLElement) {
          const classList = node.classList;
          if (
            classList?.contains("react-flow__controls") ||
            classList?.contains("react-flow__minimap") ||
            classList?.contains("react-flow__attribution")
          ) {
            return false;
          }
        }
        return true;
      },
      style: {
        color: "#ffffff",
      },
    });

    const link = document.createElement("a");
    link.download = `${filename}.png`;
    link.href = dataUrl;
    link.click();
  } catch (error) {
    console.error("Failed to export PNG:", error);
    throw error;
  }
}

export async function exportToSvg(
  element: HTMLElement,
  filename = "architecture-diagram"
): Promise<void> {
  const { toSvg } = await import("html-to-image");

  try {
    const dataUrl = await toSvg(element, {
      backgroundColor: "#0a0a0a",
      cacheBust: true,
      fetchRequestInit: {
        mode: "cors",
        credentials: "omit",
      },
      filter: (node) => {
        if (node instanceof HTMLElement) {
          const classList = node.classList;
          if (
            classList?.contains("react-flow__controls") ||
            classList?.contains("react-flow__minimap") ||
            classList?.contains("react-flow__attribution")
          ) {
            return false;
          }
        }
        return true;
      },
      style: {
        color: "#ffffff",
      },
    });

    const link = document.createElement("a");
    link.download = `${filename}.svg`;
    link.href = dataUrl;
    link.click();
  } catch (error) {
    console.error("Failed to export SVG:", error);
    throw error;
  }
}

export function exportToJson(
  nodes: ArchitectureNode[],
  edges: ArchitectureEdge[],
  filename = "architecture-diagram"
): void {
  const data = {
    version: "1.0",
    exportedAt: new Date().toISOString(),
    nodes,
    edges,
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

export function importFromJson(
  jsonString: string
): { nodes: ArchitectureNode[]; edges: ArchitectureEdge[] } | null {
  try {
    const data = JSON.parse(jsonString);
    if (
      data.nodes &&
      Array.isArray(data.nodes) &&
      data.edges &&
      Array.isArray(data.edges)
    ) {
      return { nodes: data.nodes, edges: data.edges };
    }
    return null;
  } catch {
    return null;
  }
}
