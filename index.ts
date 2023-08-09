import canvas from "canvas";
import url from "url";
import express from "express";
import { wrapText } from "./src/clip.js";
import { quote } from "./src/quote.js";

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));
const app = express();

const text = "Lorem ipsum dolor sit amet, "
    + "consectetur adipiscing elit. "
    + "Morbi rhoncus dignissim ligula eget gravida. "
    + "Integer nec euismod leo. Quisque pharetra. ";

const bg = await canvas.loadImage("resources/frame/background.png");
const pfp = await canvas.loadImage("resources/frame/profile.png");
const overlay = await canvas.loadImage("resources/frame/transparent_overlay.png")


const buffer = quote(text, bg, pfp, overlay);

app.post("/quote", (req, res) => {
    res.send(buffer);
});

app.listen(4000, () => {
    console.log(`Connected to localhost:4000.`)
});