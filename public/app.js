// Function for Employers to Verify Documents
async function verifyBatch() {
    const fileInput = document.getElementById('verifyFile');
    const folderInput = document.getElementById('verifyFolder');
    const resultDiv = document.getElementById('verifyResult');
    const table = document.getElementById('resultsTable');
    const tableBody = document.getElementById('tableBody');
    const downloadBtn = document.getElementById('downloadBtn');

    // Determine which input the user used
    let selectedFiles = [];
    if (fileInput.files.length > 0) {
        selectedFiles = fileInput.files;
    } else if (folderInput.files.length > 0) {
        selectedFiles = folderInput.files;
    } else {
        alert("Please select individual files or a folder.");
        return;
    }

    const formData = new FormData();
    // Loop through the selected files
    for (let i = 0; i < selectedFiles.length; i++) {
        formData.append('documents', selectedFiles[i]);
    }

    resultDiv.innerHTML = "Processing batch verification...";
    table.style.display = "none";
    downloadBtn.style.display = "none";
    tableBody.innerHTML = ""; // Clear old results

    try {
        const response = await fetch('/api/verify', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();

        if (response.ok) {
            resultDiv.innerHTML = `Processed ${data.totalVerified} documents.`;
            
            // Loop through the results and build the table rows
            data.results.forEach(result => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${result.fileName}</td>
                    <td class="${result.status}">${result.status === 'Authentic' ? '✅ Authentic' : '❌ FRAUDULENT'}</td>
                `;
                tableBody.appendChild(row);
            });

            // Show the table and the PDF button
            table.style.display = "table";
            
            // Only show the PDF download button if there is more than 1 file
            if (data.totalVerified > 1) {
                downloadBtn.style.display = "block";
            }
        }
    } catch (error) {
        resultDiv.innerHTML = "Server error during verification.";
    }
}

// Function for Admins to Issue Documents
async function issueDocument() {
    const fileInput = document.getElementById('issueFile');
    const folderInput = document.getElementById('issueFolder'); // FIXED: Was verifyFolder
    const resultDiv = document.getElementById('issueResult');

    // Determine which input the user used
    let selectedFiles = [];
    if (fileInput.files.length > 0) {
        selectedFiles = fileInput.files;
    } else if (folderInput.files.length > 0) {
        selectedFiles = folderInput.files;
    } else {
        alert("Please select individual files or a folder.");
        return;
    }

    const formData = new FormData();
    // Loop through the selected files
    for (let i = 0; i < selectedFiles.length; i++) {
        formData.append('documents', selectedFiles[i]);
    }

    resultDiv.className = 'result';
    // FIXED: Now accurately counts the files regardless of which button was used
    resultDiv.innerHTML = `Processing batch of ${selectedFiles.length} documents...`;
    resultDiv.style.display = "block";

    try {
        const response = await fetch('/api/admin/issue', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();

        if (response.ok) {
            resultDiv.className = 'result success';
            resultDiv.innerHTML = `✅ Batch Complete!<br><small>Successfully registered ${data.totalProcessed} documents to the registry.</small>`;
        } else {
            resultDiv.className = 'result error';
            resultDiv.innerHTML = "Failed to register batch.";
        }
    } catch (error) {
        resultDiv.className = 'result error';
        resultDiv.innerHTML = "Server error.";
    }
}
// A simple UI helper to show what the user selected in the custom portal
function updateUIText(inputElement) {
    const textDisplay = document.getElementById('selectionText'); // In admin.html, you might want to give it id="adminSelectionText"
    
    if (inputElement.files.length > 0) {
        textDisplay.innerText = `📁 Ready to process ${inputElement.files.length} document(s)`;
    } else {
        textDisplay.innerText = "";
    }
}