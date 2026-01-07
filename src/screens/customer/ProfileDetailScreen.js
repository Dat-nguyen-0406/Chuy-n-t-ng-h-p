// src/screens/customer/ProfileDetail.js

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Modal,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { useNavigation, useRoute } from "@react-navigation/native";
import { getFirestore, doc, updateDoc, getDoc } from "firebase/firestore";
import { LinearGradient } from 'expo-linear-gradient';
import app from "../../sever/firebase";

const db = getFirestore(app);

const ProfileDetail = () => {
  const { updateUserPassword } = useAuth();
  const [userData, setUserData] = useState({
    id: "",
    fullname: "",
    email: "",
    phone: "",
    address: "",
    password: "",
  });
  const [editMode, setEditMode] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigation = useNavigation();
  const route = useRoute();

  useEffect(() => {
    const fetchUserData = async () => {
      console.log("--- Bắt đầu tải dữ liệu người dùng từ AsyncStorage ---");
      try {
        const userDataString = await AsyncStorage.getItem("userData");
        if (userDataString) {
          const data = JSON.parse(userDataString);
          console.log("Dữ liệu người dùng đọc được từ AsyncStorage:", data);
          setUserData({
            id: data.id || "",
            fullname: data.fullname || "",
            email: data.email || "",
            phone: data.phone || "",
            address: data.address || "",
            password: data.password || "",
          });
        } else {
          console.log("Không tìm thấy dữ liệu người dùng trong AsyncStorage.");
        }
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu người dùng từ AsyncStorage:", error);
      }
    };

    fetchUserData();
  }, []);

  const handleSave = async () => {
    console.log("--- Bắt đầu xử lý Lưu thông tin ---");
    
    if (!userData.fullname.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập họ và tên");
      return;
    }

    if (!userData.phone.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập số điện thoại");
      return;
    }

    if (!userData.id || userData.id.toString().trim() === "" || userData.id === 0) {
      Alert.alert("Lỗi", "Không tìm thấy ID người dùng. Vui lòng đăng nhập lại.");
      return;
    }

    setIsLoading(true);
    try {
      const updateData = {
        fullname: String(userData.fullname.trim()),
        phone: String(userData.phone.trim()),
        address: userData.address ? userData.address.trim() : "",
      };

      console.log("Đang cố gắng cập nhật người dùng ID:", userData.id);

      const userDocRef = doc(db, "users", userData.id.toString());
      await updateDoc(userDocRef, updateData);

      const updatedUserData = {
        ...userData,
        fullname: userData.fullname.trim(),
        phone: userData.phone.trim(),
      };
      await AsyncStorage.setItem("userData", JSON.stringify(updatedUserData));

      setUserData(updatedUserData);
      setEditMode(false);
      Alert.alert("Thành công", "Thông tin đã được cập nhật");
    } catch (error) {
      console.error("Lỗi cập nhật thông tin người dùng:", error);

      if (error.message.includes("permission-denied")) {
        Alert.alert("Lỗi", "Không có quyền cập nhật thông tin này. Vui lòng kiểm tra quyền Firebase.");
      } else if (error.message.includes("not-found")) {
        Alert.alert("Lỗi", "Không tìm thấy thông tin người dùng trên Firebase. ID có thể sai.");
      } else {
        Alert.alert("Lỗi", "Không thể cập nhật thông tin. Vui lòng thử lại.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async () => {
    console.log("--- Bắt đầu xử lý Đổi mật khẩu ---");

    if (newPassword !== confirmPassword) {
      Alert.alert("Lỗi", "Mật khẩu mới không khớp");
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert("Lỗi", "Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }

    if (String(currentPassword).trim() !== String(userData.password).trim()) {
      Alert.alert("Lỗi", "Mật khẩu hiện tại không đúng");
      return;
    }

    if (!userData.id || String(userData.id).trim() === "") {
      Alert.alert("Lỗi", "Không tìm thấy ID người dùng. Vui lòng đăng nhập lại.");
      return;
    }

    setIsLoading(true);
    try {
      const updateData = {
        password: String(newPassword),
      };

      const userDocRef = doc(db, "users", String(userData.id));
      await updateDoc(userDocRef, updateData);

      const updatedUserData = { ...userData, password: newPassword };
      await AsyncStorage.setItem("userData", JSON.stringify(updatedUserData));

      setUserData(updatedUserData);
      setShowPasswordModal(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      Alert.alert("Thành công", "Mật khẩu đã được thay đổi");
    } catch (error) {
      console.error("Lỗi cập nhật mật khẩu:", error);
      Alert.alert("Lỗi", "Không thể thay đổi mật khẩu. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUserDataFromFirebase = async () => {
    if (!userData.id || userData.id.trim() === "") {
      Alert.alert("Lỗi", "Không tìm thấy ID người dùng để làm mới.");
      return;
    }

    setIsLoading(true);
    try {
      const userDocRef = doc(db, "users", userData.id.toString());
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const firebaseData = userDoc.data();
        const updatedData = {
          id: userData.id,
          fullname: firebaseData.fullname || "",
          email: firebaseData.email || "",
          phone: firebaseData.phone || "",
          address: firebaseData.address || "",
          password: firebaseData.password || "",
        };

        setUserData(updatedData);
        await AsyncStorage.setItem("userData", JSON.stringify(updatedData));
        Alert.alert("Thành công", "Dữ liệu đã được làm mới từ Firebase");
      } else {
        Alert.alert("Lỗi", "Không tìm thấy thông tin người dùng trên Firebase.");
      }
    } catch (error) {
      console.error("Lỗi khi làm mới dữ liệu người dùng:", error);
      Alert.alert("Lỗi", "Không thể làm mới dữ liệu. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  const InfoField = ({ label, value, editable, onChangeText, placeholder, multiline, keyboardType }) => (
    <View style={styles.infoField}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {editable && editMode ? (
        <TextInput
          style={[styles.fieldInput, multiline && styles.multilineInput]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#B0B0B0"
          multiline={multiline}
          keyboardType={keyboardType}
        />
      ) : (
        <Text style={styles.fieldValue}>{value || "Chưa cập nhật"}</Text>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#4b74ba', '#5a8ed6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.refreshButton}
              onPress={refreshUserDataFromFirebase}
              disabled={isLoading}
            >
              <Ionicons name="refresh" size={22} color="#FFFFFF" />
            </TouchableOpacity>

            {editMode ? (
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSave}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Ionicons name="checkmark" size={22} color="#FFFFFF" />
                )}
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => setEditMode(true)}
              >
                <Ionicons name="create-outline" size={22} color="#FFFFFF" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <InfoField
            label="Họ và tên"
            value={userData.fullname}
            editable={true}
            onChangeText={(text) => setUserData({ ...userData, fullname: text })}
            placeholder="Nhập họ và tên"
          />

          <View style={styles.divider} />

          <View style={styles.infoField}>
            <Text style={styles.fieldLabel}>Email</Text>
            <Text style={styles.fieldValue}>{userData.email}</Text>
            <Text style={styles.fieldNote}>
              <Ionicons name="lock-closed" size={12} color="#95A5A6" /> Email không thể thay đổi
            </Text>
          </View>

          <View style={styles.divider} />

          <InfoField
            label="Số điện thoại"
            value={userData.phone}
            editable={true}
            onChangeText={(text) => setUserData({ ...userData, phone: text })}
            placeholder="Nhập số điện thoại"
            keyboardType="phone-pad"
          />

          <View style={styles.divider} />

          <InfoField
            label="Địa chỉ giao hàng"
            value={userData.address}
            editable={true}
            onChangeText={(text) => setUserData({ ...userData, address: text })}
            placeholder="Nhập địa chỉ của bạn"
            multiline={true}
          />
        </View>

        {/* Change Password Button */}
        <TouchableOpacity
          style={styles.changePasswordButton}
          onPress={() => setShowPasswordModal(true)}
        >
          <View style={styles.changePasswordContent}>
            <Ionicons name="key-outline" size={22} color="#4b74ba" />
            <Text style={styles.changePasswordText}>Đổi mật khẩu</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#B0B0B0" />
        </TouchableOpacity>
      </ScrollView>

      {/* Password Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showPasswordModal}
        onRequestClose={() => setShowPasswordModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Đổi mật khẩu</Text>
              <TouchableOpacity onPress={() => setShowPasswordModal(false)}>
                <Ionicons name="close-circle" size={28} color="#4b74ba" />
              </TouchableOpacity>
            </View>

            <View style={styles.passwordInputContainer}>
              <Text style={styles.inputLabel}>Mật khẩu hiện tại</Text>
              <View style={styles.passwordInputWrapper}>
                <TextInput
                  style={styles.passwordInput}
                  secureTextEntry={!showCurrentPassword}
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  placeholder="Nhập mật khẩu hiện tại"
                  placeholderTextColor="#B0B0B0"
                />
                <TouchableOpacity
                  onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                  style={styles.eyeIcon}
                >
                  <Ionicons
                    name={showCurrentPassword ? "eye-off-outline" : "eye-outline"}
                    size={22}
                    color="#95A5A6"
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.passwordInputContainer}>
              <Text style={styles.inputLabel}>Mật khẩu mới</Text>
              <View style={styles.passwordInputWrapper}>
                <TextInput
                  style={styles.passwordInput}
                  secureTextEntry={!showNewPassword}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                  placeholderTextColor="#B0B0B0"
                />
                <TouchableOpacity
                  onPress={() => setShowNewPassword(!showNewPassword)}
                  style={styles.eyeIcon}
                >
                  <Ionicons
                    name={showNewPassword ? "eye-off-outline" : "eye-outline"}
                    size={22}
                    color="#95A5A6"
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.passwordInputContainer}>
              <Text style={styles.inputLabel}>Xác nhận mật khẩu</Text>
              <View style={styles.passwordInputWrapper}>
                <TextInput
                  style={styles.passwordInput}
                  secureTextEntry={!showConfirmPassword}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Nhập lại mật khẩu mới"
                  placeholderTextColor="#B0B0B0"
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.eyeIcon}
                >
                  <Ionicons
                    name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                    size={22}
                    color="#95A5A6"
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.confirmButton, isLoading && styles.buttonDisabled]}
              onPress={handleChangePassword}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.confirmButtonText}>Xác nhận</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  saveButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
    padding: 20,
  },
  profileCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  infoField: {
    paddingVertical: 12,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#7F8C8D",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  fieldValue: {
    fontSize: 16,
    color: "#2C3E50",
    fontWeight: "500",
  },
  fieldInput: {
    fontSize: 16,
    color: "#2C3E50",
    borderBottomWidth: 2,
    borderBottomColor: "#4b74ba",
    paddingVertical: 8,
    paddingHorizontal: 0,
  },
  multilineInput: {
    minHeight: 60,
    textAlignVertical: "top",
  },
  fieldNote: {
    fontSize: 12,
    color: "#95A5A6",
    marginTop: 6,
    fontStyle: "italic",
  },
  divider: {
    height: 1,
    backgroundColor: "#F0F0F0",
    marginVertical: 8,
  },
  changePasswordButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    marginTop: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  changePasswordContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  changePasswordText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2C3E50",
    marginLeft: 12,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#2C3E50",
  },
  passwordInputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#7F8C8D",
    marginBottom: 8,
  },
  passwordInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    paddingHorizontal: 16,
    backgroundColor: "#F8F9FA",
  },
  passwordInput: {
    flex: 1,
    fontSize: 16,
    color: "#2C3E50",
    paddingVertical: 14,
  },
  eyeIcon: {
    padding: 4,
  },
  confirmButton: {
    backgroundColor: "#4b74ba",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
    shadowColor: "#4b74ba",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});

export default ProfileDetail;