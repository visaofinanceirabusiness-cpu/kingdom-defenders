// Descarga cada imagen ANTES de armar el PDF y la convierte a data
// URI (base64 embebido) — dejar que @react-pdf/renderer baje las
// imágenes solo durante el layout causaba texto superpuesto e
// imágenes que no llegaban a tiempo (la librería no siempre espera
// bien una descarga lenta en medio del cálculo de posiciones). Con
// la imagen ya resuelta en memoria, el layout es síncrono y estable.
async function descargarComoDataUri(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const contentType = res.headers.get('content-type') ?? 'image/png';
    const buffer = Buffer.from(await res.arrayBuffer());
    return `data:${contentType};base64,${buffer.toString('base64')}`;
  } catch {
    return null;
  }
}

// Recorre todas las urls únicas que aparezcan y las resuelve en
// paralelo — devuelve un mapa url original -> data URI (las que
// fallan simplemente no aparecen, así el PDF se genera igual).
export async function resolverImagenes(urls: (string | undefined)[]): Promise<Record<string, string>> {
  const unicas = [...new Set(urls.filter((u): u is string => Boolean(u)))];
  const resultados = await Promise.all(unicas.map(async (url) => [url, await descargarComoDataUri(url)] as const));

  const mapa: Record<string, string> = {};
  for (const [url, dataUri] of resultados) {
    if (dataUri) mapa[url] = dataUri;
  }
  return mapa;
}
