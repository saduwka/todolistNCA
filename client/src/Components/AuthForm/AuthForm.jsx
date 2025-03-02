import { useState } from "react";
import { signInWithGoogle } from "../../firebase"; // Импортируем функцию входа через Google
import styles from "./AuthForm.module.css";

const AuthForm = ({ onSubmit }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ email, password, isRegister });
  };

  return (
    <div className={styles.container}>
      <form className={styles.form} onSubmit={handleSubmit}>
        <h2>{isRegister ? "Регистрация" : "Вход"}</h2>

        <div className={styles.inputGroup}>
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className={styles.inputGroup}>
          <label>Пароль</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button type="submit" className={styles.button}>
          {isRegister ? "Зарегистрироваться" : "Войти"}
        </button>

        <p className={styles.toggleText}>
          {isRegister ? "Уже есть аккаунт?" : "Нет аккаунта?"}{" "}
          <span onClick={() => setIsRegister(!isRegister)}>
            {isRegister ? "Войти" : "Регистрация"}
          </span>
        </p>

        {/* Кнопка входа через Google */}
        <button
          type="button"
          className={styles.googleButton}
          onClick={signInWithGoogle}
        >
          Войти через Google
        </button>
      </form>
    </div>
  );
};

export default AuthForm;