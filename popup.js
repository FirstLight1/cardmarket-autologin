document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('credentialsForm');
    const status = document.getElementById('status');
    
    // Load saved credentials if they exist
    chrome.storage.sync.get(['username'], function(items) {
      if (items.username) {
        document.getElementById('username').value = items.username;
        document.getElementById('password').value = '';
      }
    });
    
    // Save credentials when form is submitted
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const username = document.getElementById('username').value;
      const password = document.getElementById('password').value;
      
      chrome.storage.sync.set({
        username: username,
        password: password
      }, function() {
        status.textContent = 'Credentials saved!';
        status.className = 'status success';

        document.getElementById('username').value = '';
        document.getElementById('password').value = '';

        setTimeout(function() {
          status.textContent = '';
          status.className = 'status';
        }, 3000);
      });
      
    });
  });