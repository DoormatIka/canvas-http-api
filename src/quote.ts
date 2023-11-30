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
	x: number,
	y: number,
	w: number,
	h: number,
	color?: string,
	style?: string,
};

export class TextArea {
	// absolute values
	private relative_text_width: number = 0;
	private relative_text_height: number = 0;
	private absolute_text_y: number = 0;
	private absolute_text_x: number = 0;
	private coords: WordCoords[][] = [];
	private previous_style: {
		fillStyle?: string | CanvasGradient | CanvasPattern,
		lineWidth?: number,
		strokeStyle?: string | CanvasGradient | CanvasPattern,
		font?: string,
	} = {};

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
	public set_text(text: string) {this.text = text}
	public get_coords() {return this.coords}
	public store_styles() {
		if (typeof this.ctx.fillStyle === "string") {
			this.previous_style.fillStyle = this.ctx.fillStyle.toString();
		} else {
			this.previous_style.fillStyle = Object.assign({}, this.ctx.fillStyle);
		}
		if (typeof this.ctx.strokeStyle === "string") {
			this.previous_style.strokeStyle = this.ctx.strokeStyle.toString();
		} else {
			this.previous_style.strokeStyle = Object.assign({}, this.ctx.strokeStyle);
		}
		this.previous_style.lineWidth = this.ctx.lineWidth.valueOf();
		this.previous_style.font = this.ctx.font.toString();

		return this;
	}
	public get_previous_style() {
		return this.previous_style;
	}
	/*
		* O(n^2) kinda algorithm.
		* Wraps words via arrays, and measuring every word with canvas context.
		*
		* Sets relative_text_height and relative_text_width
		*/
	public wrap_words() {
		this.ctx.textBaseline = "top";

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

			this.coords.push(local_coords);
			this.relative_text_height = absolute_word_y_offset.valueOf() - this.y;
		}

		return this;
	}
	public adjust_text_for_centering() {
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

		for (const y_coord of this.coords) {
			for (const x_coord of y_coord) {
				x_coord.y += relative_text_y;
				x_coord.x += relative_text_x; // relative_text_x | for real centering by x
			}
		}

		return this;
	}
	public render() {
		for (const y_coord of this.coords) {
			for (const x_coord of y_coord) {
				this.ctx.fillText(x_coord.text, x_coord.x, x_coord.y);
			}
		}
		return this;
	}

	public draw_center() {
		const y_center_relative = Math.floor(this.height / 2);
		const y_center_absolute = this.y + y_center_relative;
		const x_center_relative = Math.floor(this.width / 2);
		const x_center_absolute = this.x + x_center_relative;

		this.ctx.fillStyle = "red";
		this.ctx.fillRect(x_center_absolute, y_center_absolute, 10, 10);

		this.ctx.fillStyle = "purple";
		this.ctx.fillRect(this.absolute_text_x, this.absolute_text_y, 5, 5);

		return this;
	}
	public draw_bounding_box() {
		this.ctx.lineWidth = 3;
		this.ctx.beginPath();
		this.ctx.strokeStyle = "red";
		this.ctx.rect(this.x, this.y, this.width, this.height);
		this.ctx.stroke();

		return this;
	}
	public draw_true_bounding_box() {
		this.ctx.lineWidth = 3;
		this.ctx.beginPath();
		this.ctx.strokeStyle = "purple";
		this.ctx.rect(this.absolute_text_x, this.absolute_text_y, this.relative_text_width, this.relative_text_height);
		this.ctx.stroke();

		return this;
	}
}

function adjust_text(ctx: canvas.CanvasRenderingContext2D, text: Text) {
	ctx.font = text.style ?? "";
	ctx.fillStyle = text.color ?? "#d9d9d9";
	const text_area = new TextArea(ctx, text.text, text.x, text.y, text.w, text.h)
		.store_styles()
		.wrap_words()
		.adjust_text_for_centering()
		.render();
	
	const previous_style = text_area.get_previous_style();
	ctx.fillStyle = previous_style.fillStyle ?? ctx.fillStyle;
	ctx.lineWidth = previous_style.lineWidth ?? ctx.lineWidth;
	ctx.strokeStyle = previous_style.strokeStyle ?? ctx.strokeStyle;
	ctx.font = previous_style.font ?? ctx.font;

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

	const main_text = adjust_text(ctx, text);
	const author_text = adjust_text(ctx, author);

	return {main_text, author_text};
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

	const main_text = adjust_text(ctx, text);
	const author_text = adjust_text(ctx, author);

	const x = 1000;
	const y = (c.height / 2) - 100;
	const ratio = attachment.width / attachment.height;
	const width = 400;
	const height = 400;
	let adjusted_width = width.valueOf();
	let adjusted_height = height.valueOf();

	if (width / ratio > height) {
		adjusted_width = height * ratio;
	} else {
		adjusted_height = width / ratio;
	}

	ctx.globalAlpha = 0.9;
	ctx.drawImage(
		attachment,
		x - (adjusted_width / 2),
		y - (adjusted_height / 2),
		adjusted_width,
		adjusted_height
	);
	ctx.globalAlpha = 1;

	return {main_text, author_text};
}
