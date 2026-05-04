import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import localConfig from './firebase-applet-config.json';

const firebaseConfig = {
  apiKey: localConfig.apiKey,
  authDomain: localConfig.authDomain,
  projectId: localConfig.projectId,
  storageBucket: localConfig.storageBucket,
  messagingSenderId: localConfig.messagingSenderId,
  appId: localConfig.appId
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, localConfig.firestoreDatabaseId);
export const auth = getAuth(app);
