// Arquivo de declaração de tipos para Express
// Corrige problemas de importação com ES modules

declare module 'express' {
  import type { Application, Request, Response, NextFunction, RequestHandler } from 'express-serve-static-core';
  
  function express(): Application;
  
  namespace express {
    export function json(options?: any): RequestHandler;
    export function urlencoded(options?: any): RequestHandler;
    export function static(root: string, options?: any): RequestHandler;
    export { Application, Request, Response, NextFunction, RequestHandler };
  }
  
  export = express;
}