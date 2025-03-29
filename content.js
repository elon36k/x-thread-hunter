// Function to extract thread content from Twitter page
function extractThreadContent() {
  // Get all tweet elements in the thread
  const tweets = document.querySelectorAll('[data-testid="tweet"]');
  
  // Get the original author from first tweet
  const originalAuthor = tweets[0]?.querySelector('[data-testid="User-Name"]')?.textContent || '';
  
  // Extract relevant information from each tweet, filtering non-author replies
  const threadContent = Array.from(tweets).filter(tweet => {
    // const author = tweet.querySelector('[data-testid="User-Name"]')?.textContent?.trim().replace(/^@/, '') || '';
    // return author === originalAuthor.trim().replace(/^@/, '');
    return true
  }).map(tweet => {
    const author = tweet.querySelector('[data-testid="User-Name"]')?.textContent || '';
    const text = tweet.querySelector('[data-testid="tweetText"]')?.textContent || '';
    const time = tweet.querySelector('time')?.textContent || '';
    
    // Extract media elements
    const media = [];
    const images = tweet.querySelectorAll('img[alt="Image"]');
    images.forEach(img => {
      media.push({
        type: 'image',
        url: img.src,
        alt: img.alt
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
    
    return { author, text, time, media };
  });
  
  return threadContent;
}

// Function to format content as markdown
function formatAsMarkdown(threadContent) {
  return threadContent.map(tweet => {
    let mediaContent = '';
    tweet.media.forEach(media => {
      if (media.type === 'image') {
        mediaContent += `![${media.alt}](${media.url})\n\n`;
      } else if (media.type === 'video') {
        mediaContent += `[视频链接](${media.url})\n\n`;
      }
    });
    return `**${tweet.author}** (${tweet.time})\n\n${tweet.text}\n\n${mediaContent}---\n\n`;
  }).join('\n');
}

// Function to format content for PDF
function formatForPDF(threadContent) {
  return threadContent.map(tweet => {
    let mediaContent = '';
    tweet.media.forEach(media => {
      if (media.type === 'image') {
        mediaContent += `<img src="${media.url}" alt="${media.alt}" style="max-width: 100%;">`;
      } else if (media.type === 'video') {
        mediaContent += `<div class="video-placeholder">视频: <a href="${media.url}">点击查看</a></div>`;
      }
    });
    return `<div class="tweet">
      <h3>${tweet.author}</h3>
      <small>${tweet.time}</small>
      <p>${tweet.text}</p>
      ${mediaContent}
    </div>`;
  }).join('');
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