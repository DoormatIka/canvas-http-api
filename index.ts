import fs from "fs";
import canvas from "canvas";
import url from "url";
import express from "express";
import fetch from "node-fetch";
import { quote } from "./src/quote.js";

const app = express();
const c = canvas.createCanvas(1280, 720);
const ctx = c.getContext("2d");

app.use(express.json());

const text = "Lorem ipsum dolor sit amet, "
    + "consectetur adipiscing elit. "
    + "Morbi rhoncus dignissim ligula eget gravida. "
    + "Integer nec euismod leo. Quisque pharetra. ";
const overlay = await canvas.loadImage("resources/frame/overlay_gradient.png");

app.post("/quote", async (req, res) => {
    const f = await fetch(req.body.url);
    const convert = await fetch("http://localhost:3500/convertwebp", {
        method: "POST",
        body: await f.blob(),
    });
    const pfp = await canvas.loadImage(Buffer.from(await convert.arrayBuffer()));
    const buffer = quote(c, ctx, req.body.text ?? text, req.body.author, pfp, overlay);
    res.send(buffer);
});

app.listen(4000, () => {
    console.log(`Connected to localhost:4000.`)
});