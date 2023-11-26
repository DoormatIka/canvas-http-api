import canvas from "canvas";
import fs from "fs";
import express from "express";
import { quote, quoteAttachment, Text } from "./src/quote.js";
import { WEBPToCanvas, getImage } from "./src/helpers.js";

const app = express();

app.use(express.json({ limit: "20mb" }));

const overlay = await canvas.loadImage("resources/frame/overlay_gradient.png");
const test_pfp = await canvas.loadImage("resources/frame/profile.png");

app.get("/ping", async (req, res) => { res.send(true) });

app.post("/quote", async (req, res) => {
    const c = canvas.createCanvas(1280, 720);
    const ctx = c.getContext("2d");

    const pfp = req.body.use_test_pfp 
			? await canvas.loadImage(Buffer.from(await getImage(req.body.avatar_url)))
			: test_pfp;

		const text: Text = {
				text: req.body.text,
				size: 50,
				x: 650,
				y: 100,
				w: Math.floor(c.width / 2.5),
				h: (c.height / 2),
				extras: "Bold",
		};
		const author: Text = {
				text: req.body.author,
				size: 10,
				x: 900,
				y: 600,
				w: 300,
				h: 100,
		};

    const box_info = quote(ctx, text, author, pfp, overlay);
		if (req.body.show_bounding) {
				box_info.text_area.draw_bounding_box();
				box_info.text_area.draw_true_bounding_box();
				box_info.author_area.draw_bounding_box();
				box_info.author_area.draw_true_bounding_box();
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
	* 	attachment_url: string,
	* 	attachment_height: number,
	* 	attachment_width: number,
	* 	mimetype: string
	* }
	*/
app.post("/quote/img", async (req, res) => {
    const c = canvas.createCanvas(1280, 720);
    const ctx = c.getContext("2d");

		const source_image = Buffer.from(await getImage(req.body.attachment_url));
    
		const pfp = await canvas.loadImage(Buffer.from(await getImage(req.body.avatar_url)));
		const mimetype: string = req.body.mimetype;
    const attachment = mimetype.includes("image/webp")
    	? await WEBPToCanvas(source_image, req.body.attachment_width, req.body.attachment_height)
			: await canvas.loadImage(Buffer.from(await getImage(req.body.attachment_url)))

		const text: Text = {
				text: req.body.text,
				size: 80,
				x: 700,
				y: 30,
				w: 300,
				h: 1000,
				extras: "Bold",
		};
		const author: Text = {
				text: req.body.author,
				size: 30,
				x: 1000,
				y: 500,
				w: 300,
				h: 40,
		}

		quoteAttachment(c, ctx,
        text,
        author,
        pfp, 
				overlay,
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
