import express from 'express';
import sqlite3 from 'sqlite3';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = process.env.DB_PATH;

// Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// --- Load Credentials from .env ---
const ADMIN_USER = process.env.ADMIN_USERNAME;
const ADMIN_PASS = process.env.ADMIN_PASSWORD;
const FLAG_VALUE = 'FLAG{G1T_R3C0N_SUCCESS_F0UND_IT_IN_C0NF1G}';
const FRONTEND_URL = process.env.FRONTEND_URL;

// --- Middleware ---
app.use(express.json()); // To parse JSON request bodies

// Configure CORS to allow the frontend to connect
const corsOptions = {
    origin: FRONTEND_URL, 
    methods: 'GET,POST',
    allowedHeaders: 'Content-Type',
};
app.use(cors(corsOptions));

// --- Database Setup ---
// We will use a file-based SQLite DB.
const DB_SOURCE = "lab_data.db";

// Use sqlite3.OPEN_READWRITE to prevent the application from overwriting the database file.
let db = new sqlite3.Database(DB_SOURCE, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
    if (err) {
        // Cannot open database
        console.error(err.message);
        throw err;
    } else {
        console.log('Connected to the SQLite database.');
        // Create a dummy users table for realism, though we won't use it for the exploit
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username text,
            hashed_password text
        )`);
    }
});

// --- API Route: The Login Check ---
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    // 1. Sanity Check: Ensure the expected username is used (as it's read-only on the frontend)
    if (username !== ADMIN_USER) {
        return res.status(400).json({ success: false, message: 'Invalid username submitted.' });
    }

    // 2. The Vulnerability Check: Directly compare the submitted password to the hardcoded secret
    if (password === ADMIN_PASS) {
        console.log(`[SUCCESS] Admin login successful for user: ${username}`);
        // Successful Login: Deliver the flag
        return res.status(200).json({
            success: true,
            message: 'Login Successful! Flag retrieved.',
            flag: FLAG_VALUE
        });
    } else {
        // Failed Login: Provide a realistic failure message
        console.log(`[FAILURE] Admin login failed for user: ${username}`);
        return res.status(401).json({
            success: false,
            message: 'Invalid credentials. The password is too complex to brute-force or guess.'
        });
    }
});

// --- Server Start ---
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Expected API Endpoint: http://localhost:${PORT}/api/login`);
});