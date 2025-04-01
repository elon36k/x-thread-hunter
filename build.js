const fs = require('fs');
const path = require('path');
const webpack = require('webpack');
const archiver = require('archiver');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const HtmlMinimizerPlugin = require("html-minimizer-webpack-plugin");

// Webpack配置
const webpackConfig = {
  mode: 'production',
  entry: {
    content: './content.js',
    popup: './popup.js',
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
    minimizer: [
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
    ],
  }
};

// 创建dist目录
if (!fs.existsSync('dist')) {
  fs.mkdirSync('dist');
}

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
        if (file === 'popup.html') {
          let htmlContent = fs.readFileSync(srcPath, 'utf8');
          // htmlContent = htmlContent.replace('popup.js', 'popup.min.js');
          // htmlContent = htmlContent.replace('styles.css', 'styles.min.css');
          fs.writeFileSync(destPath, htmlContent);
        } else if (file === 'manifest.json') {
          let manifestContent = fs.readFileSync(srcPath, 'utf8');
          // manifestContent = manifestContent.replace('content.js', 'content.min.js');
          fs.writeFileSync(destPath, manifestContent);
        } else {
          fs.copyFileSync(srcPath, destPath);
        }
      }
    }
  });
  
//   // 创建zip压缩包
   const output = fs.createWriteStream('twitter-thread-exporter.zip');
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
