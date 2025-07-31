// setup.js - Project setup script
const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up Empower Kibuye project...\n');

// Create necessary directories
const directories = [
    'public',
    'logs',
    'uploads'
];

directories.forEach(dir => {
    const dirPath = path.join(__dirname, dir);
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        console.log(`✅ Created directory: ${dir}`);
    } else {
        console.log(`📁 Directory already exists: ${dir}`);
    }
});

// Create .env file if it doesn't exist
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
    const envContent = `# Empower Kibuye Environment Variables
NODE_ENV=development
PORT=3000
DB_PATH=./empower_kibuye.db

# Admin Configuration
ADMIN_EMAIL=admin@empowerkibuye.org
ADMIN_PASSWORD=admin123

# Security Settings
JWT_SECRET=your-super-secret-jwt-key-here
BCRYPT_ROUNDS=10

# Email Configuration (Optional - for notifications)
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=

# Payment Gateway Configuration (Optional)
PAYMENT_API_KEY=
PAYMENT_SECRET=

# Application Settings
MAX_UPLOAD_SIZE=5MB
DONATION_MIN_AMOUNT=1000
DONATION_MAX_AMOUNT=10000000

# Database Configuration
DB_BACKUP_INTERVAL=24h
DB_MAX_CONNECTIONS=10
`;

    fs.writeFileSync(envPath, envContent);
    console.log('✅ Created .env file with default configuration');
} else {
    console.log('📄 .env file already exists');
}

// Create public directory and move HTML file there
const htmlSource = path.join(__dirname, 'index.html');
const htmlDest = path.join(__dirname, 'public', 'index.html');

// If HTML file exists in root, move it to public
if (fs.existsSync(htmlSource) && !fs.existsSync(htmlDest)) {
    fs.copyFileSync(htmlSource, htmlDest);
    fs.unlinkSync(htmlSource);
    console.log('✅ Moved HTML file to public directory');
}

// Create README.md file
const readmePath = path.join(__dirname, 'README.md');
if (!fs.existsSync(readmePath)) {
    const readmeContent = `# Empower Kibuye - Digital Aid Platform

A comprehensive web-based platform for managing donations, beneficiaries, and fund allocations for the Empower Kibuye NGO in Rwanda.

## Features

### For Donors
- 👤 User registration and authentication
- 💳 Secure donation processing
- 📊 Donation history tracking
- 📈 Personal impact dashboard
- 🔍 Transparent fund allocation tracking

### For Administrators
- 👥 Beneficiary management
- 💰 Fund allocation system
- 📋 Donation oversight
- 📊 Comprehensive reporting
- 👨‍💼 User management

### Platform Capabilities
- 🏥 Health insurance support tracking
- 🎓 Education fee management
- 🛠️ Skills training program coordination
- 📱 Responsive design for all devices
- 🗄️ SQLite database for reliable data storage

## Project Structure

\`\`\`
empower-kibuye/
├── server.js              # Main backend server
├── package.json           # Dependencies and scripts
├── setup.js              # Project setup script
├── .env                  # Environment variables
├── empower_kibuye.db     # SQLite database (created automatically)
├── public/               # Frontend files
│   └── index.html        # Main HTML file
├── logs/                 # Application logs
└── uploads/              # File uploads (future feature)
\`\`\`

## Installation

1. **Clone or download the project files**
2. **Install dependencies:**
   \`\`\`bash
   npm install
   \`\`\`

3. **Run setup script:**
   \`\`\`bash
   npm run setup
   \`\`\`

4. **Start the server:**
   \`\`\`bash
   npm start
   \`\`\`

   For development with auto-restart:
   \`\`\`bash
   npm run dev
   \`\`\`

5. **Access the application:**
   - Open your browser and go to \`http://localhost:3000\`

## Default Admin Account

- **Email:** admin@empowerkibuye.org
- **Password:** admin123

⚠️ **Important:** Change the admin password immediately after first login!

## API Endpoints

### Authentication
- \`POST /api/auth/signup\` - User registration
- \`POST /api/auth/login\` - User login

### Donations
- \`POST /api/donations/create\` - Create new donation
- \`GET /api/donations/user/:userId\` - Get user's donations
- \`GET /api/donations/all\` - Get all donations (admin)

### Beneficiaries
- \`POST /api/beneficiaries/create\` - Add new beneficiary
- \`GET /api/beneficiaries/all\` - Get all beneficiaries

### Fund Management
- \`POST /api/funds/allocate\` - Allocate funds to beneficiary
- \`GET /api/funds/summary\` - Get fund summary

### Impact Tracking
- \`GET /api/impact/user/:userId\` - Get user's impact data

## Database Schema

The application uses SQLite with the following main tables:

- **users** - User accounts (donors and admins)
- **donations** - Donation records
- **beneficiaries** - Beneficiary information
- **fund_allocations** - Fund allocation tracking

## Technologies Used

### Frontend
- HTML5, CSS3, JavaScript (ES6+)
- Responsive design with CSS Grid and Flexbox
- Font Awesome icons
- Modern UI/UX design principles

### Backend
- Node.js with Express.js framework
- SQLite database
- bcryptjs for password hashing
- CORS for cross-origin requests

## Configuration

### Environment Variables
Edit the \`.env\` file to configure:
- Server port
- Database settings
- Admin credentials
- Email configuration (optional)
- Payment gateway settings (optional)

### Database
The SQLite database is automatically created when you first run the server. No additional database setup is required.

## Security Features

- 🔐 Password hashing with bcrypt
- 🛡️ Input validation and sanitization
- 🚫 SQL injection prevention
- 🔒 CORS configuration
- 🎫 Session management

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Email: rurangwamika98@gmail.com 
- Phone: +250 123 456 789

## Deployment

### Local Development
1. Follow the installation steps above
2. The server will run on \`http://localhost:3000\`

### Production Deployment
1. Set \`NODE_ENV=production\` in your environment
2. Use a process manager like PM2:
   \`\`\`bash
   npm install -g pm2
   pm2 start server.js --name "empower-kibuye"
   \`\`\`
3. Set up a reverse proxy with Nginx (recommended)
4. Use HTTPS in production
5. Regular database backups

## Troubleshooting

### Common Issues

**Database errors:**
- Ensure the application has write permissions in the project directory
- Check if the database file is corrupted and restore from backup

**Port already in use:**
- Change the PORT in .env file or kill the process using port 3000

**Dependencies issues:**
- Delete \`node_modules\` folder and run \`npm install\` again

### Logs
Check the console output for detailed error messages and debugging information.

## Roadmap

### Planned Features
- 📧 Email notifications for donations and allocations
- 💳 Integration with mobile money payments (MTN MoMo, Airtel Money)
- 📊 Advanced analytics and reporting
- 📱 Mobile app version
- 🌍 Multi-language support (Kinyarwanda, French)
- 📤 Data export functionality
- 🔄 Automated recurring donations
- 📸 Photo uploads for beneficiaries and projects

### Future Enhancements
- Integration with government health insurance systems
- Partnership with local schools for direct fee payments
- Skills training certificate tracking
- Community feedback system
- Blockchain transparency features

---

**Empower Kibuye** - Transforming lives through technology and community support.
`;

    fs.writeFileSync(readmePath, readmeContent);
    console.log('✅ Created comprehensive README.md file');
} else {
    console.log('📄 README.md file already exists');
}

