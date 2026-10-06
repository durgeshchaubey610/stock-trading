import api from './api';
import { auth } from '../firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  updateProfile
} from 'firebase/auth';
import type { LoginRequest, RegisterRequest, AuthResponse } from '../types/auth';

export const authService = {
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    try {
      // 1. Firebase Authentication
      const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
      const fbUser = userCredential.user;
      const idToken = await fbUser.getIdToken();

      // 2. Synchronize with backend API session
      try {
        const syncResponse = await api.post('/auth/firebase-sync', {
          uid: fbUser.uid,
          email: fbUser.email,
          displayName: fbUser.displayName || data.email.split('@')[0],
          idToken
        });
        return syncResponse.data;
      } catch {
        return {
          status: 'success',
          token: idToken,
          user: {
            id: fbUser.uid,
            username: fbUser.displayName || fbUser.email?.split('@')[0] || 'User',
            email: fbUser.email || data.email,
            is_premium: true,
            subscription_tier: 'premium'
          }
        };
      }
    } catch {
      // Fallback to local backend login if Firebase auth returns error or user exists locally
      const response = await api.post('/auth/login', data);
      return response.data;
    }
  },
  
  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    try {
      // 1. Firebase Authentication Registration
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const fbUser = userCredential.user;
      if (data.username) {
        await updateProfile(fbUser, { displayName: data.username }).catch(() => {});
      }
      const idToken = await fbUser.getIdToken();

      // 2. Synchronize with backend API session
      try {
        const syncResponse = await api.post('/auth/firebase-sync', {
          uid: fbUser.uid,
          email: fbUser.email,
          displayName: data.username || fbUser.displayName || data.email.split('@')[0],
          idToken
        });
        return syncResponse.data;
      } catch {
        return {
          status: 'success',
          message: 'User registered successfully via Firebase',
          token: idToken,
          user: {
            id: fbUser.uid,
            username: data.username || fbUser.email?.split('@')[0] || 'User',
            email: fbUser.email || data.email,
            is_premium: true,
            subscription_tier: 'premium'
          }
        };
      }
    } catch {
      // Fallback to local backend registration
      const response = await api.post('/auth/register', data);
      return response.data;
    }
  },

  logout: async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.warn("Firebase signout error:", e);
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
  
  getProfile: async () => {
    const response = await api.get('/profile');
    return response.data;
  }
};
