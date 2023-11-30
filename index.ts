import canvas from "canvas";
import fs from "fs";
import express from "express";
import {WEBPToCanvas, getImage} from "./src/helpers.js";
import { Text, quote, quoteAttachment } from "./src/quote.js";

const app = express();

app.use(express.json({limit: "20mb"}));

const overlay = await canvas.loadImage("resources/frame/overlay_gradient.png");
const test_pfp = await canvas.loadImage("resources/frame/profile.png");

app.get("/ping", async (req, res) => {res.send(true)});

app.post("/quote", async (req, res) => {
	const c = canvas.createCanvas(1280, 720);
	const ctx = c.getContext("2d");

	const use_test_pfp: boolean = req.body.use_test_pfp;
	const pipe_to_file: boolean = req.body.pipe_to_file;
	const show_bounding: boolean = req.body.show_bounding;

	const text_field: string = req.body.text;
	const author_field: string = req.body.author;
	const avatar_url: string = req.body.avatar_url;

	const pfp = use_test_pfp
		? test_pfp
		: await canvas.loadImage(Buffer.from(await getImage(avatar_url)));

	// 100 max
	const text: Text = {
		text: text_field.slice(0, 100),
		x: 750,
		y: 200,
		w: Math.floor(c.width / 3),
		h: Math.floor(c.height / 2.5),
		style: "Bold 50px Times New Roman",
	};
	// 20 max
	const author: Text = {
		text: author_field.slice(0, 20),
		x: 900,
		y: 600,
		w: 300,
		h: 50,
		style: "30px Times New Roman"
	};

	const box_info = quote(ctx, text, author, pfp, overlay);
	if (show_bounding) {
		box_info.main_text
			.draw_bounding_box()
			.draw_true_bounding_box();
		box_info.author_text
			.draw_bounding_box()
			.draw_true_bounding_box();
	}

	const buffer = c.toBuffer("image/jpeg", {
		quality: 0.9,
		progressive: false,
		chromaSubsampling: false
	});

	if (pipe_to_file) {
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

	const use_test_pfp: boolean = req.body.use_test_pfp;
	const pipe_to_file: boolean = req.body.pipe_to_file;
	const show_bounding: boolean = req.body.show_bounding;

	const mimetype: string = req.body.mimetype;
	const text_field: string = req.body.text;
	const author_field: string = req.body.author;
	const avatar_url: string = req.body.avatar_url;
	const attachment_url: string = req.body.attachment_url;
	const attachment_width: number = req.body.attachment_width;
	const attachment_height: number = req.body.attachment_height;

	const pfp = use_test_pfp
		? test_pfp
		: await canvas.loadImage(Buffer.from(await getImage(avatar_url)));

	const source_image = Buffer.from(await getImage(attachment_url));
	const attachment = mimetype.includes("image/webp")
		? await WEBPToCanvas(source_image, attachment_width, attachment_height)
		: await canvas.loadImage(source_image)

	const text: Text = {
		text: text_field.slice(0, 100),
		x: 800,
		y: 500,
		w: 400,
		h: 100,
		style: "Bold 30px Times New Roman",
	};
	const author: Text = {
		text: author_field.slice(0, 20),
		x: 1000,
		y: 600,
		w: 200,
		h: 60,
		style: "20px Times New Roman",
	}

	const box_info = quoteAttachment(c, ctx, text, author, pfp, overlay, attachment);
	if (show_bounding) {
		box_info.main_text
			.draw_bounding_box()
			.draw_true_bounding_box();
		box_info.author_text
			.draw_bounding_box()
			.draw_true_bounding_box();
	}
	box_info.main_text.render();
	box_info.author_text.render();

	const buffer = c.toBuffer("image/jpeg", {
		quality: 0.9,
		progressive: false,
		chromaSubsampling: false
	})
	if (pipe_to_file) {
		fs.writeFileSync("fff_attachment.jpeg", buffer);
		res.send("");
	} else {
		res.send(buffer);
	}
});

app.listen(4000, () => {
	console.log(`Connected to localhost:4000.`)
});
