import { Router, type IRouter } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { LookupDeviceBody, EvaluateUsedDeviceBody } from "@workspace/api-zod";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");

const POPULAR_DEVICES = [
  { name: "Samsung Galaxy S24 Ultra", brand: "Samsung" },
  { name: "iPhone 15 Pro Max", brand: "Apple" },
  { name: "Xiaomi 14 Pro", brand: "Xiaomi" },
  { name: "Google Pixel 8 Pro", brand: "Google" },
  { name: "OnePlus 12", brand: "OnePlus" },
  { name: "Redmi Note 13 Pro", brand: "Xiaomi" },
  { name: "Samsung Galaxy A55", brand: "Samsung" },
  { name: "Realme GT 6", brand: "Realme" },
  { name: "POCO X6 Pro", brand: "POCO" },
  { name: "Nothing Phone 2", brand: "Nothing" },
];

router.get("/devices/suggestions", async (_req, res): Promise<void> => {
  res.json(POPULAR_DEVICES);
});

router.post("/devices/lookup", async (req, res): Promise<void> => {
  const parsed = LookupDeviceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { query, language = "ar" } = parsed.data;

  req.log.info({ query, language }, "Looking up device");

  const langInstructions: Record<string, { lang: string; official: string; unofficial: string; discontinued: string; notAvailable: string }> = {
    ar: { lang: "Arabic",  official: "رسمي",    unofficial: "غير رسمي", discontinued: "متوقف",       notAvailable: "غير متاح (جهاز Apple)" },
    en: { lang: "English", official: "Official", unofficial: "Unofficial", discontinued: "Discontinued", notAvailable: "Not available (Apple device)" },
    fr: { lang: "French",  official: "Officiel", unofficial: "Non officiel", discontinued: "Abandonné", notAvailable: "Non disponible (appareil Apple)" },
    tr: { lang: "Turkish", official: "Resmi",    unofficial: "Gayri resmi", discontinued: "Durduruldu", notAvailable: "Mevcut değil (Apple cihazı)" },
  };

  const l = langInstructions[language] ?? langInstructions["ar"];

  const prompt = `You are a mobile device expert with deep knowledge of smartphones and tablets, custom ROMs, and custom recoveries.

Given the device name or model number below, respond with a JSON object containing detailed information.

CRITICAL: Respond with valid JSON ONLY. No markdown fences, no explanation, just the raw JSON object.
CRITICAL: All human-readable string values in the JSON (dates, OS names, notes, etc.) must be written in ${l.lang}.

Required JSON structure:
{
  "found": boolean,
  "name": string,
  "brand": string or null,
  "releaseDate": string,
  "os": string,
  "storage": string,
  "ram": string,
  "processorRating": number (1-10),
  "processorName": string or null,
  "latestOfficialOs": string,
  "customRoms": [
    {
      "name": string,
      "androidVersion": string,
      "status": string,
      "maintainer": string or null
    }
  ],
  "customRecoveries": [
    {
      "name": string,
      "isOfficial": boolean,
      "notes": string or null
    }
  ],
  "latestAndroidViaRom": string,
  "notes": string or null
}

Guidelines:
- "found": false if the device is unknown or doesn't exist
- "releaseDate": write the month/year in ${l.lang} (e.g. March 2021)
- "os": Android version + UI skin (e.g. "Android 11 + One UI 3.1") or iOS version
- "storage": all variants (e.g. "128GB / 256GB / 512GB")
- "ram": all variants (e.g. "6GB / 8GB / 12GB")
- "processorRating": 1 (weakest) to 10 (strongest). Be accurate based on real benchmarks.
- "latestOfficialOs": latest official OS the manufacturer released for this device
- "customRoms": list ALL known custom ROMs. status must be one of: "${l.official}" | "${l.unofficial}" | "${l.discontinued}"
- "customRecoveries": TWRP, OrangeFox, SHRP, PitchBlack, etc. isOfficial = true if officially supported by that project
- "latestAndroidViaRom": highest Android version reachable via any custom ROM
- If no custom ROM support: empty arrays, latestAndroidViaRom = latestOfficialOs
- For Apple devices: customRoms=[], customRecoveries=[], latestAndroidViaRom="${l.notAvailable}"

Device to look up: ${query}`;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    const jsonText = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
    const deviceInfo = JSON.parse(jsonText);
    req.log.info({ found: deviceInfo.found }, "Device lookup complete");
    res.json(deviceInfo);
  } catch (err) {
    logger.error({ err }, "Device lookup failed");
    res.status(500).json({ error: "Failed to look up device information" });
  }
});

