import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyA6ad4UWDIp4Len_uT2ZjoZt0zChFCmO2w",
  authDomain: "cortexwebos.firebaseapp.com",
  projectId: "cortexwebos",
  storageBucket: "cortexwebos.firebasestorage.app",
  messagingSenderId: "299757536536",
  appId: "1:299757536536:web:d8ff99f3530790fb818a6d",
  measurementId: "G-RX791QJ62P"
};

console.log('--- WEB FIREBASE COMPAT INIT ---');

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const authInstance = firebase.auth();
const db = firebase.firestore();

export const GoogleAuthProvider = firebase.auth.GoogleAuthProvider;

console.log('--- WEB FIREBASE COMPAT READY ---');

export { authInstance as auth, db };
export default firebase;
