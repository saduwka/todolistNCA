# Используем Node.js 18
FROM node:18

# Указываем рабочую директорию
WORKDIR /app

# Копируем package.json и package-lock.json
COPY package.json package-lock.json ./

# Устанавливаем зависимости
RUN npm install

# Копируем остальные файлы
COPY . .

# Открываем порт
EXPOSE 5000

# Запускаем сервер
CMD ["node", "server.js"]