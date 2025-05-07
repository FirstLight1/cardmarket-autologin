function checkLoginStatus() {
    console.log('Checking login status on Cardmarket');
    
    // Check if the user is already logged in by looking for common elements that only appear when logged in
    const isLoggedIn = 
      document.querySelector('[title="Log in"]') === null; // Check if login button exits
    
    if (isLoggedIn) {
      console.log('User is already logged in');
      return;
    }
    
    console.log('User is not logged in, proceeding with login process');
    
    // Look for a login form in the navigation bar
    loginViaNavbar();
  }
  
  function loginViaNavbar() {
    console.log('Attempting to login via navigation bar');
    
    // Get stored credentials
    chrome.storage.sync.get(['username', 'password'], function(credentials) {
      if (!credentials.username || !credentials.password) {
        console.log('No saved credentials found');
        return;
      }
      
      console.log('Credentials found, searching for login form in navbar');
      
      // Function to find and interact with the login form
      const findAndSubmitLoginForm = () => {
        // Look for login/signin button that might need to be clicked to show the form
  
        
        // Try to find username/email and password fields anywhere on the page
        const usernameField = document.querySelector(".username-input");
        const passwordField = document.querySelector(".password-input");
        
        // Try to find a form or any container of the login fields
        const loginForm = document.getElementById("header-login");
        
        console.log('Username field found:', !!usernameField);
        console.log('Password field found:', !!passwordField);
        console.log('Login form found:', !!loginForm);
        
        // If we found username and password fields
        if (usernameField && passwordField) {
          console.log('Found login fields, filling credentials');
          
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
            console.log('Attempting to submit login');
            
            // Try to find a submit button first
            const submitButton = 
              document.querySelector('[title="Log in"]');
            
            if (submitButton) {
              console.log('Found submit button, clicking it');
              submitButton.click();
            } else if (loginForm) {
              console.log('No submit button found, submitting form directly');
              loginForm.submit();
            }
            
            // Reload the page after a delay to check if login worked

          }, 500);
        } else {
          console.log('Could not find login fields on the page');
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
