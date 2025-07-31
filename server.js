// server.js - Main backend server file
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Database initialization
const dbPath = path.join(__dirname, 'empower_kibuye.db');
const db = new sqlite3.Database(dbPath);

// Initialize database tables
function initDatabase() {
    // Users table
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            phone TEXT,
            password_hash TEXT NOT NULL,
            is_admin BOOLEAN DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Donations table
    db.run(`
        CREATE TABLE IF NOT EXISTS donations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            amount INTEGER NOT NULL,
            purpose TEXT NOT NULL,
            payment_method TEXT,
            status TEXT DEFAULT 'pending',
            transaction_id TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    `);

    // Beneficiaries table
    db.run(`
        CREATE TABLE IF NOT EXISTS beneficiaries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            age INTEGER,
            gender TEXT,
            phone TEXT,
            location TEXT,
            support_type TEXT NOT NULL,
            status TEXT DEFAULT 'pending',
            support_received INTEGER DEFAULT 0,
            notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Fund allocations table
    db.run(`
        CREATE TABLE IF NOT EXISTS fund_allocations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            donation_id INTEGER,
            beneficiary_id INTEGER NOT NULL,
            amount INTEGER NOT NULL,
            support_type TEXT NOT NULL,
            allocated_by INTEGER NOT NULL,
            status TEXT DEFAULT 'allocated',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (donation_id) REFERENCES donations(id),
            FOREIGN KEY (beneficiary_id) REFERENCES beneficiaries(id),
            FOREIGN KEY (allocated_by) REFERENCES users(id)
        )
    `);

    // Create default admin user if it doesn't exist
    const adminEmail = 'admin@empowerkibuye.org';
    const adminPassword = 'admin123'; // Change this in production!
    
    db.get('SELECT id FROM users WHERE email = ? AND is_admin = 1', [adminEmail], (err, row) => {
        if (err) {
            console.error('Error checking for admin user:', err);
            return;
        }
        
        if (!row) {
            bcrypt.hash(adminPassword, 10, (err, hash) => {
                if (err) {
                    console.error('Error hashing admin password:', err);
                    return;
                }
                
                db.run(`
                    INSERT INTO users (name, email, password_hash, is_admin)
                    VALUES (?, ?, ?, 1)
                `, ['System Admin', adminEmail, hash], (err) => {
                    if (err) {
                        console.error('Error creating admin user:', err);
                    } else {
                        console.log('Default admin user created:');
                        console.log('Email:', adminEmail);
                        console.log('Password:', adminPassword);
                        console.log('Please change the password after first login!');
                    }
                });
            });
        }
    });

    console.log('Database initialized successfully');
}

// Helper functions
function generateTransactionId() {
    return 'TXN' + Date.now() + Math.random().toString(36).substr(2, 9);
}

function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function validatePhone(phone) {
    const phoneRegex = /^(\+250|0)?[7][0-9]{8}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
}

// Authentication middleware
function authenticateUser(req, res, next) {
    const userId = req.headers['user-id'];
    if (!userId) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    
    db.get('SELECT * FROM users WHERE id = ?', [userId], (err, user) => {
        if (err || !user) {
            return res.status(401).json({ success: false, message: 'Invalid user' });
        }
        req.user = user;
        next();
    });
}

function requireAdmin(req, res, next) {
    if (!req.user || !req.user.is_admin) {
        return res.status(403).json({ success: false, message: 'Admin access required' });
    }
    next();
}

// Routes

// Authentication routes
app.post('/api/auth/signup', async (req, res) => {
    try {
        const { name, email, phone, password } = req.body;

        // Validation
        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Name, email, and password are required'
            });
        }

        if (!validateEmail(email)) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid email address'
            });
        }

        if (phone && !validatePhone(phone)) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid Rwandan phone number'
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters long'
            });
        }

        // Check if user already exists
        db.get('SELECT id FROM users WHERE email = ?', [email], async (err, existingUser) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Database error occurred'
                });
            }

            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'An account with this email already exists'
                });
            }

            // Hash password and create user
            const passwordHash = await bcrypt.hash(password, 10);
            
            db.run(`
                INSERT INTO users (name, email, phone, password_hash)
                VALUES (?, ?, ?, ?)
            `, [name, email, phone, passwordHash], function(err) {
                if (err) {
                    console.error('Error creating user:', err);
                    return res.status(500).json({
                        success: false,
                        message: 'Failed to create account'
                    });
                }

                // Return user data (excluding password)
                const newUser = {
                    id: this.lastID,
                    name,
                    email,
                    phone,
                    isAdmin: false
                };

                res.json({
                    success: true,
                    message: 'Account created successfully',
                    user: newUser
                });
            });
        });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password, isAdmin } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        // Find user
        db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Database error occurred'
                });
            }

            if (!user) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid email or password'
                });
            }

            // Check if admin login is required but user is not admin
            if (isAdmin && !user.is_admin) {
                return res.status(403).json({
                    success: false,
                    message: 'Admin access required'
                });
            }

            // Verify password
            const passwordMatch = await bcrypt.compare(password, user.password_hash);
            if (!passwordMatch) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid email or password'
                });
            }

            // Return user data (excluding password)
            const userData = {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                isAdmin: user.is_admin === 1
            };

            res.json({
                success: true,
                message: 'Login successful',
                user: userData
            });
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Payment processing functions
async function processMoMoPayment(amount, phoneNumber, description) {
    try {
        // MoMo API integration (using MTN MoMo API)
        const momoPayload = {
            amount: amount.toString(),
            currency: "RWF",
            externalId: generateTransactionId(),
            payer: {
                partyIdType: "MSISDN",
                partyId: phoneNumber.replace('+250', '250')
            },
            payerMessage: description,
            payeeNote: "Empower Kibuye Donation"
        };

        // For demo purposes, we'll simulate success
        // In production, integrate with actual MoMo API
        console.log('Processing MoMo payment:', momoPayload);
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Simulate success (90% success rate for demo)
        if (Math.random() > 0.1) {
            return {
                success: true,
                transactionId: momoPayload.externalId,
                status: 'completed',
                message: 'Payment processed successfully'
            };
        } else {
            return {
                success: false,
                status: 'failed',
                message: 'Payment failed. Please try again.'
            };
        }
        
    } catch (error) {
        console.error('MoMo payment error:', error);
        return {
            success: false,
            status: 'failed',
            message: 'Payment processing failed'
        };
    }
}

async function processCreditCardPayment(amount, cardDetails, description) {
    try {
        // Credit card processing (integrate with payment gateway like Stripe/Flutterwave)
        const cardPayload = {
            amount: amount,
            currency: "RWF",
            card: {
                number: cardDetails.number,
                exp_month: cardDetails.expMonth,
                exp_year: cardDetails.expYear,
                cvc: cardDetails.cvc
            },
            description: description,
            reference: generateTransactionId()
        };

        console.log('Processing credit card payment:', {
            amount: cardPayload.amount,
            currency: cardPayload.currency,
            reference: cardPayload.reference
        });
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Simulate success (95% success rate for demo)
        if (Math.random() > 0.05) {
            return {
                success: true,
                transactionId: cardPayload.reference,
                status: 'completed',
                message: 'Card payment processed successfully'
            };
        } else {
            return {
                success: false,
                status: 'failed',
                message: 'Card payment failed. Please check your details.'
            };
        }
        
    } catch (error) {
        console.error('Credit card payment error:', error);
        return {
            success: false,
            status: 'failed',
            message: 'Card payment processing failed'
        };
    }
}

// Enhanced donation creation with payment processing
app.post('/api/donations/create', async (req, res) => {
    try {
        const { userId, amount, purpose, paymentMethod, paymentDetails } = req.body;

        // Validation
        if (!userId || !amount || !purpose || !paymentMethod) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        if (amount < 1000) {
            return res.status(400).json({
                success: false,
                message: 'Minimum donation amount is 1,000 RWF'
            });
        }

        const validPurposes = ['health', 'education', 'skills', 'general'];
        if (!validPurposes.includes(purpose)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid donation purpose'
            });
        }

        // Get user details for payment
        db.get('SELECT * FROM users WHERE id = ?', [userId], async (err, user) => {
            if (err || !user) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid user'
                });
            }

            let paymentResult;
            const description = `Empower Kibuye - ${purpose} donation by ${user.name}`;

            // Process payment based on method
            if (paymentMethod === 'mobile_money') {
                if (!paymentDetails.phoneNumber) {
                    return res.status(400).json({
                        success: false,
                        message: 'Phone number is required for mobile money'
                    });
                }
                paymentResult = await processMoMoPayment(amount, paymentDetails.phoneNumber, description);
            } else if (paymentMethod === 'credit_card') {
                if (!paymentDetails.cardNumber || !paymentDetails.expMonth || !paymentDetails.expYear || !paymentDetails.cvc) {
                    return res.status(400).json({
                        success: false,
                        message: 'Complete card details are required'
                    });
                }
                paymentResult = await processCreditCardPayment(amount, {
                    number: paymentDetails.cardNumber,
                    expMonth: paymentDetails.expMonth,
                    expYear: paymentDetails.expYear,
                    cvc: paymentDetails.cvc
                }, description);
            } else {
                // For bank transfer, mark as pending
                paymentResult = {
                    success: true,
                    transactionId: generateTransactionId(),
                    status: 'pending',
                    message: 'Bank transfer initiated - pending confirmation'
                };
            }

            // Create donation record
            db.run(`
                INSERT INTO donations (user_id, amount, purpose, payment_method, status, transaction_id)
                VALUES (?, ?, ?, ?, ?, ?)
            `, [userId, amount, purpose, paymentMethod, paymentResult.status, paymentResult.transactionId], function(err) {
                if (err) {
                    console.error('Error creating donation:', err);
                    return res.status(500).json({
                        success: false,
                        message: 'Failed to record donation'
                    });
                }

                res.json({
                    success: paymentResult.success,
                    message: paymentResult.message,
                    donation: {
                        id: this.lastID,
                        amount,
                        purpose,
                        transactionId: paymentResult.transactionId,
                        status: paymentResult.status
                    }
                });
            });
        });
    } catch (error) {
        console.error('Donation creation error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

app.get('/api/donations/user/:userId', (req, res) => {
    const userId = req.params.userId;

    db.all(`
        SELECT d.*, u.name as donor_name
        FROM donations d
        JOIN users u ON d.user_id = u.id
        WHERE d.user_id = ?
        ORDER BY d.created_at DESC
    `, [userId], (err, donations) => {
        if (err) {
            console.error('Error fetching user donations:', err);
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch donations'
            });
        }

        res.json({
            success: true,
            data: donations
        });
    });
});

app.get('/api/donations/all', (req, res) => {
    db.all(`
        SELECT d.*, u.name as donor_name
        FROM donations d
        JOIN users u ON d.user_id = u.id
        ORDER BY d.created_at DESC
        LIMIT 100
    `, [], (err, donations) => {
        if (err) {
            console.error('Error fetching all donations:', err);
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch donations'
            });
        }

        res.json({
            success: true,
            data: donations
        });
    });
});

// Beneficiary routes
app.post('/api/beneficiaries/create', (req, res) => {
    try {
        const { name, age, gender, phone, location, supportType, notes } = req.body;

        // Validation
        if (!name || !age || !gender || !supportType) {
            return res.status(400).json({
                success: false,
                message: 'Name, age, gender, and support type are required'
            });
        }

        if (phone && !validatePhone(phone)) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid phone number'
            });
        }

        const validSupportTypes = ['health', 'education', 'skills'];
        if (!validSupportTypes.includes(supportType)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid support type'
            });
        }

        db.run(`
            INSERT INTO beneficiaries (name, age, gender, phone, location, support_type, notes, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'active')
        `, [name, age, gender, phone, location, supportType, notes], function(err) {
            if (err) {
                console.error('Error creating beneficiary:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to create beneficiary'
                });
            }

            res.json({
                success: true,
                message: 'Beneficiary created successfully',
                beneficiary: {
                    id: this.lastID,
                    name,
                    age,
                    gender,
                    supportType,
                    status: 'active'
                }
            });
        });
    } catch (error) {
        console.error('Beneficiary creation error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

app.get('/api/beneficiaries/all', (req, res) => {
    db.all(`
        SELECT *
        FROM beneficiaries
        ORDER BY created_at DESC
    `, [], (err, beneficiaries) => {
        if (err) {
            console.error('Error fetching beneficiaries:', err);
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch beneficiaries'
            });
        }

        res.json({
            success: true,
            data: beneficiaries
        });
    });
});

// Fund allocation routes
app.post('/api/funds/allocate', (req, res) => {
    try {
        const { beneficiaryId, amount, supportType } = req.body;
        const allocatedBy = 1; // Assuming admin user ID is 1 for simplicity

        // Validation
        if (!beneficiaryId || !amount || !supportType) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        // Check available funds with corrected calculation
        db.get(`
            SELECT COALESCE(SUM(amount), 0) as total_donated
            FROM donations 
            WHERE status = 'completed'
        `, [], (err, donationResult) => {
            if (err) {
                console.error('Error checking donations:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to check available funds'
                });
            }

            // Get total allocated funds
            db.get(`
                SELECT COALESCE(SUM(amount), 0) as total_allocated
                FROM fund_allocations 
                WHERE status = 'allocated'
            `, [], (err, allocationResult) => {
                if (err) {
                    console.error('Error checking allocations:', err);
                    return res.status(500).json({
                        success: false,
                        message: 'Failed to check available funds'
                    });
                }

                const totalDonated = donationResult.total_donated || 0;
                const totalAllocated = allocationResult.total_allocated || 0;
                const availableFunds = totalDonated - totalAllocated;
                
                if (amount > availableFunds) {
                    return res.status(400).json({
                        success: false,
                        message: `Insufficient funds. Available: ${availableFunds.toLocaleString()} RWF`
                    });
                }

                // Create allocation
                db.run(`
                    INSERT INTO fund_allocations (beneficiary_id, amount, support_type, allocated_by)
                    VALUES (?, ?, ?, ?)
                `, [beneficiaryId, amount, supportType, allocatedBy], function(err) {
                    if (err) {
                        console.error('Error creating allocation:', err);
                        return res.status(500).json({
                            success: false,
                            message: 'Failed to allocate funds'
                        });
                    }

                    // Update beneficiary support received
                    db.run(`
                        UPDATE beneficiaries 
                        SET support_received = support_received + ?,
                            updated_at = CURRENT_TIMESTAMP
                        WHERE id = ?
                    `, [amount, beneficiaryId], (err) => {
                        if (err) {
                            console.error('Error updating beneficiary:', err);
                        }
                    });

                    res.json({
                        success: true,
                        message: 'Funds allocated successfully',
                        allocation: {
                            id: this.lastID,
                            beneficiaryId,
                            amount,
                            supportType
                        }
                    });
                });
            });
        });
    } catch (error) {
        console.error('Fund allocation error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

app.get('/api/funds/summary', (req, res) => {
    // First get total donations
    db.get(`
        SELECT COALESCE(SUM(amount), 0) as total_donated
        FROM donations 
        WHERE status = 'completed'
    `, [], (err, donationResult) => {
        if (err) {
            console.error('Error fetching donations:', err);
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch fund summary'
            });
        }

        // Then get total allocations
        db.get(`
            SELECT COALESCE(SUM(amount), 0) as total_allocated
            FROM fund_allocations 
            WHERE status = 'allocated'
        `, [], (err, allocationResult) => {
            if (err) {
                console.error('Error fetching allocations:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to fetch fund summary'
                });
            }

            const totalDonated = donationResult.total_donated || 0;
            const totalAllocated = allocationResult.total_allocated || 0;
            const available = totalDonated - totalAllocated;

            res.json({
                success: true,
                data: {
                    totalDonated: totalDonated,
                    totalAllocated: totalAllocated,
                    available: Math.max(0, available) // Ensure non-negative
                }
            });
        });
    });
});

// Impact tracking routes
app.get('/api/impact/user/:userId', (req, res) => {
    const userId = req.params.userId;

    db.get(`
        SELECT 
            COALESCE(SUM(amount), 0) as total_donated,
            COUNT(*) as donation_count
        FROM donations
        WHERE user_id = ? AND status = 'completed'
    `, [userId], (err, donationData) => {
        if (err) {
            console.error('Error fetching user impact:', err);
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch impact data'
            });
        }

        // Calculate beneficiaries helped (simplified calculation)
        db.get(`
            SELECT COUNT(DISTINCT fa.beneficiary_id) as beneficiaries_helped
            FROM fund_allocations fa
            JOIN donations d ON d.user_id = ?
            WHERE fa.amount > 0
        `, [userId], (err, beneficiaryData) => {
            if (err) {
                console.error('Error fetching beneficiary impact:', err);
                beneficiaryData = { beneficiaries_helped: 0 };
            }

            res.json({
                success: true,
                data: {
                    totalDonated: donationData.total_donated || 0,
                    donationCount: donationData.donation_count || 0,
                    beneficiariesHelped: beneficiaryData.beneficiaries_helped || 0
                }
            });
        });
    });
});

// Health check route
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'Empower Kibuye API is running',
        timestamp: new Date().toISOString()
    });
});

// Serve frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        success: false,
        message: 'Internal server error'
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`\n🚀 Empower Kibuye Server running on http://localhost:${PORT}`);
    console.log('📊 Dashboard: http://localhost:' + PORT);
    console.log('🏥 Database: empower_kibuye.db');
    console.log('\n📋 Default Admin Credentials:');
    console.log('Email: admin@empowerkibuye.org');
    console.log('Password: admin123');
    console.log('\n⚠️  Please change the admin password after first login!\n');
    
    // Initialize database
    initDatabase();
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down server...');
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err);
        } else {
            console.log('📦 Database connection closed.');
        }
        process.exit(0);
    });
});

module.exports = app;
