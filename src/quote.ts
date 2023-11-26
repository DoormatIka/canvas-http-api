import {throws} from "assert";
import canvas from "canvas";

type Center = "center" | "right" | "left";
type Align = "top" | "middle" | "bottom";
type WordCoords = {
	x: number,
	y: number,
	w: number,
	h: number,
	text: string,
};
export type Text = {
	text: string,
	size: number,
	x: number,
	y: number,
	w: number,
	h: number,
	extras?: string,
};

export class TextArea {
	// absolute values
	private relative_text_width: number = 0;
	private relative_text_height: number = 0;
	private absolute_text_y: number = 0;
	private absolute_text_x: number = 0;
	
	constructor(
		private ctx: canvas.CanvasRenderingContext2D,
		private text: string,
		private x: number,
		private y: number,
		private width: number,
		private height: number,
		private will_center_x: boolean = false,
		private will_center_y: boolean = true,
	) {}
	public set_text(text: string) { this.text = text }
	/*
		* O(n^2) kinda algorithm.
		* Wraps words via arrays, and measuring every word with canvas context.
		*
		* Sets relative_text_height and relative_text_width
		*/
	public wrap_words() {
		this.ctx.textBaseline = "top";

		const coords: WordCoords[][] = [];
		const paragraph = this.text.split("\n").map(c => c.split(/(?<=[ ])/g));

		const y_adjust = 1.2;
		const global_text_metrics = this.ctx.measureText("|||");
		const absolute_width = this.x + this.width;

		let absolute_word_y_offset = this.y.valueOf();
		let absolute_word_x_offset = this.x.valueOf();

		for (const sentence of paragraph) {
			absolute_word_x_offset = this.x.valueOf();
			const local_coords: WordCoords[] = [];

			for (const word of sentence) {
				const local_text_metrics = this.ctx.measureText(word);
				
				const absolute_text_width = this.x + this.relative_text_width;

				const absolute_word_x_offset_end = absolute_word_x_offset + local_text_metrics.width;

				if (absolute_word_x_offset > absolute_text_width) {
					this.relative_text_width = absolute_word_x_offset.valueOf() - this.x;
				}
				if (absolute_word_x_offset_end > absolute_width) {
					absolute_word_y_offset += global_text_metrics.actualBoundingBoxDescent / y_adjust;
					absolute_word_x_offset = this.x.valueOf();
				}

				local_coords.push({
					x: absolute_word_x_offset,
					y: absolute_word_y_offset,
					w: local_text_metrics.width,
					h: local_text_metrics.actualBoundingBoxDescent,
					text: word,
				});
				absolute_word_x_offset += local_text_metrics.width;
			}
			absolute_word_y_offset += global_text_metrics.actualBoundingBoxDescent / y_adjust;

			coords.push(local_coords);
		}

		this.relative_text_height = absolute_word_y_offset.valueOf() - this.y;
		return coords;
	}
	/*
		* Resizing fonts
		*
		*/
	public auto_font_resize() {
		const previousFont = this.ctx.font.toString();
		const previousFontSizeMatch = previousFont.match(/(\d+)px/)?.[1];

		let absolute_text_y_limit = this.absolute_text_y + this.relative_text_height;
		let absolute_text_x_limit = this.absolute_text_x + this.relative_text_width;
		const absolute_y_limit = this.y + this.height;
		const absolute_x_limit = this.x + this.width;

		let previousFontSize = previousFontSizeMatch
			? Number(previousFontSizeMatch)
			: 20;

		let wrapped: WordCoords[][] = [];
		while (true) {
			console.log(`outif fontsize: ${previousFontSize}, style: ${this.ctx.font}, text_y_limit: ${absolute_text_y_limit}`)

			const garbageStyle = previousFont.replace(`${previousFontSizeMatch}px`, "()");
			this.ctx.font = garbageStyle.replace("()", `${previousFontSize}px`);

			if (absolute_text_x_limit < absolute_x_limit) {
				console.log(`inif fontsize: ${previousFontSize}, style: ${this.ctx.font}, text_y_limit: ${absolute_text_y_limit}`)
				previousFontSize += 3;
				this.ctx.font = previousFont.replace(`${previousFontSizeMatch}px`, "()");
				absolute_text_x_limit = this.absolute_text_x + this.relative_text_width;
				continue;
			}

			if (absolute_text_y_limit >= absolute_y_limit) {
				console.log(`inif fontsize: ${previousFontSize}, style: ${this.ctx.font}, text_y_limit: ${absolute_text_y_limit}`)
				previousFontSize -= 3;
				wrapped = this.wrap_words();
				this.ctx.font = previousFont.replace(`${previousFontSizeMatch}px`, "()");
				absolute_text_y_limit = this.absolute_text_y + this.relative_text_height;
				continue;
			}

			break;
		}
		this.ctx.font = previousFont.replace(`${previousFontSizeMatch}px`, "()");
		console.log(this.ctx.font, previousFontSize);
		return {wrapped, previousFontSize};
	}
	public adjust_text_for_centering(coords: WordCoords[][]) {
		let previousFillStyle;
		if (typeof this.ctx.fillStyle === "string") {
			previousFillStyle = this.ctx.fillStyle.toString();
		} else {
			previousFillStyle = Object.assign({}, this.ctx.fillStyle);
		}
		// performance degrader, since this parses the same loop twice.
		// i'll fix it later.
		const y_center_relative = Math.floor(this.height / 2);
		const x_center_relative = Math.floor(this.width / 2);

		const relative_x_text_center = this.relative_text_width / 2;
		const relative_y_text_center = this.relative_text_height / 2;

		const relative_text_x = this.will_center_x 
			? x_center_relative - relative_x_text_center
			: 0;
		const relative_text_y = this.will_center_y 
			? y_center_relative - relative_y_text_center
			: 0;

		this.absolute_text_x = this.x + relative_text_x;
		this.absolute_text_y = this.y + relative_text_y;

		this.ctx.fillStyle = previousFillStyle;

		for (const y_coord of coords) {
			for (const x_coord of y_coord) {
				x_coord.y += relative_text_y;
				x_coord.x += relative_text_x; // relative_text_x | for real centering by x
			}
		}
	}
	public draw_center() {
		let previousFillStyle;
		if (typeof this.ctx.fillStyle === "string") {
			previousFillStyle = this.ctx.fillStyle.toString();
		} else {
			previousFillStyle = Object.assign({}, this.ctx.fillStyle);
		}

		const y_center_relative = Math.floor(this.height / 2);
		const y_center_absolute = this.y + y_center_relative;
		const x_center_relative = Math.floor(this.width / 2);
		const x_center_absolute = this.x + x_center_relative;

		this.ctx.fillStyle = "red";
		this.ctx.fillRect(x_center_absolute, y_center_absolute, 10, 10);

		this.ctx.fillStyle = "purple";
		this.ctx.fillRect(this.absolute_text_x, this.absolute_text_y, 5, 5);

		this.ctx.fillStyle = previousFillStyle;
	}
	public draw_bounding_box() {
		let previousStrokeStyle;
		if (typeof this.ctx.fillStyle === "string") {
			previousStrokeStyle = this.ctx.fillStyle.toString();
		} else {
			previousStrokeStyle = Object.assign({}, this.ctx.fillStyle);
		}

		this.ctx.lineWidth = 3;
		this.ctx.beginPath();
		this.ctx.strokeStyle = "red";
		this.ctx.rect(this.x, this.y, this.width, this.height);
		this.ctx.stroke();
		this.ctx.lineWidth = 1;

		this.ctx.strokeStyle = previousStrokeStyle;
	}
	public draw_true_bounding_box() {
		let previousStrokeStyle;
		if (typeof this.ctx.fillStyle === "string") {
			previousStrokeStyle = this.ctx.fillStyle.toString();
		} else {
			previousStrokeStyle = Object.assign({}, this.ctx.fillStyle);
		}

		this.ctx.lineWidth = 3;
		this.ctx.beginPath();
		this.ctx.strokeStyle = "purple";
		this.ctx.rect(this.absolute_text_x, this.absolute_text_y, this.relative_text_width, this.relative_text_height);
		this.ctx.stroke();
		this.ctx.lineWidth = 1;

		this.ctx.strokeStyle = previousStrokeStyle;
	}
}

