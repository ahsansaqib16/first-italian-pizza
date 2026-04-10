require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const morgan  = require('morgan');
const path    = require('path');

const app = express();

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

// Static uploads — use UPLOADS_DIR env var (set by Electron) or fallback for dev
const uploadsDir = process.env.UPLOADS_DIR || path.join(__dirname, '../uploads');
app.use('/uploads', express.static(uploadsDir));

// Routes
app.use('/api/auth',        require('./routes/auth'));
app.use('/api/categories',  require('./routes/categories'));
app.use('/api/products',    require('./routes/products'));
app.use('/api/orders',      require('./routes/orders'));
app.use('/api/inventory',   require('./routes/inventory'));
app.use('/api/users',       require('./routes/users'));
app.use('/api/reports',     require('./routes/reports'));
app.use('/api/expenses',    require('./routes/expenses'));
app.use('/api/settings',    require('./routes/settings'));

app.get('/api/health', (_req, res) => res.json({ status: 'OK', version: '1.0.0' }));

// Global error handler
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || 'Internal Server Error' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, '127.0.0.1', () => console.log(`🍕 Pizza API running on http://127.0.0.1:${PORT}`));
