import "dotenv/config";
import express from "express";
import cors from "cors";
const app = express();
const PORT = Number(process.env.PORT) || 4000;
app.use(cors({
    origin: "http://localhost:3000",
}));
app.use(express.json());
app.get("/health", (_req, res) => {
    res.status(200).json({
        status: "ok",
        service: "projectvault-api",
    });
});
app.listen(PORT, () => {
    console.log(`ProjectVault API running at http://localhost:${PORT}`);
});
