// IronTrack Automated Test Suite
// Verifies food database math, API endpoints, static assets, and Safari 15 compatibility

const fs = require('fs');
const path = require('path');

async function runTests() {
  console.log('🧪 Starting IronTrack Automated Test Suite...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  // --- 1. Test Static Files Exist ---
  console.log('[1] Checking Project Files & Static Assets...');
  const expectedFiles = [
    'public/index.html',
    'public/css/style.css',
    'public/js/foodData.js',
    'public/js/db.js',
    'public/js/progress.js',
    'public/js/scanner.js',
    'public/js/pwa.js',
    'public/js/app.js',
    'public/manifest.json',
    'public/sw.js',
    'public/icons/icon-192.png',
    'public/icons/icon-512.png',
    'public/icons/apple-touch-icon.png',
    'server.js',
    '.env',
    '.env.example'
  ];

  for (const f of expectedFiles) {
    const exists = fs.existsSync(path.join(__dirname, f));
    assert(exists, `File exists: ${f}`);
  }

  // --- 2. Test Food Database Integrity ---
  console.log('\n[2] Testing Curated Food Database (foodData.js)...');
  const foodDataContent = fs.readFileSync(path.join(__dirname, 'public/js/foodData.js'), 'utf8');

  // Evaluate foodData.js in sandbox
  const sandbox = {};
  const evalFunc = new Function('window', foodDataContent);
  evalFunc(sandbox);

  const db = sandbox.FOOD_DATABASE;
  const calcNutrients = sandbox.calculateNutrients;
  const searchFoods = sandbox.searchFoods;

  assert(Array.isArray(db) && db.length >= 20, `Loaded ${db ? db.length : 0} verified food items`);

  // Check specific requested Filipino foods
  const filipinoKeys = ['chicken', 'rice', 'egg', 'tuna', 'bangus', 'pandesal', 'taho', 'milk', 'banana'];
  for (const key of filipinoKeys) {
    const found = db.some(item =>
      item.name.toLowerCase().includes(key) ||
      (item.tags && item.tags.some(t => t.includes(key)))
    );
    assert(found, `Database contains staple: "${key}"`);
  }

  // Test Portion Math
  const chicken = db.find(item => item.id === 'food_chicken_breast_cooked');
  assert(Boolean(chicken), 'Found Cooked Chicken Breast');
  if (chicken) {
    // 200g should double nutrients from 100g base (165 cal -> 330 cal, 31g pro -> 62g pro)
    const n200 = calcNutrients(chicken, 200, 'g');
    assert(n200.calories === 330, `200g chicken calories is 330 (got ${n200.calories})`);
    assert(n200.protein === 62.0, `200g chicken protein is 62.0g (got ${n200.protein}g)`);

    // 1 medium breast unit (factor: 160g)
    const n1Breast = calcNutrients(chicken, 1, 'breast');
    assert(n1Breast.calories === 264, `1 medium breast (160g) is 264 kcal (got ${n1Breast.calories})`);
    assert(n1Breast.protein === 49.6, `1 medium breast is 49.6g protein (got ${n1Breast.protein})`);
  }

  // Test Search functionality
  const adoboSearch = searchFoods('adobo', []);
  assert(adoboSearch.length > 0, `Search for "adobo" returned ${adoboSearch.length} item(s)`);

  const sagingSearch = searchFoods('saging', []);
  assert(sagingSearch.length > 0, `Search for "saging" returned ${sagingSearch.length} item(s)`);

  // --- 3. Test HTTP Server Endpoints ---
  console.log('\n[3] Testing Live Server Endpoints...');
  try {
    const statusRes = await fetch('http://localhost:3000/api/status');
    assert(statusRes.status === 200, `/api/status returned HTTP 200`);
    const statusData = await statusRes.json();
    assert(statusData.status === 'ok', `/api/status payload status is "ok"`);
    assert(typeof statusData.aiConfigured === 'boolean', `aiConfigured is boolean (${statusData.aiConfigured})`);
  } catch (err) {
    assert(false, `/api/status fetch failed: ${err.message}`);
  }

  try {
    // Test /api/scan with no image (should return HTTP 400 NO_IMAGE)
    const scanRes = await fetch('http://localhost:3000/api/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    assert(scanRes.status === 400, `/api/scan without image returned HTTP 400`);
    const scanData = await scanRes.json();
    assert(scanData.error === 'NO_IMAGE', `/api/scan error is "NO_IMAGE"`);
  } catch (err) {
    assert(false, `/api/scan fetch failed: ${err.message}`);
  }

  try {
    // Test static index.html and headers
    const indexRes = await fetch('http://localhost:3000/');
    assert(indexRes.status === 200, `Index route returned HTTP 200`);
    const htmlText = await indexRes.text();
    assert(htmlText.includes('IronTrack'), `index.html contains app title "IronTrack"`);
    assert(htmlText.includes('apple-mobile-web-app-capable'), `index.html contains iOS PWA standalone meta tag`);
    assert(htmlText.includes('viewport-fit=cover'), `index.html includes safe-area viewport-fit=cover`);
  } catch (err) {
    assert(false, `index.html fetch failed: ${err.message}`);
  }

  try {
    // Test PWA manifest
    const manifestRes = await fetch('http://localhost:3000/manifest.json');
    assert(manifestRes.status === 200, `manifest.json returned HTTP 200`);
    const manifestData = await manifestRes.json();
    assert(manifestData.display === 'standalone', `manifest.json display is "standalone"`);
  } catch (err) {
    assert(false, `manifest.json fetch failed: ${err.message}`);
  }

  try {
    // Test Service Worker
    const swRes = await fetch('http://localhost:3000/sw.js');
    assert(swRes.status === 200, `sw.js returned HTTP 200`);
    assert(swRes.headers.get('service-worker-allowed') === '/', `sw.js has Service-Worker-Allowed header`);
  } catch (err) {
    assert(false, `sw.js fetch failed: ${err.message}`);
  }

  // --- 4. Safari 15 Compatibility Checks ---
  console.log('\n[4] Validating Safari on iOS 15 Compatibility...');
  const clientJsFiles = [
    'public/js/foodData.js',
    'public/js/db.js',
    'public/js/progress.js',
    'public/js/scanner.js',
    'public/js/pwa.js',
    'public/js/app.js'
  ];

  for (const jsFile of clientJsFiles) {
    const code = fs.readFileSync(path.join(__dirname, jsFile), 'utf8');
    // Ensure no unsupported syntax like lookbehind regexes that fail on older Safari versions
    assert(!code.includes('(?<='), `${jsFile} does not contain risky regex lookbehinds`);
    // Ensure standard ID generation has fallback if crypto.randomUUID is not defined
    if (jsFile.includes('db.js')) {
      assert(code.includes('Date.now()'), `db.js has safe fallback for iOS 15 UUID generation`);
    }
  }

  // Check CSS for 16px input font size to prevent iOS Safari auto-zoom
  const cssCode = fs.readFileSync(path.join(__dirname, 'public/css/style.css'), 'utf8');
  assert(cssCode.includes('font-size: 16px'), `style.css enforces 16px inputs to disable iOS Safari zoom`);
  assert(cssCode.includes('safe-area-inset'), `style.css supports env(safe-area-inset-*) for iPhone displays`);

  console.log('\n===============================================');
  console.log(`🎉 TEST SUMMARY: ${passed} Passed, ${failed} Failed`);
  console.log('===============================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
