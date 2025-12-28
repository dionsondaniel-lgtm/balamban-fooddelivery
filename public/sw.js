// public/sw.js

self.addEventListener("push", function (event) {
  let data = {};
  if (event.data) {
    data = event.data.json();
  }

  const title = data.title || "FoodPapaDan";
  const options = {
    body: data.body || "You have a new notification!",
    icon: "/dan.svg",
    badge: "/dan.svg",
    data: data.url || "/dashboard", // redirect path on click
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Open app when notification is clicked
self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (clientList) {
      for (const client of clientList) {
        if (client.url === event.notification.data && "focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(event.notification.data);
      }
    })
  );
});
