import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';
import * as crypto from 'crypto';

@Injectable()
export class FirebaseAdminService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseAdminService.name);
  private firebaseApp: admin.app.App | null = null;
  private hasServiceAccount = false;

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
        this.hasServiceAccount = true;
        this.logger.log('Firebase Admin initialized with Service Account.');
      } else {
        this.firebaseApp = admin.initializeApp({
          projectId,
        });
        this.hasServiceAccount = false;
        this.logger.warn(
          'Firebase Admin initialized with default projectId (no Service Account key supplied).'
        );
      }
    } catch (err: any) {
      this.logger.error('Failed to initialize Firebase Admin SDK', err.message);
    }
  }

  get hasValidServiceAccount(): boolean {
    return this.hasServiceAccount;
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
  }): Promise<{ uid: string; email?: string; displayName?: string }> {
    // 1. Try Firebase Admin SDK if service account is available
    if (this.hasServiceAccount) {
      try {
        const existing = await this.auth.getUserByEmail(params.email);
        return existing;
      } catch (err: any) {
        if (err.code === 'auth/user-not-found') {
          // Sanitize phone for Firebase Auth (must be E.164 e.g. +8801XXXXXXXXX)
          let cleanPhone: string | undefined = undefined;
          if (params.phoneNumber) {
            let p = params.phoneNumber.trim().replace(/[\s-]/g, '');
            if (/^01[3-9]\d{8}$/.test(p)) {
              p = '+88' + p;
            }
            if (/^\+[1-9]\d{1,14}$/.test(p)) {
              cleanPhone = p;
            }
          }

          try {
            return await this.auth.createUser({
              email: params.email,
              password: params.password || 'pass1233',
              displayName: params.displayName,
              ...(cleanPhone ? { phoneNumber: cleanPhone } : {}),
            });
          } catch (fbErr: any) {
            if (
              fbErr.code === 'auth/invalid-phone-number' ||
              fbErr.code === 'auth/phone-number-already-exists'
            ) {
              return await this.auth.createUser({
                email: params.email,
                password: params.password || 'pass1233',
                displayName: params.displayName,
              });
            }
            throw fbErr;
          }
        }
        this.logger.warn(`Firebase Admin lookup failed: ${err.message}. Falling back to REST API.`);
      }
    }

    // 2. Fallback: Firebase Auth REST API with Web API Key
    const apiKey =
      process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
      process.env.FIREBASE_API_KEY ||
      'AIzaSyAg6Hthgv9fAHdAOsPDcIOZREy1wJIfzyM';

    try {
      const signUpRes = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: params.email,
            password: params.password || 'pass1233',
            returnSecureToken: true,
          }),
        }
      );

      const signUpData = await signUpRes.json();

      if (signUpData.localId) {
        // Update display name
        if (params.displayName && signUpData.idToken) {
          await fetch(
            `https://identitytoolkit.googleapis.com/v1/accounts:update?key=${apiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                idToken: signUpData.idToken,
                displayName: params.displayName,
              }),
            }
          ).catch(() => {});
        }
        return {
          uid: signUpData.localId,
          email: params.email,
          displayName: params.displayName,
        };
      }

      // If user already exists in Firebase, sign in to retrieve existing localId
      if (signUpData.error?.message?.includes('EMAIL_EXISTS')) {
        const signInRes = await fetch(
          `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: params.email,
              password: params.password || 'pass1233',
              returnSecureToken: true,
            }),
          }
        );
        const signInData = await signInRes.json();
        if (signInData.localId) {
          return {
            uid: signInData.localId,
            email: params.email,
            displayName: params.displayName,
          };
        }
      }
    } catch (restErr: any) {
      this.logger.warn(`Firebase REST auth fallback failed: ${restErr.message}`);
    }

    // 3. Fallback: Generate a deterministic or unique local UID
    const fallbackUid = 'usr_' + crypto.randomUUID().replace(/-/g, '').slice(0, 24);
    this.logger.log(`Created fallback local UID for ${params.email}: ${fallbackUid}`);
    return {
      uid: fallbackUid,
      email: params.email,
      displayName: params.displayName,
    };
  }
}
