import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyA6ad4UWDIp4Len_uT2ZjoZt0zChFCmO2w",
  authDomain: "cortexwebos.firebaseapp.com",
  projectId: "cortexwebos",
  storageBucket: "cortexwebos.firebasestorage.app",
  messagingSenderId: "299757536536",
  appId: "1:299757536536:web:d8ff99f3530790fb818a6d",
  measurementId: "G-RX791QJ62P"
};

console.log('--- WEB FIREBASE INIT ---');

let app;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const authInstance = getAuth(app);
const db = getFirestore(app);

console.log('--- WEB FIREBASE READY ---');

export { authInstance as auth, db };
