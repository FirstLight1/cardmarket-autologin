function checkLoginStatus() {
    // Check if the user is already logged in by looking for common elements that only appear when logged in
    const isLoggedIn = 
      document.querySelector('[title="Log in"]') === null; // Check if login button exits
    
    if (isLoggedIn) {
      return;
    }
    // Look for a login form in the navigation bar
    loginViaNavbar();
  }
  
  function loginViaNavbar() {

    // Get stored credentials
    chrome.storage.sync.get(['username', 'password'], function(credentials) {
      if (!credentials.username || !credentials.password) {
        return;
      }
      
      // Function to find and interact with the login form
      const findAndSubmitLoginForm = () => {
          
        // Try to find username/email and password fields anywhere on the page
        const usernameField = document.querySelector(".username-input");
        const passwordField = document.querySelector(".password-input");

          // Try to find a submit button first
        const submitButton = document.querySelector('[title="Log in"]');

        if (usernameField.value && passwordField.value){
          submitButton.click();
          return;
        }
        
        // Try to find a form or any container of the login fields
        const loginForm = document.getElementById("header-login");
        
        // If we found username and password fields
        if (usernameField && passwordField) {
          
          // Fill in the fields
          usernameField.value = credentials.username;
          passwordField.value = credentials.password;

          
          
          // Dispatch input events to trigger any listeners
          usernameField.dispatchEvent(new Event('input', { bubbles: true }));
          passwordField.dispatchEvent(new Event('input', { bubbles: true }));
          usernameField.dispatchEvent(new Event('change', { bubbles: true }));
          passwordField.dispatchEvent(new Event('change', { bubbles: true }));
          
          // Small delay before submission
          setTimeout(() => {
            
          
            
            if (submitButton) {
              submitButton.click();
            } else if (loginForm) {
              loginForm.submit();
            }
          }, 500);
        }
      };
      
      findAndSubmitLoginForm();
    });
  }
  
  // Wait for the DOM to be fully loaded
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkLoginStatus);
  } else {
    // DOM is already ready
    checkLoginStatus();
  }
