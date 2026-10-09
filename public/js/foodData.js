// IronTrack Curated Food Database
// High-Protein Gym Staples & Filipino Carinderia Classics
// All nutrients are calibrated to the base serving specified

const FOOD_DATABASE = [
  // --- HIGH PROTEIN GYM STAPLES ---
  {
    id: 'food_chicken_breast_cooked',
    name: 'Chicken Breast (Skinless, Cooked/Grilled)',
    category: 'Protein Staples',
    baseServingAmount: 100,
    baseUnit: 'g',
    calories: 165,
    protein: 31.0,
    carbs: 0.0,
    fat: 3.6,
    units: [
      { unit: 'g', factor: 1, label: 'grams (g)' },
      { unit: 'breast', factor: 160, label: 'medium breast (160g)' },
      { unit: 'cup', factor: 140, label: 'diced cup (140g)' }
    ],
    verified: true,
    tags: ['chicken', 'breast', 'protein', 'lean', 'gym', 'meat']
  },
  {
    id: 'food_chicken_breast_raw',
    name: 'Chicken Breast (Raw, Skinless)',
    category: 'Protein Staples',
    baseServingAmount: 100,
    baseUnit: 'g',
    calories: 120,
    protein: 23.5,
    carbs: 0.0,
    fat: 2.5,
    units: [
      { unit: 'g', factor: 1, label: 'grams (g)' },
      { unit: 'breast', factor: 200, label: 'raw breast (200g)' }
    ],
    verified: true,
    tags: ['chicken', 'raw', 'protein', 'lean']
  },
  {
    id: 'food_egg_whole',
    name: 'Egg (Whole, Large)',
    category: 'Protein Staples',
    baseServingAmount: 1,
    baseUnit: 'piece',
    calories: 74,
    protein: 6.3,
    carbs: 0.4,
    fat: 5.0,
    units: [
      { unit: 'piece', factor: 1, label: 'piece / egg (50g)' },
      { unit: 'g', factor: 0.02, label: 'grams (g)' }
    ],
    verified: true,
    tags: ['egg', 'itlog', 'protein', 'breakfast']
  },
  {
    id: 'food_egg_white',
    name: 'Egg Whites (Boiled or Cooked)',
    category: 'Protein Staples',
    baseServingAmount: 1,
    baseUnit: 'piece',
    calories: 17,
    protein: 3.6,
    carbs: 0.2,
    fat: 0.1,
    units: [
      { unit: 'piece', factor: 1, label: 'white of 1 egg (33g)' },
      { unit: 'g', factor: 0.03, label: 'grams (g)' },
      { unit: 'cup', factor: 7.4, label: 'cup liquid whites (243g)' }
    ],
    verified: true,
    tags: ['egg white', 'itlog', 'pure protein', 'lean']
  },
  {
    id: 'food_canned_tuna_water',
    name: 'Canned Tuna in Water (Drained)',
    category: 'Protein Staples',
    baseServingAmount: 1,
    baseUnit: 'can',
    calories: 110,
    protein: 26.0,
    carbs: 0.0,
    fat: 1.0,
    units: [
      { unit: 'can', factor: 1, label: '1 can (130g drained)' },
      { unit: 'g', factor: 0.00769, label: 'grams (g)' }
    ],
    verified: true,
    tags: ['tuna', 'canned tuna', 'century tuna', 'protein', 'seafood']
  },
  {
    id: 'food_canned_tuna_oil',
    name: 'Canned Tuna in Vegetable Oil (Drained)',
    category: 'Protein Staples',
    baseServingAmount: 1,
    baseUnit: 'can',
    calories: 190,
    protein: 24.0,
    carbs: 0.0,
    fat: 10.0,
    units: [
      { unit: 'can', factor: 1, label: '1 can (130g drained)' },
      { unit: 'g', factor: 0.00769, label: 'grams (g)' }
    ],
    verified: true,
    tags: ['tuna', 'oil', 'century tuna', 'san marino']
  },
  {
    id: 'food_bangus_grilled',
    name: 'Bangus / Milkfish (Grilled, Inihaw)',
    category: 'Protein Staples',
    baseServingAmount: 100,
    baseUnit: 'g',
    calories: 160,
    protein: 21.0,
    carbs: 0.0,
    fat: 8.0,
    units: [
      { unit: 'g', factor: 1, label: 'grams (g)' },
      { unit: 'fillet', factor: 150, label: 'half fish / fillet (150g)' },
      { unit: 'piece', factor: 250, label: 'whole small fish (250g)' }
    ],
    verified: true,
    tags: ['bangus', 'milkfish', 'inihaw', 'fish', 'seafood', 'protein']
  },
  {
    id: 'food_daing_na_bangus',
    name: 'Daing na Bangus (Pan-Fried Boneless Milkfish)',
    category: 'Filipino Favorites',
    baseServingAmount: 100,
    baseUnit: 'g',
    calories: 220,
    protein: 22.0,
    carbs: 2.0,
    fat: 14.0,
    units: [
      { unit: 'g', factor: 1, label: 'grams (g)' },
      { unit: 'serving', factor: 120, label: '1 portion (120g)' }
    ],
    verified: true,
    tags: ['daing', 'bangus', 'fried', 'breakfast', 'protein']
  },
  {
    id: 'food_tilapia_steamed_grilled',
    name: 'Tilapia (Steamed or Grilled)',
    category: 'Protein Staples',
    baseServingAmount: 100,
    baseUnit: 'g',
    calories: 128,
    protein: 26.0,
    carbs: 0.0,
    fat: 2.7,
    units: [
      { unit: 'g', factor: 1, label: 'grams (g)' },
      { unit: 'fillet', factor: 115, label: '1 fillet (115g)' },
      { unit: 'piece', factor: 200, label: 'whole fish meat (200g)' }
    ],
    verified: true,
    tags: ['tilapia', 'fish', 'lean', 'protein', 'seafood']
  },
  {
    id: 'food_ground_beef_lean',
    name: 'Lean Ground Beef (90/10 Cooked)',
    category: 'Protein Staples',
    baseServingAmount: 100,
    baseUnit: 'g',
    calories: 215,
    protein: 26.0,
    carbs: 0.0,
    fat: 12.0,
    units: [
      { unit: 'g', factor: 1, label: 'grams (g)' },
      { unit: 'cup', factor: 150, label: '1 cup cooked (150g)' }
    ],
    verified: true,
    tags: ['beef', 'giniling', 'mince', 'protein', 'bulking']
  },
  {
    id: 'food_pork_tenderloin',
    name: 'Pork Tenderloin / Lean Pork Chop (Cooked)',
    category: 'Protein Staples',
    baseServingAmount: 100,
    baseUnit: 'g',
    calories: 165,
    protein: 28.0,
    carbs: 0.0,
    fat: 5.0,
    units: [
      { unit: 'g', factor: 1, label: 'grams (g)' },
      { unit: 'piece', factor: 120, label: '1 chop / portion (120g)' }
    ],
    verified: true,
    tags: ['pork', 'baboy', 'tenderloin', 'lean meat']
  },
  {
    id: 'food_whey_protein',
    name: 'Whey Protein Powder (Standard 1 Scoop)',
    category: 'Protein Staples',
    baseServingAmount: 1,
    baseUnit: 'scoop',
    calories: 125,
    protein: 25.0,
    carbs: 3.0,
    fat: 1.5,
    units: [
      { unit: 'scoop', factor: 1, label: '1 scoop (32g)' },
      { unit: 'g', factor: 0.03125, label: 'grams (g)' }
    ],
    verified: true,
    tags: ['whey', 'protein powder', 'shake', 'supplement', 'isolate']
  },
  {
    id: 'food_tofu_tokwa_firm',
    name: 'Tokwa / Firm Tofu (Steamed / Boiled)',
    category: 'Protein Staples',
    baseServingAmount: 100,
    baseUnit: 'g',
    calories: 85,
    protein: 9.5,
    carbs: 2.0,
    fat: 4.8,
    units: [
      { unit: 'g', factor: 1, label: 'grams (g)' },
      { unit: 'block', factor: 150, label: '1 slice / block (150g)' }
    ],
    verified: true,
    tags: ['tokwa', 'tofu', 'soy', 'vegan protein']
  },
  {
    id: 'food_tofu_tokwa_fried',
    name: 'Tokwa (Fried Cubes)',
    category: 'Protein Staples',
    baseServingAmount: 100,
    baseUnit: 'g',
    calories: 180,
    protein: 11.0,
    carbs: 4.0,
    fat: 13.0,
    units: [
      { unit: 'g', factor: 1, label: 'grams (g)' },
      { unit: 'cup', factor: 120, label: '1 cup fried cubes (120g)' }
    ],
    verified: true,
    tags: ['tokwa', 'fried tofu', 'protein']
  },

  // --- CARBOHYDRATE & BULKING STAPLES ---
  {
    id: 'food_white_rice_cooked',
    name: 'White Rice (Cooked, Kanin)',
    category: 'Carb Staples',
    baseServingAmount: 1,
    baseUnit: 'cup',
    calories: 205,
    protein: 4.2,
    carbs: 45.0,
    fat: 0.4,
    units: [
      { unit: 'cup', factor: 1, label: '1 cup cooked (158g)' },
      { unit: 'g', factor: 0.00633, label: 'grams (g)' },
      { unit: 'plate', factor: 1.5, label: 'heaping cup (240g)' }
    ],
    verified: true,
    tags: ['rice', 'kanin', 'bigas', 'white rice', 'carbs', 'bulking']
  },
  {
    id: 'food_sinangag_garlic_rice',
    name: 'Sinangag (Garlic Fried Rice)',
    category: 'Carb Staples',
    baseServingAmount: 1,
    baseUnit: 'cup',
    calories: 245,
    protein: 4.5,
    carbs: 46.0,
    fat: 5.0,
    units: [
      { unit: 'cup', factor: 1, label: '1 cup (165g)' },
      { unit: 'g', factor: 0.00606, label: 'grams (g)' }
    ],
    verified: true,
    tags: ['sinangag', 'fried rice', 'garlic rice', 'breakfast', 'carbs']
  },
  {
    id: 'food_brown_rice_cooked',
    name: 'Brown Rice (Cooked)',
    category: 'Carb Staples',
    baseServingAmount: 1,
    baseUnit: 'cup',
    calories: 216,
    protein: 5.0,
    carbs: 45.0,
    fat: 1.8,
    units: [
      { unit: 'cup', factor: 1, label: '1 cup cooked (195g)' },
      { unit: 'g', factor: 0.00513, label: 'grams (g)' }
    ],
    verified: true,
    tags: ['brown rice', 'rice', 'fiber', 'carbs']
  },
  {
    id: 'food_pandesal_classic',
    name: 'Pandesal (Filipino Bread Roll)',
    category: 'Carb Staples',
    baseServingAmount: 1,
    baseUnit: 'piece',
    calories: 105,
    protein: 3.2,
    carbs: 20.0,
    fat: 1.2,
    units: [
      { unit: 'piece', factor: 1, label: '1 piece standard (35g)' },
      { unit: 'g', factor: 0.02857, label: 'grams (g)' }
    ],
    verified: true,
    tags: ['pandesal', 'bread', 'breakfast', 'carbs', 'bakery']
  },
  {
    id: 'food_oats_rolled',
    name: 'Rolled Oats / Oatmeal (Dry)',
    category: 'Carb Staples',
    baseServingAmount: 40,
    baseUnit: 'g',
    calories: 150,
    protein: 5.0,
    carbs: 27.0,
    fat: 2.5,
    units: [
      { unit: 'g', factor: 1, label: 'grams dry (g)' },
      { unit: 'cup', factor: 2.0, label: '1/2 cup dry (40g)' },
      { unit: 'serving', factor: 1.0, label: '1 standard bowl (40g dry)' }
    ],
    verified: true,
    tags: ['oats', 'oatmeal', 'quaker', 'breakfast', 'carbs']
  },
  {
    id: 'food_banana_latundan_cavendish',
    name: 'Banana (Saging - Cavendish / Latundan)',
    category: 'Carb Staples',
    baseServingAmount: 1,
    baseUnit: 'piece',
    calories: 105,
    protein: 1.3,
    carbs: 27.0,
    fat: 0.3,
    units: [
      { unit: 'piece', factor: 1, label: '1 medium banana (118g peeled)' },
      { unit: 'g', factor: 0.00847, label: 'grams (g)' }
    ],
    verified: true,
    tags: ['saging', 'banana', 'pre-workout', 'fruit', 'potassium']
  },
  {
    id: 'food_saba_boiled',
    name: 'Saging na Saba (Boiled)',
    category: 'Carb Staples',
    baseServingAmount: 1,
    baseUnit: 'piece',
    calories: 90,
    protein: 1.0,
    carbs: 23.0,
    fat: 0.2,
    units: [
      { unit: 'piece', factor: 1, label: '1 piece boiled saba (80g)' },
      { unit: 'g', factor: 0.0125, label: 'grams (g)' }
    ],
    verified: true,
    tags: ['saba', 'boiled banana', 'saging', 'carbs', 'snack']
  },
  {
    id: 'food_kamote_sweet_potato',
    name: 'Kamote / Sweet Potato (Boiled/Baked)',
    category: 'Carb Staples',
    baseServingAmount: 100,
    baseUnit: 'g',
    calories: 86,
    protein: 1.6,
    carbs: 20.0,
    fat: 0.1,
    units: [
      { unit: 'g', factor: 1, label: 'grams (g)' },
      { unit: 'piece', factor: 150, label: '1 medium root (150g)' }
    ],
    verified: true,
    tags: ['kamote', 'sweet potato', 'carbs', 'complex carbs']
  },
  {
    id: 'food_white_bread_slice',
    name: 'White Bread / Tasty (1 Slice)',
    category: 'Carb Staples',
    baseServingAmount: 1,
    baseUnit: 'piece',
    calories: 75,
    protein: 2.2,
    carbs: 14.0,
    fat: 1.0,
    units: [
      { unit: 'piece', factor: 1, label: '1 slice (28g)' },
      { unit: 'g', factor: 0.0357, label: 'grams (g)' }
    ],
    verified: true,
    tags: ['bread', 'tasty', 'gardenia', 'toast', 'carbs']
  },

  // --- FILIPINO CLASSICS & CARINDERIA MEALS ---
  {
    id: 'food_taho_cup',
    name: 'Taho (Fresh Silken Tofu, Arnibal & Sago)',
    category: 'Filipino Favorites',
    baseServingAmount: 1,
    baseUnit: 'cup',
    calories: 180,
    protein: 8.0,
    carbs: 32.0,
    fat: 2.5,
    units: [
      { unit: 'cup', factor: 1, label: '1 standard cup (~200ml)' },
      { unit: 'large_cup', factor: 1.6, label: 'large cup (~320ml)' }
    ],
    verified: true,
    tags: ['taho', 'tofu', 'arnibal', 'sago', 'breakfast', 'sweet']
  },
  {
    id: 'food_chicken_adobo',
    name: 'Chicken Adobo (Meat + Sauce)',
    category: 'Carinderia Meals',
    baseServingAmount: 1,
    baseUnit: 'serving',
    calories: 320,
    protein: 34.0,
    carbs: 6.0,
    fat: 17.0,
    units: [
      { unit: 'serving', factor: 1, label: '1 carinderia portion (~180g)' },
      { unit: 'cup', factor: 1.2, label: '1 cup adobo (~220g)' },
      { unit: 'g', factor: 0.0055, label: 'grams (g)' }
    ],
    verified: true,
    tags: ['adobo', 'chicken', 'manok', 'ulam', 'carinderia', 'protein']
  },
  {
    id: 'food_pork_adobo',
    name: 'Pork Adobo (Standard Cut)',
    category: 'Carinderia Meals',
    baseServingAmount: 1,
    baseUnit: 'serving',
    calories: 390,
    protein: 28.0,
    carbs: 5.0,
    fat: 29.0,
    units: [
      { unit: 'serving', factor: 1, label: '1 standard portion (~180g)' },
      { unit: 'g', factor: 0.0055, label: 'grams (g)' }
    ],
    verified: true,
    tags: ['adobo', 'baboy', 'pork', 'ulam', 'carinderia']
  },
  {
    id: 'food_sinigang_baboy',
    name: 'Sinigang na Baboy (Pork Tamarind Soup)',
    category: 'Carinderia Meals',
    baseServingAmount: 1,
    baseUnit: 'serving',
    calories: 310,
    protein: 24.0,
    carbs: 8.0,
    fat: 20.0,
    units: [
      { unit: 'serving', factor: 1, label: '1 bowl with meat & veggies (250g)' },
      { unit: 'cup', factor: 0.9, label: '1 cup soup & meat (220g)' }
    ],
    verified: true,
    tags: ['sinigang', 'baboy', 'pork', 'soup', 'ulam', 'tamarind']
  },
  {
    id: 'food_sinigang_bangus',
    name: 'Sinigang na Bangus (Milkfish Soup)',
    category: 'Carinderia Meals',
    baseServingAmount: 1,
    baseUnit: 'serving',
    calories: 220,
    protein: 26.0,
    carbs: 7.0,
    fat: 9.0,
    units: [
      { unit: 'serving', factor: 1, label: '1 bowl with fish & soup (250g)' }
    ],
    verified: true,
    tags: ['sinigang', 'bangus', 'fish', 'soup', 'ulam', 'healthy']
  },
  {
    id: 'food_tinolang_manok',
    name: 'Tinolang Manok (Chicken Ginger Soup with Sayote)',
    category: 'Carinderia Meals',
    baseServingAmount: 1,
    baseUnit: 'serving',
    calories: 240,
    protein: 29.0,
    carbs: 6.0,
    fat: 10.0,
    units: [
      { unit: 'serving', factor: 1, label: '1 bowl chicken & broth (250g)' }
    ],
    verified: true,
    tags: ['tinola', 'manok', 'chicken', 'ginger', 'soup', 'ulam']
  },
  {
    id: 'food_bistek_tagalog',
    name: 'Bistek Tagalog (Beef Steak with Onions)',
    category: 'Carinderia Meals',
    baseServingAmount: 1,
    baseUnit: 'serving',
    calories: 330,
    protein: 30.0,
    carbs: 6.0,
    fat: 20.0,
    units: [
      { unit: 'serving', factor: 1, label: '1 carinderia portion (~160g)' }
    ],
    verified: true,
    tags: ['bistek', 'beef', 'baka', 'ulam', 'protein']
  },
  {
    id: 'food_ginisang_monggo',
    name: 'Ginisang Monggo (Mung Bean Stew with Malunggay)',
    category: 'Carinderia Meals',
    baseServingAmount: 1,
    baseUnit: 'cup',
    calories: 195,
    protein: 13.0,
    carbs: 26.0,
    fat: 4.5,
    units: [
      { unit: 'cup', factor: 1, label: '1 cup stew (~220g)' },
      { unit: 'serving', factor: 1.2, label: '1 carinderia bowl (~260g)' }
    ],
    verified: true,
    tags: ['monggo', 'munggo', 'mung bean', 'malunggay', 'ulam', 'budget']
  },
  {
    id: 'food_chicken_inasal_pecho',
    name: 'Chicken Inasal - Pecho (Breast with Wing)',
    category: 'Filipino Favorites',
    baseServingAmount: 1,
    baseUnit: 'piece',
    calories: 340,
    protein: 44.0,
    carbs: 2.0,
    fat: 16.0,
    units: [
      { unit: 'piece', factor: 1, label: '1 pecho cut (~220g meat)' }
    ],
    verified: true,
    tags: ['inasal', 'chicken', 'pecho', 'grilled', 'mang inasal', 'protein']
  },
  {
    id: 'food_chicken_inasal_paa',
    name: 'Chicken Inasal - Paa (Leg & Thigh)',
    category: 'Filipino Favorites',
    baseServingAmount: 1,
    baseUnit: 'piece',
    calories: 360,
    protein: 32.0,
    carbs: 2.0,
    fat: 24.0,
    units: [
      { unit: 'piece', factor: 1, label: '1 paa cut (~210g meat)' }
    ],
    verified: true,
    tags: ['inasal', 'paa', 'chicken', 'thigh', 'grilled']
  },
  {
    id: 'food_tortang_talong',
    name: 'Tortang Talong (Eggplant Omelet)',
    category: 'Carinderia Meals',
    baseServingAmount: 1,
    baseUnit: 'piece',
    calories: 180,
    protein: 8.5,
    carbs: 9.0,
    fat: 12.0,
    units: [
      { unit: 'piece', factor: 1, label: '1 medium eggplant with 1 egg' }
    ],
    verified: true,
    tags: ['tortang talong', 'talong', 'eggplant', 'egg', 'omelet']
  },
  {
    id: 'food_lugaw_arroz_caldo',
    name: 'Lugaw / Arroz Caldo (with 1 Boiled Egg)',
    category: 'Filipino Favorites',
    baseServingAmount: 1,
    baseUnit: 'bowl',
    calories: 270,
    protein: 14.0,
    carbs: 38.0,
    fat: 6.5,
    units: [
      { unit: 'bowl', factor: 1, label: '1 standard bowl (~350g)' }
    ],
    verified: true,
    tags: ['lugaw', 'arroz caldo', 'porridge', 'egg', 'ginger']
  },
  {
    id: 'food_giniling_pork_beef',
    name: 'Picadillo / Giniling na Baboy o Baka (with carrots/potatoes)',
    category: 'Carinderia Meals',
    baseServingAmount: 1,
    baseUnit: 'serving',
    calories: 290,
    protein: 23.0,
    carbs: 12.0,
    fat: 16.0,
    units: [
      { unit: 'serving', factor: 1, label: '1 serving (~170g)' }
    ],
    verified: true,
    tags: ['giniling', 'picadillo', 'mince', 'carinderia', 'ulam']
  },
  {
    id: 'food_lumpiang_shanghai',
    name: 'Lumpiang Shanghai (Crispy Spring Roll)',
    category: 'Filipino Favorites',
    baseServingAmount: 1,
    baseUnit: 'piece',
    calories: 65,
    protein: 3.5,
    carbs: 4.0,
    fat: 3.8,
    units: [
      { unit: 'piece', factor: 1, label: '1 piece small (~25g)' },
      { unit: 'serving', factor: 4, label: '4 pieces (100g)' }
    ],
    verified: true,
    tags: ['lumpia', 'shanghai', 'fried', 'snack']
  },

  // --- DAIRY, FATS & EXTRAS ---
  {
    id: 'food_cow_milk_whole',
    name: 'Cow Milk (Full Cream Whole Milk)',
    category: 'Dairy & Drinks',
    baseServingAmount: 240,
    baseUnit: 'ml',
    calories: 149,
    protein: 7.7,
    carbs: 11.7,
    fat: 8.0,
    units: [
      { unit: 'ml', factor: 1, label: 'milliliters (ml)' },
      { unit: 'cup', factor: 1, label: '1 standard glass/cup (240ml)' }
    ],
    verified: true,
    tags: ['milk', 'gatas', 'whole milk', 'calcium', 'drink']
  },
  {
    id: 'food_cow_milk_lowfat',
    name: 'Cow Milk (Low Fat / 1% Milk)',
    category: 'Dairy & Drinks',
    baseServingAmount: 240,
    baseUnit: 'ml',
    calories: 102,
    protein: 8.2,
    carbs: 12.2,
    fat: 2.4,
    units: [
      { unit: 'ml', factor: 1, label: 'milliliters (ml)' },
      { unit: 'cup', factor: 1, label: '1 glass (240ml)' }
    ],
    verified: true,
    tags: ['milk', 'low fat', 'gatas', 'drink']
  },
  {
    id: 'food_peanut_butter',
    name: 'Peanut Butter (Regular / Lily\'s / Skippy)',
    category: 'Healthy Fats',
    baseServingAmount: 1,
    baseUnit: 'tbsp',
    calories: 95,
    protein: 4.0,
    carbs: 3.5,
    fat: 8.0,
    units: [
      { unit: 'tbsp', factor: 1, label: '1 tablespoon (16g)' },
      { unit: 'g', factor: 0.0625, label: 'grams (g)' }
    ],
    verified: true,
    tags: ['peanut butter', 'mani', 'bulking', 'fats', 'snack']
  },
  {
    id: 'food_olive_oil_cooking',
    name: 'Cooking Oil / Olive Oil / Canola Oil',
    category: 'Healthy Fats',
    baseServingAmount: 1,
    baseUnit: 'tbsp',
    calories: 120,
    protein: 0.0,
    carbs: 0.0,
    fat: 14.0,
    units: [
      { unit: 'tbsp', factor: 1, label: '1 tablespoon (14g)' },
      { unit: 'tsp', factor: 0.33, label: '1 teaspoon (4.7g)' },
      { unit: 'g', factor: 0.0714, label: 'grams (g)' }
    ],
    verified: true,
    tags: ['oil', 'mantika', 'olive oil', 'fat']
  },
  {
    id: 'food_greek_yogurt_plain',
    name: 'Greek Yogurt (Plain, Low Fat)',
    category: 'Dairy & Drinks',
    baseServingAmount: 150,
    baseUnit: 'g',
    calories: 110,
    protein: 15.0,
    carbs: 6.0,
    fat: 2.5,
    units: [
      { unit: 'g', factor: 1, label: 'grams (g)' },
      { unit: 'cup', factor: 1.13, label: '1 small cup (170g)' }
    ],
    verified: true,
    tags: ['yogurt', 'greek yogurt', 'protein', 'snack']
  }
];

