import { createJimp } from "@jimp/core";
import jpeg from "@jimp/js-jpeg";
import png from "@jimp/js-png";
import webp from "@jimp/wasm-webp";
import { methods as resizeMethods } from "@jimp/plugin-resize";

export const Jimp = createJimp({
  formats: [jpeg, png, webp],
  plugins: [resizeMethods],
});
