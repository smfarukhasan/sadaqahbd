import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();
    const request = ctx.getRequest<FastifyRequest>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';
    let errorType = 'InternalServerError';

    // 1. NestJS Built-in HttpExceptions (BadRequestException, ForbiddenException, NotFoundException, etc.)
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        const anyRes = res as any;
        message = anyRes.message || anyRes.error || exception.message;
        errorType = anyRes.error || exception.name;
      } else {
        message = exception.message;
      }
    }
    // 2. Zod Validation Errors
    else if (exception instanceof ZodError) {
      status = HttpStatus.BAD_REQUEST;
      errorType = 'ValidationError';
      const formattedIssues = exception.issues.map((issue) => {
        const path = issue.path.join('.');
        return path ? `${path}: ${issue.message}` : issue.message;
      });
      message = formattedIssues.join('; ');
      this.logger.warn(`Validation Error on ${request.url}: ${message}`);
    }
    // 3. MySQL / Database Errors
    else if (
      exception &&
      typeof exception === 'object' &&
      ('code' in exception || 'errno' in exception)
    ) {
      const dbErr = exception as any;
      if (dbErr.code === 'ER_DUP_ENTRY' || dbErr.errno === 1062) {
        status = HttpStatus.BAD_REQUEST;
        errorType = 'DuplicateEntryError';
        message = 'এই তথ্যটি (ইমেইল অথবা ফোন নম্বর) ইতোমধ্যে অন্য একটি অ্যাকাউন্টে ব্যবহৃত হয়েছে।';
      } else if (dbErr.code === 'ER_NO_REFERENCED_ROW_2') {
        status = HttpStatus.BAD_REQUEST;
        errorType = 'ReferenceError';
        message = 'সম্পর্কিত ডেটা বা রেফারেন্স খুঁজে পাওয়া যায়নি।';
      } else {
        status = HttpStatus.BAD_REQUEST;
        errorType = 'DatabaseError';
        message = `ডাটাবেজ ত্রুটি: ${dbErr.message || 'অনুরোধটি সম্পন্ন করা সম্ভব হয়নি।'}`;
      }
      this.logger.error(`Database Exception on ${request.url}:`, dbErr.message || dbErr);
    }
    // 4. Firebase Authentication Errors
    else if (
      exception &&
      typeof exception === 'object' &&
      'code' in exception &&
      typeof (exception as any).code === 'string' &&
      (exception as any).code.startsWith('auth/')
    ) {
      const fbErr = exception as any;
      status = HttpStatus.BAD_REQUEST;
      errorType = 'FirebaseAuthError';
      switch (fbErr.code) {
        case 'auth/email-already-exists':
          message = 'এই ইমেইল দিয়ে ইতোমধ্যে একটি Firebase অ্যাকাউন্ট রয়েছে।';
          break;
        case 'auth/invalid-email':
          message = 'ইমেইল অ্যাড্রেসের ফরম্যাট সঠিক নয়।';
          break;
        case 'auth/invalid-phone-number':
          message = 'ফোন নম্বরের ফরম্যাট সঠিক নয়। বাংলাদেশের জন্য 01XXXXXXXXX ফরম্যাট দিন।';
          break;
        case 'auth/phone-number-already-exists':
          message = 'এই ফোন নম্বর দিয়ে ইতোমধ্যে একটি অ্যাকাউন্ট রয়েছে।';
          break;
        case 'auth/weak-password':
          message = 'পাসওয়ার্ড অত্যন্ত দুর্বল। কমপক্ষে ৮ অক্ষরের শক্ত পাসওয়ার্ড ব্যবহার করুন।';
          break;
        default:
          message = fbErr.message || 'Firebase authentication error';
      }
      this.logger.warn(`Firebase Auth Exception on ${request.url}: ${fbErr.code} - ${message}`);
    }
    // 5. Standard JavaScript Error or Unknown Error
    else if (exception instanceof Error) {
      status = HttpStatus.BAD_REQUEST;
      errorType = exception.name || 'Error';
      message = exception.message || 'An unexpected error occurred';
      this.logger.error(`Unhandled Exception on ${request.url}:`, exception.stack || exception.message);
    } else {
      this.logger.error(`Unknown Exception on ${request.url}:`, exception);
    }

    // Return clean, informative JSON response to the client
    response.status(status).send({
      statusCode: status,
      error: errorType,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
