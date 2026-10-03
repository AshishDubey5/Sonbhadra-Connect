import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
    path: path.resolve(__dirname, "../.env"),
    override: true,
});

const { default: connectDB } = await import("./db/index.js");
const { app } = await import("./app.js");

connectDB()
    .then(() => {
        const port = process.env.PORT || 4242;
        app.listen(port, () => {
            console.log(`Server running on port ${port}`);
        });
    })
    .catch((err) => {
        console.log(`Error in connecting to database`, err);
    });