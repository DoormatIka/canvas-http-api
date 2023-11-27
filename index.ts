import canvas from "canvas";
import fs from "fs";
import express from "express";
import {quote, quoteAttachment, Text} from "./src/quote.js";
import {WEBPToCanvas, getImage} from "./src/helpers.js";

const app = express();

app.use(express.json({limit: "20mb"}));

const overlay = await canvas.loadImage("resources/frame/overlay_gradient.png");
const test_pfp = await canvas.loadImage("resources/frame/profile.png");

app.get("/ping", async (req, res) => {res.send(true)});

app.post("/quote", async (req, res) => {
	const c = canvas.createCanvas(1280, 720);
	const ctx = c.getContext("2d");

	const pfp = req.body.use_test_pfp
		? test_pfp
		: await canvas.loadImage(Buffer.from(await getImage(req.body.avatar_url)));

	const text: Text = {
		text: req.body.text,
		size: 50,
		x: 750,
		y: 200,
		w: Math.floor(c.width / 3),
		h: (c.height / 2.5),
		max_font_size: 70,
		iterations: 50,
		extras: "Bold",
	};
	const author: Text = {
		text: req.body.author,
		size: 10,
		x: 900,
		y: 600,
		w: 300,
		h: 50,
		max_font_size: 30,
		iterations: 10,
	};

	const box_info = quote(ctx, text, author, pfp, overlay);
	if (req.body.show_bounding) {
		box_info.main_text.draw_bounding_box();
		box_info.main_text.draw_true_bounding_box();
		box_info.author_text.draw_bounding_box();
		box_info.author_text.draw_true_bounding_box();
	}

	const buffer = c.toBuffer("image/jpeg", {
		quality: 0.9,
		progressive: false,
		chromaSubsampling: false
	});

	if (req.body.pipe_to_file) {
		fs.writeFileSync("fff.jpeg", buffer);
		res.send("");
	} else {
		res.send(buffer);
	}
});

/*
	* {
	* 	text: string,
	* 	author: string,
	* 	attachment_url: string,
	* 	attachment_height: number,
	* 	attachment_width: number,
	* 	mimetype: string,
	* 	use_test_pfp: bool,
	* 	show_bounding: bool,
	* 	pipe_to_file: bool,
	* }
	*/
app.post("/quote/img", async (req, res) => {
	const c = canvas.createCanvas(1280, 720);
	const ctx = c.getContext("2d");


	const pfp = req.body.use_test_pfp
		? test_pfp
		: await canvas.loadImage(Buffer.from(await getImage(req.body.avatar_url)));

	const mimetype: string = req.body.mimetype;
	const source_image = Buffer.from(await getImage(req.body.attachment_url));
	const attachment = mimetype.includes("image/webp")
		? await WEBPToCanvas(source_image, req.body.attachment_width, req.body.attachment_height)
		: await canvas.loadImage(Buffer.from(await getImage(req.body.attachment_url)))

	const text: Text = {
		text: req.body.text,
		size: 20,
		x: 800,
		y: 500,
		w: 400,
		h: 100,
		max_font_size: 40,
		iterations: 25,
		extras: "Bold",
	};
	const author: Text = {
		text: req.body.author,
		size: 20,
		x: 1000,
		y: 600,
		w: 200,
		h: 60,
		max_font_size: 20,
		iterations: 10,
	}

	const box_info = quoteAttachment(c, ctx, text, author, pfp, overlay, attachment);
	if (req.body.show_bounding) {
		box_info.main_text.draw_bounding_box();
		box_info.main_text.draw_true_bounding_box();
		box_info.author_text.draw_bounding_box();
		box_info.author_text.draw_true_bounding_box();
	}

	const buffer = c.toBuffer("image/jpeg", {
		quality: 0.9,
		progressive: false,
		chromaSubsampling: false
	})
	if (req.body.pipe_to_file) {
		fs.writeFileSync("fff_attachment.jpeg", buffer);
		res.send("");
	} else {
		res.send(buffer);
	}
});

app.listen(4000, () => {
	console.log(`Connected to localhost:4000.`)
});
