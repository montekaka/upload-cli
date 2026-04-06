import { createJimp } from "@jimp/core";
import jpeg from "@jimp/js-jpeg";
import png from "@jimp/js-png";
import { methods as resizeMethods } from "@jimp/plugin-resize";
import encodeWebP from "@jsquash/webp/encode.js";
import decodeWebP from "@jsquash/webp/decode.js";
import { init as initEncoder } from "@jsquash/webp/encode.js";
import { init as initDecoder } from "@jsquash/webp/decode.js";
import { simd } from "wasm-feature-detect";

// "file" import assertions tell Bun to embed these binary assets in the
// compiled standalone binary and return the correct virtual path at runtime.
// Both encoder variants are embedded so the right one can be chosen based on
// SIMD support detected at runtime.
// @ts-expect-error -- bun-specific "file" import assertion
import encSimdPath from "../node_modules/@jsquash/webp/codec/enc/webp_enc_simd.wasm" with { type: "file" };
// @ts-expect-error -- bun-specific "file" import assertion
import encPath from "../node_modules/@jsquash/webp/codec/enc/webp_enc.wasm" with { type: "file" };
// @ts-expect-error -- bun-specific "file" import assertion
import decPath from "../node_modules/@jsquash/webp/codec/dec/webp_dec.wasm" with { type: "file" };

let webpReady: Promise<void> | null = null;

function assertReady(): void {
  if (!webpReady) {
    throw new Error("WebP WASM not initialized — call initWebP() before processing images");
  }
}

/**
 * Pre-initialise the @jsquash/webp encoder/decoder from embedded WASM bytes.
 *
 * @jsquash/webp's encode() default export only calls init() if emscriptenModule
 * is unset. By calling initEncoder(wasmModule) here (with a pre-compiled
 * WebAssembly.Module from embedded bytes), we set emscriptenModule once so
 * subsequent encode()/decode() calls skip init entirely — bypassing Emscripten's
 * locateFile path resolution, which fails inside a standalone Bun binary.
 *
 * We do NOT use @jimp/wasm-webp because it calls initEncoder() unconditionally
 * (no args) before every encode, which overrides our pre-initialised module.
 * Instead, we register our own minimal Jimp WebP plugin below.
 */
export function initWebP(): Promise<void> {
  if (!webpReady) {
    webpReady = (async () => {
      const isSIMD = await simd();
      const chosenEncPath = isSIMD ? (encSimdPath as string) : (encPath as string);

      const [encBytes, decBytes] = await Promise.all([
        Bun.file(chosenEncPath).arrayBuffer(),
        Bun.file(decPath as string).arrayBuffer(),
      ]);

      const [encModule, decModule] = await Promise.all([
        WebAssembly.compile(encBytes),
        WebAssembly.compile(decBytes),
      ]);

      await Promise.all([
        initEncoder(encModule),
        initDecoder(decModule),
      ]);
    })();
  }
  return webpReady;
}

/**
 * Minimal Jimp WebP format plugin backed by @jsquash/webp.
 *
 * Unlike @jimp/wasm-webp this plugin does NOT call initEncoder/initDecoder
 * before each operation — it relies on initWebP() having already set
 * up the module. encode() and decode() from @jsquash/webp respect the
 * already-initialised emscriptenModule without re-triggering WASM loading.
 */
function webp() {
  return {
    mime: "image/webp",
    hasAlpha: true,
    encode: async (
      bitmap: { data: Buffer; width: number; height: number },
      options: { quality?: number } = {}
    ) => {
      assertReady();
      const arrayBuffer = await encodeWebP(
        {
          data: new Uint8ClampedArray(bitmap.data),
          width: bitmap.width,
          height: bitmap.height,
          colorSpace: "srgb",
        },
        { quality: options.quality ?? 80 }
      );
      return Buffer.from(arrayBuffer);
    },
    decode: async (data: Buffer) => {
      assertReady();
      const result = await decodeWebP(data);
      return {
        data: Buffer.from(result.data),
        width: result.width,
        height: result.height,
      };
    },
  };
}

export const Jimp = createJimp({
  formats: [jpeg, png, webp],
  plugins: [resizeMethods],
});
