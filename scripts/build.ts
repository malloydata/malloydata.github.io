/*
 * Copyright 2024 Google LLC
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files
 * (the "Software"), to deal in the Software without restriction,
 * including without limitation the rights to use, copy, modify, merge,
 * publish, distribute, sublicense, and/or sell copies of the Software,
 * and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
 * IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
 * CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
 * TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
 * SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

import fs from "fs";
import { build, BuildOptions, Plugin } from "esbuild";
import { nativeNodeModulesPlugin } from "../third_party/github.com/evanw/esbuild/native-modules-plugin";
import * as path from "path";
import { noNodeModulesSourceMaps } from "../third_party/github.com/evanw/esbuild/no-node-modules-sourcemaps";

function makeDuckdbNoNodePreGypPlugin(): Plugin {
  const localPath = require.resolve("duckdb/lib/binding/duckdb.node");
  const posixPath = localPath.split(path.sep).join(path.posix.sep);
  return {
    name: "duckdbNoNodePreGypPlugin",
    setup(build) {
      build.onResolve({ filter: /duckdb-binding\.js/ }, (args) => {
        return {
          path: args.path,
          namespace: "duckdb-no-node-pre-gyp-plugin",
        };
      });
      build.onLoad(
        {
          filter: /duckdb-binding\.js/,
          namespace: "duckdb-no-node-pre-gyp-plugin",
        },
        (_args) => {
          return {
            contents: /* javascript */ `
              const path = require("path");
              const os = require("os");

              const binding_path = "${posixPath}";

              // dlopen is used because we need to specify the RTLD_GLOBAL flag to be able to resolve duckdb symbols
              // on linux where RTLD_LOCAL is the default.
              process.dlopen(module, binding_path, os.constants.dlopen.RTLD_NOW | os.constants.dlopen.RTLD_GLOBAL);
            `,
            resolveDir: ".",
          };
        }
      );
    },
  };
}

const outDir = "./dist";

async function doBuild(): Promise<void> {
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });

  fs.copyFileSync(
    "./node_modules/jsdom/lib/jsdom/living/xhr/xhr-sync-worker.js",
    `${outDir}/xhr-sync-worker.js`
  );

  const duckDBPlugin = makeDuckdbNoNodePreGypPlugin();
  const extensionPlugins = [duckDBPlugin];

  extensionPlugins.push(noNodeModulesSourceMaps);

  const nodeExtensionPlugins = extensionPlugins;
  nodeExtensionPlugins.push(nativeNodeModulesPlugin);

  const buildOptions: BuildOptions = {
    bundle: true,
    sourcemap: "inline",
    outfile: "./dist/build.js",
    logLevel: "info",
    target: "node18",
    platform: "node",
    plugins: nodeExtensionPlugins,
    entryPoints: ["./scripts/index.ts"],
    external: ["canvas", "vscode-oniguruma", "./xhr-sync-worker.js"],
  };

  await build(buildOptions);
}

doBuild();
