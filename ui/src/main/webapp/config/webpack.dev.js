var webpackMerge = require('webpack-merge');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var commonConfig = require('./webpack.common.js');
var helpers = require('./helpers');
var HardSourceWebpackPlugin = require('hard-source-webpack-plugin');
const UglifyWebpackPlugin = require("uglifyjs-webpack-plugin");

module.exports = webpackMerge(commonConfig, {
    devtool: 'source-map', //devtool: 'cheap-module-eval-source-map',

    output: {
        path: helpers.root('../../../target/rhamt-web'),
        filename: 'js/[name].js',
        chunkFilename: 'js/[id].chunk.js'
    },

    module: {
        rules: [
            {
                test: /\.ts$/,
                exclude: /jquery*\.js/,
                use: [
                    {
                        loader: 'thread-loader',
                        options: {
                            // there should be 1 cpu for the fork-ts-checker-webpack-plugin
                            workers: require('os').cpus().length - 1,
                        },
                    },
                    {
                        loader: 'ts-loader',
                        options: {
                            happyPackMode: true // IMPORTANT! use happyPackMode mode to speed-up compilation and reduce errors reported to webpack
                        }
                    },
                    // {
                    //     loader: 'awesome-typescript-loader'
                    // },
                    {
                        loader: 'angular2-template-loader'
                    },
                    {
                        loader: 'angular-router-loader'
                    }
                ]
            }
        ]
    },

    optimization: {
        minimizer: [
            new UglifyWebpackPlugin({
                sourceMap: true,
                uglifyOptions: {
                    compress: false
                },
                cache: true,
                parallel: 4
            })
        ]
    },

    plugins: [
        new ExtractTextPlugin('css/[name].css'),
        new HardSourceWebpackPlugin()
    ],

    devServer: {
        historyApiFallback: true,
        stats: 'minimal'
    }
});
