import { PHP_FILES } from "./src/phpCodeTemplates";
import * as fs from "fs";
import * as path from "path";

const targetDir = path.join(process.cwd(), "php-wamp");

console.log("🚀 Extraction des fichiers PHP pour WAMP dans le dossier 'php-wamp'...");

if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

for (const [filePath, content] of Object.entries(PHP_FILES)) {
  const fullPath = path.join(targetDir, filePath);
  const dirName = path.dirname(fullPath);

  if (!fs.existsSync(dirName)) {
    fs.mkdirSync(dirName, { recursive: true });
  }

  fs.writeFileSync(fullPath, content, "utf8");
  console.log(`✅ Fichier créé : php-wamp/${filePath}`);
}

console.log("\n🎉 Extraction terminée ! Tous les fichiers PHP et SQL sont disponibles dans le dossier 'php-wamp'.");
console.log("Vous pouvez maintenant copier le contenu de ce dossier dans votre dossier 'www' de WAMP (ex: C:/wamp64/www/gestion_scolaire/).");
