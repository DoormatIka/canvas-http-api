import canvas from "canvas";


export function crazy2be_word_wrap_paragraph(
  ctx: canvas.CanvasRenderingContext2D, 
  text: string, 
  maxWidth: number
) {
  return text
    .split("\n")
    .flatMap(para => crazy2be_word_wrap(ctx, para, maxWidth))
}

export function crazy2be_word_wrap(
    ctx: canvas.CanvasRenderingContext2D, 
    text: string,
    maxWidth: number,
) {
    const words = text.split(" ");
    const lines: string[] = [];
    let currentLine = words[0];

    for (var i = 1; i < words.length; i++) {
        var word = words[i];
        var width = ctx.measureText(currentLine + " " + word).width;
        if (width < maxWidth) {
            currentLine += " " + word;
        } else {
            lines.push(currentLine);
            currentLine = word;
        }
    }
    lines.push(currentLine);
    return lines;
}
