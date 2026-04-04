import { Jimp } from "../src/jimp";

// Create a small 4x4 red image as test fixture
const image = new Jimp({ width: 4, height: 4, color: 0xff0000ff });

const pngBuffer = await image.getBuffer("image/png");
const jpegBuffer = await image.getBuffer("image/jpeg");
const webpBuffer = await image.getBuffer("image/webp");

await Bun.write("test/fixtures/sample.png", pngBuffer);
await Bun.write("test/fixtures/sample.jpg", jpegBuffer);
await Bun.write("test/fixtures/sample.webp", webpBuffer);

console.log("Fixtures created:");
console.log("  sample.png:", pngBuffer.length, "bytes");
console.log("  sample.jpg:", jpegBuffer.length, "bytes");
console.log("  sample.webp:", webpBuffer.length, "bytes");
