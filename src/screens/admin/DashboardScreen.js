import React, { useState, useEffect, useCallback } from "react";
import { Platform } from "react-native";
import { useAuth } from "../../context/AuthContext";
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { clearAllStorage } from "../../utils/storage";
import { getFirestore, collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { app } from "../../sever/firebase"; 

const DashboardScreen = ({ navigation }) => { 
  const { logout } = useAuth();
  const [stats, setStats] = useState({
    todayOrders: 0,
    todayRevenue: 0,
    weeklyOrders: 0,
    weeklyRevenue: 0,
    monthlyOrders: 0,
    monthlyRevenue: 0,
    popularDrinks: [], 
    recentOrders: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const markMessagesAsRead = async () => {
  try {
    const db = getFirestore(app);
    // Tìm các tin nhắn gửi đến Admin (receiverId: 'admin') mà chưa đọc (isRead: false)
    const q = query(
      collection(db, "chats"), 
      where("receiverId", "==", "admin"), 
      where("isRead", "==", false)
    );

    const querySnapshot = await getDocs(q);
    
    // Sử dụng batch để cập nhật nhiều tài liệu cùng lúc
    const batch = writeBatch(db);
    querySnapshot.forEach((document) => {
      const docRef = doc(db, "chats", document.id);
      batch.update(docRef, { isRead: true });
    });

    await batch.commit();
    console.log("Đã đánh dấu tất cả tin nhắn là đã đọc");
  } catch (error) {
    console.error("Lỗi khi cập nhật trạng thái đọc:", error);
  }
};

   useFocusEffect(
    useCallback(() => {
      console.log("DashboardScreen được focus, tải lại dữ liệu ban đầu và thiết lập interval.");
      fetchDashboardData(); 
      
      const intervalId = setInterval(() => {
        console.log("Tự động cập nhật dữ liệu dashboard định kỳ...");
        fetchDashboardData();
      }, 60000);
      return () => {
        console.log("DashboardScreen bị blur hoặc unmount, xóa interval.");
        clearInterval(intervalId); 
      };
    }, [])
  );
  useEffect(() => {
      fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const db = getFirestore(app); 
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const todayStart = new Date(today);

      const todayEnd = new Date(today);
      todayEnd.setHours(23, 59, 59, 999);

      const dayOfWeek = today.getDay(); 
     
      const diffToMonday = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);

      const weekStart = new Date(today);
      weekStart.setDate(diffToMonday);
      weekStart.setHours(0, 0, 0, 0);


      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

 
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      monthStart.setHours(0, 0, 0, 0);
      const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0); 
      monthEnd.setHours(23, 59, 59, 999);

      
      const ordersRef = collection(db, "orders");
      const allOrdersQuery = query(ordersRef, orderBy("createdAt", "desc")); 
      const allOrdersSnapshot = await getDocs(allOrdersQuery);

      let calculatedTodayOrders = 0;
      let calculatedTodayRevenue = 0;
      let calculatedWeeklyOrders = 0;
      let calculatedWeeklyRevenue = 0;
      let calculatedMonthlyOrders = 0;
      let calculatedMonthlyRevenue = 0;
      const fetchedRecentOrders = [];

      allOrdersSnapshot.forEach((doc) => {
        const data = doc.data();

        const createdAt = data.createdAt && typeof data.createdAt.toDate === 'function'
          ? data.createdAt.toDate()
          : (data.createdAt instanceof Date ? data.createdAt : new Date(data.createdAt));

        if (data.status === 'Đã hoàn thành') {
          const orderTotal = parseFloat(data.total) || 0; 


          if (createdAt >= todayStart && createdAt <= todayEnd) {
            calculatedTodayOrders++;
            calculatedTodayRevenue += orderTotal;
          }

          if (createdAt >= weekStart && createdAt <= weekEnd) {
            calculatedWeeklyOrders++;
            calculatedWeeklyRevenue += orderTotal;
          }

          if (createdAt.getMonth() === monthStart.getMonth() && createdAt.getFullYear() === monthStart.getFullYear()) {
            calculatedMonthlyOrders++;
            calculatedMonthlyRevenue += orderTotal;
          }
        }

        if (fetchedRecentOrders.length < 5) {
            fetchedRecentOrders.push({
                id: doc.id,
                customer: data.userName || "Khách hàng",
                total: parseFloat(data.total) || 0,
                time: createdAt.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
                status: data.status || "Unknown",
            });
        }
      });

      setStats(prevStats => ({
        ...prevStats,
        todayOrders: calculatedTodayOrders,
        todayRevenue: calculatedTodayRevenue,
        weeklyOrders: calculatedWeeklyOrders,
        weeklyRevenue: calculatedWeeklyRevenue,
        monthlyOrders: calculatedMonthlyOrders,
        monthlyRevenue: calculatedMonthlyRevenue,
        recentOrders: fetchedRecentOrders,
      }));

    } catch (e) {
      console.error("Lỗi khi tải dữ liệu dashboard:", e);
      setError("Không thể tải dữ liệu. Vui lòng thử lại.");
      Alert.alert("Lỗi", "Không thể tải dữ liệu dashboard. Vui lòng kiểm tra kết nối hoặc thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      "Đăng xuất",
      "Bạn có chắc chắn muốn đăng xuất?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Đăng xuất",
          onPress: async () => {
            await logout();
            await clearAllStorage();
            navigation.replace("Login"); 
          },
        },
      ]
    );
  };

 
  const getOrderStatusStyle = (status) => {
    switch (status) {
      case 'Đã hoàn thành':
        return { backgroundColor: '#4CAF50', color: '#fff' }; 
      case 'Đang giao':
        return { backgroundColor: '#2196F3', color: '#fff' }; 
      case 'Đang xử lý':
        return { backgroundColor: '#FF9800', color: '#fff' }; 
      case 'Đã hủy':
        return { backgroundColor: '#F44336', color: '#fff' }; 
      default:
        return { backgroundColor: '#757575', color: '#fff' };
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6F4E37" />
        <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchDashboardData}>
          <Text style={styles.retryButtonText}>Thử lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
    
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Doanh thu</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Ionicons name="log-out-outline" size={24} color="#8B4513" />
        </TouchableOpacity>
      </View>
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Đơn hàng hôm nay</Text>
          <Text style={styles.statValue}>{stats.todayOrders}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Doanh thu hôm nay</Text>
          <Text style={styles.statValue}>{stats.todayRevenue.toLocaleString('vi-VN')}đ</Text>
        </View>
      </View>
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Đơn hàng tuần này</Text>
          <Text style={styles.statValue}>{stats.weeklyOrders}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Doanh thu tuần này</Text>
          <Text style={styles.statValue}>{stats.weeklyRevenue.toLocaleString('vi-VN')}đ</Text>
        </View>
      </View>
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Đơn hàng tháng này</Text>
          <Text style={styles.statValue}>{stats.monthlyOrders}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Doanh thu tháng này</Text>
          <Text style={styles.statValue}>{stats.monthlyRevenue.toLocaleString('vi-VN')}đ</Text>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Đơn hàng gần đây</Text>
      </View>
      <View style={styles.recentOrdersContainer}>
        {stats.recentOrders.length === 0 ? (
          <Text style={styles.emptySectionText}>Không có đơn hàng gần đây.</Text>
        ) : (
          stats.recentOrders.map((order) => {
            const statusStyles = getOrderStatusStyle(order.status);
            return (
              <View key={order.id} style={styles.orderItem}>
                <View style={styles.orderInfo}>
                  <Text style={styles.orderId}>Mã đơn: {String(order.id).slice(-6).toUpperCase()}</Text>
                  <View style={[styles.orderStatusBadge, { backgroundColor: statusStyles.backgroundColor }]}>
                    <Text style={[styles.orderStatusText, { color: statusStyles.color }]}>
                      {order.status}
                    </Text>
                  </View>
                </View>
                <Text style={styles.orderCustomer}>Khách hàng: {order.customer}</Text>
                <Text style={styles.orderTotal}>Tổng tiền: {order.total.toLocaleString('vi-VN')}đ</Text>
                <Text style={styles.orderTime}>Thời gian: {order.time}</Text>
              </View>
            );
          })
        )}
      </View>

      {/* Placeholder for other sections */}
      <View style={{ height: 100 }} />
      </ScrollView>
      
  </View>
);
  
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: "#fff",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: "#fff",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
    marginBottom: 15,
  },
  retryButton: {
    backgroundColor: '#6F4E37',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingTop: Platform.OS === 'android' ? 40 : 20, 
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
  },
  logoutButton: {
    padding: 5,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 8,
  },
  statCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    width: "48%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#8B4513",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    backgroundColor: "#fff",
    marginTop: 10,
  },
  sectionTitle: { fontSize: 18, fontWeight: "600", color: "#333" },
  seeAllText: { color: "#6F4E37", fontSize: 14, fontWeight: "500" },
  emptySectionText: {
    textAlign: 'center',
    color: '#999',
    marginTop: 15,
    marginBottom: 15,
    fontSize: 14,
  },
  popularDrinksContainer: {
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    paddingBottom: 5, 
  },
  popularDrinkItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  rankContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#6F4E37",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  rankText: { color: "white", fontWeight: "bold" },
  drinkDetails: { flex: 1 },
  drinkName: { fontSize: 16, fontWeight: "500", color: "#333" },
  drinkQuantity: { fontSize: 13, color: "#666", marginTop: 2 },
  recentOrdersContainer: {
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    paddingBottom: 5,
  },
  orderItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  orderInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
    alignItems: 'center',
  },
  orderId: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#333",
  },
  orderStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  orderStatusText: {
    fontSize: 12,
    color: "white",
    fontWeight: "500",
  },
  orderCustomer: {
    fontSize: 14,
    color: "#555",
    marginBottom: 4,
  },
  orderTotal: {
    fontSize: 14,
    fontWeight: "500",
    color: "#8B4513", 
    marginBottom: 4,
  },
  orderTime: {
    fontSize: 13,
    color: "#777",
  },
  mainContainer: {
    flex: 1, 
    backgroundColor: "#f5f5f5",
  },
  
});

export default DashboardScreen;