const fs = require('fs');
const path = require('path');
const webpack = require('webpack');
const archiver = require('archiver');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const HtmlMinimizerPlugin = require("html-minimizer-webpack-plugin");
const TerserPlugin = require('terser-webpack-plugin');

// Webpack配置
const webpackConfig = {
  mode: 'production',
  entry: {
    content: './content.js',
    popup: './popup.js',
    styles: './styles.css'  // 添加styles.css作为入口
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist')
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader'
        ]
      },
      {
        test: /\.html$/i,
        type: "asset/resource",
        generator: {
          filename: '[name][ext]'
        }
      }
    ]
  },
  plugins: [
    new webpack.optimize.ModuleConcatenationPlugin(),
    new MiniCssExtractPlugin({
      filename: '[name].css'
    })
  ],
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          format: {
            comments: false,
          },
          compress: {
            drop_console: false,
            drop_debugger: true
          }
        },
        extractComments: false
      }),
      new CssMinimizerPlugin({
        minimizerOptions: {
          preset: [
            'default',
            {
              discardComments: { removeAll: true },
            },
          ],
        },
      }),
      new HtmlMinimizerPlugin({
        minimizerOptions: {
          collapseWhitespace: true,
          removeComments: true,
          minifyCSS: true,
          minifyJS: true
        }
      })
    ],
  }
};

// 清理并创建dist目录
if (fs.existsSync('dist')) {
  fs.rmSync('dist', { recursive: true, force: true });
}
fs.mkdirSync('dist');

// 运行webpack打包
webpack(webpackConfig, (err, stats) => {
  if (err) {
    console.error(err);
    return;
  }
  
  console.log(stats.toString({
    chunks: false,
    colors: true
  }));
  
  // 复制其他必要文件到dist目录
  const filesToCopy = ['manifest.json', 'popup.html', 'images'];
  filesToCopy.forEach(file => {
    const srcPath = path.join(__dirname, file);
    const destPath = path.join(__dirname, 'dist', file);
    
    if (fs.existsSync(srcPath)) {
      if (fs.lstatSync(srcPath).isDirectory()) {
        copyFolderSync(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    } else {
      console.warn(`警告: ${srcPath} 不存在，已跳过`);
    }
  });
  
  // 创建zip压缩包
  const output = fs.createWriteStream('x-thread-hunter.zip');
  const archive = archiver('zip', { zlib: { level: 9 } });
  
  output.on('close', () => {
    console.log(`压缩包创建完成，大小: ${archive.pointer()} bytes`);
  });
  
  archive.on('error', (err) => {
    throw err;
  });
  
  archive.pipe(output);
  archive.directory('dist/', false);
  archive.finalize();
});

// 递归复制文件夹
function copyFolderSync(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest);
  }
  
  fs.readdirSync(src).forEach(item => {
    const srcPath = path.join(src, item);
    const destPath = path.join(dest, item);
    
    if (fs.lstatSync(srcPath).isDirectory()) {
      copyFolderSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  });
}
