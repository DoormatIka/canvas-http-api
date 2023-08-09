import canvas from "canvas";
import { wrapText } from "./clip.js";

export function quote(
    c: canvas.Canvas,
    ctx: canvas.CanvasRenderingContext2D,
    text: string,
    author: string,
    pfp: canvas.Image,
    overlay: canvas.Image,
) {
    const clean = wrapText(ctx, text,
        700, 400 - (text.length * 2),
        100 + (text.length / 5), 70 - Math.round(text.length / 5),
    );

    const text_size = 60 - Math.round(text.length / 5);
    let last_text_end = 0;
    
    ctx.drawImage(pfp, 0, 0, 720, 718);
    ctx.drawImage(overlay, 0, 0);
    ctx.fillStyle = "#d9d9d9";
    ctx.font = `800 ${text_size}px Times New Roman`;
    clean.forEach(v => {
        ctx.fillText(v[0] as string, v[1] as number, v[2] as number);
        last_text_end = v[2] as number;
    })
    ctx.font = "40px Times New Roman";
    ctx.fillText(`- ${author}`, 1000, last_text_end + 50);

    return c.toBuffer("image/jpeg", {
        quality: 0.9,
        progressive: false,
        chromaSubsampling: true,
    });
}