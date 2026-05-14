import { createRequire } from "module";
const require = createRequire(import.meta.url);
import path from "path";

let CatBoost;
try {
  const cb = require("catboost");
  CatBoost = cb.CatBoost;
} catch (e) {
  console.error("❌ CatBoost Binary Load Error:", e.message);
}

let modelInstance = null;

export function getSmartRisk(input) {
  if (!CatBoost) return 50;

  try {
    if (!modelInstance) {
      const modelPath = path.resolve(process.cwd(), "model", "model_ambrozie.cbm");
      modelInstance = new CatBoost(modelPath);
      console.log("✅ Model .cbm loaded successfully");
    }
    const features = [
      Number(input.lat || 44.31),
      Number(input.lng || 23.81),
      Number(input.polen || 0),
      Number(input.temp || 0),
      Number(input.umiditate || 0),
      Number(input.vant || 0),
      Number(input.rapoarte || 0)
    ];

    const prediction = modelInstance.predict(features);
    
    const finalValue = Array.isArray(prediction) ? prediction[0] : prediction;

    return Math.round(finalValue * 100);
  } catch (err) {
    console.error("Prediction failed:", err);
    return 52; 
  }
}