import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";

// Ваши Firebase конфигурации
const firebaseConfig = {
  apiKey: "AIzaSyCgUvNH8SF0Pbl5Yid1ObI7hc8kAcSPaQI",
  authDomain: "tasks-acd7c.firebaseapp.com",
  projectId: "tasks-acd7c",
  storageBucket: "tasks-acd7c.firebasestorage.app",
  messagingSenderId: "1017047993935",
  appId: "1:1017047993935:web:ac16d268b88694d24aa43a",
  measurementId: "G-Q65L60QXME"
};

// Инициализация Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// Функция для входа с Google
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    // Получаем токен пользователя
    const token = await user.getIdToken();
    localStorage.setItem("token", token); // Сохраняем в localStorage

    return user;
  } catch (error) {
    console.error("Ошибка авторизации:", error);
  }
};

// Функция для выхода из аккаунта
export const logOut = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Ошибка выхода:", error);
  }
};

export { auth };