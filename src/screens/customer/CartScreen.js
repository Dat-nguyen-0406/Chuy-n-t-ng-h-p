import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage"; 
import { useIsFocused, useNavigation } from "@react-navigation/native"; 
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import app from "../../sever/firebase"; 

const CartScreen = ({ route }) => {

  const [orders, setOrders] = useState([]);
  
  const [activeTab, setActiveTab] = useState("orders");
  
  const isFocused = useIsFocused();
  const navigation = useNavigation();

  
  useEffect(() => {
    if (route.params?.activeTab) {
      setActiveTab(route.params.activeTab);
    }
  }, [route.params]);

  
  useEffect(() => {
    if (isFocused) {
      
      loadOrders();
    }
  }, [isFocused]);

  

  const loadOrders = async () => {
    try {
      const db = getFirestore(app);
      const userData = await AsyncStorage.getItem("userData");
      const userId = userData ? JSON.parse(userData).id : null;

      if (userId) {
        const q = query(
          collection(db, "orders"),
          where("userId", "==", userId)
        );
        const querySnapshot = await getDocs(q);

        const ordersData = [];
        querySnapshot.forEach((doc) => {
          ordersData.push({ id: doc.id, ...doc.data() });
        });
        ordersData.sort((a, b) => {
            const dateA = typeof a.createdAt === 'number' ? a.createdAt : (a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0);
            const dateB = typeof b.createdAt === 'number' ? b.createdAt : (b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0);
            return dateB - dateA;
        });
        setOrders(ordersData);

        
        await AsyncStorage.setItem("orders", JSON.stringify(ordersData));
      } else {
        
        const data = await AsyncStorage.getItem("orders");
        setOrders(data ? JSON.parse(data) : []);
       
      }
    } catch (error) {
      console.error("Error loading orders:", error);
      const data = await AsyncStorage.getItem("orders");
      setOrders(data ? JSON.parse(data) : []);
      Alert.alert("Lỗi", "Không thể tải đơn hàng. Vui lòng thử lại.");
    }
  };

  
  const goToOrderScreen = (item) => {
    navigation.navigate("Order", {
      drinkId: item.id,
      cartItem: item, 
      fromCart: true,
    });
  };

  return (
    <View style={styles.container}>
    
      <View style={styles.tabContainer}>
       
        <TouchableOpacity
         
          style={[
            styles.tabButton,
            styles.singleTabButton, 
            activeTab === "orders" && styles.activeTabButton,
          ]}
          onPress={() => setActiveTab("orders")} 
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "orders" && styles.activeTabText,
            ]}
          >
            Đơn hàng của bạn
          </Text>
        </TouchableOpacity>
      </View>

     
      <ScrollView style={styles.content}>
       
       
         
          {orders.length === 0 ? (
            <Text style={styles.emptyText}>Bạn chưa có đơn hàng nào</Text>
          ) : (
            orders.map((order, orderIndex) => (
              <View
                key={`order-${orderIndex}-${order.id}`}
                style={styles.itemCard}
              >
                <Text style={styles.itemName}>
                  Mã đơn: {String(order.id).slice(-6).toUpperCase()}
                </Text>
                <Text style={{ color: 'green' }}>Trạng thái: {order.status}</Text>
                <Text>
                  Thời gian: {new Date(order.createdAt).toLocaleString("vi-VN")}
                </Text>
                <Text>
                  Phương thức thanh toán:{" "}
                  {order.paymentMethod === "cash" ? "Tiền mặt" : "Quét QR"}
                </Text>

                {Array.isArray(order.items) &&
                  order.items.map((item, itemIndex) => (
                    <View
                      key={`order-${orderIndex}-item-${itemIndex}`}
                      style={{ marginVertical: 5 }}
                    >
                      <Text>{item.name}</Text>
                      <Text>
                        {item.quantity} x {parseInt(item.price).toLocaleString()}đ
                      </Text>
                    </View>
                  ))}

                <Text style={styles.totalText}>
                  Tổng cộng:{" "}
                  {(typeof order.total === "number"
                    ? order.total
                    : 0
                  ).toLocaleString()}
                  đ
                </Text>
              </View>
            ))
          )}
        {/* )} */}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  tabContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  singleTabButton: {
    
    justifyContent: 'center',
    alignSelf: 'center',
  },
  activeTabButton: {
    borderBottomWidth: 2,
    borderBottomColor: "#6F4E37",
  },
  tabText: {
    fontSize: 16,
    color: "#666",
  },
  activeTabText: {
    color: "#6F4E37",
    fontWeight: "bold",
  },
  content: {
    padding: 16,
  },
  emptyText: {
    textAlign: "center",
    color: "#999",
    marginTop: 30,
  },
  itemCard: {
    padding: 16,
    backgroundColor: "#f9f9f9",
    marginBottom: 15,
    borderRadius: 8,
    elevation: 1,
  },
  itemName: {
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 5,
  },
  totalText: {
    marginTop: 10,
    fontWeight: "bold",
    color: "#6F4E37",
  },
 
  orderActionContainer: {
    marginTop: 10,
    alignItems: "flex-end",
  },
  deleteOrderButton: {
    flexDirection: "row",
    backgroundColor: "#c00",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: "center",
  },
  deleteOrderText: {
    color: "#fff",
    marginLeft: 5,
  },
});

export default CartScreen;