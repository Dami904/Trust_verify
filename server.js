require('dotenv').config();
const express = require('express');
const multer = require('multer');
const crypto = require('crypto');
const path = require('path');
const { MongoClient } = require('mongodb');

const app = express();
const port = 3000;
const upload = multer({ storage: multer.memoryStorage() });

// ==========================================
// ☁️ THE CLOUD DATABASE CONNECTION
// ==========================================

const uri = process.env.MONGO_URI;

const client = new MongoClient(uri);
let documentDatabase;

// Boot up the database connection
async function connectCloudDB() {
    try {
        await client.connect();
        // This creates a database called "TrustVerify" and a table called "Records"
        documentDatabase = client.db("TrustVerify").collection("Records");
        console.log("☁️  SUCCESS: Connected to MongoDB Atlas Cloud!");
    } catch (error) {
        console.error("❌ CLOUD ERROR: Could not connect to MongoDB.", error);
    }
}
connectCloudDB();

app.use(express.static('public'));

// --- FRONTEND ROUTES ---
app.get('/', (req, res) => res.redirect('/verify'));
app.get('/verify', (req, res) => res.sendFile(path.join(__dirname, 'public', 'verify.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));

// ==========================================
// ROUTE 1: ADMIN BATCH ISSUING (Writing to Cloud)
// ==========================================
app.post('/api/admin/issue', upload.array('documents', 5000), async (req, res) => {
    if (!req.files || req.files.length === 0) return res.status(400).json({ error: "No documents uploaded." });

    const recordsToSave = [];

    for (const file of req.files) {
        const hashSum = crypto.createHash('sha256');
        hashSum.update(file.buffer);
        const hexHash = hashSum.digest('hex');

        // Prepare the data package for MongoDB
        recordsToSave.push({
            documentHash: hexHash,
            fileName: file.originalname,
            issuedAt: new Date().toISOString()
        });
    }

    try {
        // Send the entire batch to the Cloud Database in one swift command!
        await documentDatabase.insertMany(recordsToSave);
        
        res.json({
            message: "Batch processing complete!",
            totalProcessed: recordsToSave.length
        });
    } catch (error) {
        res.status(500).json({ error: "Failed to save to cloud database." });
    }
});

// ==========================================
// ROUTE 2: EMPLOYER VERIFICATION (Reading from Cloud)
// ==========================================
app.post('/api/verify', upload.array('documents', 5000), async (req, res) => {
    if (!req.files || req.files.length === 0) return res.status(400).json({ error: "No documents uploaded." });

    const verificationResults = [];

    for (const file of req.files) {
        const hashSum = crypto.createHash('sha256');
        hashSum.update(file.buffer);
        const hexHash = hashSum.digest('hex');

        // Query the Cloud Database: "Do you have a record with this exact hash?"
        const existingRecord = await documentDatabase.findOne({ documentHash: hexHash });

        if (existingRecord) {
            verificationResults.push({ fileName: file.originalname, status: "Authentic" });
        } else {
            verificationResults.push({ fileName: file.originalname, status: "Fraudulent" });
        }
    }

    res.json({
        totalVerified: verificationResults.length,
        results: verificationResults
    });
});

app.listen(port, () => {
    console.log(`🚀 Verification Server is live on port ${port}...`);
});