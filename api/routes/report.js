import express from "express";
import { db } from "../firebase.js";
import { collection, addDoc, getDocs, serverTimestamp, query, orderBy } from "firebase/firestore";

const router = express.Router();
router.post("/", async (req, res) => {
  try {
    const { lat, lng, captchaToken } = req.body;
    if (!lat || !lng) {
      return res.status(400).json({ error: "Lipsesc coordonatele." });
    }

    if (!captchaToken) {
      return res.status(400).json({ error: "Lipsește token-ul CAPTCHA." });
    }

    const secretKey = process.env.RECAPTCHA_SECRET_KEY;
    const verifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${captchaToken}`;
    
    const captchaVerify = await fetch(verifyUrl, { method: "POST" });
    const captchaData = await captchaVerify.json();

    if (!captchaData.success) {
      return res.status(400).json({ error: "Captcha invalid sau expirat. Reîncearcă." });
    }

    const docRef = await addDoc(collection(db, "reports"), {
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      timestamp: serverTimestamp()
    });

    res.status(200).json({ success: true, id: docRef.id });
  } catch (e) {
    console.error("Eroare Backend POST:", e);
    res.status(500).json({ error: "Eroare la procesarea cererii." });
  }
});
router.get("/", async (req, res) => {
  try {
    const q = query(collection(db, "reports"), orderBy("timestamp", "desc"));
    const querySnapshot = await getDocs(q);
    
    const reports = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      reports.push({ 
        id: doc.id, 
        lat: data.lat, 
        lng: data.lng,
        timestamp: data.timestamp 
      });
    });
    
    res.json(reports);
  } catch (e) {
    console.error("Eroare Backend GET:", e);
    res.status(500).json({ error: "Nu am putut încărca datele de pe hartă." });
  }
});

export default router;