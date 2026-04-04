import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyCkPowJwB7YC6dolvH8gqzQeWZKqUvlolM",
  authDomain: "boardgame-373fb.firebaseapp.com",
  databaseURL: "https://boardgame-373fb-default-rtdb.firebaseio.com",
  projectId: "boardgame-373fb",
  storageBucket: "boardgame-373fb.firebasestorage.app",
  messagingSenderId: "147450335913",
  appId: "1:147450335913:web:a1063fecc3b952401e0fb8",
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
