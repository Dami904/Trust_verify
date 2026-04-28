require('dotenv').config();
const express = require('express');
const multer = require('multer');
const crypto = require('crypto');
const path = require('path');
const { MongoClient } = require('mongodb');
const PDFDocument = require('pdfkit'); // Added missing PDFKit requirement

const app = express();
const port = 3000;
const upload = multer({ storage: multer.memoryStorage() });

// ==========================================
// ☁️ THE CLOUD DATABASE CONNECTION
// ==========================================

const uri = process.env.MONGO_URI;
const client = new MongoClient(uri);

// We need TWO variables now: one for original records, one for the history log
let documentDatabase;
let historyCollection; 

// Boot up the database connection
async function connectCloudDB() {
    try {
        await client.connect();
        // Point to the specific collections inside the "TrustVerify" database
        documentDatabase = client.db("TrustVerify").collection("Records");
        historyCollection = client.db("TrustVerify").collection("verification_history"); 
        console.log("☁️  SUCCESS: Connected to MongoDB Atlas Cloud!");
    } catch (error) {
        console.error("❌ CLOUD ERROR: Could not connect to MongoDB.", error);
    }
}
connectCloudDB();

// Serves HTML/CSS files from the root directory
app.use(express.static(__dirname));

// --- FRONTEND ROUTES ---
app.get('/', (req, res) => res.redirect('/verify'));
app.get('/verify', (req, res) => res.sendFile(path.join(__dirname, 'index.html'))); // Ensure this points to your main page
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'admin.html')));
app.get('/history', (req, res) => res.sendFile(path.join(__dirname, 'history.html')));

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

        recordsToSave.push({
            documentHash: hexHash,
            fileName: file.originalname,
            issuedAt: new Date().toISOString()
        });
    }

    try {
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

        const existingRecord = await documentDatabase.findOne({ documentHash: hexHash });

        // 1. Generate a unique ID for this specific verification event
        const transactionId = crypto.randomBytes(4).toString('hex').toUpperCase();
        const currentStatus = existingRecord ? "Verified" : "Tampered";

        // 2. Save this event using the CORRECT historyCollection variable
        await historyCollection.insertOne({
            transactionId: transactionId,
            fileName: file.originalname,
            hash: hexHash,
            status: currentStatus,
            timestamp: new Date()
        });

        if (existingRecord) {
            verificationResults.push({ 
                fileName: file.originalname, 
                status: "Authentic",
                certificateId: transactionId 
            });
        } else {
            verificationResults.push({ 
                fileName: file.originalname, 
                status: "Fraudulent",
                certificateId: transactionId 
            });
        }
    }

    res.json({
        totalVerified: verificationResults.length,
        results: verificationResults
    });
});

// ==========================================
// ROUTE 3: FETCH HISTORY FOR THE DASHBOARD
// ==========================================
app.get('/api/history', async (req, res) => {
    try {
        // Fetch all history, sorted by newest first
        const history = await historyCollection.find().sort({ timestamp: -1 }).toArray();
        res.json(history);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch history" });
    }
});

// ==========================================
// ROUTE 4: GENERATE & DOWNLOAD PDF CERTIFICATE
// ==========================================
app.get('/download-certificate/:id', async (req, res) => {
    try {
        const record = await historyCollection.findOne({ transactionId: req.params.id });
        if (!record) return res.status(404).send('Certificate not found');

        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=TrustVerify_${record.transactionId}.pdf`);

        // PDF Design
        doc.rect(0, 0, 600, 50).fill('#2c3e50');
        doc.fillColor('#fff').fontSize(18).text('TRUSTVERIFY OFFICIAL RECORD', 50, 15);
        doc.fillColor('#000').moveDown(4);
        doc.fontSize(22).text('Verification Certificate', { align: 'center' });
        doc.moveDown().fontSize(12).text(`Document Name: ${record.fileName}`);
        doc.text(`Status: ${record.status}`);
        doc.text(`Digital Fingerprint (SHA-256): ${record.hash}`);
        doc.text(`Verified On: ${record.timestamp.toUTCString()}`);
        doc.moveDown(5).fontSize(10).text('Scan to verify online: https://trustverify.duckdns.org/history.html', { align: 'center' });

        doc.pipe(res);
        doc.end();
    } catch (err) {
        console.error(err);
        res.status(500).send("Error generating PDF");
    }
});

// Start the server
app.listen(port, () => {
    console.log(`🚀 Verification Server is live on port ${port}...`);
});