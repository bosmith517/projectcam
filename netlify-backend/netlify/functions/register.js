const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Simple in-memory storage for demo (in production, use a real database)
let users = [];

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ message: 'Method not allowed' }),
    };
  }

  try {
    const { firstName, lastName, email, password, company, trade, phone } = JSON.parse(event.body);

    // Validation
    if (!firstName || !lastName || !email || !password || !company || !trade) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: 'All required fields must be provided' }),
      };
    }

    // Check if user already exists
    const existingUser = users.find(user => user.email === email.toLowerCase());
    if (existingUser) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: 'User with this email already exists' }),
      };
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = {
      id: Date.now().toString(),
      firstName,
      lastName,
      email: email.toLowerCase(),
      password: hashedPassword,
      company,
      trade,
      phone: phone || '',
      role: 'member',
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    users.push(user);

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id,
        email: user.email 
      },
      process.env.JWT_SECRET || 'projectcam-secret-key-123',
      { expiresIn: '7d' }
    );

    // Return user data (without password)
    const userData = {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      company: user.company,
      trade: user.trade,
      phone: user.phone,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt
    };

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({
        message: 'User registered successfully',
        token,
        user: userData
      }),
    };

  } catch (error) {
    console.error('Registration error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        message: 'Registration failed',
        error: error.message
      }),
    };
  }
};
