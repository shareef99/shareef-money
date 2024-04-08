import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyB4dIeidHuhn7OIq9p2CrmSIV6fpC3ucC0",
  authDomain: "shareef-money.firebaseapp.com",
  projectId: "shareef-money",
  storageBucket: "shareef-money.appspot.com",
  messagingSenderId: "313261930788",
  appId: "1:313261930788:web:059bbb54e1398fa63c5bb1",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

export default app;
