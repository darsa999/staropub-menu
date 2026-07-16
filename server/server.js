process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const fs = require('fs');
const path = require('path');

dotenv.config();

// ─── Firebase Admin Initialization ───────────────────────────────────────────
// Commented placeholder block for service account credentials.
// const serviceAccount = require("./firebase-service-account.json");
// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount)
// });
const admin = require("firebase-admin");
const { getAuth } = require("firebase-admin/auth");

admin.auth = () => getAuth();

try {
  admin.initializeApp({
    projectId: process.env.FIREBASE_PROJECT_ID || "staropub-menu"
  });
} catch (e) {
  // Already initialized or placeholder error
}
const firebaseAdmin = admin;

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cookieParser());
app.use(express.json());

// Configure CORS to dynamically accept requests from the Vercel production domain or local dev
const cleanOrigin = (url) => {
  if (!url) return "";
  return url.replace(/\/$/, "");
};

const allowedOrigins = [
  "http://localhost:5173",
  cleanOrigin(process.env.FRONTEND_URL)
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

// Ensure public/uploads directory exists for local fallback storage
const uploadsDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

// ─── local JSON fallback database setup ──────────────────────────────────────
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}
const categoriesFile = path.join(dataDir, 'categories.json');
const dishesFile = path.join(dataDir, 'dishes.json');
const usersFile = path.join(dataDir, 'users.json');

const readJSON = (filePath) => {
  if (!fs.existsSync(filePath)) return [];
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (err) {
    return [];
  }
};

const writeJSON = (filePath, data) => {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
};

let useLocalFallback = false;

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('MongoDB Connected Successfully');
    useLocalFallback = false;
  })
  .catch(err => {
    console.error('MongoDB connection error, falling back to local JSON database:', err.message);
    useLocalFallback = true;
  });

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure Multer (Memory Storage)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Helper function to upload file (Cloudinary with local filesystem fallback)
const uploadFile = async (file, req) => {
  if (!file) return "";

  const isCloudinaryConfigured =
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_CLOUD_NAME !== 'your_cloud_name_here';

  if (isCloudinaryConfigured) {
    try {
      return await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "staropub" },
          (error, result) => {
            if (error) reject(error);
            else resolve(result.secure_url);
          }
        );
        stream.end(file.buffer);
      });
    } catch (err) {
      console.warn("Cloudinary upload failed, falling back to local storage:", err.message);
    }
  }

  // Local fallback storage
  const filename = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
  const filepath = path.join(uploadsDir, filename);
  fs.writeFileSync(filepath, file.buffer);

  if (req) {
    const host = req.get('host');
    const protocol = req.protocol;
    return `${protocol}://${host}/uploads/${filename}`;
  }
  return `http://localhost:5000/uploads/${filename}`;
};

// ─── Database Schemas and Models ──────────────────────────────────────────

const userSchema = new mongoose.Schema({
  email: { type: String, unique: true, sparse: true },
  password: { type: String },
  provider: { type: String, default: 'local' },
  providerId: { type: String }
}, {
  toJSON: {
    transform: (doc, ret) => {
      delete ret.password;
      delete ret.__v;
      return ret;
    }
  }
});

const categorySchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name_ka: String,
  name_en: String,
  name_ru: String,
  icon: String,
  image: String,
  isHot: { type: Boolean, default: false },
  order: { type: Number, default: 0 }
}, {
  toJSON: {
    transform: (doc, ret) => {
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

const dishSchema = new mongoose.Schema({
  name_ka: String,
  name_en: String,
  name_ru: String,
  desc_ka: String,
  desc_en: String,
  desc_ru: String,
  price: String,
  category: String,
  image: String,
  order: { type: Number, default: 0 }
}, {
  toJSON: {
    virtuals: true,
    transform: (doc, ret) => {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

const User = mongoose.model('User', userSchema);
const Category = mongoose.model('Category', categorySchema);
const Dish = mongoose.model('Dish', dishSchema);

// ─── Middleware: Protect Admin Endpoints ───────────────────────────────

const protect = (req, res, next) => {
  const token = req.cookies.admin_session;
  if (!token) {
    return res.status(401).json({ error: "Unauthorized: No session token provided" });
  }
  try {
    const secret = process.env.JWT_SECRET || 'staropub-super-secret-key';
    const decoded = jwt.verify(token, secret);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Unauthorized: Invalid or expired session token" });
  }
};

// ─── Express Auth REST Endpoints ──────────────────────────────────────────

// User Registration (Local)
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    if (useLocalFallback) {
      const users = readJSON(usersFile);
      if (users.some(u => u.email === email && u.provider === 'local')) {
        return res.status(400).json({ error: "User already exists with this email" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = {
        id: `user_${Date.now()}`,
        email,
        password: hashedPassword,
        provider: 'local'
      };
      users.push(newUser);
      writeJSON(usersFile, users);

      const secret = process.env.JWT_SECRET || 'staropub-super-secret-key';
      const token = jwt.sign({ id: newUser.id, email: newUser.email }, secret, { expiresIn: '30d' });

      res.cookie('admin_session', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
      });
      
      const resUser = { ...newUser };
      delete resUser.password;
      return res.status(201).json(resUser);
    }

    const existingUser = await User.findOne({ email, provider: 'local' });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists with this email" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      email,
      password: hashedPassword,
      provider: 'local'
    });
    await newUser.save();

    const secret = process.env.JWT_SECRET || 'staropub-super-secret-key';
    const token = jwt.sign({ id: newUser._id, email: newUser.email }, secret, { expiresIn: '30d' });

    res.cookie('admin_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });

    res.status(201).json(newUser);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// User Login (Local)
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    if (useLocalFallback) {
      const users = readJSON(usersFile);
      const user = users.find(u => u.email === email && u.provider === 'local');
      if (!user) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      const secret = process.env.JWT_SECRET || 'staropub-super-secret-key';
      const token = jwt.sign({ id: user.id, email: user.email }, secret, { expiresIn: rememberMe ? '30d' : '1d' });

      const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
      };

      if (rememberMe) {
        cookieOptions.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
      }

      res.cookie('admin_session', token, cookieOptions);
      const resUser = { ...user };
      delete resUser.password;
      return res.json(resUser);
    }

    const user = await User.findOne({ email, provider: 'local' });
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const secret = process.env.JWT_SECRET || 'staropub-super-secret-key';
    const token = jwt.sign({ id: user._id, email: user.email }, secret, { expiresIn: rememberMe ? '30d' : '1d' });

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
    };

    if (rememberMe) {
      cookieOptions.maxAge = 30 * 24 * 60 * 60 * 1000;
    }

    res.cookie('admin_session', token, cookieOptions);
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// User Social Login (Mock OAuth)
app.post('/api/auth/social-login', async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ error: "Firebase ID token is required" });
    }

    // Verify token using firebaseAdmin
    let decodedToken;
    try {
      decodedToken = await admin.auth().verifyIdToken(token);
    } catch (verifyErr) {
      console.error("Firebase ID token verification failed:", verifyErr);
      return res.status(401).json({ error: "Invalid social login token: " + verifyErr.message });
    }

    const { email, uid, name } = decodedToken;
    const provider = decodedToken.firebase?.sign_in_provider || "google.com";

    if (useLocalFallback) {
      const users = readJSON(usersFile);
      let user = users.find(u => u.email === email || (u.provider === provider && u.providerId === uid));
      if (!user) {
        user = {
          id: `user_${Date.now()}`,
          email,
          provider,
          providerId: uid,
          name: name || email
        };
        users.push(user);
        writeJSON(usersFile, users);
      } else {
        // Update user if provider info is updated
        let updated = false;
        if (!user.provider) { user.provider = provider; updated = true; }
        if (!user.providerId) { user.providerId = uid; updated = true; }
        if (updated) {
          writeJSON(usersFile, users);
        }
      }

      const secret = process.env.JWT_SECRET || 'staropub-super-secret-key';
      const jwtToken = jwt.sign({ id: user.id, email: user.email }, secret, { expiresIn: '30d' });

      res.cookie('admin_session', jwtToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
      });

      const resUser = { ...user };
      delete resUser.password;
      return res.json(resUser);
    }

    // MongoDB Atlas flow
    let user = await User.findOne({ email });
    if (!user) {
      // Create user if not exists
      user = new User({
        email,
        provider,
        providerId: uid
      });
      await user.save();
    } else {
      // Check if social provider needs to be linked
      if (!user.provider) {
        user.provider = provider;
        user.providerId = uid;
        await user.save();
      }
    }

    const secret = process.env.JWT_SECRET || 'staropub-super-secret-key';
    const jwtToken = jwt.sign({ id: user._id, email: user.email }, secret, { expiresIn: '30d' });

    res.cookie('admin_session', jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });

    res.json(user);
  } catch (err) {
    console.error("Social login route error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Check Active Session
app.get('/api/auth/me', async (req, res) => {
  const token = req.cookies.admin_session;
  if (!token) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  try {
    const secret = process.env.JWT_SECRET || 'staropub-super-secret-key';
    const decoded = jwt.verify(token, secret);

    if (useLocalFallback) {
      const users = readJSON(usersFile);
      const user = users.find(u => u.id === decoded.id);
      if (!user) {
        return res.status(401).json({ error: "User not found" });
      }
      const resUser = { ...user };
      delete resUser.password;
      return res.json(resUser);
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }
    res.json(user);
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
});

// User Logout
app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('admin_session', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  });
  res.json({ message: "Logged out successfully" });
});

// ─── Express Menu/Dashboard REST Endpoints ─────────────────────────────────

// GET Categories
app.get('/api/categories', async (req, res) => {
  if (useLocalFallback) {
    const categories = readJSON(categoriesFile);
    return res.json(categories.sort((a, b) => (a.order || 0) - (b.order || 0)));
  }
  try {
    const categories = await Category.find().sort({ order: 1 });
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST Category (multipart upload, PROTECTED)
app.post('/api/categories', protect, upload.single('image'), async (req, res) => {
  try {
    const { id, name_ka, name_en, name_ru, icon, isHot } = req.body;
    let imageUrl = "";
    if (req.file) {
      imageUrl = await uploadFile(req.file, req);
    }

    if (useLocalFallback) {
      const categories = readJSON(categoriesFile);
      const newCategory = {
        id,
        name_ka,
        name_en,
        name_ru,
        icon,
        image: imageUrl,
        isHot: isHot === 'true',
        order: categories.length
      };
      categories.push(newCategory);
      writeJSON(categoriesFile, categories);
      return res.status(201).json(newCategory);
    }

    const newCategory = new Category({
      id,
      name_ka,
      name_en,
      name_ru,
      icon,
      image: imageUrl,
      isHot: isHot === 'true',
      order: await Category.countDocuments()
    });
    await newCategory.save();
    res.status(201).json(newCategory);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE Category (PROTECTED)
app.delete('/api/categories/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;

    if (useLocalFallback) {
      let categories = readJSON(categoriesFile);
      categories = categories.filter(c => c.id !== id);
      writeJSON(categoriesFile, categories);

      let dishes = readJSON(dishesFile);
      dishes = dishes.filter(d => d.category !== id);
      writeJSON(dishesFile, dishes);

      return res.json({ message: "Category and associated dishes deleted successfully" });
    }

    await Category.findOneAndDelete({ id });
    await Dish.deleteMany({ category: id });
    res.json({ message: "Category and associated dishes deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// REORDER Categories (PROTECTED)
app.put('/api/categories/reorder', protect, async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids)) {
      return res.status(400).json({ error: "ids must be an array" });
    }

    if (useLocalFallback) {
      const categories = readJSON(categoriesFile);
      categories.forEach(cat => {
        const newIdx = ids.indexOf(cat.id);
        if (newIdx !== -1) cat.order = newIdx;
      });
      writeJSON(categoriesFile, categories);
      return res.json({ message: "Categories order updated successfully" });
    }

    for (let i = 0; i < ids.length; i++) {
      await Category.findOneAndUpdate({ id: ids[i] }, { order: i });
    }
    res.json({ message: "Categories order updated successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET Dishes
app.get('/api/dishes', async (req, res) => {
  if (useLocalFallback) {
    const dishes = readJSON(dishesFile);
    return res.json(dishes.sort((a, b) => (a.order || 0) - (b.order || 0)));
  }
  try {
    const dishes = await Dish.find().sort({ order: 1 });
    res.json(dishes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST Dish (multipart upload, PROTECTED)
app.post('/api/dishes', protect, upload.single('image'), async (req, res) => {
  try {
    const { name_ka, name_en, name_ru, desc_ka, desc_en, desc_ru, price, category } = req.body;
    let imageUrl = "";
    if (req.file) {
      imageUrl = await uploadFile(req.file, req);
    }

    if (useLocalFallback) {
      const dishes = readJSON(dishesFile);
      const newDish = {
        id: `local_${Date.now()}`,
        name_ka,
        name_en,
        name_ru,
        desc_ka,
        desc_en,
        desc_ru,
        price,
        category,
        image: imageUrl,
        order: dishes.filter(d => d.category === category).length
      };
      dishes.push(newDish);
      writeJSON(dishesFile, dishes);
      return res.status(201).json(newDish);
    }

    const newDish = new Dish({
      name_ka,
      name_en,
      name_ru,
      desc_ka,
      desc_en,
      desc_ru,
      price,
      category,
      image: imageUrl,
      order: await Dish.countDocuments({ category })
    });
    await newDish.save();

    res.status(201).json(newDish);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE Dish (PROTECTED)
app.delete('/api/dishes/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;

    if (useLocalFallback) {
      let dishes = readJSON(dishesFile);
      dishes = dishes.filter(d => d.id !== id);
      writeJSON(dishesFile, dishes);
      return res.json({ message: "Dish deleted successfully" });
    }

    await Dish.findByIdAndDelete(id);
    res.json({ message: "Dish deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// REORDER Dishes (PROTECTED)
app.put('/api/dishes/reorder', protect, async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids)) {
      return res.status(400).json({ error: "ids must be an array" });
    }

    if (useLocalFallback) {
      const dishes = readJSON(dishesFile);
      dishes.forEach(dish => {
        const newIdx = ids.indexOf(dish.id);
        if (newIdx !== -1) dish.order = newIdx;
      });
      writeJSON(dishesFile, dishes);
      return res.json({ message: "Dishes order updated successfully" });
    }

    for (let i = 0; i < ids.length; i++) {
      if (mongoose.Types.ObjectId.isValid(ids[i])) {
        await Dish.findByIdAndUpdate(ids[i], { order: i });
      }
    }
    res.json({ message: "Dishes order updated successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
