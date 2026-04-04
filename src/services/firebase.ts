import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

console.log('--- NATIVE FIREBASE INIT ---');

const authInstance = auth();
const db            = firestore();

console.log('--- NATIVE FIREBASE READY ---');

export { authInstance as auth, db };
