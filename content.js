function checkLoginStatus() {
    console.log('Checking login status on Cardmarket');
    
    // Check if the user is already logged in by looking for common elements that only appear when logged in
    const isLoggedIn = 
      document.querySelector('.d-flex.align-items-center a[href*="/User/"] span') !== null || // Username in navbar
      document.querySelector('a[href*="Account/LogOut"]') !== null || // Logout link
      document.querySelector('.nav-item a[href*="/Wants"]') !== null; // "Wants" link that typically only appears when logged in
    
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
        const loginButton = 
          document.querySelector('a[href*="LogIn"]') || 
          document.querySelector('button:contains("Login")') ||
          document.querySelector('button:contains("Sign in")') ||
          document.querySelector('.nav-link:contains("Login")');
        
        if (loginButton && !document.querySelector('input[type="password"]')) {
          console.log('Found login button, clicking to reveal form');
          loginButton.click();
          // Wait for the form to appear after clicking
          setTimeout(findAndSubmitLoginForm, 500);
          return;
        }
        
        // Try to find username/email and password fields anywhere on the page
        const usernameField = 
          document.querySelector('input[name="username"]') || 
          document.querySelector('input[id="username"]') ||
          document.querySelector('input[type="text"][id*="username" i]') ||
          document.querySelector('input[type="email"]') ||
          document.querySelector('input[placeholder*="username" i]') ||
          document.getElementsByClassName("username-input");
          
        const passwordField = 
          document.querySelector('input[name="Password"]') || 
          document.querySelector('input[id="Password"]') ||
          document.querySelector('input[type="password"]') ||
          document.getElementsByClassName("password-input");
        
        // Try to find a form or any container of the login fields
        const loginForm = 
          document.querySelector('form[action*="LogIn"]') ||
          (usernameField && usernameField.closest('form')) ||
          document.querySelector('form')||
          document.getElementById("header-login");
        
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
              document.querySelector('button[type="submit"]') ||
              document.querySelector('input[type="submit"]') ||
              document.querySelector('button:contains("Login")') ||
              document.querySelector('button.btn-primary') ||
              document.querySelector('button:contains("Sign in")');
            
            if (submitButton) {
              console.log('Found submit button, clicking it');
              submitButton.click();
            } else if (loginForm) {
              console.log('No submit button found, submitting form directly');
              loginForm.submit();
            } else {
              console.log('No submit method found, trying to trigger Enter key');
              // Try to simulate pressing Enter in the password field
              const enterEvent = new KeyboardEvent('keydown', {
                key: 'Enter',
                code: 'Enter',
                which: 13,
                keyCode: 13,
                bubbles: true
              });
              passwordField.dispatchEvent(enterEvent);
            }
            
            // Reload the page after a delay to check if login worked
            setTimeout(() => {
              console.log('Reloading page to verify login status');
              window.location.reload();
            }, 2000);
          }, 500);
        } else {
          console.log('Could not find login fields on the page');
        }
      };
      
      // First attempt
      findAndSubmitLoginForm();
      
      // Try again after a delay in case elements load dynamically
      setTimeout(findAndSubmitLoginForm, 1500);
    });
  }
  
  // Wait for the DOM to be fully loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkLoginStatus);
  } else {
    // DOM is already ready
    checkLoginStatus();
  }
  
  // Also run after a delay to catch any dynamic content
  setTimeout(checkLoginStatus, 1000);