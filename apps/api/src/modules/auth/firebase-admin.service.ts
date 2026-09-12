import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseAdminService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseAdminService.name);
  private firebaseApp: admin.app.App | null = null;

  onModuleInit() {
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'sadaqahbd';

    if (admin.apps.length > 0) {
      this.firebaseApp = admin.apps[0]!;
      return;
    }

    try {
      if (serviceAccountKey) {
        let cert: admin.ServiceAccount;
        if (serviceAccountKey.startsWith('{')) {
          cert = JSON.parse(serviceAccountKey);
        } else {
          // treat as file path or base64
          try {
            const decoded = Buffer.from(serviceAccountKey, 'base64').toString('utf-8');
            cert = JSON.parse(decoded);
          } catch {
            cert = require(serviceAccountKey);
          }
        }
        this.firebaseApp = admin.initializeApp({
          credential: admin.credential.cert(cert),
          projectId,
        });
        this.logger.log('Firebase Admin initialized with Service Account.');
      } else {
        // Fallback for local development or Google Default Credentials
        this.firebaseApp = admin.initializeApp({
          projectId,
        });
        this.logger.warn(
          'Firebase Admin initialized with default projectId (no Service Account key supplied).'
        );
      }
    } catch (err: any) {
      this.logger.error('Failed to initialize Firebase Admin SDK', err.message);
    }
  }

  get auth(): admin.auth.Auth {
    return admin.auth();
  }

  get messaging(): admin.messaging.Messaging {
    return admin.messaging();
  }

  async verifyIdToken(idToken: string): Promise<admin.auth.DecodedIdToken> {
    return this.auth.verifyIdToken(idToken);
  }

  async createOrUpdateUser(params: {
    email: string;
    password?: string;
    displayName: string;
    phoneNumber?: string;
  }): Promise<admin.auth.UserRecord> {
    try {
      const existing = await this.auth.getUserByEmail(params.email);
      return existing;
    } catch (err: any) {
      if (err.code === 'auth/user-not-found') {
        return this.auth.createUser({
          email: params.email,
          password: params.password || 'pass1233',
          displayName: params.displayName,
          phoneNumber: params.phoneNumber,
        });
      }
      throw err;
    }
  }
}
