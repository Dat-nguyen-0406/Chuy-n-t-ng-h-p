// src/screens/customer/ProfileScreen.js

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  Modal,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { useNavigation, useIsFocused } from "@react-navigation/native"; 

const ProfileScreen = () => {
  const { logout } = useAuth();
  const [userData, setUserData] = useState({});
  const [showBadge, setShowBadge] = useState(true);
  const [showPromoModal, setShowPromoModal] = useState(false);
  const navigation = useNavigation();
  const isFocused = useIsFocused(); 


  const fetchUserData = async () => {
    try {
      const userDataString = await AsyncStorage.getItem("userData");
      if (userDataString) {
        const parsed = JSON.parse(userDataString);
        console.log("ProfileScreen: userData from AsyncStorage:", parsed);
        setUserData(parsed);
      } else {
        setUserData({}); 
      }
    } catch (error) {
      console.log("ProfileScreen: Lỗi khi lấy thông tin người dùng:", error);
      setUserData({}); 
    }
  };


  useEffect(() => {
    if (isFocused) {
      console.log("ProfileScreen: Màn hình đang được focus, gọi fetchUserData.");
      fetchUserData();
    
      setTimeout(() => {
        setShowBadge(false);
      }, 5000);
    }
  }, [isFocused]);

  const handleLogout = async () => {
    try {
      await logout();
      await AsyncStorage.clear();
    } catch (error) {
      Alert.alert("Lỗi", "Không thể đăng xuất. Vui lòng thử lại sau.");
    }
  };


  const navigateProfileDetail = () => {
    navigation.navigate("ProfileDetail", { id: "1" });
  };
  const navigateToOrderHistory = () => {
    navigation.navigate("Cart"
     );
  };

  const navigateToNotifications = () => {
    navigation.navigate("Notifications");
    setShowBadge(false);
  };

  const navigateToOrderTracking = () => {
    navigation.navigate("OrderTracking");
  };

  const navigateToReviews = () => {
    navigation.navigate("Reviews");
  };
  const navigateToChatbot = () => {
  navigation.navigate("Chatbot");
  };
  const showPromotion = () => {
    setShowPromoModal(true);
  };
  
  

  return (
    <ScrollView style={styles.container}>
  
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.profileImageContainer}>
            <Image
              source={require("../../assets/images/default-avatar.png")}
              style={styles.profileImage}
              defaultSource={require("../../assets/images/default-avatar.png")}
            />
          </View>
          <TouchableOpacity style={styles.editAvatarButton}>
            <Ionicons name="camera-outline" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        <Text style={styles.fullname}>{userData.fullname}</Text>
        <Text style={styles.email}>Email : {userData.email}</Text>
        <Text style={styles.phone}>SĐT : {userData.phone}</Text>

        <TouchableOpacity style={styles.loyaltyCard} onPress={showPromotion}>
          <View style={styles.loyaltyCardContent}>
            <Ionicons name="cafe-outline" size={24} color="#FFFFFF" />
            <View style={styles.loyaltyTextContainer}>
              <Text style={styles.loyaltyTitle}>Thẻ Thành Viên</Text>
              <Text style={styles.loyaltyPoints}>150 điểm</Text>
            </View>
          </View>
          <Text style={styles.loyaltyPromo}>Xem ưu đãi</Text>
        </TouchableOpacity>
      </View>

      {/* Phần menu tài khoản */}
      <View style={styles.menuSection}>
        <Text style={styles.sectionTitle}>Tài khoản</Text>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={navigateProfileDetail}
        >
          <Ionicons name="person-outline" size={24} color="#8B4513" />
          <Text style={styles.menuItemText}>Thông tin cá nhân</Text>
          <Ionicons name="chevron-forward" size={24} color="#CCCCCC" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={navigateToOrderHistory}
        >
          <Ionicons name="time-outline" size={24} color="#8B4513" />
          <Text style={styles.menuItemText}>Lịch sử đơn hàng</Text>
          <Ionicons name="chevron-forward" size={24} color="#CCCCCC" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={navigateToOrderTracking}
        >
          <Ionicons name="location-outline" size={24} color="#8B4513" />
          <Text style={styles.menuItemText}>Theo dõi đơn hàng hiện tại</Text>
          <Ionicons name="chevron-forward" size={24} color="#CCCCCC" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={navigateToReviews}>
          <Ionicons name="star-outline" size={24} color="#8B4513" />
          <Text style={styles.menuItemText}>Đánh giá & Nhận xét</Text>
          <Ionicons name="chevron-forward" size={24} color="#CCCCCC" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={navigateToNotifications}
        >
          <View style={styles.iconWithBadge}>
            <Ionicons name="notifications-outline" size={24} color="#8B4513" />
            {showBadge && <View style={styles.badge} />}
          </View>
          <Text style={styles.menuItemText}>Thông báo</Text>
          <Ionicons name="chevron-forward" size={24} color="#CCCCCC" />
        </TouchableOpacity>
      </View>

      {/* Phần menu cài đặt */}
      <View style={styles.menuSection}>
        <Text style={styles.sectionTitle}>Cài đặt</Text>

        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="settings-outline" size={24} color="#8B4513" />
          <Text style={styles.menuItemText}>Cài đặt ứng dụng</Text>
          <Ionicons name="chevron-forward" size={24} color="#CCCCCC" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="language-outline" size={24} color="#8B4513" />
          <Text style={styles.menuItemText}>Ngôn ngữ</Text>
          <View style={styles.valueContainer}>
            <Text style={styles.valueText}>Tiếng Việt</Text>
            <Ionicons name="chevron-forward" size={24} color="#CCCCCC" />
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={navigateToChatbot}>
          <Ionicons name="help-outline" size={24} color="#8B4513" />
          <Text style={styles.menuItemText}>Trợ giúp & Hỗ trợ</Text>
          <Ionicons name="chevron-forward" size={24} color="#CCCCCC" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Ionicons
            name="information-outline"
            size={24}
            color="#8B4513"
          />
          <Text style={styles.menuItemText}>Về chúng tôi</Text>
          <Ionicons name="chevron-forward" size={24} color="#CCCCCC" />
        </TouchableOpacity>
      </View>

      {/* Nút đăng xuất */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Đăng xuất</Text>
      </TouchableOpacity>

      {/* Modal hiển thị ưu đãi */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showPromoModal}
        onRequestClose={() => setShowPromoModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Ưu đãi thành viên</Text>
              <TouchableOpacity onPress={() => setShowPromoModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.promoList}>
              <View style={styles.promoItem}>
                <View style={styles.promoBadge}>
                  <Text style={styles.promoBadgeText}>-30%</Text>
                </View>
                <View style={styles.promoInfo}>
                  <Text style={styles.promoTitle}>Giảm 30% món thứ 2</Text>
                  <Text style={styles.promoDesc}>
                    Áp dụng cho đơn hàng từ 100.000đ
                  </Text>
                  <Text style={styles.promoExpiry}>Hết hạn: 30/04/2025</Text>
                </View>
              </View>

              <View style={styles.promoItem}>
                <View style={styles.promoBadge}>
                  <Text style={styles.promoBadgeText}>FREE</Text>
                </View>
                <View style={styles.promoInfo}>
                  <Text style={styles.promoTitle}>Miễn phí topping</Text>
                  <Text style={styles.promoDesc}>
                    Đổi 100 điểm lấy 1 topping miễn phí
                  </Text>
                  <Text style={styles.promoExpiry}>
                    Không giới hạn thời gian
                  </Text>
                </View>
              </View>

              <View style={styles.promoItem}>
                <View
                  style={[styles.promoBadge, { backgroundColor: "#FFD700" }]}
                >
                  <Text style={styles.promoBadgeText}>BOGO</Text>
                </View>
                <View style={styles.promoInfo}>
                  <Text style={styles.promoTitle}>Mua 1 tặng 1</Text>
                  <Text style={styles.promoDesc}>
                    Áp dụng vào thứ 2 hàng tuần
                  </Text>
                  <Text style={styles.promoExpiry}>Hết hạn: 31/05/2025</Text>
                </View>
              </View>
            </ScrollView>

            <TouchableOpacity
              style={styles.usePointsButton}
              onPress={() => setShowPromoModal(false)}
            >
              <Text style={styles.usePointsText}>Dùng điểm ngay</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  header: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  headerTop: {
    position: "relative",
  },
  fullname: {
  fontSize: 20,
  fontWeight: "600",
  color: "#4A4A4A",
  marginTop: 10,
},

email: {
  fontSize: 16,
  fontWeight: "400",
  color: "#777",
  marginTop: 5,
},

phone: {
  fontSize: 16,
  fontWeight: "400",
  color: "#777",
  marginTop: 5,
},

  profileImageContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: "hidden",
    marginBottom: 10,
    borderWidth: 2,
    borderColor: "#8B4513",
  },
  profileImage: {
    width: "100%",
    height: "100%",
  },
  editAvatarButton: {
    position: "absolute",
    bottom: 10,
    right: 0,
    backgroundColor: "#8B4513",
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  userName: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 16,
    color: "#777777",
    marginBottom: 5,
  },
  userPhone: {
    fontSize: 16,
    color: "#777777",
    marginBottom: 15,
  },
  loyaltyCard: {
    width: "100%",
    backgroundColor: "#8B4513",
    borderRadius: 12,
    padding: 15,
    marginTop: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  loyaltyCardContent: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  loyaltyTextContainer: {
    marginLeft: 10,
  },
  loyaltyTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  loyaltyPoints: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  loyaltyPromo: {
    color: "#FFD700",
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "right",
  },
  menuSection: {
    backgroundColor: "#FFFFFF",
    marginTop: 15,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 10,
    marginHorizontal: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginVertical: 10,
    color: "#333333",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  menuItemText: {
    flex: 1,
    marginLeft: 15,
    fontSize: 16,
    color: "#333333",
  },
  iconWithBadge: {
    position: "relative",
  },
  badge: {
    position: "absolute",
    right: -2,
    top: -2,
    backgroundColor: "red",
    borderRadius: 9,
    width: 9,
    height: 9,
  },
  valueContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  valueText: {
    fontSize: 14,
    color: "#777777",
    marginRight: 5,
  },
  logoutButton: {
    backgroundColor: "#8B0000",
    marginHorizontal: 15,
    marginVertical: 25,
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  logoutText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },

  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  promoList: {
    maxHeight: 300,
  },
  promoItem: {
    flexDirection: "row",
    backgroundColor: "#F9F9F9",
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#EEEEEE",
    alignItems: "center",
  },
  promoBadge: {
    backgroundColor: "#8B4513",
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  promoBadgeText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 14,
  },
  promoInfo: {
    flex: 1,
  },
  promoTitle: {
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 5,
  },
  promoDesc: {
    fontSize: 14,
    color: "#666666",
    marginBottom: 5,
  },
  promoExpiry: {
    fontSize: 12,
    color: "#999999",
  },
  usePointsButton: {
    backgroundColor: "#8B4513",
    borderRadius: 10,
    padding: 15,
    alignItems: "center",
    marginTop: 15,
  },
  usePointsText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
});

export default ProfileScreen;
