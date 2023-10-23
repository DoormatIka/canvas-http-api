import canvas from "canvas";
import express from "express";
import { quote, quoteAttachment } from "./src/quote.js";
import { WEBPToCanvas, getImage } from "./src/helpers.js";

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
    const pfp = await canvas.loadImage(Buffer.from(await getImage(req.body.avatar_url)));

    quote(ctx, req.body.text ?? text, req.body.author, pfp, overlay);
    
	const buffer = c.toBuffer("image/jpeg", {
        quality: 0.9,
        progressive: false,
        chromaSubsampling: false
    })
    res.send(buffer);
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

    const pfp = await canvas.loadImage(Buffer.from(await getImage(req.body.avatar_url)));
	const mimetype: string = req.body.mimetype;
    const attachment = mimetype.includes("image/webp")
    	? await WEBPToCanvas(req.body.attachment_url, req.body.attachment_width, req.body.attachment_height)
		: await canvas.loadImage(Buffer.from(await getImage(req.body.attachment_url)))

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
