import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { db } from "../../sever/firebase";
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  serverTimestamp,
  doc,
  updateDoc 
} from "firebase/firestore";

const AdminChatDetailScreen = ({ route, navigation }) => {
  
  const { userId, userName } = route.params || {};

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");

  const formatChatTime = (timestamp) => {
    if (!timestamp) return "...";
    const date = timestamp.toDate();
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  useEffect(() => {
    // Kiểm tra an toàn nếu không có userId thì không chạy tiếp
    if (!userId) return;

    // Cập nhật tiêu đề màn hình là tên khách hàng
    if (userName) {
      navigation.setOptions({ title: userName });
    }
    const markAsRead = async () => {
      try {
        const chatRoomRef = doc(db, "chats", userId);
        await updateDoc(chatRoomRef, { status: "seen" });
      } catch (e) {
        console.log("Lỗi cập nhật trạng thái đã xem:", e);
      }
    };
    markAsRead();

    const messagesRef = collection(db, "chats", userId, "messages");
    const q = query(messagesRef, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allMsgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMessages(allMsgs);
    });

    return () => unsubscribe();
  }, [userId]);

  const handleSend = async () => {
    if (inputText.trim() === "" || !userId) return;

    const messageText = inputText;
    setInputText(""); // Xóa input nhanh

    try {
      // 1. Thêm tin nhắn của Admin
      await addDoc(collection(db, "chats", userId, "messages"), {
        text: messageText,
        sender: "admin",
        createdAt: serverTimestamp(),
      });

      // 2. Cập nhật trạng thái phòng chat là đã trả lời (replied)
      const chatRoomRef = doc(db, "chats", userId);
      await updateDoc(chatRoomRef, {
        lastMessage: messageText,
        updatedAt: serverTimestamp(),
        status: "replied",
      });
    } catch (error) {
      console.error("Lỗi gửi tin nhắn:", error);
    }
  };

  // Nếu không có userId (lỗi điều hướng), hiển thị thông báo nhẹ
  if (!userId) {
    return (
      <View style={styles.centered}>
        <Text>Không tìm thấy thông tin cuộc trò chuyện.</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <FlatList
        data={messages}
        inverted
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const timeString = formatChatTime(item.createdAt);
          return (
            <View style={[
              styles.msgWrapper,
              item.sender === 'admin' ? styles.adminAlign : styles.userAlign
            ]}>
              {/* BÓNG CHAT */}
              <View style={[
                styles.bubble, 
                item.sender === 'admin' ? styles.adminBubble : styles.userBubble
              ]}>
                <Text style={item.sender === 'admin' ? styles.adminText : styles.userText}>
                  {item.text}
                  {/* Tạo khoảng trống để không đè lên giờ trong bóng */}
                  <Text style={{ color: 'transparent' }}>{"          "}</Text>
                </Text>
                
                {/* 1. THỜI GIAN TRONG BÓNG CHAT (Góc dưới phải) */}
                <Text style={[
                  styles.timeInBubble,
                  item.sender === 'admin' ? styles.adminTime : styles.userTime
                ]}>
                  {timeString}
                </Text>
              </View>

              {/* 2. THỜI GIAN BÊN DƯỚI BÓNG CHAT */}
             
              
            </View>
          );
        }}
        contentContainerStyle={{ padding: 15 }}
      />
      
      <View style={styles.inputContainer}>
        <TextInput 
          style={styles.input} 
          value={inputText} 
          onChangeText={setInputText} 
          placeholder="Trả lời khách hàng..."
          multiline
        />
        <TouchableOpacity onPress={handleSend} style={styles.sendButton}>
          <Ionicons name="send" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  bubble: { maxWidth: '80%', padding: 12, borderRadius: 18, marginBottom: 10 },
  adminBubble: { 
    alignSelf: 'flex-end', 
    backgroundColor: '#36568eff', // Đổi về màu nâu giống theme của bạn
    borderBottomRightRadius: 2 
  },
  userBubble: { 
    alignSelf: 'flex-start', 
    backgroundColor: '#FFF', 
    borderWidth: 1, 
    borderColor: '#EEE',
    borderBottomLeftRadius: 2 
  },
  adminText: { color: '#FFF', fontSize: 16 },
  userText: { color: '#333', fontSize: 16 },
  inputContainer: { 
    flexDirection: 'row', 
    padding: 10, 
    backgroundColor: '#FFF', 
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#EEE'
  },
  input: { 
    flex: 1, 
    backgroundColor: '#F0F0F0', 
    borderRadius: 20, 
    paddingHorizontal: 15, 
    paddingVertical: 8,
    maxHeight: 100 
  },
  sendButton: { 
    marginLeft: 10, 
    backgroundColor: '#0f367aff', 
    width: 44, 
    height: 44, 
    borderRadius: 22, 
    justifyContent: 'center', 
    alignItems: 'center' 
  }
});

export default AdminChatDetailScreen;