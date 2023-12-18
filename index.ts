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

function normalize(input: number, low_limit: number, high_limit: number) {
	return (input - low_limit) / (high_limit - low_limit)
}
function denormalize(input: number, low_limit: number, high_limit: number) {
	return input * (high_limit - low_limit) + low_limit;
}
function invert_denormalize(input: number, low_limit: number, high_limit: number) {
	const normalized_value = 1 - input;
	return denormalize(normalized_value, low_limit, high_limit);
}
function limit_number(input: number, min: number, max: number) {
	return Math.min(Math.max(input, min), max);
}

app.post("/quote", async (req, res) => {
	const c = canvas.createCanvas(1280, 720);
	const ctx = c.getContext("2d");

	const use_test_pfp: boolean = req.body.use_test_pfp;
	const pipe_to_file: boolean = req.body.pipe_to_file;
	const show_bounding: boolean = req.body.show_bounding;

	const text_field: string = req.body.text;
	const author_field: string = req.body.author;
	const avatar_url: string = req.body.avatar_url;

	const text_field_limit = 400;
	const cut_text_field = text_field.slice(0, text_field_limit);

	const pfp = use_test_pfp
		? test_pfp
		: await canvas.loadImage(Buffer.from(await getImage(avatar_url)));

	// 100 max
	const lower_limit = 10;
	const highest_limit = 70;
	const text_length_limit = limit_number(text_field.length / 3, lower_limit, highest_limit);
	const text_normalized = normalize(text_length_limit, lower_limit, highest_limit);
	const text_non_normalized = invert_denormalize(text_normalized, lower_limit, highest_limit);

	const text: Text = {
		text: text_field.length > text_field_limit 
			? cut_text_field + " ..." 
			: cut_text_field,
		x: 700,
		y: 200,
		w: Math.floor(c.width / 2.3),
		h: Math.floor(c.height / 2.5),
		style: `bold ${text_non_normalized}pt Times New Roman`,
		color: `rgba(255, 255, 255, 0.8)`
	};

	const author_lower_limit = 20;
	const author_highest_limit = 30;

	const author_length_limit = limit_number(author_field.length / 1.1, author_lower_limit, author_highest_limit);
	const author_normalized = normalize(author_length_limit, author_lower_limit, author_highest_limit);
	const author_non_normalized = invert_denormalize(author_normalized, author_lower_limit, author_highest_limit);

	const author: Text = {
		text: author_field.slice(0, 20),
		x: 950,
		y: 500,
		w: 300,
		h: 150,
		style: `${author_non_normalized}pt Times New Roman`,
		color: `rgba(255, 255, 255, 0.3)`
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

	const lower_limit = 20;
	const highest_limit = 30;

	const text_length_limit = limit_number(text_field.length / 4, lower_limit, highest_limit);
	const text_normalized = normalize(text_length_limit, lower_limit, highest_limit);
	const text_non_normalized = invert_denormalize(text_normalized, lower_limit, highest_limit);

	const text: Text = {
		text: text_field,
		x: 800,
		y: 500,
		w: 400,
		h: 100,
		style: `bold ${text_non_normalized}pt Times New Roman`,
		color: `rgba(255, 255, 255, 0.8)`,
	};

	const author_lower_limit = 10;
	const author_highest_limit = 20;

	const author_length_limit = limit_number(author_field.length / 2, author_lower_limit, author_highest_limit);
	const author_normalized = normalize(author_length_limit, author_lower_limit, author_highest_limit);
	const author_non_normalized = invert_denormalize(author_normalized, author_lower_limit, author_highest_limit);

	const author: Text = {
		text: author_field.slice(0, 20),
		x: 1000,
		y: 600,
		w: 200,
		h: 60,
		style: `${author_non_normalized}pt Times New Roman`,
		color: `rgba(255, 255, 255, 0.3)`,
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
