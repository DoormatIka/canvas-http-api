import canvas from "canvas";

export function lilys_word_wrap(text: string, maxLetters: number) {
    const splitted_text = text.split(" ");
    const numerous: string[] = [];

    let current_word = "";
    for (const text of splitted_text) {
        if (current_word.length > maxLetters) {
            numerous.push(` ${current_word}`);
            console.log(current_word);
            current_word = "";
        }
        current_word += ` ${text}`;
    }
    if (current_word.length > 0) {
        numerous.push(` ${current_word}`);
    }
    return numerous;
}

export function rlemons_fragmentText(
    ctx: canvas.CanvasRenderingContext2D,
    text: string,
    maxWidth: number
) {
    var words = text.split(' '),
        lines = [],
        line = "";
    if (ctx.measureText(text).width < maxWidth) {
        return [text];
    }
    while (words.length > 0) {
        var split = false;
        while (ctx.measureText(words[0]).width >= maxWidth) {
            var tmp = words[0];
            words[0] = tmp.slice(0, -1);
            if (!split) {
                split = true;
                words.splice(1, 0, tmp.slice(-1));
            } else {
                words[1] = tmp.slice(-1) + words[1];
            }
        }
        if (ctx.measureText(line + words[0]).width < maxWidth) {
            line += words.shift() + " ";
        } else {
            lines.push(line);
            line = "";
        }
        if (words.length === 0) {
            lines.push(line);
        }
    }
    return lines;
}