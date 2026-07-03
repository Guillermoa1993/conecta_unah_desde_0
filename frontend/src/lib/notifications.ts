export function requestNotificationPermission(): Promise<boolean> {
  return new Promise((resolve) => {
    if (!("Notification" in window)) {
      resolve(false);
      return;
    }
    if (Notification.permission === "granted") {
      resolve(true);
      return;
    }
    if (Notification.permission === "denied") {
      resolve(false);
      return;
    }
    Notification.requestPermission().then((permission) => {
      resolve(permission === "granted");
    });
  });
}

export function sendPushNotification(title: string, body: string, onClickUrl?: string): void {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  const notification = new Notification(title, {
    body,
    icon: "/icon.png",
    badge: "/badge.png",
  });
  if (onClickUrl) {
    notification.onclick = () => {
      window.focus();
      if (onClickUrl) window.location.href = onClickUrl;
    };
  }
}
