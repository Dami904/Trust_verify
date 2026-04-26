TrustVerify: Secure Cloud-Based Document Verification
TrustVerify is a professional-grade web application designed to ensure the integrity of digital documents (like academic transcripts). By using cryptographic hashing and cloud-based infrastructure, it allows users to verify whether a document is authentic or has been tampered with since its original issuance.

🚀 Live Demo
URL: https://trustverify.duckdns.org

(Deployed on AWS EC2 with SSL encryption)

🛠 Features
Cryptographic Integrity: Uses the SHA-256 hashing algorithm to generate unique digital fingerprints for every uploaded document.

Tamper Detection: Instantly alerts users if even a single pixel or character in a document has been modified.

Cloud Persistence: Securely stores and retrieves document metadata using MongoDB Atlas.

Production-Ready Deployment: Hosted on Amazon Web Services (AWS) using a custom Nginx reverse proxy configuration.

Secure Connection: Fully encrypted via SSL/TLS (HTTPS) using Let's Encrypt and Certbot.

**🏗 Technical Stack**
Frontend: HTML5, CSS3 (Modern Responsive UI)

Backend: Node.js, Express.js

Database: MongoDB Atlas (Cloud Cluster)

Deployment: AWS EC2 (Ubuntu Linux)

Process Management: PM2

Web Server: Nginx (Reverse Proxy)

Security: SHA-256 Hashing, Certbot SSL

**
📸 System Architecture**
The application follows a modern cloud architecture:

User connects via HTTPS to the DuckDNS domain.

Nginx acts as the entry point, handling SSL termination and forwarding requests to the internal Node.js process.

The Node.js/Express backend processes document uploads using Multer.

Cryptographic hashes are compared against the MongoDB Atlas cloud database.

⚙️ Installation & Local Setup
Clone the repository:

Bash
git clone https://github.com/Dami904/Trust_verify.git
cd Trust_verify
Install dependencies:

Bash
npm install
Configure Environment Variables:
Create a .env file in the root directory and add your MongoDB connection string:

Code snippet
MONGO_URI=your_mongodb_connection_string
Run the application:

Bash
node server.js

📝 License
This project is for educational purposes as part of a Software Engineering portfolio.
