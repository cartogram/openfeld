import { describe, test, expect, vi } from "vite-plus/test";
import {
  parseTranslationFile,
  generateTranslationFile,
  detectChanges,
  translateTexts,
  translateDiff,
} from "./translate.js";

// --- parseTranslationFile ---

describe("parseTranslationFile", () => {
  test("parses a standard translation file", () => {
    const content = `export default {
  title: "Hello",
  open: "Open",
  closed: "Closed",
} as const;`;
    expect(parseTranslationFile(content)).toEqual({
      title: "Hello",
      open: "Open",
      closed: "Closed",
    });
  });

  test("handles escaped characters", () => {
    const content = `export default {
  title: "Ist das Tempelhofer Feld ge\\u00f6ffnet?",
} as const;`;
    expect(parseTranslationFile(content)).toEqual({
      title: "Ist das Tempelhofer Feld ge\\u00f6ffnet?",
    });
  });

  test("returns empty object for empty file", () => {
    expect(parseTranslationFile("export default {} as const;\n")).toEqual({});
  });
});

// --- generateTranslationFile ---

describe("generateTranslationFile", () => {
  test("generates correct file format", () => {
    const translations = { title: "Hello", open: "Open" };
    const result = generateTranslationFile(translations, ["title", "open"]);
    expect(result).toBe(
      `export default {\n  title: "Hello",\n  open: "Open",\n} as const;\n`,
    );
  });

  test("respects key order", () => {
    const translations = { b: "B", a: "A", c: "C" };
    const result = generateTranslationFile(translations, ["c", "a", "b"]);
    expect(result).toContain('  c: "C",\n  a: "A",\n  b: "B",');
  });

  test("omits keys not in translations", () => {
    const translations = { a: "A" };
    const result = generateTranslationFile(translations, ["a", "b"]);
    expect(result).not.toContain("b:");
  });

  test("escapes double quotes in values", () => {
    const translations = { title: 'Say "hello"' };
    const result = generateTranslationFile(translations, ["title"]);
    expect(result).toContain('title: "Say \\"hello\\"",');
  });
});

// --- detectChanges ---

describe("detectChanges", () => {
  test("detects added keys", () => {
    const old = { a: "A" };
    const next = { a: "A", b: "B" };
    expect(detectChanges(old, next)).toEqual({
      added: ["b"],
      changed: [],
      removed: [],
    });
  });

  test("detects changed keys", () => {
    const old = { a: "A" };
    const next = { a: "A updated" };
    expect(detectChanges(old, next)).toEqual({
      added: [],
      changed: ["a"],
      removed: [],
    });
  });

  test("detects removed keys", () => {
    const old = { a: "A", b: "B" };
    const next = { a: "A" };
    expect(detectChanges(old, next)).toEqual({
      added: [],
      changed: [],
      removed: ["b"],
    });
  });

  test("handles all change types at once", () => {
    const old = { a: "A", b: "B", c: "C" };
    const next = { a: "A modified", c: "C", d: "D" };
    const result = detectChanges(old, next);
    expect(result.added).toEqual(["d"]);
    expect(result.changed).toEqual(["a"]);
    expect(result.removed).toEqual(["b"]);
  });

  test("returns empty arrays when nothing changed", () => {
    const keys = { a: "A", b: "B" };
    expect(detectChanges(keys, keys)).toEqual({
      added: [],
      changed: [],
      removed: [],
    });
  });
});

// --- translateDiff (with mocked API) ---

describe("translateDiff", () => {
  const mockFetch = vi.fn();

  function mockDeepLResponse(texts: string[]) {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        translations: texts.map((text) => ({ text })),
      }),
    });
  }

  test("translates added and changed keys", async () => {
    vi.stubGlobal("fetch", mockFetch);

    const oldEn = `export default {
  title: "Hello",
} as const;`;

    const newEn = `export default {
  title: "Hello updated",
  subtitle: "World",
} as const;`;

    // added keys come first, then changed — so subtitle (added), title (changed)
    mockDeepLResponse(["Welt", "Hallo aktualisiert"]);

    const results = await translateDiff({
      oldEnContent: oldEn,
      newEnContent: newEn,
      targetLanguages: ["DE"],
      apiKey: "fake-key",
      i18nDir: "/tmp/fake",
    });

    expect(results).toHaveLength(1);
    expect(results[0].translated).toEqual(["subtitle", "title"]);
    expect(results[0].content).toContain('title: "Hallo aktualisiert"');
    expect(results[0].content).toContain('subtitle: "Welt"');

    vi.unstubAllGlobals();
  });

  test("removes deleted keys from target", async () => {
    vi.stubGlobal("fetch", mockFetch);

    const oldEn = `export default {
  title: "Hello",
  old: "Remove me",
} as const;`;

    const newEn = `export default {
  title: "Hello",
} as const;`;

    const results = await translateDiff({
      oldEnContent: oldEn,
      newEnContent: newEn,
      targetLanguages: ["DE"],
      apiKey: "fake-key",
      i18nDir: "/tmp/fake",
    });

    expect(results).toHaveLength(1);
    expect(results[0].removed).toEqual(["old"]);
    expect(results[0].content).not.toContain("old:");

    vi.unstubAllGlobals();
  });

  test("returns empty array when nothing changed", async () => {
    const content = `export default {
  title: "Hello",
} as const;`;

    const results = await translateDiff({
      oldEnContent: content,
      newEnContent: content,
      targetLanguages: ["DE"],
      apiKey: "fake-key",
      i18nDir: "/tmp/fake",
    });

    expect(results).toEqual([]);
  });

  test("translates to multiple languages", async () => {
    vi.stubGlobal("fetch", mockFetch);

    const oldEn = `export default {} as const;`;
    const newEn = `export default {
  title: "Hello",
} as const;`;

    mockDeepLResponse(["Hallo"]);
    mockDeepLResponse(["Bonjour"]);

    const results = await translateDiff({
      oldEnContent: oldEn,
      newEnContent: newEn,
      targetLanguages: ["DE", "FR"],
      apiKey: "fake-key",
      i18nDir: "/tmp/fake",
    });

    expect(results).toHaveLength(2);
    expect(results[0].content).toContain("Hallo");
    expect(results[1].content).toContain("Bonjour");

    vi.unstubAllGlobals();
  });

  test("preserves key order from en.ts", async () => {
    vi.stubGlobal("fetch", mockFetch);

    const oldEn = `export default {} as const;`;
    const newEn = `export default {
  zebra: "Z",
  alpha: "A",
  middle: "M",
} as const;`;

    mockDeepLResponse(["Z-de", "A-de", "M-de"]);

    const results = await translateDiff({
      oldEnContent: oldEn,
      newEnContent: newEn,
      targetLanguages: ["DE"],
      apiKey: "fake-key",
      i18nDir: "/tmp/fake",
    });

    const lines = results[0].content.split("\n");
    const keyLines = lines.filter((l) => l.includes(":"));
    expect(keyLines[0]).toContain("zebra");
    expect(keyLines[1]).toContain("alpha");
    expect(keyLines[2]).toContain("middle");

    vi.unstubAllGlobals();
  });
});

// --- Integration test with real DeepL API ---

describe("DeepL API integration", () => {
  const apiKey = process.env.DEEPL_API_KEY;

  test.skipIf(!apiKey)("translates a string to German", async () => {
    const results = await translateTexts(["Hello"], "DE", apiKey!);
    expect(results).toHaveLength(1);
    expect(results[0]).toBeTruthy();
    expect(results[0].toLowerCase()).toContain("hallo");
  });
});
