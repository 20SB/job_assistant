import express from "express";
import dotenv from "dotenv";
import postgreDb from "./db/index.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.get("/health", (req: any, res: any) => {
    res.send("OK");
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
