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
// const pfp = await canvas.loadImage("resources/frame/profile.png");

/* TESTS
const buffer = quote(c, ctx, text, "Alice", pfp, overlay);
fs.writeFileSync(`./in.jpg`, buffer);
const buffer2 = quote(c, ctx, "text", "Alice", pfp, overlay);
fs.writeFileSync(`./in2.jpg`, buffer2);
const buffer3 = quote(c, ctx, "Fellas, is it gay to be gay?", "Alice", pfp, overlay);
fs.writeFileSync(`./in3.jpg`, buffer3);
const buffer4 = quote(c, ctx, "Imma imma eat lunch, I compressed my gym time during my 1 hour break at school so I wouldn’t do anything later", "Alice", pfp, overlay);
fs.writeFileSync(`./in4.jpg`, buffer4);
const buffer5 = quote(c, ctx, `"The Lisa released in 1983, but just a year later, was the Super Bowl."
This channel really captures the essence of losing focus during lecture for 3 minutes cause you thought you were following along.`, "ALice", pfp, overlay);
fs.writeFileSync(`./in5.jpg`, buffer5);
*/


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