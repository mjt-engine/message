import { build } from "esbuild";
import process from "process";

build({
  entryPoints: ["./src/index.ts"], // Your entry file
  bundle: true,
  platform: "browser",
  // target: ['chrome58', 'firefox57', 'safari11', 'edge16'], // Target browsers
  outfile: "./dist/index.js", // Output file
  // define: {
  //   'process.env.NODE_ENV': '"production"', // Define environment variables if needed
  // },
  // inject: ['./shims/crypto.js'], // Inject the crypto shim
  external: ["crypto"], // Mark crypto as external
}).catch(() => process.exit(1));
