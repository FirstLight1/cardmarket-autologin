function checkLoginStatus() {
    // Check if the user is already logged in by looking for common elements that only appear when logged in
    const isLoggedIn =
        document.querySelector('[title="Log in"]') === null; // Check if login button exists

    if (isLoggedIn) {
        return;
    }

    // Look for a login form in the navigation bar
    console.log("checking log in status");
    loginViaNavbar();
}

function loginViaNavbar() {

    // Get stored credentials and things to derive encryption key
    chrome.storage.local.get(['username', 'password', 'token', 'salt', 'iv'], function (credentials) {
        if (!credentials.username || !credentials.password) {
            console.log("returning");
            return;
        } else {
            credentials.token = new Uint8Array(credentials.token);
            credentials.salt = new Uint8Array(credentials.salt);
            credentials.iv = new Uint8Array(credentials.iv);
        }

        console.log("trying to log in");

        // Combine username and token
        function getKeyMaterial(username, tokenBytes) {
            const enc = new TextEncoder();
            const tokenHex = Array.from(tokenBytes)
                .map((b) => b.toString(16).padStart(2, "0"))
                .join("");

            const combined = `${username}:${tokenHex}`;

            return window.crypto.subtle.importKey(
                "raw",
                enc.encode(combined),
                { name: "PBKDF2" },
                false,
                ["deriveBits", "deriveKey"]
            );
        }

        // Derive key from salt and keyMaterial
        function getKey(keyMaterial, saltBytes) {
            return window.crypto.subtle.deriveKey(
                {
                    name: "PBKDF2",
                    salt: saltBytes,
                    iterations: 100000,
                    hash: "SHA-256",
                },
                keyMaterial,
                { name: "AES-GCM", length: 256 },
                true,
                ["encrypt", "decrypt"]
            );
        }

        // Decrypt password
        async function decrypt(username, passwordArray) {
            const keyMaterial = await getKeyMaterial(username, credentials.token);
            const key = await getKey(keyMaterial, credentials.salt);
            const encryptedBytes = new Uint8Array(passwordArray);

            if (!key) {
                return;
            }

            let decrypted = await window.crypto.subtle.decrypt(
                {
                    name: "AES-GCM",
                    iv: credentials.iv,
                },
                key,
                encryptedBytes.buffer,
            );
            const dec = new TextDecoder();
            return dec.decode(decrypted);
        };

        // Function to find and interact with the login form
        const findAndSubmitLoginForm = () => {

            // Try to find username/email and password fields anywhere on the page
            const usernameField = document.querySelector(".username-input");
            const passwordField = document.querySelector(".password-input");

            // Try to find a submit button first
            const submitButton = document.querySelector('[title="Log in"]');

            // If we found username and password fields
            if (usernameField && passwordField) {

                // Fill in the fields
                usernameField.value = credentials.username;
                decrypt(credentials.username, credentials.password)
                    .then(plaintext => {
                        passwordField.value = plaintext;

                        // Dispatch input events to trigger any listeners
                        usernameField.dispatchEvent(new Event('input', { bubbles: true }));
                        passwordField.dispatchEvent(new Event('input', { bubbles: true }));
                        usernameField.dispatchEvent(new Event('change', { bubbles: true }));
                        passwordField.dispatchEvent(new Event('change', { bubbles: true }));
                        console.log("event dispatched");

                        // Small delay before submission
                        if (submitButton) {
                            console.log("button found");
                            submitButton.click();
                        };
                    });
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
