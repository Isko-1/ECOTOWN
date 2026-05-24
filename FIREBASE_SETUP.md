# Настройка Firebase для ECOTOWN

## Шаг 1: Создайте Firebase проект

1. Откройте https://console.firebase.google.com
2. Нажмите "Создать проект" (или "Add project")
3. Введите имя: `ECOTOWN`
4. Отключите Google Analytics (галочка) и создайте проект
5. Подождите 1-2 минуты, пока проект создаётся

## Шаг 2: Включите Firestore Database

1. В левом меню нажмите **Firestore Database**
2. Нажмите "Create database"
3. Выберите регион: **europe-west1** (или ближайший к вам)
4. Выберите режим: **Start in production mode** (или тестовый)
5. Нажмите "Create" и подождите ~1-2 минуты

## Шаг 3: Установите правила доступа

1. В Firestore идите на вкладку **Rules**
2. Замените весь текст на:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /marks/{document=**} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && resource.data.userId == request.auth.uid;
    }
  }
}
```

3. Нажмите "Publish"

## Шаг 4: Включите Authentication

1. В левом меню нажмите **Authentication**
2. Нажмите "Get started"
3. Выберите **Anonymous** (анонимная аутентификация)
4. Нажмите "Enable" и сохраните

## Шаг 5: Получите Firebase конфиг

1. В левом меню нажмите **Project Settings** (значок ⚙️)
2. Прокрутите вниз до "Your apps"
3. Нажмите на иконку `</>`  (Web)
4. Скопируйте весь объект `firebaseConfig` из кода
5. Он должен выглядеть так:

```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "ecotown-xxxxx.firebaseapp.com",
  projectId: "ecotown-xxxxx",
  storageBucket: "ecotown-xxxxx.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc..."
};
```

## Шаг 6: Добавьте конфиг в ECOTOWN

1. Откройте `index.html` в VS Code
2. Найдите строку: `var FIREBASE_CONFIG = {apiKey: "YOUR_KEY"...}`
3. Замените на ваш конфиг из шага 5
4. Сохраните файл (`Ctrl+S`)
5. Закоммитьте: `git add index.html && git commit -m "Add Firebase config" && git push`

## Готово! ✅

Теперь все метки будут сохраняться в облако Firebase и видны всем пользователям в реальном времени!

### Обслуживание

**Если нужно удалить метку:**
1. Откройте https://console.firebase.google.com
2. Перейдите в Firestore Database
3. Найдите коллекцию `marks`
4. Нажмите на метку и удалите документ

**Если нужно экспортировать данные:**
1. В Firestore нажмите на три точки у коллекции `marks`
2. Выберите "Export collection" → скачается JSON
