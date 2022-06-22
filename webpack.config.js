const path = require('path');
const nodeExternals = require('webpack-node-externals');
const NodemonPlugin = require('nodemon-webpack-plugin');
const Dotenv = require('dotenv-webpack');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');

module.exports = (env, argv) => {
  return {
    entry: {
      server: './server/index.ts',
    },
    output: {
      path: path.join(__dirname, 'dist'),
      publicPath: '/',
      filename: '[name].js',
    },
    resolve: {
      plugins: [new TsconfigPathsPlugin()],
      extensions: ['.ts', '.js'],
    },
    mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
    target: 'node',
    node: {
      // Need this when working with express, otherwise the build fails
      __dirname: false, // if you don't put this is, __dirname
      __filename: false, // and __filename return blank or /
    },
    externals: [nodeExternals({
      allowlist:[
        'unified', 
        'bail', 
        'extend', 
        'is-buffer',
        'is-plain-obj',
        'trough',
        'vfile', 
        'vfile-message', 
        'unist-util-stringify-position', 
        'remark-parse', 
        'mdast-util-from-markdown', 
        'mdast-util-to-string', 
        /^micromark/,
        'decode-named-character-reference',
        'character-entities'
      ]}
    )], // Need this to avoid error when working with Express
    module: {
      rules: [
        {
          test: /\.(j|t)s$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-env', '@babel/preset-typescript'],
            },
          },
        },
      ],
    },
    plugins: [
      new NodemonPlugin(),
      new Dotenv({
        path: process.env.NODE_ENV === 'production' ? 'prod.env' : 'dev.env',
      }),
    ],
  };
};
