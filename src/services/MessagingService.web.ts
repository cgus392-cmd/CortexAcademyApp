// Mock para Web - No se usa FCM en PWA (por ahora)
class MessagingService {
  async requestPermission() {
    return false;
  }
  async getToken() {
    return null;
  }
  onMessage(callback: any) {
    return () => {};
  }
  onTokenRefresh(callback: any) {
    return () => {};
  }
  async subscribeToTopic(topic: string) {
    return;
  }
  async unsubscribeFromTopic(topic: string) {
    return;
  }
}

export default new MessagingService();
