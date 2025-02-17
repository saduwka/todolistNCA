import React, { useState } from "react";
import styles from "./TaskSearch.module.css";

export default function TaskSearch({ onSearch }) {
  const [query, setQuery] = useState("");

  const handleSearch = (e) => {
    const value = e.target.value;
    setQuery(value);
    onSearch(value);
  };

  return (
    <div className={styles.searchContainer}>
      <input
        type="text"
        className={styles.searchInput}
        placeholder="🔍 Поиск задач..."
        value={query}
        onChange={handleSearch}
      />
    </div>
  );
}
