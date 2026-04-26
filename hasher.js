const crypto = require('crypto');
const fs = require('fs');

// 1. Define the file we want to hash
const fileToHash = 'document.txt';

try {
    // 2. Read the raw byte data of the file
    const fileBuffer = fs.readFileSync(fileToHash);

    // 3. Create a SHA-256 hash object
    const hashSum = crypto.createHash('sha256');

    // 4. Update the hash object with the file's data
    hashSum.update(fileBuffer);

    // 5. Output the final hash as a readable hex string
    const hexHash = hashSum.digest('hex');

    console.log(`Original Data Hash:`);
    console.log(hexHash);

} catch (error) {
    console.error("Error reading the file. Make sure document.txt exists.");
}
