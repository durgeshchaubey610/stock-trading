import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';
import { getStorage } from 'firebase/storage';

export const firebaseConfig = {
  apiKey: "AIzaSyAK8dYM_gnzYNdzOJHs14Vt25tLGOJtY0Y",
  authDomain: "chaubeyedu.firebaseapp.com",
  databaseURL: "https://chaubeyedu-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "chaubeyedu",
  storageBucket: "chaubeyedu.firebasestorage.app",
  messagingSenderId: "1056511681360",
  appId: "1:1056511681360:web:3373cb7e3799eb95c48255",
  measurementId: "G-6WKDGDLLFZ"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const firestore = getFirestore(app);
export const rtdb = getDatabase(app);
export const storage = getStorage(app);

export default app;
