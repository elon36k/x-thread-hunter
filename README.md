# x-thread-hunter

chrome插件，获取Twitter上的threads的数据，可以一键复制序列或保存成markdown格式，方便文档收集整理

整理的内容包含以下信息：

- 文本，保留原始内容和格式，链接保留标题和URL
- 图片，直接引用原始图片
- 视频，只保留视频封面

## 存在的问题

Threads过长，可能会因为内容没有完全加载而无法全部获取到内容。这个做为TODO，放后面优化。


## 使用

打开chrome扩展程序[chrome://extensions/](chrome://extensions/),打开 开发者模式，把目录直接拉进去。

## 优化

```bash
# 安装npm依赖
npm install 

# 内容压缩 + 打包
node build.js

# 把dist目录加到chrome扩展程序中

```

