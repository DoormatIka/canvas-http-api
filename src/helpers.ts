import fetch from "node-fetch";
import canvas from "canvas";
import webp from "@cwasm/webp"

export async function WEBPToCanvas(url: string, width: number, height: number) {
	const source_image = Buffer.from(await getImage(url));
	
	const c = canvas.createCanvas(width, height);
	const ctx = c.getContext("2d");
	const image = webp.decode(source_image);
	const imageData = ctx.createImageData(image.width, image.height);
	imageData.data.set(image.data);
	ctx.putImageData(imageData, 0, 0);

	return c;
}

export async function getImage(url: string) {
	return await (await fetch(url)).arrayBuffer()
}
