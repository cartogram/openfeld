import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const I18N_DIR = resolve(__dirname, "../src/i18n");

// Add target languages here to auto-translate
const TARGET_LANGUAGES = ["DE"];

const DEEPL_API_URL = "https://api-free.deepl.com/v2/translate";

// --- Parsing and generation ---

export function parseTranslationFile(content: string): Record<string, string> {
  const result: Record<string, string> = {};
  const regex = /(\w+):\s*"((?:[^"\\]|\\.)*)"/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    result[match[1]] = match[2].replace(/\\"/g, '"');
  }
  return result;
}

export function generateTranslationFile(
  translations: Record<string, string>,
  keyOrder: string[],
): string {
  const lines = keyOrder
    .filter((key) => key in translations)
    .map((key) => {
      const value = translations[key].replace(/"/g, '\\"');
      return `  ${key}: "${value}",`;
    });
  return `export default {\n${lines.join("\n")}\n} as const;\n`;
}

// --- Diff detection ---

export function detectChanges(
  oldKeys: Record<string, string>,
  newKeys: Record<string, string>,
): { added: string[]; changed: string[]; removed: string[] } {
  const added: string[] = [];
  const changed: string[] = [];
  const removed: string[] = [];

  for (const key of Object.keys(newKeys)) {
    if (!(key in oldKeys)) {
      added.push(key);
    } else if (oldKeys[key] !== newKeys[key]) {
      changed.push(key);
    }
  }

  for (const key of Object.keys(oldKeys)) {
    if (!(key in newKeys)) {
      removed.push(key);
    }
  }

  return { added, changed, removed };
}

// --- DeepL API ---

export async function translateTexts(
  texts: string[],
  targetLang: string,
  apiKey: string,
): Promise<string[]> {
  if (texts.length === 0) return [];

  const response = await fetch(DEEPL_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `DeepL-Auth-Key ${apiKey}`,
    },
    body: JSON.stringify({
      text: texts,
      source_lang: "EN",
      target_lang: targetLang,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`DeepL API error (${response.status}): ${body}`);
  }

  const data = (await response.json()) as {
    translations: { text: string }[];
  };
  return data.translations.map((t) => t.text);
}

// --- Main logic ---

export interface TranslateResult {
  language: string;
  translated: string[];
  removed: string[];
  filePath: string;
  content: string;
}

export async function translateDiff(options: {
  oldEnContent: string;
  newEnContent: string;
  targetLanguages: string[];
  apiKey: string;
  i18nDir: string;
  langToggleValues?: Record<string, string>;
}): Promise<TranslateResult[]> {
  const { oldEnContent, newEnContent, targetLanguages, apiKey, i18nDir } =
    options;

  const oldKeys = parseTranslationFile(oldEnContent);
  const newKeys = parseTranslationFile(newEnContent);
  const { added, changed, removed } = detectChanges(oldKeys, newKeys);
  const keysToTranslate = [...added, ...changed];

  if (keysToTranslate.length === 0 && removed.length === 0) {
    return [];
  }

  const newKeyOrder = Object.keys(newKeys);
  const results: TranslateResult[] = [];

  for (const lang of targetLanguages) {
    const langCode = lang.toLowerCase();
    const filePath = resolve(i18nDir, `${langCode}.ts`);

    // Load existing translations or start fresh
    let existing: Record<string, string> = {};
    if (existsSync(filePath)) {
      existing = parseTranslationFile(readFileSync(filePath, "utf-8"));
    }

    // Remove deleted keys
    for (const key of removed) {
      delete existing[key];
    }

    // Translate changed/added keys (skip langToggle — it's not translatable)
    const textsToTranslate = keysToTranslate
      .filter((k) => k !== "langToggle")
      .map((k) => newKeys[k]);
    const keysForApi = keysToTranslate.filter((k) => k !== "langToggle");

    if (textsToTranslate.length > 0) {
      const translated = await translateTexts(textsToTranslate, lang, apiKey);
      for (let i = 0; i < keysForApi.length; i++) {
        existing[keysForApi[i]] = translated[i];
      }
    }

    // Handle langToggle separately if it was added/changed
    if (
      keysToTranslate.includes("langToggle") &&
      options.langToggleValues?.[langCode]
    ) {
      existing["langToggle"] = options.langToggleValues[langCode];
    }

    const content = generateTranslationFile(existing, newKeyOrder);
    results.push({
      language: lang,
      translated: keysToTranslate,
      removed,
      filePath,
      content,
    });
  }

  return results;
}

// --- CLI entry point ---

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const apiKey = process.env.DEEPL_API_KEY;

  if (!apiKey) {
    console.error("DEEPL_API_KEY environment variable is required");
    process.exit(1);
  }

  // Read current en.ts
  const newEnPath = resolve(I18N_DIR, "en.ts");
  const newEnContent = readFileSync(newEnPath, "utf-8");

  // Read base en.ts from main branch
  let oldEnContent: string;
  try {
    const { execSync } = await import("node:child_process");
    oldEnContent = execSync("git show origin/main:src/i18n/en.ts", {
      encoding: "utf-8",
    });
  } catch {
    console.log("No base en.ts found on main — treating all keys as new");
    oldEnContent = "export default {} as const;\n";
  }

  const results = await translateDiff({
    oldEnContent,
    newEnContent,
    targetLanguages: TARGET_LANGUAGES,
    apiKey,
    i18nDir: I18N_DIR,
  });

  if (results.length === 0) {
    console.log("No translation changes needed");
    process.exit(0);
  }

  for (const result of results) {
    if (dryRun) {
      console.log(`\n[DRY RUN] Would update ${result.language}:`);
      if (result.translated.length > 0) {
        console.log(`  Translate: ${result.translated.join(", ")}`);
      }
      if (result.removed.length > 0) {
        console.log(`  Remove: ${result.removed.join(", ")}`);
      }
      console.log(`\n${result.content}`);
    } else {
      writeFileSync(result.filePath, result.content);
      console.log(`Updated ${result.filePath}`);
    }
  }

  // Output summary for GitHub Actions
  if (!dryRun) {
    const summary = results
      .map((r) => {
        const items = r.translated.map((k) => `- \`${k}\``).join("\n");
        const removedItems =
          r.removed.length > 0
            ? `\nRemoved:\n${r.removed.map((k) => `- \`${k}\``).join("\n")}`
            : "";
        return `🌐 Auto-translated ${r.translated.length} key(s) to ${r.language} via DeepL:\n${items}${removedItems}`;
      })
      .join("\n\n");
    console.log(
      `\n::set-output name=summary::${summary.replace(/\n/g, "%0A")}`,
    );
  }
}

// Only run main when executed directly
const isDirectRun =
  process.argv[1] &&
  (process.argv[1].endsWith("translate.ts") ||
    process.argv[1].endsWith("translate.mjs"));

if (isDirectRun) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
