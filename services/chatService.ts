import AsyncStorage from "@react-native-async-storage/async-storage";
import { Message } from "./interfaces/chatInterface";

const STORAGE_KEY = "chat_messages";

export async function loadMessages(): Promise<Message[]> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (error) {
    console.error("Erreur lors du chargement des messages:", error);
    return [];
  }
}

// Sauvegarde un nouveau message dans AsyncStorage
export async function saveMessage(message: Message): Promise<void> {
  try {
    const messages = await loadMessages();
    messages.push(message);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    console.log("Message sauvegardé:", message.text);
  } catch (error) {
    console.error("Erreur lors de la sauvegarde du message:", error);
  }
}

// Efface tous les messages
export async function clearMessages(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
    console.log("Tous les messages ont été effacés");
  } catch (error) {
    console.error("Erreur lors de l'effacement des messages:", error);
  }
}
