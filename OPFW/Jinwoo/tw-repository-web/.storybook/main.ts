import type { StorybookConfig } from "@storybook/react-webpack5";
import type { Options } from '@swc/core';
import path from 'path';

const config: StorybookConfig = {
  stories: [
      // "../src/**/*.mdx",
      "../project_front/src/components/**/*.stories.@(js|jsx|mjs|ts|tsx)"
  ],
  addons: [
    "@storybook/addon-webpack5-compiler-swc",
    "@storybook/addon-onboarding",
    "@storybook/addon-links",
    "@storybook/addon-essentials",
    "@chromatic-com/storybook",
    "@storybook/addon-interactions",
    {
      name: '@storybook/addon-postcss',
      options: {
        postcssLoaderOptions: {
          implementation: require('postcss'),
        },
      },
    },
    "@storybook/addon-styling-webpack"
  ],
  framework: {
    name: "@storybook/react-webpack5",
    options: {},
  },
  swc: (config: Options, options:any): Options => {
    return {
      ...config,
      jsc: {
        transform: {
          react: {
            runtime: 'automatic'
          }
        }
      }
    };
  },
  webpackFinal: async (config:any) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@": path.resolve(__dirname, "../project_front/src"),
      '@scss': path.resolve(__dirname, "../project_front/scss"),
      "@images": path.resolve(__dirname, "../project_front/assets/image"),
    };
    config.module.rules.push({
      test: /\.scss$/,
      use: ['style-loader', 'css-loader', 'sass-loader'],
      // include: path.resolve(__dirname, '../'),
    });

    return config;
  }
};
export default config;
