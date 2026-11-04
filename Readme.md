# SecureCode AI

**AI-Powered Code Security Analysis Platform**

SecureCode AI is a web-based code security analysis platform built using the MERN stack. It helps developers identify potential security vulnerabilities in their source code, understand detected issues, and explore AI-generated suggestions for fixing them.

The platform combines **Semgrep** for static application security testing (SAST) with **Google Gemini AI** for vulnerability explanations and remediation suggestions.

---

## Features

### 1. User Authentication

- User registration and login.
- Secure password hashing using bcrypt.
- JWT-based authentication using HTTP-only cookies.
- Protected application routes.
- Persistent authentication sessions.

### 2. Static Code Analysis

- Analyze source code using Semgrep.
- Custom security rules for identifying vulnerabilities.
- Detect common coding security issues.
- Categorize findings according to severity.

### 3. AI-Powered Vulnerability Explanation

- Generate explanations for detected vulnerabilities using Google Gemini.
- Understand the potential impact of security issues.
- Receive suggested approaches for fixing vulnerable code.

### 4. Code Editor and File Upload

- Monaco Editor integration.
- Write or paste code directly into the editor.
- Upload supported source files:
  - JavaScript (`.js`)
  - JSX (`.jsx`)
  - TypeScript (`.ts`)
  - TSX (`.tsx`)
  - Python (`.py`)
- Maximum supported upload size: 100 KB.

### 5. Scan Management

- View previous scans.
- Access individual scan details.
- Review associated security findings.
- Update finding statuses.
- Track scanning activity through the dashboard.

### 6. Security Reports

- Generate PDF security reports.
- Download reports for individual scans.
- Review identified vulnerabilities and scan results.

### 7. User Settings

- Update profile information.
- Change account password.
- Select application theme.
- Manage account sessions through logout.

### 8. Application Security

- Helmet security headers.
- CORS configuration.
- API rate limiting.
- Input validation.
- Controlled Semgrep execution.
- Execution time and output limits.
- Temporary scan file cleanup.
- Submitted source code is analyzed, not executed.

---

## Technology Stack

### Frontend

| Technology      | Purpose                           |
| --------------- | --------------------------------- |
| React           | User interface                    |
| Vite            | Development server and build tool |
| React Router    | Client-side routing               |
| Tailwind CSS v4 | Styling                           |
| HeroUI          | UI components                     |
| Zustand         | State management                  |
| Axios           | API communication                 |
| Monaco Editor   | Code editor                       |
| Lucide React    | Icons                             |

### Backend

| Technology         | Purpose                  |
| ------------------ | ------------------------ |
| Node.js            | JavaScript runtime       |
| Express.js         | REST API                 |
| MongoDB            | Database                 |
| Mongoose           | Database object modeling |
| JWT                | Authentication           |
| bcryptjs           | Password hashing         |
| Helmet             | HTTP security headers    |
| express-rate-limit | API rate limiting        |
| PDFKit             | PDF report generation    |

### Security Analysis and AI

| Technology           | Purpose                             |
| -------------------- | ----------------------------------- |
| Semgrep              | Static code analysis                |
| Custom Semgrep Rules | Vulnerability detection             |
| Google Gemini API    | AI explanations and suggested fixes |

---

## Project Structure

```text
SecureCode-AI/
│
├── client/
│   ├── public/
│   │
│   ├── src/
│   │   ├── assets/
│   │   │
│   │   ├── components/
│   │   │   ├── auth/
│   │   │   ├── layout/
│   │   │   └── scanner/
│   │   │
│   │   ├── lib/
│   │   │
│   │   ├── pages/
│   │   │
│   │   ├── stores/
│   │   │
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   │
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── server/
│   ├── src/
│   ├── .env
│   └── package.json
│
├── .gitignore
└── README.md
```

---

## Prerequisites

Before installing the project, make sure you have:

- Node.js and npm.
- MongoDB Atlas account or a local MongoDB installation.
- Google Gemini API key.
- Semgrep installed and accessible to the backend process.
- Git.

Verify your installations:

```bash
node --version
npm --version
semgrep --version
```

---

## Installation and Setup

### 1. Clone the Repository

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>

cd SecureCode-AI
```

### 2. Install Backend Dependencies

```bash
cd server

npm install
```

### 3. Configure Backend Environment Variables

Create a `.env` file inside the `server` directory.

Example configuration:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_long_random_secret
GEMINI_API_KEY=your_gemini_api_key
CLIENT_URL=http://localhost:5173
```

### 4. Start the Backend

From the `server` directory:

```bash
npm run dev
```

The Express backend should start using the configured port.

### 5. Install Frontend Dependencies

Open another terminal:

```bash
cd client

npm install
```

### 6. Configure Frontend API URL

Check:

```text
client/src/lib/axios.js
```

For local development, the backend URL will commonly be:

```text
http://localhost:5000
```

### 7. Start the Frontend

From the `client` directory:

```bash
npm run dev
```

Open the local development URL displayed by Vite, usually:

```text
http://localhost:5173
```

---

## Application Workflow

The general workflow of SecureCode AI is:

1. The user registers or logs into the application.
2. The authenticated user opens the code scanner.
3. The user writes code in the editor or uploads a supported file.
4. The backend validates the submitted source code.
5. Semgrep analyzes the code using configured security rules.
6. Detected vulnerabilities are stored as scan findings.
7. Google Gemini generates explanations and suggested fixes when requested.
8. The user reviews findings and tracks their status.
9. Scan history and dashboard statistics provide an overview of previous analyses.
10. The user can generate and download PDF security reports.
