import * as webpack from 'webpack';

import * as path from 'path';
const HtmlWebpackPlugin = require('html-webpack-plugin')
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

const config: webpack.Configuration = {
    resolve: {
        extensions: ['.ts', '.tsx', '.js']
    },
    devtool: 'inline-source-map',
    mode: 'development',
    entry: {
        main: "./src/index.tsx"
    },
    output: {
        path: path.resolve(__dirname, './dist'),
        filename: '[name].bundle.js',
    },
    module: {
        rules: [
            { test: /\.tsx?$/, loader: "ts-loader" },
            { test: /\.txt$/, use: ["file-loader"] },
            {
                test: /\.css$/i,
                use: ["style-loader", "css-loader"],
            },
            {
                test: /(\.mp3|\.jpg)$/,
                type: 'asset/resource'
            },
            {test: /\.svg$/, loader: 'file-loader'}
        ]
    },
    devServer: {
        port: 3010,
        disableHostCheck: true,
        host: '10.160.32.104',//your ip address
    },
    plugins: [
        new webpack.HotModuleReplacementPlugin(),
        new HtmlWebpackPlugin({
            title: 'Typist',
            template: path.resolve(__dirname, 'src/index.html'),
            filename: 'index.html'
        }),
        new BundleAnalyzerPlugin()
    ]
}

module.exports = config;
