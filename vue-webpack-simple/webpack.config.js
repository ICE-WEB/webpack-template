var path = require('path')
var webpack = require('webpack')
var CleadWebpackPlugin = require("clean-webpack-plugin");
var HtmlWebpackPlugin = require("html-webpack-plugin");


let webpackConfig = {
  entry: {
            main:'src/main.js',
            vendor:['vue','vuex','vue-router'],//公共部分 长期不修改文件。
          },
  output: {
    path: path.resolve("dist/lib"),
    publicPath: 'lib/',
    filename: '[name].[chunkHash:6].js',
    chunkFilename:'[name].[chunkHash:6].js'

  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          'vue-style-loader',
          'css-loader',
          'less-loader',
        ],
      }, 
      {
        test: /\.vue$/,
        loader: 'vue-loader',
        options: {
          loaders: {
          }
        }
      },
      {
        test: /\.js$/,
        loader: 'babel-loader',
        exclude: /node_modules/
      },
    ]
  },
  resolve: {
    alias: {
      'vue$': 'vue/dist/vue.common.js',
      'src':path.resolve("src"),
      // 'util':path.resolve('src/util'),
      // 'assets':path.resolve('dist/assets'),
    },
    extensions: ['*', '.js', '.vue', '.json','.less']
  },
  devtool: 'inline-source-map',
  plugins:[
    new CleadWebpackPlugin([path.resolve('dist/lib'),path.resolve('dist/index.html')]),
    new webpack.optimize.CommonsChunkPlugin({
      name:['vendor','mainfirst']
    }),
    new HtmlWebpackPlugin({
      template:path.resolve('src',"index.html"),
      filename:'../index.html',
      // hash:true,
      chunks:['vendor','mainfirst','main'],
    })
  ]
}

if (process.env.NODE_ENV === 'production') {
  // module.exports.devtool = '#source-map'
  webpackConfig.plugins = (webpackConfig.plugins || []).concat([
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: '"production"'
      }
    }),
    new webpack.optimize.UglifyJsPlugin({
      compress: {
        warnings: false
      }
    }),
  ])
}


module.exports = webpackConfig;