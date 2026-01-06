import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { db } from "../../sever/firebase";
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  serverTimestamp, 
  doc, 
  setDoc,
  updateDoc 
} from "firebase/firestore";

const ChatbotScreen = () => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const flatListRef = useRef();

  // 1. Định nghĩa các câu trả lời tự động
  const autoReplies = [
    { keywords: ["chào", "hi", "hello", "xin chào", "alo"], reply: "Xin chào! ☕ Coffee Shop có thể hỗ trợ gì cho bạn hôm nay?" },
  { keywords: ["bạn là ai", "ai vậy", "chatbot"], reply: "Mình là trợ lý ảo của Coffee Shop, luôn sẵn sàng hỗ trợ bạn 😊" },

  
  { keywords: ["menu", "thực đơn", "đồ uống"], reply: "Bạn có thể xem đầy đủ menu và giá cả tại màn hình chính của ứng dụng nhé!" },
  { keywords: ["giá", "bao nhiêu tiền", "giá cả"], reply: "Giá từng món được hiển thị trong menu. Bạn bấm vào sản phẩm để xem chi tiết nha!" },
  { keywords: ["bán gì", "có gì ngon"], reply: "Shop có cà phê, trà sữa, trà trái cây và bánh ngọt. Món best-seller là Latte và Trà đào 🍑" },

  
  { keywords: ["mở cửa", "đóng cửa", "giờ"], reply: "Cửa hàng mở cửa từ 7h đến 22h tất cả các ngày trong tuần." },
  { keywords: ["hôm nay mở không", "cuối tuần"], reply: "Shop mở cửa cả cuối tuần luôn bạn nhé!" },

 
  { keywords: ["địa chỉ", "ở đâu", "chi nhánh", "cửa hàng"], reply: "Hiện tại Coffee Shop có chi nhánh tại Hà Nội. Thông tin chi tiết có trong ứng dụng." },
  { keywords: ["gần đây", "gần nhất"], reply: "Bạn bật định vị để ứng dụng gợi ý chi nhánh gần bạn nhất nha 📍" },

  
  { keywords: ["ship", "giao hàng", "vận chuyển"], reply: "Shop có hỗ trợ giao hàng trong phạm vi 5km. Phí ship sẽ hiển thị khi đặt đơn." },
  { keywords: ["bao lâu tới", "thời gian giao"], reply: "Thời gian giao hàng dự kiến từ 20–30 phút tùy khu vực bạn nhé!" },


  { keywords: ["khuyến mãi", "giảm giá", "ưu đãi"], reply: "Hiện shop đang có chương trình mua 2 tặng 1 từ 14h đến 16h mỗi ngày 🎉" },
  { keywords: ["voucher", "mã giảm"], reply: "Voucher sẽ được hiển thị tại mục Ưu đãi trong ứng dụng nha!" },

  
  { keywords: ["đặt hàng", "mua hàng"], reply: "Bạn chọn món trong menu và nhấn 'Thêm vào giỏ' để đặt hàng nhé!" },
  { keywords: ["giỏ hàng", "xem đơn"], reply: "Bạn có thể xem giỏ hàng bằng cách nhấn vào biểu tượng 🛒 trên màn hình." },

 
  { keywords: ["thanh toán", "trả tiền"], reply: "Shop hỗ trợ thanh toán tiền mặt và ví điện tử." },
  { keywords: ["chuyển khoản", "momo", "zalopay"], reply: "Hiện shop hỗ trợ thanh toán qua ví điện tử phổ biến như MoMo và ZaloPay." },

  
  { keywords: ["tài khoản", "đăng nhập", "đăng ký"], reply: "Bạn có thể đăng ký hoặc đăng nhập tại màn hình tài khoản trong ứng dụng." },
  { keywords: ["đổi mật khẩu", "quên mật khẩu"], reply: "Nếu quên mật khẩu, bạn dùng chức năng 'Quên mật khẩu' để đặt lại nhé!" },
  { keywords: ["địa chỉ giao hàng", "địa chỉ"], reply: "Sau khi đăng nhập, bạn có thể thêm hoặc chỉnh sửa địa chỉ tại mục Thông tin cá nhân." },

  
  { keywords: ["liên hệ", "hỗ trợ", "admin"], reply: "Nếu cần hỗ trợ thêm, bạn có thể để lại tin nhắn, admin sẽ phản hồi sớm nhất." },
  { keywords: ["lỗi", "không hoạt động"], reply: "Xin lỗi vì sự bất tiện 😥 Bạn mô tả chi tiết lỗi để shop hỗ trợ nhanh hơn nhé!" },

  
  { keywords: ["cảm ơn", "thanks", "thank"], reply: "Cảm ơn bạn đã sử dụng Coffee Shop ☕ Chúc bạn một ngày tốt lành!" },
  { keywords: ["bye", "tạm biệt"], reply: "Tạm biệt bạn! Hẹn gặp lại tại Coffee Shop 👋" },
  ];

  useEffect(() => {
    let unsubscribe;

    const initializeChat = async () => {
      try {
        const userDataString = await AsyncStorage.getItem("userData");
        if (userDataString) {
          const parsed = JSON.parse(userDataString);
          const userId = String(parsed.id || "");
          
          if (!userId) return;
          
          setUserData({ ...parsed, id: userId });

          // Lấy tin nhắn theo thời gian giảm dần để dùng 'inverted' cho FlatList
          const messagesRef = collection(db, "chats", userId, "messages");
          const q = query(messagesRef, orderBy("createdAt", "desc"));

          unsubscribe = onSnapshot(q, (snapshot) => {
            const allMessages = snapshot.docs.map(docSnap => {
              const data = docSnap.data();
              return {
                id: docSnap.id,
                text: data.text || "",
                sender: data.sender || "user",
                createdAt: data.createdAt,
                displayTime: data.createdAt 
                  ? data.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                  : "..."
              };
            });
            setMessages(allMessages);
            setLoading(false);
          });
        }
      } catch (error) {
        console.error("Lỗi khởi tạo:", error);
      } finally {
        setLoading(false);
      }
    };

    initializeChat();
    return () => unsubscribe && unsubscribe();
  }, []);

  // 2. Hàm xử lý gửi tin nhắn
  const handleSend = async () => {
    if (!inputText.trim() || !userData?.id) return;
    
    const messageText = inputText.trim();
    const userId = String(userData.id);
    const chatRoomRef = doc(db, "chats", userId);
    const messagesRef = collection(db, "chats", userId, "messages");
    
    setInputText("");

    try {
      // Gửi tin nhắn của người dùng lên Firestore
      await addDoc(messagesRef, {
        text: messageText,
        sender: "user",
        createdAt: serverTimestamp(),
      });

      // Cập nhật trạng thái phòng chat để Admin thấy (Hiện chấm ĐỎ)
      await setDoc(chatRoomRef, {
        userId: userId,
        userName: userData.fullname || "Khách hàng",
        lastMessage: messageText,
        updatedAt: serverTimestamp(),
        status: "waiting", 
      }, { merge: true });

      // LOGIC TRẢ LỜI TỰ ĐỘNG
      const normalizedText = messageText.toLowerCase();
      const match = autoReplies.find(item => 
        item.keywords.some(keyword => normalizedText.includes(keyword))
      );

      if (match) {
        setTimeout(async () => {
          await addDoc(messagesRef, {
            text: match.reply,
            sender: "bot",
            createdAt: serverTimestamp(),
          });
          
          await updateDoc(chatRoomRef, {
            lastMessage: match.reply,
            updatedAt: serverTimestamp(),
          });
        }, 1000); // Delay 1 giây tạo cảm giác thật
      }
    } catch (error) {
      console.error("Lỗi gửi tin:", error);
    }
  };

  const renderItem = ({ item }) => (
    <View style={[
      styles.messageBubble,
      item.sender === "user" ? styles.userBubble : styles.botBubble,
    ]}>
      <Text style={[
        styles.messageText,
        item.sender === "user" ? styles.userText : styles.botText
      ]}>
        {item.text}
      </Text>
      <Text style={[styles.timeText, item.sender === "user" ? {color: '#E0E0E0'} : {color: '#999'}]}>
        {item.displayTime}
      </Text>
    </View>
  );

  if (loading) return <ActivityIndicator style={{flex:1}} size="large" color="#007AFF" />;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0} 
    >
      <FlatList
        data={messages}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        inverted // Để tin nhắn mới nhất nằm ở dưới cùng gần ô nhập
        contentContainerStyle={styles.listContent}
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Nhập tin nhắn..."
          multiline
        />
        <TouchableOpacity 
          style={styles.sendButton} 
          onPress={handleSend}
        >
          <Ionicons name="send" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F5" },
  listContent: { paddingHorizontal: 15, paddingVertical: 20 },
  messageBubble: { maxWidth: "80%", padding: 12, borderRadius: 20, marginBottom: 10 },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: "#1A4D8C", // ĐÃ ĐỔI SANG XANH DƯƠNG
    borderBottomRightRadius: 2,
  },
  botBubble: {
    alignSelf: "flex-start",
    backgroundColor: "#FFFFFF",
    borderBottomLeftRadius: 2,
    borderWidth: 1,
    borderColor: "#EEEEEE",
  },
  messageText: { fontSize: 16 },
  userText: { color: "#FFFFFF" },
  botText: { color: "#333333" },
  timeText: { fontSize: 10, marginTop: 5, alignSelf: "flex-end" },
  inputContainer: {
    flexDirection: "row",
    padding: 10,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#EEEEEE",
  },
  input: {
    flex: 1,
    backgroundColor: "#F0F0F0",
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 10,
    fontSize: 16,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: "#1A4D8C", // ĐÃ ĐỔI SANG XANH DƯƠNG
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default ChatbotScreen;