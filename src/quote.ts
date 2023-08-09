import canvas from "canvas";
import { wrapText } from "./clip.js";

export function quote(
    text: string,
    bg: canvas.Image,
    pfp: canvas.Image,
    overlay: canvas.Image,
) {
    const c = canvas.createCanvas(1280, 720);
    const ctx = c.getContext("2d");
    const clean = wrapText(ctx, text,
        570, Math.abs(300 - (text.length / 1.5)),
        90 + Math.round(text.length / 5), 80 - Math.round(text.length / 5),
    );

    let text_size = 70;
    let last_text_end = 0;
    
    ctx.drawImage(bg, 0, 0);
    ctx.drawImage(pfp, 96, 148, 425, 424);
    ctx.drawImage(overlay, 0, 0);
    ctx.fillStyle = "#d9d9d9";
    if (text.length > 100) {
        text_size -= Math.round(text.length / 5)
    }
    ctx.font = `800 ${text_size}px Times New Roman`;
    clean.forEach(v => {
        ctx.fillText(v[0] as string, v[1] as number, v[2] as number);
        last_text_end = v[2] as number;
    })
    ctx.font = "40px Times New Roman";
    ctx.fillText("- Alice", 1000, last_text_end + 50);

    return c.toBuffer("image/jpeg", {
        quality: 0.9,
        progressive: false,
        chromaSubsampling: true,
    });
}