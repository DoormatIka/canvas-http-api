import fs, { readFileSync, writeFileSync } from "fs";
import canvas from "canvas";
import url from "url";
import express from "express";
import fetch from "node-fetch";
import { quote, quoteAttachment } from "./src/quote.js";
import { convertToPNG } from "./src/convert.js";

const app = express();

app.use(express.json({ limit: "20mb" }));

const text = "Lorem ipsum dolor sit amet, "
    + "consectetur adipiscing elit. "
    + "Morbi rhoncus dignissim ligula eget gravida. "
    + "Integer nec euismod leo. Quisque pharetra. ";
const overlay = await canvas.loadImage("resources/frame/overlay_gradient.png");

app.post("/quote", async (req, res) => {
    const c = canvas.createCanvas(1280, 720);
    const ctx = c.getContext("2d");
    const pfp_png = await convertToPNG(req.body.avatar_url);
    const pfp = await canvas.loadImage(Buffer.from(await pfp_png.arrayBuffer()));

    quote(ctx, req.body.text ?? text, req.body.author, pfp, overlay);

    const buffer = c.toBuffer("image/jpeg", {
        quality: 0.9,
        progressive: false,
        chromaSubsampling: false
    })
    res.send(buffer);
});

app.post("/quote/img", async (req, res) => {
    const c = canvas.createCanvas(1280, 720);
    const ctx = c.getContext("2d");
    const pfp_png = await convertToPNG(req.body.avatar_url);
    const attachment_png = await convertToPNG(req.body.attachment_url);

    const pfp = await canvas.loadImage(Buffer.from(await pfp_png.arrayBuffer()));
    const attachment = await canvas.loadImage(Buffer.from(await attachment_png.arrayBuffer()));
    quoteAttachment(c, ctx,
        req.body.text ?? text,
        req.body.author,
        pfp, overlay,
        attachment
    );

    const buffer = c.toBuffer("image/jpeg", {
        quality: 0.9,
        progressive: false,
        chromaSubsampling: false
    })
    res.send(buffer);
});

app.listen(4000, () => {
    console.log(`Connected to localhost:4000.`)
});