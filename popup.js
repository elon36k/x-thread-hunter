// Show notification function
function showNotification(message) {
  const notification = document.getElementById('notification');
  notification.textContent = message;
  notification.style.display = 'block';
  setTimeout(() => {
    notification.style.display = 'none';
  }, 2000);
}

// Load and display thread preview when popup opens
(async function initPreview() {
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
  
  // Display HTML preview
  document.getElementById('preview-content').innerHTML = response.content??"";
})();

// document.getElementById('export-pdf').addEventListener('click', async () => {
//   const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
  
//   // First inject content.js
//   await chrome.scripting.executeScript({
//     target: {tabId: tab.id},
//     files: ['content.js']
//   });
  
//   // Then send message to get formatted content
//   const response = await chrome.tabs.sendMessage(tab.id, {
//     action: 'export',
//     format: 'pdf'
//   });
  
//   // Create and download PDF
//   const blob = new Blob([response.content], {type: 'text/html'});
//   const url = URL.createObjectURL(blob);
//   chrome.downloads.download({
//     url: url,
//     filename: 'twitter-thread.pdf',
//     saveAs: true
//   });
// });

document.getElementById('copy-md').addEventListener('click', async () => {
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
  
  // Copy to clipboard
  await navigator.clipboard.writeText(response.content);
  showNotification('Markdown copied to clipboard!');
});
document.getElementById('copy-html').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
  
  // copy selected content from #preview-content to clipboard
  const range = document.createRange();
  range.selectNode(document.getElementById('preview-content'));
  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);
  document.execCommand('copy');
  selection.removeAllRanges();
  showNotification('Content copied to clipboard!');
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
    filename: 'x-thread.md',
    saveAs: true
  });
});
