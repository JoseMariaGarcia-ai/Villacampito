/**
 * download-media.mjs — Villa Campito
 *
 * Downloads all the villa's real photos and videos from Manus's CDN
 * (private-us-east-1.manuscdn.com) into client/public/media/, so the site
 * stops depending on Manus's signed URLs (which expire on 2027-02-23).
 *
 * Run this ONCE, with internet access, from the project root:
 *
 *   node scripts/download-media.mjs
 *
 * It reads scripts/manus-media-urls.json and writes each file to the
 * "localPath" indicated there (e.g. client/public/media/exterior/...).
 * client/src/lib/photoUrls.ts already points to those local paths, so no
 * further code changes are needed — just run this before the URLs expire.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

const mappingPath = path.join(__dirname, "manus-media-urls.json");
const mapping = JSON.parse(fs.readFileSync(mappingPath, "utf-8"));

async function downloadOne({ const: name, url, localPath }) {
  const destPath = path.join(projectRoot, "client", "public", localPath);
  await fs.promises.mkdir(path.dirname(destPath), { recursive: true });

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText}`);
  }
  const buffer = Buffer.from(await res.arrayBuffer());
  await fs.promises.writeFile(destPath, buffer);
  return buffer.length;
}

async function main() {
  console.log(`Descargando ${mapping.length} archivos a client/public/media/ ...\n`);

  let ok = 0;
  let failed = 0;

  for (const item of mapping) {
    try {
      const bytes = await downloadOne(item);
      console.log(`OK   ${item.localPath}  (${(bytes / 1024 / 1024).toFixed(2)} MB)`);
      ok++;
    } catch (err) {
      console.error(`FAIL ${item.localPath}  -> ${err.message}`);
      failed++;
    }
  }

  console.log(`\nCompletado: ${ok} ok, ${failed} con error.`);
  if (failed > 0) {
    console.log(
      "\nSi ves errores 403/expired, las URLs firmadas de Manus ya han caducado.\n" +
        "En ese caso, descarga las fotos/vídeos originales desde tu panel de\n" +
        "Manus (o desde tu copia local) y colócalos manualmente en las rutas\n" +
        "indicadas por 'localPath' en scripts/manus-media-urls.json."
    );
    process.exitCode = 1;
  }
}

main();
