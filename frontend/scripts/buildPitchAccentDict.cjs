/**
 * Build Pitch Accent Dictionary
 *
 * Downloads accent data from Kanjium and converts to optimized JSON format.
 * Source: https://github.com/mifunetoshiro/kanjium
 *
 * Run with: node scripts/buildPitchAccentDict.js
 */

const https = require("https");
const fs = require("fs");
const path = require("path");

const ACCENTS_URL =
  "https://raw.githubusercontent.com/mifunetoshiro/kanjium/master/data/source_files/raw/accents.txt";
const OUTPUT_PATH = path.join(
  __dirname,
  "../public/data/pitch-accent-dict.json"
);
const READINGS_PATH = path.join(
  __dirname,
  "../public/data/kanji-readings.json"
);

/**
 * Download file from URL
 */
function downloadFile(url) {
  return new Promise((resolve, reject) => {
    console.log("Downloading pitch accent data from Kanjium...");

    https
      .get(url, (response) => {
        if (response.statusCode === 301 || response.statusCode === 302) {
          // Follow redirect
          return downloadFile(response.headers.location)
            .then(resolve)
            .catch(reject);
        }

        if (response.statusCode !== 200) {
          reject(new Error(`Failed to download: ${response.statusCode}`));
          return;
        }

        let data = "";
        response.setEncoding("utf8");
        response.on("data", (chunk) => (data += chunk));
        response.on("end", () => resolve(data));
        response.on("error", reject);
      })
      .on("error", reject);
  });
}

/**
 * Parse accent notation to get accent position
 * Kanjium uses various notations like "0", "1", "2", etc.
 * Multiple readings are separated by commas
 */
function parseAccent(accentStr) {
  if (!accentStr || accentStr === "") return 0;

  // Take first accent if multiple exist
  const first = accentStr.split(",")[0].trim();

  // Parse as integer
  const num = parseInt(first, 10);
  return isNaN(num) ? 0 : num;
}

/**
 * Convert katakana to hiragana
 */
function katakanaToHiragana(str) {
  return str.replace(/[\u30A1-\u30F6]/g, (char) => {
    return String.fromCharCode(char.charCodeAt(0) - 0x60);
  });
}

/**
 * Process accent data into dictionary
 * Format: kanji\treading\taccent
 * Returns { accentDict, readingsDict }
 */
function processAccentData(data) {
  const accentDict = {};
  const readingsDict = {}; // kanji -> hiragana reading
  const lines = data.split("\n");
  let processed = 0;
  let skipped = 0;

  for (const line of lines) {
    if (!line.trim()) continue;

    const parts = line.split("\t");
    if (parts.length < 3) {
      skipped++;
      continue;
    }

    const [kanji, reading, accentStr] = parts;
    const accent = parseAccent(accentStr);

    // Convert reading to hiragana
    const hiraganaReading = katakanaToHiragana(reading);

    // Store accent by both kanji and reading
    if (kanji && !accentDict[kanji]) {
      accentDict[kanji] = accent;
    }

    if (hiraganaReading && !accentDict[hiraganaReading]) {
      accentDict[hiraganaReading] = accent;
    }

    // Store kanji -> reading mapping (only if kanji contains actual kanji)
    if (
      kanji &&
      hiraganaReading &&
      /[\u4E00-\u9FAF\u3400-\u4DBF]/.test(kanji)
    ) {
      if (!readingsDict[kanji]) {
        readingsDict[kanji] = hiraganaReading;
      }
    }

    processed++;
  }

  console.log(`Processed ${processed} entries, skipped ${skipped}`);
  return { accentDict, readingsDict };
}

/**
 * Add particles to the dictionary
 */
function addParticles(dict) {
  const particles = [
    "が",
    "を",
    "に",
    "で",
    "と",
    "は",
    "も",
    "や",
    "の",
    "へ",
    "ば",
    "から",
    "まで",
    "より",
    "など",
    "って",
    "けど",
    "けれど",
    "ので",
    "のに",
    "たり",
    "ながら",
    "ばかり",
    "だけ",
    "しか",
    "こそ",
    "さえ",
    "でも",
    "とか",
    "なり",
    "やら",
    "か",
    "ね",
    "よ",
    "わ",
    "ぞ",
    "ぜ",
    "な",
    "かな",
    "かしら",
  ];

  for (const p of particles) {
    dict[p] = -1; // -1 indicates particle (follows previous word's pitch)
  }

  return dict;
}

async function main() {
  try {
    // Download accent data
    const data = await downloadFile(ACCENTS_URL);

    // Process into dictionaries (accent + readings)
    const { accentDict, readingsDict } = processAccentData(data);

    // Add particles to accent dict
    const finalAccentDict = addParticles(accentDict);

    // Ensure output directory exists
    const outputDir = path.dirname(OUTPUT_PATH);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Write accent dictionary
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(finalAccentDict));
    const accentStats = fs.statSync(OUTPUT_PATH);
    console.log(`\nAccent dictionary saved to: ${OUTPUT_PATH}`);
    console.log(`Total accent entries: ${Object.keys(finalAccentDict).length}`);
    console.log(
      `Accent file size: ${(accentStats.size / 1024 / 1024).toFixed(2)} MB`
    );

    // Write readings dictionary
    fs.writeFileSync(READINGS_PATH, JSON.stringify(readingsDict));
    const readingsStats = fs.statSync(READINGS_PATH);
    console.log(`\nReadings dictionary saved to: ${READINGS_PATH}`);
    console.log(`Total reading entries: ${Object.keys(readingsDict).length}`);
    console.log(
      `Readings file size: ${(readingsStats.size / 1024 / 1024).toFixed(2)} MB`
    );
  } catch (error) {
    console.error("Error building pitch accent dictionary:", error);
    process.exit(1);
  }
}

main();
