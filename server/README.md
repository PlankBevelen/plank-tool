# Plank Tool Server

This is the backend API for the Plank Tool application.

## Features

- **RESTful API** architecture
- **Authentication**: JWT-based auth with secure password hashing (bcrypt)
- **Database**: MongoDB with Mongoose ODM
- **Validation**: Mongoose schema validation & Joi request validation
- **Security**: Helmet headers, CORS, Rate Limiting, Mongo Sanitization
- **Logging**: Winston logger
- **Error Handling**: Centralized error handling mechanism

## Prerequisites

- Node.js (v14+)
- MongoDB Server (running on localhost:27017 by default)

## Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables in `.env`:
   ```
   PORT=8686
   NODE_ENV=development
   MONGO_URI=mongodb://localhost:27017/react_toolbox_db
   JWT_SECRET=your_jwt_secret
   ```

3. Ensure MongoDB server is running.

## Running the Server

- **Development**:
  ```bash
  npm run dev
  ```
- **Production**:
  ```bash
  npm start
  ```

## API Endpoints

### Auth
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user

### User
- `GET /api/users/profile` - Get current user profile (Requires Bearer Token)

## Testing

Run unit tests:
```bash
npm test
```
