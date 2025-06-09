const checkbox = document.querySelector(".checkbox");

async function loadOptions(){
    chrome.storage.local.get("checked", (data) =>{
        checkbox.checked = Boolean(data.checked)
    });
}

loadOptions();

checkbox.addEventListener("click", async (event) => {
    const checked = event.target.checked;
    chrome.storage.local.set({checked});

    
    // Check active tab's URL
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (tab.url.includes("https://www.cardmarket.com")) {
        // Reload the page if it's the one you're targeting
        chrome.tabs.reload(tab.id);
    }

})

function showPsw(){
    const x = document.getElementById("password");
    if (x.type === "password") {
        x.type = "text";
    } else {
        x.type = "password";
    }
}

document.querySelector(".showPSW").addEventListener('click', () => {
    showPsw();
})


document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("credentialsForm");
    const status = document.getElementById("status");

    let tokenBytes, saltBytes, ivBytes;

    // Try to load token, salt and IV for encryption
    chrome.storage.local.get(["token", "salt", "iv"], function (crypts) {
        if (!crypts.token || !crypts.salt || !crypts.iv) {
            tokenBytes = crypto.getRandomValues(new Uint8Array(32));
            saltBytes = crypto.getRandomValues(new Uint8Array(16));
            ivBytes = crypto.getRandomValues(new Uint8Array(12));

            chrome.storage.local.set({
                token: Array.from(tokenBytes),
                salt: Array.from(saltBytes),
                iv: Array.from(ivBytes),
            });
        } else {
            tokenBytes = new Uint8Array(crypts.token);
            saltBytes = new Uint8Array(crypts.salt);
            ivBytes = new Uint8Array(crypts.iv);
        }
    });

    function getMessageEncoding(password) {
        const enc = new TextEncoder();
        return enc.encode(password);
    }

    // Get material to derive encryption key
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

    // Derive key from keyMaterial and saltBytes
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

    // Encrypt password
    async function encrypt(username, password) {
        if (!tokenBytes || !saltBytes || !ivBytes) {
            throw new Error("Key material not initialized yet");
        }

        const keyMaterial = await getKeyMaterial(username, tokenBytes);
        const key = await getKey(keyMaterial, saltBytes);
        const encoded = getMessageEncoding(password);

        const ciphertext = await window.crypto.subtle.encrypt(
            {
                name: "AES-GCM",
                iv: ivBytes,
            },
            key,
            encoded
        );

        return new Uint8Array(ciphertext);
    }


    // Load saved credentials if they exist
    chrome.storage.local.get(["username", "password"], function (items) {
        if (items.username && items.password) {
            document.getElementById("username").value = items.username;
            document.getElementById("password").placeholder = "Password saved";
            
        }
    });

    // Save credentials when form is submitted
    form.addEventListener("submit", async function (e) {
        e.preventDefault();

        const username = document.getElementById("username").value;
        const password = document.getElementById("password").value;

        const ctBytes = await encrypt(username, password);
        const ctArr = Array.from(ctBytes);

        chrome.storage.local.set(
            {
                username: username,
                password: ctArr,
            },
            function () {
                status.textContent = "Credentials saved!";
                status.className = "status success";

                document.getElementById("username").value = "";
                document.getElementById("password").value = "";

                setTimeout(function () {
                    status.textContent = "";
                    status.className = "status";
                }, 3000);
            }
        );
    });
});

