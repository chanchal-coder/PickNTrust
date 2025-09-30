export const config = {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? [
          process.env.FRONTEND_URL || 'https://picktrustdeals.com',
          'http://localhost:3000',
          'http://localhost:5000',
          'http://localhost:5173'
        ]
      : [
          'http://localhost:3000',
          'http://localhost:5000',
          'http://127.0.0.1:5173',
          'http://localhost:5173'
        ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    optionsSuccessStatus: 200
  },
  port: process.env.PORT || 5000,
  database: {
    path: process.env.DATABASE_PATH || './database.sqlite'
  }
};
