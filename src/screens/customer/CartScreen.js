import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  StatusBar,
  Dimensions,
  Platform
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useIsFocused, useNavigation } from "@react-navigation/native";
import { getFirestore, collection, query, where, getDocs,serverTimestamp } from "firebase/firestore";
import app from "../../sever/firebase";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

const CartScreen = ({ route }) => {
  const [orders, setOrders] = useState([]);
  const isFocused = useIsFocused();
  const navigation = useNavigation();

  useEffect(() => {
    if (isFocused) loadOrders();
  }, [isFocused]);
  const handlePlaceOrder = async (orderData) => {
  const db = getFirestore(app);
  try {
    // Đảm bảo orderData có đầy đủ thông tin: items, total, userId...
    await addDoc(collection(db, "orders"), {
      ...orderData,
      createdAt: serverTimestamp(), 
      status: "Đang xử lý", // Chỉnh lại cho đồng bộ với Admin
    });
    Alert.alert("Thành công", "Đặt hàng thành công!");
  } catch (error) {
    console.error("Lỗi: ", error);
    Alert.alert("Lỗi", "Không thể đặt hàng");
  }
};
  const loadOrders = async () => {
    try {
      const db = getFirestore(app);

      
      const userData = await AsyncStorage.getItem("userData");
      const userId = userData ? JSON.parse(userData).id : null;

      if (userId) {
        const q = query(collection(db, "orders"), where("userId", "==", userId));
        const querySnapshot = await getDocs(q);
        const ordersData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Sắp xếp đơn hàng mới nhất lên đầu dựa trên createdAt
        ordersData.sort((a, b) => {
          const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
          const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
          return dateB - dateA;
        });
        setOrders(ordersData);
      }
    } catch (error) {
      console.error("Lỗi tải đơn hàng:", error);
    }
  };

  // Logic hiển thị trạng thái đơn hàng
  const getStatusStyle = (status) => {
    switch (status) {
      case "pending": 
      case "Đang xử lý": return { label: "Đang xử lý", color: "#F39C12", bg: "#FEF5E7" };
      case "completed": 
      case "Đã hoàn thành": return { label: "Thành công", color: "#27AE60", bg: "#EAFAF1" };
      case "cancelled": 
      case "Đã hủy": return { label: "Đã hủy", color: "#E74C3C", bg: "#FDEDEC" };
      default: return { label: status || "Đang xử lý", color: "#3498DB", bg: "#EBF5FB" };
    }
  };

  // Hàm format thời gian chuẩn để giữ lại dữ liệu gốc
  // Cập nhật lại hàm này trong CartScreen.js của bạn
const formatOrderDate = (createdAt) => {
  if (!createdAt) return "---";
  
  let date;
  // Kiểm tra nếu là Timestamp từ Firebase (có hàm toDate)
  if (typeof createdAt.toDate === 'function') {
    date = createdAt.toDate();
  } 
  // Nếu là số (milliseconds) hoặc chuỗi ngày tháng
  else {
    date = new Date(createdAt);
  }
  
  return date.toLocaleString("vi-VN", {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Lịch sử đơn hàng</Text>
        <TouchableOpacity style={styles.iconButton}>
          <Ionicons name="notifications-outline" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {orders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="clipboard-text-outline" size={100} color="#E0E0E0" />
            <Text style={styles.emptyText}>Chưa có đơn hàng nào</Text>
            <TouchableOpacity style={styles.shopNowBtn} onPress={() => navigation.navigate("HomeTab")}>
              <Text style={styles.shopNowText}>Đặt hàng ngay</Text>
            </TouchableOpacity>
          </View>
        ) : (
          orders.map((order) => {
            const status = getStatusStyle(order.status);
            return (
              <View key={order.id} style={styles.card}>
                {/* Header Card: Mã đơn (Siêu đậm) & Trạng thái */}
                <View style={styles.cardTop}>
                  <View>
                    <Text style={styles.orderLabel}>Mã đơn hàng</Text>
                    <Text style={styles.orderId}>#{order.id.slice(-8).toUpperCase()}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
                    <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
                  </View>
                </View>

                <View style={styles.divider} />

                {/* Danh sách sản phẩm rút gọn */}
                <View style={styles.itemContainer}>
                  {order.items?.map((item, index) => (
                    <View key={index} style={styles.itemRow}>
                      <Ionicons name="cafe-outline" size={16} color="#6F4E37" />
                      <Text style={styles.itemNameText} numberOfLines={1}>
                        {item.quantity} x {item.name}
                      </Text>
                      <Text style={styles.itemPriceText}>
                        {(item.price * item.quantity).toLocaleString()}đ
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Footer Card: Thời gian (Giữ nguyên logic) & Tổng tiền */}
                <View style={styles.cardBottom}>
                  <View style={styles.timeInfo}>
                    <Ionicons name="time-outline" size={14} color="#999" />
                    <Text style={styles.timeText}>
                      {formatOrderDate(order.createdAt)}
                    </Text>
                  </View>
                  <View style={styles.totalInfo}>
                    <Text style={styles.totalLabel}>Tổng thanh toán</Text>
                    <Text style={styles.totalValue}>{order.total?.toLocaleString()}đ</Text>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FDFDFD" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: "#FFF",
  },
  headerTitle: { fontSize: 24, fontWeight: "800", color: "#2C3E50" },
  iconButton: { padding: 8, backgroundColor: "#F5F5F5", borderRadius: 12 },
  scrollContent: { padding: 20 },
  
  card: {
    backgroundColor: "#FFF",
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  
  // STYLE MÃ ĐƠN HÀNG SẮC NÉT NHƯ MẪU
  orderLabel: { 
    fontSize: 12, 
    color: "#8E8E93", 
    fontWeight: "700", 
    textTransform: "uppercase",
    marginBottom: 2
  },
  orderId: { 
    fontSize: 20, 
    fontWeight: "900", 
    color: "#000000", // Đen tuyền sắc nét
    letterSpacing: 0.8,
    fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'Roboto', 
  },
  
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  statusText: { fontSize: 12, fontWeight: "700" },
  divider: { height: 1, backgroundColor: "#F0F0F0", marginVertical: 15 },
  itemContainer: { marginBottom: 15 },
  itemRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  itemNameText: { flex: 1, marginLeft: 10, fontSize: 14, color: "#7F8C8D" },
  itemPriceText: { fontSize: 14, fontWeight: "600", color: "#2C3E50" },
  
  cardBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    backgroundColor: "#F9F9F9",
    marginHorizontal: -20,
    marginBottom: -20,
    padding: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  timeInfo: { flexDirection: "row", alignItems: "center" },
  timeText: { fontSize: 12, color: "#95A5A6", marginLeft: 4 },
  totalLabel: { fontSize: 11, color: "#95A5A6", textAlign: "right" },
  totalValue: { fontSize: 18, fontWeight: "800", color: "#6F4E37" },

  emptyContainer: { flex: 1, alignItems: "center", marginTop: 100 },
  emptyText: { fontSize: 16, color: "#BDC3C7", marginTop: 20 },
  shopNowBtn: { marginTop: 20, backgroundColor: "#6F4E37", paddingHorizontal: 30, paddingVertical: 12, borderRadius: 15 },
  shopNowText: { color: "#FFF", fontWeight: "700" }
});

export default CartScreen;