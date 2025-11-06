import User from '../models/user.model.js';
import ArtistProfile from '../models/artist.model.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    // Normalize email to lowercase and trim (same as model)
    const normalizedEmail = email?.toLowerCase().trim();
    
    // Trim password to avoid whitespace issues
    const trimmedPassword = password?.trim();

    // Check if user exists
    const userExists = await User.findOne({ email: normalizedEmail });
    if (userExists) {
      return res.status(400).json({ 
        success: false,
        message: 'User already exists' 
      });
    }

    // Validate password
    if (!trimmedPassword || trimmedPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }

    // Create user - password will be hashed automatically by the pre-save hook in the User model
    // ✅ CORRECT: We pass plain password, pre-save hook hashes it with bcrypt.hash()
    const user = await User.create({
      name,
      email: normalizedEmail,
      password: trimmedPassword, // Pass plain password, model will hash it
      role: role || 'BUYER',
    });

    // Verify password was hashed (should be ~60 characters)
    const passwordHashLength = user.password?.length || 0;
    const isHashed = passwordHashLength > 50; // bcrypt hashes are typically 60 chars
    
    console.log('User registered successfully:', {
      email: normalizedEmail,
      role: user.role,
      passwordHashExists: !!user.password,
      passwordHashLength: passwordHashLength,
      isProperlyHashed: isHashed
    });
    
    if (!isHashed) {
      console.error('WARNING: Password may not have been hashed correctly!');
    }

    // If artist, create artist profile
    if (user.role === 'ARTIST') {
      await ArtistProfile.create({ userId: user._id });
    }

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    console.log('=== LOGIN REQUEST RECEIVED ===');
    console.log('Raw email from request:', email);
    console.log('Password provided:', password ? `[${password.length} chars]` : 'MISSING');

    // Normalize email to lowercase and trim (same as model)
    const normalizedEmail = email?.toLowerCase().trim();
    
    // Trim password to avoid whitespace issues
    const trimmedPassword = password?.trim();
    
    if (!trimmedPassword) {
      return res.status(400).json({
        success: false,
        message: 'Password is required'
      });
    }
    console.log('Normalized email:', normalizedEmail);

    // Find user and include password field
    const user = await User.findOne({ email: normalizedEmail }).select('+password');

    if (!user) {
      console.log('User not found for email:', normalizedEmail);
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    console.log('User found:', {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role
    });

    // Debug: Check password hash format
    const passwordHashLength = user.password?.length || 0;
    const isHashed = passwordHashLength > 50; // bcrypt hashes are typically 60 chars
    const hashFormat = user.password?.substring(0, 4) || 'NULL';
    
    console.log('Password hash info:', {
      exists: !!user.password,
      length: passwordHashLength,
      format: hashFormat,
      isProperlyHashed: isHashed,
      fullHash: user.password ? user.password.substring(0, 30) + '...' : 'NULL'
    });
    
    // Compare password
    // ✅ CORRECT: Use bcrypt.compare() with plain password and stored hash
    // ❌ WRONG: Never hash the password again here (bcrypt.hash() would create a different hash each time)
    console.log('Comparing password...');
    const valid = await bcrypt.compare(trimmedPassword, user.password);
    
    console.log('=== PASSWORD COMPARISON RESULT ===');
    console.log('Valid:', valid);
    
    if (!valid) {
      console.error('❌ PASSWORD COMPARISON FAILED');
      console.error('Email:', normalizedEmail);
      console.error('Password hash exists:', !!user.password);
      console.error('Password hash length:', user.password?.length);
      console.error('Password hash starts with:', hashFormat);
      console.error('Input password length:', password?.length || 0);
      
      // Check if password might be double-hashed
      if (user.password && !user.password.startsWith('$2')) {
        console.error('⚠️ ERROR: Password is not in bcrypt format!');
        console.error('This account may have been created before the fix and has a corrupted password.');
        console.error('SOLUTION: Delete this account and create a new one.');
      } else if (user.password && user.password.startsWith('$2')) {
        console.error('✅ Password hash format is correct (bcrypt)');
        console.error('❌ Password simply does not match');
      }
    } else {
      console.log('✅ PASSWORD MATCH - Login successful!');
    }

    if (!valid) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid credentials' 
      });
    }

    // Generate and save token
    const token = crypto.randomBytes(32).toString('hex');
    user.token = token;
    await user.save();

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          isVerified: user.isVerified,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
export const logout = async (req, res, next) => {
  try {
    // Remove token from user
    req.user.token = null;
    await req.user.save();

    res.json({
      success: true,
      message: 'Logout successful',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    res.json({
      success: true,
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          isVerified: user.isVerified,
          createdAt: user.createdAt,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Test password hashing (TEMPORARY - FOR DEBUGGING ONLY)
// @route   POST /api/auth/test-password
// @access  Public
export const testPassword = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password required'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail }).select('+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Test password comparison
    const isValid = await bcrypt.compare(password, user.password);

    res.json({
      success: true,
      data: {
        email: normalizedEmail,
        userFound: true,
        passwordHashExists: !!user.password,
        passwordHashLength: user.password?.length || 0,
        passwordHashFormat: user.password?.substring(0, 4) || 'N/A',
        isProperlyHashed: (user.password?.length || 0) > 50,
        passwordMatch: isValid,
        testPassword: password,
        storedHash: user.password ? user.password.substring(0, 20) + '...' : 'NULL'
      }
    });
  } catch (error) {
    next(error);
  }
};
