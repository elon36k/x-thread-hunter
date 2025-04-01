// Function to extract thread content from Twitter page
function extractThreadContent() {
  // Get all tweet elements in the thread
  const tweets = document.querySelectorAll('[data-testid="tweet"]');
  
  // Get the original author from first tweet
  const originalAuthor = tweets[0]?.querySelector('[data-testid="User-Name"]')?.textContent?.match(/@?\w+/)?.[0] || '';
  let seenNonAuthor = false;
     // Extract relevant information from each tweet, filtering non-author replies
  const threadContent = Array.from(tweets).filter(tweet => {
    // 如果已经遇到过非作者回复，后续内容都不要
    if (seenNonAuthor) {
      return false;
    }
    const author = tweet.querySelector('[data-testid="User-Name"]')?.textContent?.match(/@?\w+/)?.[0] || '';
    // 记录是否已经遇到非作者回复
    if (!seenNonAuthor && author !== originalAuthor) {
      seenNonAuthor = true;
      return false;
    }
 
    return author === originalAuthor;
  }).map(tweet => {
    const author = tweet.querySelector('[data-testid="User-Name"]')?.textContent.replace(/^(.*@\w+)(.*)$/, '$1') || '';
    const text = tweet.querySelector('[data-testid="tweetText"]')?.textContent || '';
    const html = tweet.querySelector('[data-testid="tweetText"]')?.innerHTML || ''
    const time = tweet.querySelector('time')?.textContent || '';
    
    // Extract media elements
    const media = [];
    const images = tweet.querySelectorAll('img[alt="Image"]');
    images.forEach(img => {
      media.push({
        type: 'image',
        url: img.src,
        alt: img.alt,
      });
    });
    
    const videos = tweet.querySelectorAll('video');
    videos.forEach(video => {
      media.push({
        type: 'video',
        url: video.src || video.querySelector('source')?.src,
        poster: video.poster
      });
    });
    
    return { author, text, time, media , html };
  });
  
  return threadContent;
}

// Function to format content as markdown
function formatAsMarkdown(threadContent) {
  const content =  threadContent.map(tweet => {
    let mediaContent = '';
    tweet.media.forEach(media => {
      if (media.type === 'image') {
        mediaContent += `![${media.alt}](${media.url})\n\n`;
      } else if (media.type === 'video') {
        mediaContent += `[VIDEO POSTER](${media.poster})\n\n`;
      }
    });
  // 清理html内容，提取<span>之间的内容，把链接替换成markdown链接
  const md = tweet.html
    // 提取<span>标签内的内容
    .replace(/<span[^>]*>(.*?)<\/span>/g, '$1')
    // 将HTML链接转换为Markdown格式
    .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/g, '[$2]($1)')
    // 清理html标签
    .replace(/<[^>]+>/g, '')
    // 清理多余空格和换行
    .trim();

    return `${md}\n\n${mediaContent}\n\n`;
  }).join('\n');

  if (content) {
    return `** ${threadContent[0].author}**\n\n${threadContent[0].time}\n\n${content}`; 
  }
  return '';
}
// 导出PDF格式的Buffer
async function exportPDFBuffer(htmlContent) {
  // 创建一个新的HTML文档
  const doc = new DOMParser().parseFromString(htmlContent, 'text/html');
  
  // 添加基本样式
  const style = doc.createElement('style');
  style.textContent = `
    body { font-family: Arial, sans-serif; }
    .tweet { margin-bottom: 20px; padding: 10px; border-bottom: 1px solid #eee; }
    .video-container { position: relative; }
    .play-button-overlay { 
      position: absolute; 
      top: 50%; 
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 48px;
      color: white;
      background: rgba(0,0,0,0.5);
      border-radius: 50%;
      padding: 20px;
    }
  `;
  doc.head.appendChild(style);
  
  // 将HTML转换为PDF Buffer
  const pdfBuffer = await html2pdf()
    .set({
      margin: [10, 10],
      filename: 'twitter-thread.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    })
    .from(doc.body)
    .outputPdf('arraybuffer');
    
  return pdfBuffer;
}


// Function to format content for PDF
function formatForPDF(threadContent) {
  const content =  threadContent.map(tweet => {
    let mediaContent = '';
    tweet.media.forEach(media => {
      if (media.type === 'image') {
        mediaContent += `<img src="${media.url}" alt="${media.alt}" style="max-width: 100%;">`;
      } else if (media.type === 'video') {
        mediaContent += `<div class="video-container">
          <img src="${media.poster || ''}" alt="VIDEO POSTER" style="max-width: 100%;">
         
        </div>`;
      }
    });
    // 清理HTML标签，只保留target和href属性
    const html = tweet.html
      .replace(/<a[^>]*(?:href="[^"]*"|target="[^"]*")[^>]*>/g, match => {
        const href = match.match(/href="([^"]*)"/)?.[0] || '';
        const target = match.match(/target="([^"]*)"/)?.[0] || '';
        return `<a ${href} ${target}>`;
      })
      // 替换@用户名的链接为纯文本
      .replace(/\n*<a[^>]*>(@\w+)<\/a>/g, '$1')
      // 去掉div标签
      .replace(/<div[^>]*>(.*)<\/div>/g, '$1')
      .replace(/<span[^>]*>/g, '<span>')
      .replace(/\n/g, "<br/>")
  

    return `<div class="tweet">
      <p>${html}</p>
      ${mediaContent}
    </div>`;
  }).join('');

  if(content){
   return `
    <div class="thread-content">
      <h1>${threadContent[0].author}</h1>
      <p class="time">${threadContent[0].time}</p>
      ${content}
    </div>
   ` 
  }
  return '';
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'export') {
    const threadContent = extractThreadContent();
    
    if (request.format === 'markdown') {
      const markdown = formatAsMarkdown(threadContent);
      sendResponse({ content: markdown });
    } else if (request.format === 'pdf') {
      const htmlContent = formatForPDF(threadContent);
      sendResponse({ content: htmlContent });
    }
  }
});