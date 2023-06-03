/*
 * Copyright 2019, 2021, 2022, 2023 sukawasatoru
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

/** @type {import('next').NextConfig} */
const config = {
  experimental: {
    typedRoutes: true,
  },
  output: 'export',
  poweredByHeader: false,
  reactStrictMode: true,
  staticPageGenerationTimeout: 30,
  webpack: (config, options) => {
    config.experiments.syncWebAssembly = true;

    // https://github.com/vercel/next.js/issues/25852#issuecomment-1057059000
    if (!options.dev && options.isServer) {
      const {access, symlink} = require('fs/promises');

      config.plugins.push(
        new (class {
          apply(compiler) {
            compiler.hooks.afterEmit.tapPromise(
              'SymlinkWebpackPlugin',
              async (compiler) => {
                const from = `${compiler.options.output.path}/../static`;
                const to = `${compiler.options.output.path}/static`;

                try {
                  await access(from);
                  console.log(`${from} already exists`);
                } catch (error) {
                  if (error.code === 'ENOENT') {
                    // No link exists

                    await symlink(to, from, 'junction');
                    console.log(`created symlink ${from} -> ${to}`);
                  } else {
                    throw error;
                  }
                }
              },
            );
          }
        })(),
      );
    }

    if (options.isServer) {
      if (options.dev) {
        const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
        config.plugins.push(new ForkTsCheckerWebpackPlugin());
      }

      if (process.env.BUNDLE_ANALYZER) {
        const {BundleAnalyzerPlugin} = require('webpack-bundle-analyzer');
        config.plugins.push(new BundleAnalyzerPlugin());
      }
    }

    return config;
  },
};

const pathContext = process.env.PATH_CONTEXT;
if (pathContext) {
  config.assetPrefix = pathContext;
  config.basePath = pathContext;
}

module.exports = config;
