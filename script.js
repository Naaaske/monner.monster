const pdfFileInput = document.getElementById('pdfFileInput');
const base64Output = document.getElementById('base64Output');
const base64Input = document.getElementById('base64Input');
const downloadLinkContainer = document.getElementById('downloadLinkContainer');
const copyButton = document.getElementById('copyButton');
const decodeButton = document.getElementById('decodeButton');
const fileNameInput = document.getElementById('fileNameInput');
const encodeButton = document.getElementById('encodeButton');
const selectedFileName = document.getElementById('selectedFileName');
const fileInputLabel = document.querySelector('.custom-file-upload');
const includePrefixCheckbox = document.getElementById('includePrefixCheckbox');

let debounceTimeout = null;

function showMessage(message, type) {
    const box = document.getElementById('message-box');
    
    box.className = 'message-box';
    
    box.classList.add(type);
    
    box.textContent = message;
    box.classList.remove('hidden');

    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
        box.classList.add('hidden');
    }, 5000);
}

function base64ToUint8Array(base64) {
    let base64String = base64;
    if (base64.includes(',')) {
        base64String = base64.split(',').pop();
    }
    
    const raw = window.atob(base64String);
    const rawLength = raw.length;
    const array = new Uint8Array(rawLength);

    for (let i = 0; i < rawLength; i++) {
        array[i] = raw.charCodeAt(i);
    }
    return array;
}

function copyToClipboard(elementId) {
    const element = document.getElementById(elementId);
    if (!element.value) {
        showMessage("Nothing to copy. Please encode a file first.", 'info');
        return;
    }

    element.select();

    try {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(element.value)
                .then(() => showMessage("Copied to clipboard!", 'success'))
                .catch(err => {
                    console.error('Failed to copy text (Clipboard API): ', err);
                    document.execCommand('copy');
                    showMessage("Copied to clipboard!", 'success');
                });
        } else {
            document.execCommand('copy');
            showMessage("Copied to clipboard!", 'success');
        }
        
    } catch (err) {
        console.error('Failed to copy text: ', err);
        showMessage("Failed to copy. Please select the text manually.", 'error');
    }
}

function updateFileSelectionDisplay(file) {
    if (file) {
        selectedFileName.textContent = `File: ${file.name}`;
        fileInputLabel.classList.add('file-selected');
    } else {
        selectedFileName.textContent = '';
        fileInputLabel.classList.remove('file-selected');
    }
}


function convertPdfToBase64() {
    const file = pdfFileInput.files[0];
    base64Output.value = '';
    copyButton.disabled = true;
    downloadLinkContainer.innerHTML = '';
    updateFileSelectionDisplay(file);

    if (!file) {
        showMessage("Please select a PDF file first.", 'error');
        return;
    }

    if (file.type !== 'application/pdf') {
        showMessage("The selected file is not a PDF.", 'error');
        pdfFileInput.value = '';
        updateFileSelectionDisplay(null);
        return;
    }

    showMessage("Encoding started...", 'info');

    const reader = new FileReader();

    reader.onload = function(event) {
        const dataUrl = event.target.result;
        
        const includePrefix = includePrefixCheckbox.checked;
        let outputString = dataUrl;

        if (!includePrefix) {
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

    reader.readAsDataURL(file);
}

function convertBase64ToPdf() {
    const base64 = base64Input.value.trim();
    downloadLinkContainer.innerHTML = '';

    if (!base64) {
        showMessage("Please paste a Base64 string into the input area.", 'error');
        return;
    }

    try {
        const pdfBytes = base64ToUint8Array(base64);

        const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });

        const url = URL.createObjectURL(pdfBlob);
        const a = document.createElement('a');
        
        let fileName = fileNameInput.value.trim();
        if (!fileName || !fileName.toLowerCase().endsWith('.pdf')) {
            fileName = (fileName || 'decoded_document') + '.pdf';
        }

        a.href = url;
        a.download = fileName;
        a.textContent = `Download '${fileName}'`;
        a.className = "download-link";
        
        downloadLinkContainer.appendChild(a); 
        a.click();
        
        downloadLinkContainer.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 100); 
        
        showMessage(`PDF download for '${fileName}' initiated!`, 'success');

    } catch (e) {
        console.error("Decoding error:", e);
        showMessage("Decoding failed. Check if the Base64 string is valid.", 'error');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    
    pdfFileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        updateFileSelectionDisplay(file);
        
        encodeButton.disabled = !file;

        base64Output.value = '';
        copyButton.disabled = true;
        downloadLinkContainer.innerHTML = '';    
    });

    base64Input.addEventListener('input', () => {
        decodeButton.disabled = base64Input.value.trim().length === 0;
        downloadLinkContainer.innerHTML = '';
    });

    decodeButton.disabled = base64Input.value.trim().length === 0;
    
    if (!fileNameInput.value.toLowerCase().endsWith('.pdf')) {
        fileNameInput.value += '.pdf';
    }
});