router.post("/devices/evaluate-used", async (req, res): Promise<void> => {
  const parsed = EvaluateUsedDeviceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const {
    deviceName,
    language = "ar",
    condition,
    storage,
    ram,
    screenCondition,
    batteryHealth,
    isLocked,
    defects,
    askingPrice,
    currency,
  } = parsed.data;

  req.log.info({ deviceName, language }, "Evaluating used device");

  const langMap: Record<string, string> = {
    ar: "Arabic",
    en: "English",
    fr: "French",
    tr: "Turkish",
  };
  const lang = langMap[language ?? "ar"] ?? "Arabic";

  const conditionMap: Record<string, Record<string, string>> = {
    ar: { excellent: "ممتازة", very_good: "جيدة جداً", good: "جيدة", acceptable: "مقبولة", poor: "رديئة" },
    en: { excellent: "Excellent", very_good: "Very Good", good: "Good", acceptable: "Acceptable", poor: "Poor" },
    fr: { excellent: "Excellent", very_good: "Très bien", good: "Bien", acceptable: "Acceptable", poor: "Mauvais" },
    tr: { excellent: "Mükemmel", very_good: "Çok İyi", good: "İyi", acceptable: "Kabul Edilebilir", poor: "Kötü" },
  };

  const screenMap: Record<string, Record<string, string>> = {
    ar: { perfect: "مثالية بدون خدوش", scratches: "بها خدوش خفيفة", cracked: "مكسورة/متشققة", replaced: "تم تغييرها" },
    en: { perfect: "Perfect, no scratches", scratches: "Minor scratches", cracked: "Cracked/broken", replaced: "Replaced" },
    fr: { perfect: "Parfait, sans rayures", scratches: "Légères rayures", cracked: "Écran cassé", replaced: "Remplacé" },
    tr: { perfect: "Mükemmel, çizik yok", scratches: "Hafif çizikler", cracked: "Kırık/çatlak", replaced: "Değiştirildi" },
  };

  const cond = conditionMap[language ?? "ar"]?.[condition] ?? condition;
  const screen = screenCondition ? (screenMap[language ?? "ar"]?.[screenCondition] ?? screenCondition) : null;

  const prompt = `You are an expert used smartphone market analyst. Evaluate the following used device listing and provide a fair price estimate and detailed assessment.

CRITICAL: Respond with valid JSON ONLY. No markdown, no explanation — just the raw JSON.
CRITICAL: All human-readable strings in the response must be written in ${lang}.

Device being evaluated: ${deviceName}
- Storage: ${storage}
- RAM: ${ram}
- Overall condition: ${cond}
${screen ? `- Screen condition: ${screen}` : ""}
${batteryHealth != null ? `- Battery health: ${batteryHealth}%` : ""}
${isLocked != null ? `- SIM locked: ${isLocked ? "Yes" : "No"}` : ""}
${defects ? `- Reported defects/issues: ${defects}` : "- No defects reported"}
${askingPrice != null ? `- Seller's asking price: ${askingPrice} ${currency ?? ""}` : "- No asking price provided"}

Provide a realistic fair market price range based on current used device market (${new Date().getFullYear()}). Use the most commonly used currency in the user's likely region based on language (Arabic→ USD but mention equivalent in local currencies; English→USD; French→EUR; Turkish→TRY).

Respond with this exact JSON structure:
{
  "fairPriceMin": number,
  "fairPriceMax": number,
  "currency": string,
  "dealRating": "excellent" | "good" | "fair" | "overpriced",
  "dealRatingLabel": string (localized),
  "score": number (1-10, overall condition score),
  "verdict": string (2-3 sentence summary in ${lang}),
  "strengths": string[] (positive points about this unit, in ${lang}),
  "weaknesses": string[] (concerns or negative points, in ${lang}),
  "negotiationTips": string[] (3-4 tips to negotiate a better price, in ${lang}),
  "checklistBeforeBuying": string[] (5-7 things to verify before buying, in ${lang})
}

${askingPrice != null ? `Also factor the asking price of ${askingPrice} ${currency ?? ""} into the dealRating: if asking price is within fair range = "fair", below = "good" or "excellent", above = "overpriced".` : "Set dealRating based on overall unit quality only."}`;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    const jsonText = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
    const evaluation = JSON.parse(jsonText);
    req.log.info({ deviceName, dealRating: evaluation.dealRating }, "Used device evaluation complete");
    res.json(evaluation);
  } catch (err) {
    logger.error({ err }, "Used device evaluation failed");
    res.status(500).json({ error: "Failed to evaluate device" });
  }
});

export default router;
