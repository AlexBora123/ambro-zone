import express from "express";
import { getSmartRisk } from './predict.js';
const router = express.Router();

let chatHistory = [];

router.post("/", async (req, res) => {
  const { prompt, contextData, estePrimul } = req.body;
  const apiKey = process.env.GROQ_API_KEY;
  const riscCalculat = getSmartRisk({
    lat: contextData?.lat,
    lng: contextData?.lng,
    polen: contextData?.pollen || contextData?.ragweed_pollen || 0,
    temp: contextData?.temp || 0,
    umiditate: contextData?.humidity || 0,
    vant: contextData?.windSpeed || 0,
    rapoarte: contextData?.nrRapoarte || 0
});
  const systemPromptInitial = `
Ești Expertul Principal Ambro-Zone, un sistem avansat de monitorizare a calității aerului în Craiova. 
Funcționezi pe o arhitectură hibridă:
1. **Motor Predictiv CatBoost**: Calculează riscul real prin corelarea temperaturii, umidității și vântului cu raportările din Firebase.
2. **Sistem RAG (Retrieval-Augmented Generation)**: Extrage date live pentru a preveni halucinațiile și a oferi recomandări medicale verificate.

CONTEXT TEHNIC ACTUAL:
- Scorul CatBoost: ${riscCalculat}% (Acesta este indicatorul tău suprem de adevăr).
- Date Meteo Live: ${JSON.stringify(contextData)}

BAZA DE DATE MEDICI ALERGOLOGI (Craiova):
- Dr. Magdalena Mihaela Frătoșteanu (Lifemed Art, Bdul Gheorghe Chițu 21)
- Dr. Denisa Dorogan (Lifemed Art)
- Dr. Aura Florincescu-Gheorghe (Clinica Alergologie, Str. Bătrânilor 4)
- Dr. Cristina Oprică-Rușoiu (AlergoClinic, Str. Împăratul Traian 186)
- Dr. Mihaela Voiculescu (Cabinet Alergologie și Imunologie)
- Dr. Liliana Stănescu (Cabinet Alergologie Dr. Stanescu Liliana)

REGULI DE INTERPRETARE:
- Ambrozie (ragweed): 0=absent, 1–10=scăzut, 11–30=moderat, >30=ridicat.
- Dacă polenul măsurat este 0, dar Scorul CatBoost este >50%, explică faptul că factorii meteo (vânt/umiditate) și raportările comunității indică un risc invizibil senzorilor.

FORMAT OBLIGATORIU DE RĂSPUNS:
🌿 **Ambrozie**: [Risc + explicație scurtă]
🌾 **Polen**: [Risc detectat + valoare numerică]
🌦 **Vreme**: [Impactul condițiilor meteo asupra dispersiei]
📊 **Analiză CatBoost**: Scorul predictiv este de ${riscCalculat}% ([Scăzut/Mediu/Ridicat])
💡 **Expertiză RAG**: [Recomandare practică. Dacă riscul e >70%, recomandă un medic specific din listă]
`;

const systemPromptConversatie = `
Ești Expertul Ambro-Zone. Conversăm natural, dar profesional. 
Sistemul tău se bazează pe modelul **CatBoost** (${riscCalculat}% risc calculat) și tehnologia **RAG**.

REGULI DE DIALOG:
- Nu folosi emoji-uri sau formatări rigide. Răspunde liber, în maximum 4-5 rânduri.
- Dacă ești întrebat de medici, oferă detalii despre specialiștii din Craiova menționați în baza ta de date (Frătoșteanu, Dorogan, Florincescu, Oprică, Voiculescu, Stănescu).
- Justifică-ți sfaturile prin tehnologie: "Algoritmul nostru CatBoost a corelat datele de vânt și umiditate, rezultând un risc de ${riscCalculat}%."
- Dacă utilizatorul întreabă "de unde știi?", explică pe scurt că ești un sistem RAG care procesează date meteo și statistice în timp real, nu doar un simplu chatbot.
- Răspunde strict despre: ambrozie, polen, meteo și sănătate respiratorie.
`;

  const messages = [
    { role: "system", content: estePrimul ? systemPromptInitial : systemPromptConversatie }
  ];

  if (contextData) {
    messages.push({ 
      role: "system", 
      content: `DATE METEO ACTUALE: ${JSON.stringify(contextData)}` 
    });
  }

  chatHistory.push({ role: "user", content: prompt });

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [...messages, ...chatHistory],
        temperature: estePrimul ? 0.3 : 0.7
      }),
    });

    const data = await response.json();
    const reply = data.choices[0].message.content;
    
    chatHistory.push({ role: "assistant", content: reply });
    res.json({ reply });
  } catch (err) {
    res.status(500).json({ error: "AI failed" });
  }
});

export default router;