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
  Dimensions,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { useNavigation, useIsFocused } from "@react-navigation/native";
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

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
    Alert.alert(
      "Đăng xuất",
      "Bạn có chắc chắn muốn đăng xuất?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Đăng xuất",
          style: "destructive",
          onPress: async () => {
            try {
              await logout();
              await AsyncStorage.clear();
            } catch (error) {
              Alert.alert("Lỗi", "Không thể đăng xuất. Vui lòng thử lại sau.");
            }
          },
        },
      ]
    );
  };

  const navigateProfileDetail = () => {
    navigation.navigate("ProfileDetail", { id: "1" });
  };
  
  const navigateToOrderHistory = () => {
    navigation.navigate("Cart");
  };

  const navigateToNotifications = () => {
    navigation.navigate("Notifications");
    setShowBadge(false);
  };

  const navigateToOrderTracking = () => {
    navigation.navigate("OrderTracking");
  };

  const navigateToGames = () => {
    navigation.navigate("Game");
  };
  const navigateToTracking = () => {
    navigation.navigate("Tracking");
  };
  
  
  const navigateToChatbot = () => {
    navigation.navigate("Chatbot");
  };
  
  const showPromotion = () => {
    setShowPromoModal(true);
  };

  const MenuItem = ({ icon, title, onPress, badge, iconColor = "#4b74ba" }) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={styles.menuIconContainer}>
        <View style={[styles.iconWrapper, { backgroundColor: iconColor + '15' }]}>
          <Ionicons name={icon} size={22} color={iconColor} />
        </View>
        {badge && <View style={styles.badge} />}
      </View>
      <Text style={styles.menuItemText}>{title}</Text>
      <Ionicons name="chevron-forward" size={20} color="#B0B0B0" />
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header với gradient */}
      <LinearGradient
        colors={['#4b74ba', '#5a8ed6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.profileSection}>
          <View style={styles.profileImageContainer}>
            <Image
              source={require("../../assets/images/default-avatar.png")}
              style={styles.profileImage}
              defaultSource={require("../../assets/images/default-avatar.png")}
            />
            <TouchableOpacity style={styles.editAvatarButton}>
              <Ionicons name="camera" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.userInfoContainer}>
            <Text style={styles.fullname}>{userData.fullname || "Người dùng"}</Text>
            <View style={styles.infoRow}>
              <Ionicons name="mail-outline" size={14} color="#E8F0FF" />
              <Text style={styles.userInfo}>{userData.email || "email@example.com"}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="call-outline" size={14} color="#E8F0FF" />
              <Text style={styles.userInfo}>{userData.phone || "Chưa cập nhật"}</Text>
            </View>
          </View>
        </View>

        {/* Loyalty Card */}
        <TouchableOpacity style={styles.loyaltyCard} onPress={showPromotion}>
          <View style={styles.loyaltyCardLeft}>
            <View style={styles.pointsBadge}>
              <Ionicons name="star" size={20} color="#FFD700" />
            </View>
            <View style={styles.loyaltyTextContainer}>
              <Text style={styles.loyaltyTitle}>Thẻ Thành Viên</Text>
              <Text style={styles.loyaltyPoints}>{userData.coin || "Chưa cập nhật"} điểm</Text>
            </View>
          </View>
          <View style={styles.loyaltyCardRight}>
            <Text style={styles.loyaltyPromo}>Xem ưu đãi</Text>
            <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
          </View>
        </TouchableOpacity>
      </LinearGradient>

      {/* Menu Sections */}
      <View style={styles.contentContainer}>
        {/* Tài khoản Section */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Tài khoản của tôi</Text>
          <View style={styles.menuCard}>
            <MenuItem
              icon="person-outline"
              title="Thông tin cá nhân"
              onPress={navigateProfileDetail}
            />
            <MenuItem
              icon="receipt-outline"
              title="Lịch sử đơn hàng"
              onPress={navigateToOrderHistory}
            />
            <MenuItem
              icon="location-outline"
              title="Theo dõi đơn hàng"
              onPress={navigateToTracking}
            />
          </View>
        </View>

        {/* Tiện ích Section */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Tiện ích</Text>
          <View style={styles.menuCard}>
            <MenuItem
              icon="gift-outline"
              title="Săn Voucher ngay"
              onPress={navigateToGames}
              iconColor="#FF6B6B"
            />
            
            <MenuItem
              icon="notifications-outline"
              title="Thông báo"
              onPress={navigateToNotifications}
              badge={showBadge}
              iconColor="#4ECDC4"
            />
            <MenuItem
              icon="chatbubble-ellipses-outline"
              title="Trợ giúp & Hỗ trợ"
              onPress={navigateToChatbot}
              iconColor="#95E1D3"
            />
          </View>
        </View>


        {/* Nút đăng xuất */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#FF4757" />
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </TouchableOpacity>
      </View>

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
                <Ionicons name="close-circle" size={28} color="#4b74ba" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.promoList} showsVerticalScrollIndicator={false}>
              <View style={styles.promoItem}>
                <View style={[styles.promoBadge, { backgroundColor: '#FF6B6B' }]}>
                  <Text style={styles.promoBadgeText}>-30%</Text>
                </View>
                <View style={styles.promoInfo}>
                  <Text style={styles.promoTitle}>Giảm 30% món thứ 2</Text>
                  <Text style={styles.promoDesc}>
                    Áp dụng cho đơn hàng từ 100.000đ
                  </Text>
                  <View style={styles.promoFooter}>
                    <Ionicons name="time-outline" size={14} color="#999" />
                    <Text style={styles.promoExpiry}>Hết hạn: 30/04/2025</Text>
                  </View>
                </View>
              </View>

              <View style={styles.promoItem}>
                <View style={[styles.promoBadge, { backgroundColor: '#4ECDC4' }]}>
                  <Text style={styles.promoBadgeText}>FREE</Text>
                </View>
                <View style={styles.promoInfo}>
                  <Text style={styles.promoTitle}>Miễn phí topping</Text>
                  <Text style={styles.promoDesc}>
                    Đổi 100 điểm lấy 1 topping miễn phí
                  </Text>
                  <View style={styles.promoFooter}>
                    <Ionicons name="infinite-outline" size={14} color="#999" />
                    <Text style={styles.promoExpiry}>Không giới hạn thời gian</Text>
                  </View>
                </View>
              </View>

              <View style={styles.promoItem}>
                <View style={[styles.promoBadge, { backgroundColor: '#FFD700' }]}>
                  <Text style={[styles.promoBadgeText, { color: '#333' }]}>BOGO</Text>
                </View>
                <View style={styles.promoInfo}>
                  <Text style={styles.promoTitle}>Mua 1 tặng 1</Text>
                  <Text style={styles.promoDesc}>
                    Áp dụng vào thứ 2 hàng tuần
                  </Text>
                  <View style={styles.promoFooter}>
                    <Ionicons name="time-outline" size={14} color="#999" />
                    <Text style={styles.promoExpiry}>Hết hạn: 31/05/2025</Text>
                  </View>
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
    backgroundColor: "#F8F9FA",
  },
  header: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 25,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  profileImageContainer: {
    position: "relative",
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
  editAvatarButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#4b74ba",
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  userInfoContainer: {
    flex: 1,
    marginLeft: 15,
  },
  fullname: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 6,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  userInfo: {
    fontSize: 14,
    color: "#E8F0FF",
    marginLeft: 6,
  },
  loyaltyCard: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  loyaltyCardLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  pointsBadge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  loyaltyTextContainer: {
    marginLeft: 12,
  },
  loyaltyTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    opacity: 0.9,
  },
  loyaltyPoints: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "700",
  },
  loyaltyCardRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  loyaltyPromo: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    marginRight: 4,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
  },
  menuSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2C3E50",
    marginBottom: 12,
  },
  menuCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  menuIconContainer: {
    position: "relative",
    marginRight: 12,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  menuItemText: {
    flex: 1,
    fontSize: 15,
    color: "#2C3E50",
    fontWeight: "500",
  },
  badge: {
    position: "absolute",
    right: -2,
    top: -2,
    backgroundColor: "#FF4757",
    borderRadius: 6,
    width: 12,
    height: 12,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  languageContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  languageText: {
    fontSize: 14,
    color: "#95A5A6",
    marginRight: 4,
  },
  logoutButton: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    marginTop: 10,
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#FFE5E5",
    shadowColor: "#FF4757",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  logoutText: {
    color: "#FF4757",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 24,
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#2C3E50",
  },
  promoList: {
    maxHeight: 400,
  },
  promoItem: {
    flexDirection: "row",
    backgroundColor: "#F8F9FA",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E8E8E8",
    alignItems: "center",
  },
  promoBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  promoBadgeText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },
  promoInfo: {
    flex: 1,
  },
  promoTitle: {
    fontWeight: "700",
    fontSize: 16,
    color: "#2C3E50",
    marginBottom: 4,
  },
  promoDesc: {
    fontSize: 13,
    color: "#7F8C8D",
    marginBottom: 6,
  },
  promoFooter: {
    flexDirection: "row",
    alignItems: "center",
  },
  promoExpiry: {
    fontSize: 12,
    color: "#95A5A6",
    marginLeft: 4,
  },
  usePointsButton: {
    backgroundColor: "#4b74ba",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    marginTop: 16,
    shadowColor: "#4b74ba",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  usePointsText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 16,
  },
});

export default ProfileScreen;