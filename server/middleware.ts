import { Request, Response, NextFunction } from 'express';
import { config } from './config';

export const corsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const origin = req.headers.origin;
  
  // Define allowed origins based on environment
  const allowedOrigins = process.env.NODE_ENV === 'production' 
    ? [
        'https://picktrustdeals.com',
        'https://www.picktrustdeals.com',
        'https://pickntrust.com',
        'https://www.pickntrust.com',
        'http://localhost:3000',
        'http://localhost:5000',
        'http://localhost:5173',
        'http://127.0.0.1:5000',
        'http://127.0.0.1:5173'
      ]
    : [
        'http://localhost:3000',
        'http://localhost:5000',
        'http://127.0.0.1:5173',
        'http://localhost:5173',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:5000'
      ];

  // Set CORS headers
  if (origin && allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  } else if (process.env.NODE_ENV !== 'production') {
    // In development, allow all origins
    res.header('Access-Control-Allow-Origin', origin || '*');
  } else {
    // In production, be more restrictive
    res.header('Access-Control-Allow-Origin', 'https://picktrustdeals.com');
  }
  
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH, HEAD');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, X-File-Name, X-HTTP-Method-Override, If-Modified-Since, X-Forwarded-For, X-Real-IP');
  res.header('Access-Control-Expose-Headers', 'Content-Length, X-Foo, X-Bar');
  res.header('Access-Control-Max-Age', '86400');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  next();
};

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Server Error:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    body: req.body,
    headers: req.headers
  });
  
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  
  res.status(status).json({ 
    message,
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const path = req.path;
  
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      console.log(`${req.method} ${path} ${res.statusCode} in ${duration}ms`);
    }
  });
  
  next();
};
