import canvas from "canvas";
import { lilys_word_wrap, rlemons_fragmentText } from "./clip.js";

export function quote(
    c: canvas.Canvas,
    ctx: canvas.CanvasRenderingContext2D,
    text: string,
    author: string,
    pfp: canvas.Image,
    overlay: canvas.Image,
) {
    ctx.drawImage(pfp, 0, 0, 720, 718);
    ctx.drawImage(overlay, 0, 0);
    ctx.fillStyle = "#d9d9d9";

    // AUTO FONT RESIZE IN COMPARISON TO THE TEXT LENGTH NEEDS TO BE CALCULATED.
    ctx.font = `bold ${60}px Times New Roman`;
    let last = 300 - (text.length * 2.5);
    const a = lilys_word_wrap(text, 10);

    for (const s of a) {
        last += 65;
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText(s, 700, last, 900);
    }
    ctx.font = "40px Times New Roman"
    ctx.fillText(`- ${author}`, 800, last + 65, 900);

    return c.toBuffer("image/jpeg", {
        quality: 0.9,
        progressive: false,
        chromaSubsampling: true,
    });
}