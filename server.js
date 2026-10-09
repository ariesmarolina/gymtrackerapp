const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Multer memory storage for direct buffer access
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 } // 15MB max upload
});

// Serve Service Worker with proper headers (do not cache sw.js aggressively)
app.get('/sw.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Service-Worker-Allowed', '/');
  res.sendFile(path.join(__dirname, 'public', 'sw.js'));
});

// Serve static assets from public directory
app.use(express.static(path.join(__dirname, 'public'), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.webmanifest') || filePath.endsWith('manifest.json')) {
      res.setHeader('Content-Type', 'application/manifest+json');
    }
  }
}));

// API Status endpoint: checks if backend AI vision is configured
app.get('/api/status', (req, res) => {
  const hasGemini = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim() !== '');
  const hasOpenAI = Boolean(process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim() !== '');

  res.json({
    status: 'ok',
    aiConfigured: hasGemini || hasOpenAI,
    provider: hasGemini ? 'gemini' : (hasOpenAI ? 'openai' : 'none'),
    message: (hasGemini || hasOpenAI)
      ? 'AI Vision service is active.'
      : 'No AI vision key configured. Please set GEMINI_API_KEY in .env.'
  });
});

// Helper: parse clean JSON from model output
function cleanAndParseJSON(text) {
  if (!text) throw new Error('Empty response from AI vision provider');
  let cleaned = text.trim();
  // Strip markdown code fences if present
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/i, '').replace(/\s*```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }
  // Extract outermost JSON object if model outputs preamble
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }
  return JSON.parse(cleaned.trim());
}

// System prompt for vision analysis
const NUTRITION_SYSTEM_PROMPT = `You are a sports nutritionist and food recognition AI specialized in bodybuilding, fitness nutrition, and Asian/Filipino diets (e.g., chicken breast, white rice, canned tuna, bangus/milkfish, eggs, pandesal, taho, pork sinigang, chicken adobo, beef bistek, monggo, carinderia meals).

Analyze the provided food photo carefully.
Identify visible food items, estimate reasonable gym-oriented portion sizes, and calculate macronutrients (calories, protein, carbohydrates, fat).

Rules:
1. If the image clearly DOES NOT contain food, return:
{
  "summary": "No Food Detected",
  "foods": [],
  "disclaimer": "The image provided does not appear to contain recognizable food items. Please take a clear photo of your meal."
}
2. Break down meal into distinct food items if multiple dishes or components (e.g. rice + chicken + egg) are on the plate.
3. Provide realistic fitness estimates for portions in grams/cups/pieces.
4. Be especially mindful of protein content for gym lifters.
5. Keep estimates realistic and acknowledge that visual estimates are approximate.
6. Return STRICT JSON ONLY without conversational markdown.

JSON Schema to return:
{
  "summary": "Short meal summary, e.g. Grilled Chicken Breast with 1 Cup White Rice",
  "estimatedTotalCalories": 450,
  "estimatedTotalProtein": 42,
  "estimatedTotalCarbs": 48,
  "estimatedTotalFat": 8,
  "foods": [
    {
      "name": "Chicken Breast (Grilled)",
      "serving": "1 breast (approx 160g)",
      "estimatedWeightGrams": 160,
      "calories": 264,
      "protein": 38,
      "carbs": 0,
      "fat": 5,
      "confidence": "high",
      "notes": "Lean cut, grilled without heavy oil"
    },
    {
      "name": "White Rice (Cooked)",
      "serving": "1 cup (approx 160g)",
      "estimatedWeightGrams": 160,
      "calories": 205,
      "protein": 4,
      "carbs": 45,
      "fat": 0.5,
      "confidence": "high",
      "notes": "Standard cooked white rice"
    }
  ],
  "disclaimer": "AI image estimation is approximate. Weight and cooking oils may alter actual calorie and macronutrient values."
}`;

// Call Gemini Vision API
async function callGeminiVision(base64Image, mimeType) {
  const apiKey = process.env.GEMINI_API_KEY;
  // Supported active models for Google Generative AI v1beta
  const preferredModel = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const models = [preferredModel, 'gemini-2.5-flash', 'gemini-flash-latest'];
  // Deduplicate
  const uniqueModels = [...new Set(models)];

  let lastError = null;
  for (const model of uniqueModels) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const payload = {
        contents: [
          {
            parts: [
              { text: NUTRITION_SYSTEM_PROMPT },
              {
                inlineData: {
                  mimeType: mimeType || 'image/jpeg',
                  data: base64Image
                }
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 2500,
          responseMimeType: "application/json"
        }
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errText = await response.text();
        console.warn(`Gemini ${model} HTTP ${response.status}:`, errText);
        // Only try fallback if model not found (404) or temporarily overloaded (503)
        if (response.status === 404 || response.status === 503) {
          lastError = new Error(`Gemini ${model} (${response.status}): ${errText}`);
          continue;
        } else {
          // If 400 (bad key or bad payload), fail immediately with real error
          throw new Error(`Gemini API error (${response.status}): ${errText}`);
        }
      }

      const data = await response.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) throw new Error('No text candidate returned from Gemini vision model');

      return cleanAndParseJSON(rawText);
    } catch (err) {
      lastError = err;
      console.warn(`Attempt with ${model} failed:`, err.message);
      // If it's a parsing error or real API error, don't cascade to deprecated models
      if (!err.message.includes('404') && !err.message.includes('503')) {
        throw err;
      }
    }
  }

  throw lastError || new Error('All Gemini model attempts failed');
}

// Call OpenAI Vision API
async function callOpenAIVision(base64Image, mimeType) {
  const apiKey = process.env.OPENAI_API_KEY;
  const url = 'https://api.openai.com/v1/chat/completions';

  const imageUrl = `data:${mimeType || 'image/jpeg'};base64,${base64Image}`;

  const payload = {
    model: process.env.OPENAI_VISION_MODEL || 'gpt-4o-mini',
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: NUTRITION_SYSTEM_PROMPT
      },
      {
        role: 'user',
        content: [
          { type: 'text', text: 'Identify all food items in this meal, portion estimates, and macronutrients.' },
          { type: 'image_url', image_url: { url: imageUrl, detail: 'low' } }
        ]
      }
    ],
    max_tokens: 1200,
    temperature: 0.2
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenAI error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const rawText = data?.choices?.[0]?.message?.content;
  return cleanAndParseJSON(rawText);
}

// AI Food Scanner Endpoint
app.post('/api/scan', upload.single('image'), async (req, res) => {
  try {
    let base64Image = null;
    let mimeType = 'image/jpeg';

    if (req.file) {
      base64Image = req.file.buffer.toString('base64');
      mimeType = req.file.mimetype || 'image/jpeg';
    } else if (req.body && req.body.imageBase64) {
      const match = req.body.imageBase64.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
      if (match) {
        mimeType = match[1];
        base64Image = match[2];
      } else {
        base64Image = req.body.imageBase64;
      }
    }

    if (!base64Image) {
      return res.status(400).json({
        success: false,
        error: 'NO_IMAGE',
        message: 'No image file or base64 data provided.'
      });
    }

    const hasGemini = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim() !== '');
    const hasOpenAI = Boolean(process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim() !== '');

    if (!hasGemini && !hasOpenAI) {
      return res.status(503).json({
        success: false,
        error: 'NO_API_KEY',
        message: 'AI Vision API key is not configured on the server. Please set GEMINI_API_KEY in your .env file.',
        fallbackAllowed: true
      });
    }

    let parsedResult = null;
    if (hasGemini) {
      parsedResult = await callGeminiVision(base64Image, mimeType);
    } else {
      parsedResult = await callOpenAIVision(base64Image, mimeType);
    }

    // Ensure valid response object
    if (!parsedResult) {
      throw new Error('AI response could not be parsed');
    }

    // If no food detected, return graceful message without server error
    if (!Array.isArray(parsedResult.foods) || parsedResult.foods.length === 0) {
      return res.json({
        success: true,
        summary: parsedResult.summary || 'No Food Detected',
        disclaimer: parsedResult.disclaimer || 'No recognizable food items were found in this photo. Please retake photo or enter manually.',
        estimatedTotals: { calories: 0, protein: 0, carbs: 0, fat: 0 },
        foods: []
      });
    }

    // Calculate/verify totals
    let totalCals = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;

    const sanitizedFoods = parsedResult.foods.map((food, idx) => {
      const c = Math.round(Number(food.calories) || 0);
      const p = Math.round((Number(food.protein) || 0) * 10) / 10;
      const carb = Math.round((Number(food.carbs) || 0) * 10) / 10;
      const f = Math.round((Number(food.fat) || 0) * 10) / 10;

      totalCals += c;
      totalProtein += p;
      totalCarbs += carb;
      totalFat += f;

      return {
        id: 'ai_' + Date.now() + '_' + idx,
        name: food.name || 'Estimated Dish',
        serving: food.serving || '1 portion',
        estimatedWeightGrams: Math.round(Number(food.estimatedWeightGrams) || 100),
        calories: c,
        protein: p,
        carbs: carb,
        fat: f,
        confidence: food.confidence || 'medium',
        notes: food.notes || '',
        isAiEstimate: true
      };
    });

    return res.json({
      success: true,
      summary: parsedResult.summary || 'Detected Meal',
      disclaimer: parsedResult.disclaimer || 'Visual estimates are approximate. Adjust serving sizes as needed.',
      estimatedTotals: {
        calories: Math.round(totalCals),
        protein: Math.round(totalProtein * 10) / 10,
        carbs: Math.round(totalCarbs * 10) / 10,
        fat: Math.round(totalFat * 10) / 10
      },
      foods: sanitizedFoods
    });

  } catch (error) {
    console.error('Error in /api/scan:', error);
    return res.status(500).json({
      success: false,
      error: 'AI_PROCESSING_ERROR',
      message: error.message || 'Failed to analyze food image with AI vision API.',
      fallbackAllowed: true
    });
  }
});

// Fallback route to serve index.html for SPA/PWA deep links (Express 5 compatible)
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`🏋️  Gym Tracker PWA Server running!`);
  console.log(`📱 Local URL: http://localhost:${PORT}`);
  console.log(`📶 Network URL: http://0.0.0.0:${PORT}`);
  console.log(`🔑 AI Scanner: ${process.env.GEMINI_API_KEY ? 'Gemini configured' : (process.env.OPENAI_API_KEY ? 'OpenAI configured' : 'Not configured (Manual entry ready)')}`);
  console.log(`===============================================`);
});