export function writeText(
		ctx: canvas.CanvasRenderingContext2D,
		text: Text,
) {
    const text_area = new TextArea(ctx, text.text, text.x, text.y, text.w, text.h);
		text_area.wrap_words();
	  const coords = text_area.auto_font_resize();
		text_area.adjust_text_for_centering(coords.wrapped);
		for (const y_coord of coords.wrapped) {
			for (const x_coord of y_coord) {
				ctx.fillText(x_coord.text, x_coord.x, x_coord.y);
			}
		}
		return text_area;
}

export function quote(
    ctx: canvas.CanvasRenderingContext2D,
    text: Text,
    author: Text,
    pfp: canvas.Image,
    overlay: canvas.Image,
) {
    ctx.drawImage(pfp, 0, 0, 720, 718);
    ctx.drawImage(overlay, 0, 0);

    ctx.fillStyle = "#d9d9d9";
    ctx.font = `${text.extras ?? ""} ${text.size}px Times New Roman`;
		const text_area = writeText(ctx, text);

    ctx.font = `${author.extras ?? ""} ${author.size}px Times New Roman`;
		const author_area = writeText(ctx, author);

		return {text_area, author_area};
}

export function quoteAttachment(
    c: canvas.Canvas,
    ctx: canvas.CanvasRenderingContext2D,
    text: Text,
    author: Text,
    pfp: canvas.Image,
    overlay: canvas.Image,
    attachment: canvas.Image | canvas.Canvas,
) {
    ctx.drawImage(pfp, 0, 0, 720, 718);
    ctx.drawImage(overlay, 0, 0);
    
		quote(ctx, text, author, pfp, overlay)

    const ratio = attachment.width / attachment.height;
    const width = 400;
    const height = width / ratio;
    ctx.globalAlpha = 0.9;
    ctx.drawImage(
        attachment, 
        (c.width - width) - 110, 
        (c.height - height) - 230, 
        width, 
        height);
    ctx.globalAlpha = 1;
}
