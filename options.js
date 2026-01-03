// Save settings to chrome.storage
function saveOptions() {
  const apiKey = document.getElementById('apiKey').value;
  chrome.storage.local.set(
    { geminiApiKey: apiKey },
    () => {
      const status = document.getElementById('status');
      status.textContent = 'Options saved.';
      setTimeout(() => {
        status.textContent = '';
      }, 750);
    }
  );
}

// Restore settings from chrome.storage
function restoreOptions() {
  chrome.storage.local.get(
    { geminiApiKey: '' },
    (items) => {
      document.getElementById('apiKey').value = items.geminiApiKey;
    }
  );
}

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('save').addEventListener('click', saveOptions);
