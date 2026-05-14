import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import aiChatRoutes from "./routes/ai-chat.js";
import reportRoutes from "./routes/report.js"; 

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/ai-chat", aiChatRoutes);
app.use("/api/reports", reportRoutes); 
app.get("/", (req, res) => res.send("API Ambro-Zone rulează!"));
export default app;