// Helper to calculate nutrients for any serving amount and unit
function calculateNutrients(food, amount, unit) {
  const numericAmount = Math.max(0, parseFloat(amount) || 0);

  // If unit matches baseUnit, calculate linearly
  if (unit === food.baseUnit) {
    const ratio = numericAmount / (food.baseServingAmount || 1);
    return {
      calories: Math.round(food.calories * ratio),
      protein: Math.round(food.protein * ratio * 10) / 10,
      carbs: Math.round(food.carbs * ratio * 10) / 10,
      fat: Math.round(food.fat * ratio * 10) / 10
    };
  }

  // Look for unit conversion factor
  const unitDef = food.units ? food.units.find(u => u.unit === unit) : null;
  let multiplier = 1;

  if (unitDef) {
    multiplier = unitDef.factor;
  }

  // Base ratio
  const ratio = (numericAmount * multiplier) / (food.baseServingAmount || 1);

  return {
    calories: Math.round(food.calories * ratio),
    protein: Math.round(food.protein * ratio * 10) / 10,
    carbs: Math.round(food.carbs * ratio * 10) / 10,
    fat: Math.round(food.fat * ratio * 10) / 10
  };
}

// Search helper (multi-word, fuzzy tags)
function searchFoods(query, customFoods = []) {
  const allFoods = [...customFoods, ...FOOD_DATABASE];
  if (!query || !query.trim()) {
    return allFoods.slice(0, 30);
  }

  const terms = query.toLowerCase().trim().split(/\s+/);
  return allFoods.filter(food => {
    const searchable = [
      food.name,
      food.category || '',
      ...(food.tags || [])
    ].join(' ').toLowerCase();

    return terms.every(term => searchable.includes(term));
  });
}

// Export for browser window
if (typeof window !== 'undefined') {
  window.FOOD_DATABASE = FOOD_DATABASE;
  window.calculateNutrients = calculateNutrients;
  window.searchFoods = searchFoods;
}
