# Empower Kibuye - Digital Aid Platform

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

```
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
```

## Installation

1. **Clone or download the project files**
2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run setup script:**
   ```bash
   npm run setup
   ```

4. **Start the server:**
   ```bash
   npm start
   ```

   For development with auto-restart:
   ```bash
   npm run dev
   ```

5. **Access the application:**
   - Open your browser and go to `http://localhost:3000`

## Default Admin Account

- **Email:** admin@empowerkibuye.org
- **Password:** admin123

⚠️ **Important:** Change the admin password immediately after first login!

## API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login

### Donations
- `POST /api/donations/create` - Create new donation
- `GET /api/donations/user/:userId` - Get user's donations
- `GET /api/donations/all` - Get all donations (admin)

### Beneficiaries
- `POST /api/beneficiaries/create` - Add new beneficiary
- `GET /api/beneficiaries/all` - Get all beneficiaries

### Fund Management
- `POST /api/funds/allocate` - Allocate funds to beneficiary
- `GET /api/funds/summary` - Get fund summary

### Impact Tracking
- `GET /api/impact/user/:userId` - Get user's impact data

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
Edit the `.env` file to configure:
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




## Support

For support and questions:
- Email: rurangwamika98@gmail.com
- Phone: +250 786 130 393

## Deployment

### Local Development
1. Follow the installation steps above
2. The server will run on `http://localhost:3000`

### Production Deployment
1. Set `NODE_ENV=production` in your environment
2. Use a process manager like PM2:
   ```bash
   npm install -g pm2
   pm2 start server.js --name "empower-kibuye"
   ```
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
- Delete `node_modules` folder and run `npm install` again

### Logs
Check the console output for detailed error messages and debugging information.

## Roadmap

### Planned Features
- 💳 Integration with mobile money payments (MTN MoMo, Airtel Money)
- 📊 Advanced analytics and reporting
- 📱 Mobile app version
- 🔄 Automated recurring donations

### Future Enhancements
- Integration with government health insurance systems
- Partnership with local schools for direct fee payments
- Skills training certificate tracking
- Community feedback system
- Blockchain transparency features

---

**Empower Kibuye** - Transforming lives through technology and community support.
