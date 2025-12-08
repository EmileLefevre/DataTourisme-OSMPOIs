import {
  clearMessages,
  loadMessages,
  saveMessage,
} from "@/services/chatService";
import { styles } from "@/styles/ChatBubble.styles";
import React, { useEffect, useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface Message {
  id: string;
  text: string;
  timestamp: number;
}

export default function ChatBubble() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    const loadInitialMessages = async () => {
      const loadedMessages = await loadMessages();
      setMessages(loadedMessages);
    };
    loadInitialMessages();

    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
      }
    );

    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => {
        setKeyboardHeight(0);
      }
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      flatListRef.current?.scrollToEnd({ animated: true });
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      timestamp: Date.now(),
    };

    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    await saveMessage(newMessage);
    setInputValue("");
  };

  const handleClearMessages = async () => {
    await clearMessages();
    setMessages([]);
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View style={styles.messageContainer}>
      <View style={styles.messageBubble}>
        <Text style={styles.messageText}>{item.text}</Text>
      </View>
      <Text style={styles.messageTime}>
        {new Date(item.timestamp).toLocaleTimeString("fr-FR", {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </Text>
    </View>
  );

  return (
    <>
      <TouchableOpacity
        style={styles.chatBubble}
        onPress={() => setIsOpen(!isOpen)}
      >
        <Text style={styles.chatBubbleText}>💬</Text>
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        animationType="slide"
        onRequestClose={() => setIsOpen(false)}
        presentationStyle="pageSheet"
      >
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={0}
        >
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Chatte</Text>
            <View style={styles.headerButtons}>
              <TouchableOpacity
                onPress={handleClearMessages}
                style={styles.clearButton}
              >
                <Text style={styles.clearButtonText}>🗑️</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setIsOpen(false)}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.messagesContainer}>
            {messages.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>parlons peu, pardon dieux</Text>
              </View>
            ) : (
              <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={renderMessage}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.messagesList}
                onContentSizeChange={() =>
                  flatListRef.current?.scrollToEnd({ animated: true })
                }
              />
            )}
          </View>

          <View
            style={[
              styles.inputContainer,
              {
                marginBottom:
                  keyboardHeight > 0
                    ? keyboardHeight - Dimensions.get("window").height * 0.3
                    : 0,
              },
            ]}
          >
            <TextInput
              style={styles.input}
              value={inputValue}
              onChangeText={setInputValue}
              placeholder="On rentre cagoulé ?..."
              placeholderTextColor="#999"
              multiline
              onSubmitEditing={handleSendMessage}
              blurOnSubmit={false}
            />
            <TouchableOpacity
              onPress={handleSendMessage}
              style={styles.sendButton}
            >
              <Text style={styles.sendButtonText}>Envoyer</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}
