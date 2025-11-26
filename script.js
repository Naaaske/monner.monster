const pdfFileInput = document.getElementById('pdfFileInput');
const base64Output = document.getElementById('base64Output');
const base64Input = document.getElementById('base64Input');
const downloadLinkContainer = document.getElementById('downloadLinkContainer');
const copyButton = document.getElementById('copyButton');
const decodeButton = document.getElementById('decodeButton');
const fileNameInput = document.getElementById('fileNameInput');

// Debounce mechanism to prevent spamming conversions
let debounceTimeout = null;

// --- Utility Functions ---

/**
 * Shows a temporary, colored message to the user.
 * @param {string} message - The message content.
 * @param {string} type - 'success', 'error', or 'info'.
 */
function showMessage(message, type) {
    const box = document.getElementById('message-box');
    
    // Reset classes
    box.className = 'message-box';
    
    // Apply message type class
    box.classList.add(type);
    
    box.textContent = message;
    box.classList.remove('hidden');

    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
        box.classList.add('hidden');
    }, 5000);
}

/**
 * Safely converts Base64 string to a Uint8Array.
 * @param {string} base64 - The Base64 string (can include the mime type prefix).
 * @returns {Uint8Array}
 */
function base64ToUint8Array(base64) {
    // Remove the data URL prefix if present (e.g., "data:application/pdf;base64,")
    const base64String = base64.split(',').pop();
    const raw = window.atob(base64String);
    const rawLength = raw.length;
    const array = new Uint8Array(rawLength);

    for (let i = 0; i < rawLength; i++) {
        array[i] = raw.charCodeAt(i);
    }
    return array;
}

/**
 * Copies text from a given element ID to the clipboard.
 * @param {string} elementId - The ID of the textarea/input to copy from.
 */
function copyToClipboard(elementId) {
    const element = document.getElementById(elementId);
    if (!element.value) {
        showMessage("Nothing to copy. Please encode a file first.", 'info');
        return;
    }

    // Select the text
    element.select();
    element.setSelectionRange(0, 99999); // For mobile devices

    try {
        // Use execCommand('copy') for cross-browser compatibility within iframes
        document.execCommand('copy');
    } catch (err) {
        console.error('Failed to copy text: ', err);
        showMessage("Failed to copy. Please select the text manually.", 'error');
    }
}

// --- Main Conversion Logic ---

/**
 * Converts the uploaded PDF file to a Base64 string.
 */
function convertPdfToBase64() {
    const file = pdfFileInput.files[0];
    base64Output.value = ''; // Clear previous output
    copyButton.disabled = true;
    downloadLinkContainer.innerHTML = '';

    if (!file) {
        showMessage("Please select a PDF file first.", 'error');
        return;
    }

    if (file.type !== 'application/pdf') {
        showMessage("The selected file is not a PDF.", 'error');
        pdfFileInput.value = '';
        return;
    }

    showMessage("Encoding started...", 'info');

    const reader = new FileReader();

    reader.onload = function(event) {
        // The result is the full data URL (e.g., "data:application/pdf;base64,...")
        const dataUrl = event.target.result;
        
        const includePrefix = includePrefixCheckbox.checked;
        let outputString = dataUrl;

        if (!includePrefix) {
            // If the user does not want the prefix, split the string at the comma
            const parts = dataUrl.split(',');
            if (parts.length > 1) {
                outputString = parts.pop();
            }
        }

        base64Output.value = outputString;
        copyButton.disabled = false;
        showMessage("PDF successfully encoded to Base64!", 'success');
    };

    reader.onerror = function() {
        showMessage("An error occurred while reading the file.", 'error');
    };

    // Read the file as a Data URL
    reader.readAsDataURL(file);
}

/**
 * Converts the Base64 string back to a PDF file and generates a download link.
 */
function convertBase64ToPdf() {
    const base64 = base64Input.value.trim();
    downloadLinkContainer.innerHTML = '';

    if (!base64) {
        showMessage("Please paste a Base64 string into the input area.", 'error');
        return;
    }

    try {
        // 1. Convert Base64 to Array Buffer (Uint8Array)
        const pdfBytes = base64ToUint8Array(base64);

        // 2. Create a Blob (Binary Large Object)
        // We assume the decoded content is a PDF, so we use the correct MIME type.
        const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });

        // 3. Create a downloadable link (anchor element)
        const url = URL.createObjectURL(pdfBlob);
        const a = document.createElement('a');
        
        let fileName = fileNameInput.value.trim();
        if (!fileName || !fileName.toLowerCase().endsWith('.pdf')) {
            fileName = (fileName || 'decoded_document') + '.pdf';
        }

        a.href = url;
        a.download = fileName; // Use the user-provided file name
        a.textContent = `Download '${fileName}'`;
        a.className = "download-link"; // Custom class for styling
        
        // This is the crucial part: Programmatically trigger the download instantly.
        // It's best practice to append it briefly before clicking.
        downloadLinkContainer.appendChild(a); 
        a.click();
        
        // Clean up: remove the temporary link and revoke the URL
        downloadLinkContainer.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 100); 

    } catch (e) {
        console.error("Decoding error:", e);
    }
}

// --- Event Listeners for UI State ---

document.addEventListener('DOMContentLoaded', () => {
    // Event listener for file selection change
    pdfFileInput.addEventListener('change', () => {
        base64Output.value = ''; // Clear previous output on new file selection
        copyButton.disabled = true;
        downloadLinkContainer.innerHTML = '';
    });

    // Event listener for Base64 input change
    base64Input.addEventListener('input', () => {
        // Enable decode button only if there is text in the input
        decodeButton.disabled = base64Input.value.trim().length === 0;
        downloadLinkContainer.innerHTML = ''; // Clear previous download link
    });

    // Initial check for decode button state and file name
    decodeButton.disabled = base64Input.value.trim().length === 0;
    
    if (!fileNameInput.value.toLowerCase().endsWith('.pdf')) {
        fileNameInput.value += '.pdf';
    }
});