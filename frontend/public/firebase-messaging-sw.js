importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyA0Tbt16gKafumRk6TWFcSzZG8GuB3_ARY",
  authDomain: "pair-mate.firebaseapp.com",
  projectId: "pair-mate",
  storageBucket: "pair-mate.firebasestorage.app",
  messagingSenderId: "989934425215",
  appId: "1:989934425215:web:8f279a2cc88386bd45db4a"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/favicon.ico'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
