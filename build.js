const fs = require('fs');
const path = require('path');
const webpack = require('webpack');
const archiver = require('archiver');

// Webpack配置
const webpackConfig = {
  mode: 'production',
  entry: {
    content: './content.js',
    popup: './popup.js'
  },
  output: {
    filename: '[name].min.js',
    path: path.resolve(__dirname, 'dist')
  },
  plugins: [
    new webpack.optimize.ModuleConcatenationPlugin()
  ]
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
  const filesToCopy = ['manifest.json', 'popup.html', 'styles.css', 'images'];
  filesToCopy.forEach(file => {
    const srcPath = path.join(__dirname, file);
    const destPath = path.join(__dirname, 'dist', file);
    
    if (fs.existsSync(srcPath)) {
      if (fs.lstatSync(srcPath).isDirectory()) {
        copyFolderSync(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  });
  
  // 创建zip压缩包
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