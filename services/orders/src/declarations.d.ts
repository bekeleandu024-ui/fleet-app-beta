// Local ambient module declarations to avoid editor/TS errors when node_modules
// aren't installed yet. Install real types with `npm install` to replace these.

declare module 'express';
declare module 'cors';
declare module 'body-parser';
declare module 'uuid';

// Minimal shims for Request/Response so handlers can be typed.
declare global {
  namespace Express {
    interface Request {
      [key: string]: any;
    }

    interface Response {
      [key: string]: any;
    }
  }
}

export {};
