
let socket: WebSocket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
const MAX_RECONNECT_DELAY = 5000;
const INITIAL_RECONNECT_DELAY = 1000;
let reconnectDelay = INITIAL_RECONNECT_DELAY;

type MessageHandler = (event: MessageEvent) => void;
type StatusHandler = (isConnected: boolean) => void;

const messageHandlers: MessageHandler[] = [];
const statusHandlers: StatusHandler[] = [];

export function connectWebSocket(url: string): Promise<WebSocket> {
  return new Promise((resolve, reject) => {
    try {
      socket = new WebSocket(url);

      socket.onopen = () => {
        console.log('WebSocket connected');
        reconnectDelay = INITIAL_RECONNECT_DELAY;
        statusHandlers.forEach(handler => handler(true));
        resolve(socket as WebSocket);
      };

      socket.onclose = () => {
        console.log('WebSocket disconnected');
        statusHandlers.forEach(handler => handler(false));
        scheduleReconnect(url);
      };

      socket.onerror = (error) => {
        console.error('WebSocket error', error);
        reject(error);
      };

      socket.onmessage = (event) => {
        messageHandlers.forEach(handler => handler(event));
      };
    } catch (error) {
      console.error('Failed to connect WebSocket', error);
      reject(error);
      scheduleReconnect(url);
    }
  });
}

function scheduleReconnect(url: string) {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
  }

  reconnectTimer = setTimeout(() => {
    console.log(`Attempting to reconnect in ${reconnectDelay}ms...`);
    connectWebSocket(url).catch(() => {
      // Exponential backoff with a maximum
      reconnectDelay = Math.min(reconnectDelay * 1.5, MAX_RECONNECT_DELAY);
    });
  }, reconnectDelay);
}

export function sendMessage(message: object): boolean {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(message));
    return true;
  }
  return false;
}

export function addMessageHandler(handler: MessageHandler): void {
  messageHandlers.push(handler);
}

export function removeMessageHandler(handler: MessageHandler): void {
  const index = messageHandlers.indexOf(handler);
  if (index !== -1) {
    messageHandlers.splice(index, 1);
  }
}

export function addStatusHandler(handler: StatusHandler): void {
  statusHandlers.push(handler);
}

export function removeStatusHandler(handler: StatusHandler): void {
  const index = statusHandlers.indexOf(handler);
  if (index !== -1) {
    statusHandlers.splice(index, 1);
  }
}

export function disconnectWebSocket(): void {
  if (socket) {
    socket.close();
    socket = null;
  }

  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
}

export function isConnected(): boolean {
  return socket !== null && socket.readyState === WebSocket.OPEN;
}
