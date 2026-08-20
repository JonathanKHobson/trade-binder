import type { BinderData } from "./types";

type CompressedCatalogue = {
  path: string;
  compression: "gzip";
  format: "json";
};

type OfficialDataManifest = BinderData & {
  compressedCatalogue?: CompressedCatalogue;
};

async function responseJson<T>(url: URL, message: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(message);
  return response.json() as Promise<T>;
}

/**
 * Loads either the legacy inline snapshot or the generated gzip catalogue.
 * The compact manifest keeps the public repository and initial Pages request
 * small while preserving the exact same BinderData contract for the UI.
 */
export async function loadOfficialBinderData(manifestUrl: URL): Promise<BinderData> {
  const manifest = await responseJson<OfficialDataManifest>(manifestUrl, "Unable to load official cards");
  const compressed = manifest.compressedCatalogue;
  if (!compressed) return manifest;
  if (compressed.compression !== "gzip" || compressed.format !== "json" || typeof DecompressionStream === "undefined") {
    throw new Error("This browser cannot read the official-card catalogue.");
  }

  const catalogueUrl = new URL(compressed.path, manifestUrl);
  const response = await fetch(catalogueUrl);
  if (!response.ok || !response.body) throw new Error("Unable to load official cards");
  return new Response(response.body.pipeThrough(new DecompressionStream("gzip"))).json() as Promise<BinderData>;
}
