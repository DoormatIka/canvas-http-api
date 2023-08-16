import fetch from "node-fetch";

export async function convertToPNG(url: string) {
    const pfp_webp = await fetch(url);
    return await fetch("http://localhost:3500/convertwebp", {
        method: "POST",
        body: await pfp_webp.blob(),
    });
}