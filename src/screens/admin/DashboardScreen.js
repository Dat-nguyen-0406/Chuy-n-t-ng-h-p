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
      const q = query(
        collection(db, "chats"), 
        where("receiverId", "==", "admin"), 
        where("isRead", "==", false)
      );

      const querySnapshot = await getDocs(q);
      
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
        return { backgroundColor: '#10b981', color: '#fff' }; 
      case 'Đang giao':
        return { backgroundColor: '#3b82f6', color: '#fff' }; 
      case 'Đang xử lý':
        return { backgroundColor: '#f59e0b', color: '#fff' }; 
      case 'Đã hủy':
        return { backgroundColor: '#ef4444', color: '#fff' }; 
      default:
        return { backgroundColor: '#6b7280', color: '#fff' };
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0ea5e9" />
        <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#ef4444" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchDashboardData}>
          <Text style={styles.retryButtonText}>Thử lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      {/* Header với gradient effect */}
      <View style={styles.headerGradient}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Tổng quan kinh doanh</Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Ionicons name="log-out-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Stats Cards với icon */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionLabel}>HÔM NAY</Text>
          <View style={styles.statsRow}>
            <View style={[styles.statCard, styles.statCardPrimary]}>
              <View style={styles.statIconContainer}>
                <Ionicons name="receipt-outline" size={24} color="#0ea5e9" />
              </View>
              <View style={styles.statContent}>
                <Text style={styles.statLabel}>Đơn hàng</Text>
                <Text style={styles.statValue}>{stats.todayOrders}</Text>
              </View>
            </View>
            <View style={[styles.statCard, styles.statCardSuccess]}>
              <View style={styles.statIconContainer}>
                <Ionicons name="cash-outline" size={24} color="#10b981" />
              </View>
              <View style={styles.statContent}>
                <Text style={styles.statLabel}>Doanh thu</Text>
                <Text style={styles.statValue}>{stats.todayRevenue.toLocaleString('vi-VN')}đ</Text>
              </View>
            </View>
          </View>

          <Text style={[styles.sectionLabel, styles.sectionLabelSpacing]}>TUẦN NÀY</Text>
          <View style={styles.statsRow}>
            <View style={[styles.statCard, styles.statCardInfo]}>
              <View style={styles.statIconContainer}>
                <Ionicons name="calendar-outline" size={24} color="#8b5cf6" />
              </View>
              <View style={styles.statContent}>
                <Text style={styles.statLabel}>Đơn hàng</Text>
                <Text style={styles.statValue}>{stats.weeklyOrders}</Text>
              </View>
            </View>
            <View style={[styles.statCard, styles.statCardWarning]}>
              <View style={styles.statIconContainer}>
                <Ionicons name="trending-up-outline" size={24} color="#f59e0b" />
              </View>
              <View style={styles.statContent}>
                <Text style={styles.statLabel}>Doanh thu</Text>
                <Text style={styles.statValue}>{stats.weeklyRevenue.toLocaleString('vi-VN')}đ</Text>
              </View>
            </View>
          </View>

          <Text style={[styles.sectionLabel, styles.sectionLabelSpacing]}>THÁNG NÀY</Text>
          <View style={styles.statsRow}>
            <View style={[styles.statCard, styles.statCardDanger]}>
              <View style={styles.statIconContainer}>
                <Ionicons name="stats-chart-outline" size={24} color="#ec4899" />
              </View>
              <View style={styles.statContent}>
                <Text style={styles.statLabel}>Đơn hàng</Text>
                <Text style={styles.statValue}>{stats.monthlyOrders}</Text>
              </View>
            </View>
            <View style={[styles.statCard, styles.statCardTeal]}>
              <View style={styles.statIconContainer}>
                <Ionicons name="wallet-outline" size={24} color="#14b8a6" />
              </View>
              <View style={styles.statContent}>
                <Text style={styles.statLabel}>Doanh thu</Text>
                <Text style={styles.statValue}>{stats.monthlyRevenue.toLocaleString('vi-VN')}đ</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Recent Orders Section */}
        <View style={styles.ordersSection}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderLeft}>
              <Ionicons name="time-outline" size={20} color="#0ea5e9" />
              <Text style={styles.sectionTitle}>Đơn hàng gần đây</Text>
            </View>
          </View>

          {stats.recentOrders.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="file-tray-outline" size={48} color="#cbd5e1" />
              <Text style={styles.emptyStateText}>Không có đơn hàng gần đây</Text>
            </View>
          ) : (
            <View style={styles.ordersList}>
              {stats.recentOrders.map((order, index) => {
                const statusStyles = getOrderStatusStyle(order.status);
                return (
                  <View 
                    key={order.id} 
                    style={[
                      styles.orderCard,
                      index === stats.recentOrders.length - 1 && styles.orderCardLast
                    ]}
                  >
                    <View style={styles.orderHeader}>
                      <View style={styles.orderIdContainer}>
                        <Ionicons name="document-text-outline" size={16} color="#64748b" />
                        <Text style={styles.orderId}>#{String(order.id).slice(-6).toUpperCase()}</Text>
                      </View>
                      <View style={[styles.orderStatusBadge, { backgroundColor: statusStyles.backgroundColor }]}>
                        <Text style={[styles.orderStatusText, { color: statusStyles.color }]}>
                          {order.status}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.orderBody}>
                      <View style={styles.orderRow}>
                        <Ionicons name="person-outline" size={14} color="#64748b" />
                        <Text style={styles.orderCustomer}>{order.customer}</Text>
                      </View>
                      <View style={styles.orderRow}>
                        <Ionicons name="cash-outline" size={14} color="#10b981" />
                        <Text style={styles.orderTotal}>{order.total.toLocaleString('vi-VN')}đ</Text>
                      </View>
                      <View style={styles.orderRow}>
                        <Ionicons name="time-outline" size={14} color="#64748b" />
                        <Text style={styles.orderTime}>{order.time}</Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1, 
    backgroundColor: "#f8fafc",
  },
  headerGradient: {
    backgroundColor: "#0ea5e9",
    paddingTop: Platform.OS === 'android' ? 40 : 50,
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    marginBottom: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#e0f2fe",
    marginBottom: 4,
    fontWeight: "500",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  logoutButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    padding: 10,
    borderRadius: 12,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: "#f8fafc",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#64748b",
    fontWeight: "500",
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: "#f8fafc",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#0ea5e9',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 12,
    shadowColor: "#0ea5e9",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: "600",
  },
  statsSection: {
    paddingHorizontal: 16,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748b",
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  sectionLabelSpacing: {
    marginTop: 20,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  statCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    width: "48.5%",
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  statCardPrimary: {
    borderLeftWidth: 3,
    borderLeftColor: "#0ea5e9",
  },
  statCardSuccess: {
    borderLeftWidth: 3,
    borderLeftColor: "#10b981",
  },
  statCardInfo: {
    borderLeftWidth: 3,
    borderLeftColor: "#8b5cf6",
  },
  statCardWarning: {
    borderLeftWidth: 3,
    borderLeftColor: "#f59e0b",
  },
  statCardDanger: {
    borderLeftWidth: 3,
    borderLeftColor: "#ec4899",
  },
  statCardTeal: {
    borderLeftWidth: 3,
    borderLeftColor: "#14b8a6",
  },
  statIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#f8fafc",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  statContent: {
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    color: "#64748b",
    marginBottom: 4,
    fontWeight: "500",
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
  },
  ordersSection: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  sectionTitle: { 
    fontSize: 18, 
    fontWeight: "700", 
    color: "#0f172a",
    marginLeft: 8,
  },
  emptyState: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 40,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#f1f5f9",
    borderStyle: "dashed",
  },
  emptyStateText: {
    marginTop: 12,
    fontSize: 14,
    color: "#94a3b8",
    fontWeight: "500",
  },
  ordersList: {
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  orderCard: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  orderCardLast: {
    borderBottomWidth: 0,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  orderIdContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  orderId: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0f172a",
    marginLeft: 6,
  },
  orderStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  orderStatusText: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  orderBody: {
    gap: 8,
  },
  orderRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  orderCustomer: {
    fontSize: 14,
    color: "#475569",
    marginLeft: 8,
    fontWeight: "500",
  },
  orderTotal: {
    fontSize: 14,
    fontWeight: "700",
    color: "#10b981",
    marginLeft: 8,
  },
  orderTime: {
    fontSize: 13,
    color: "#94a3b8",
    marginLeft: 8,
  },
});

export default DashboardScreen;