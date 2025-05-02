// content.js - This script runs on any Cardmarket page
function checkLoginStatus() {
    console.log('Checking login status on Cardmarket');
    
    // Check if the user is already logged in by looking for common elements that only appear when logged in
    // For Cardmarket, we can check for user profile elements or logout buttons
    const isLoggedIn = document.querySelector('.navbar-userPanel-loggedIn') !== null || 
                       document.querySelector('a[href*="Account/LogOut"]') !== null;
    
    if (isLoggedIn) {
      console.log('User is already logged in');
      return;
    }
    
    // If we're not on the login page, navigate to it
    if (!window.location.href.includes('/Account/LogIn')) {
      console.log('Not logged in. Redirecting to login page...');
      // Save the current URL to return after login
      chrome.storage.local.set({ 'returnUrl': window.location.href });
      window.location.href = window.location.origin + '/' + window.location.href.split('/')[3] + '/Account/LogIn';
      return;
    }
    
    // If we're on the login page, attempt to log in
    autoLogin();
  }
  
  function autoLogin() {
    console.log('On login page. Attempting auto-login');
    
    // Get stored credentials
    chrome.storage.sync.get(['username', 'password'], function(credentials) {
      if (!credentials.username || !credentials.password) {
        console.log('No saved credentials found');
        return;
      }
      
      // Wait for the page to fully load
      setTimeout(() => {
        // Find the username and password fields
        const usernameField = document.querySelector('input[name="Username"]');
        const passwordField = document.querySelector('input[name="Password"]');
        const loginForm = document.querySelector('form[action*="LogIn"]');
        
        // Fill in the fields if they exist
        if (usernameField && passwordField && loginForm) {
          usernameField.value = credentials.username;
          passwordField.value = credentials.password;
          
          // Get the return URL if it exists
          chrome.storage.local.get(['returnUrl'], function(data) {
            if (data.returnUrl) {
              // Add a hidden field for the return URL if the form supports it
              // This depends on how Cardmarket handles redirects after login
              // You may need to adjust this based on Cardmarket's specific implementation
              const returnUrlField = document.createElement('input');
              returnUrlField.type = 'hidden';
              returnUrlField.name = 'ReturnUrl';
              returnUrlField.value = data.returnUrl;
              loginForm.appendChild(returnUrlField);
              
              // Clear the stored URL
              chrome.storage.local.remove('returnUrl');
            }
            
            // Submit the form
            loginForm.submit();
            console.log('Login form submitted');
          });
        } else {
          console.log('Could not find login form elements');
        }
      }, 500);
    });
  }

  document.addEventListener('DOMContentLoaded', checkLoginStatus);