// Create .gitignore file
const gitignorePath = path.join(__dirname, '.gitignore');
if (!fs.existsSync(gitignorePath)) {
    const gitignoreContent = `# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Database
*.db-journal
*.db-wal
*.db-shm

# Logs
logs/
*.log

# Runtime data
pids/
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/

# IDE files
.vscode/
.idea/
*.swp
*.swo

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# Uploads
uploads/*
!uploads/.gitkeep

# Backup files
*.backup
*.bak

# Temporary files
tmp/
temp/
`;

    fs.writeFileSync(gitignorePath, gitignoreContent);
    console.log('✅ Created .gitignore file');
} else {
    console.log('📄 .gitignore file already exists');
}

// Create uploads directory with .gitkeep
const uploadsDir = path.join(__dirname, 'uploads');
const gitkeepPath = path.join(uploadsDir, '.gitkeep');
if (!fs.existsSync(gitkeepPath)) {
    fs.writeFileSync(gitkeepPath, '# Keep this directory');
    console.log('✅ Created uploads/.gitkeep');
}

// Create logs directory with .gitkeep
const logsDir = path.join(__dirname, 'logs');
const logsGitkeepPath = path.join(logsDir, '.gitkeep');
if (!fs.existsSync(logsGitkeepPath)) {
    fs.writeFileSync(logsGitkeepPath, '# Keep this directory');
    console.log('✅ Created logs/.gitkeep');
}

// Display final setup instructions
console.log('\n🎉 Setup completed successfully!\n');
console.log('📋 Next steps:');
console.log('1. Run "npm install" to install dependencies');
console.log('2. Run "npm start" to start the server');
console.log('3. Open http://localhost:3000 in your browser');
console.log('4. Login with admin credentials to get started\n');

console.log('👤 Default Admin Account:');
console.log('   Email: admin@empowerkibuye.org');
console.log('   Password: admin123');
console.log('   ⚠️  Please change this password after first login!\n');

console.log('📝 Configuration:');
console.log('   - Edit .env file to customize settings');
console.log('   - Database will be created automatically');
console.log('   - Check README.md for detailed documentation\n');

console.log('🔧 Development commands:');
console.log('   npm start     - Start production server');
console.log('   npm run dev   - Start development server with auto-reload');
console.log('   npm run setup - Run this setup script again\n');

console.log('✨ Your Empower Kibuye platform is ready to transform lives!');
