import "dotenv/config";
import cors from "cors";
import express from "express";

import routes from "./routes/routes.js";

const app = express();

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:3000",
      "https://simatren.cloud",
      "https://fe-simatren.riset-d3rpla.com",
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json({ limit: "20mb" }));

app.get("/", (req, res) => {
  res.status(200).json({
    code: 200,
    message: "Selamat Datang di API S!MATREN",
  });
});

app.use("/api", routes);

export default app;
