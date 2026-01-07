import React, { useState, useEffect } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../../sever/firebase";
import { useNavigation } from "@react-navigation/native";

const ChatListScreen = () => {
  const [chatRooms, setChatRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();

  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    const date = timestamp.toDate(); // Chuyển từ Firebase Timestamp sang JS Date
    const now = new Date();
    
    // Nếu là hôm nay thì hiện giờ, khác ngày thì hiện ngày/tháng
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { day: '2-digit', month: '2-digit' });
  };

  useEffect(() => {
    // Truy vấn danh sách các phòng chat, sắp xếp theo thời gian mới nhất
    const q = query(collection(db, "chats"), orderBy("updatedAt", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const rooms = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setChatRooms(rooms);
      setLoading(false);
    }, (error) => {
      console.error("Lỗi lấy danh sách chat:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.roomItem}
      onPress={() => navigation.navigate("AdminChatDetail", { userId: item.id, userName: item.userName })}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{item.userName?.charAt(0).toUpperCase()}</Text>
      </View>
      <View style={styles.info}>
        <View style={styles.row}>
          <Text style={styles.userName}>{item.userName || "Khách lạ"}</Text>
          <Text style={styles.timeText}>{formatTime(item.updatedAt)}</Text>
        </View>
        <Text style={styles.lastMessage} numberOfLines={1}>{item.lastMessage}</Text>
      </View>
      {item.status === "waiting" && <View style={styles.badge} />}
    </TouchableOpacity>
  );

  if (loading) return <ActivityIndicator style={{flex: 1}} size="large" color="#8B4513" />;

  return (
    <View style={styles.container}>
      <FlatList
        data={chatRooms}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={<Text style={styles.empty}>Chưa có yêu cầu hỗ trợ nào</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  roomItem: { flexDirection: "row", padding: 15, borderBottomWidth: 1, borderBottomColor: "#eee", alignItems: "center" },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: "#0f367aff", justifyContent: "center", alignItems: "center" },
  avatarText: { color: "#fff", fontSize: 20, fontWeight: "bold" },
  info: { flex: 1, marginLeft: 15 },
  userName: { fontSize: 16, fontWeight: "bold" },
  lastMessage: { color: "#666", marginTop: 4 },
  badge: { width: 12, height: 12, borderRadius: 6, backgroundColor: "red" }
});

export default ChatListScreen;