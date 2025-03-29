document.getElementById('export-pdf').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
  
  // First inject content.js
  await chrome.scripting.executeScript({
    target: {tabId: tab.id},
    files: ['content.js']
  });
  
  // Then send message to get formatted content
  const response = await chrome.tabs.sendMessage(tab.id, {
    action: 'export',
    format: 'pdf'
  });
  
  // Create and download PDF
  const blob = new Blob([response.content], {type: 'text/html'});
  const url = URL.createObjectURL(blob);
  chrome.downloads.download({
    url: url,
    filename: 'twitter-thread.pdf',
    saveAs: true
  });
});

document.getElementById('export-md').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
  
  // First inject content.js
  await chrome.scripting.executeScript({
    target: {tabId: tab.id},
    files: ['content.js']
  });
  
  // Then send message to get formatted content
  const response = await chrome.tabs.sendMessage(tab.id, {
    action: 'export',
    format: 'markdown'
  });
  
  // Create and download Markdown
  const blob = new Blob([response.content], {type: 'text/markdown'});
  const url = URL.createObjectURL(blob);
  chrome.downloads.download({
    url: url,
    filename: 'twitter-thread.md',
    saveAs: true
  });
});