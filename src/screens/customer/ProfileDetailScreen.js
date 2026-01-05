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
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { useNavigation, useRoute } from "@react-navigation/native";
import { getFirestore, doc, updateDoc, getDoc } from "firebase/firestore";
import app from "../../sever/firebase";

const db = getFirestore(app);

const ProfileDetail = () => {
  const { updateUserPassword } = useAuth();
  const [userData, setUserData] = useState({
    id: "",
    fullname: "",
    email: "",
    phone: "",
    password: "", 
  });
  const [editMode, setEditMode] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
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
  console.log("Chế độ chỉnh sửa:", editMode);
  console.log("userData hiện tại trước khi kiểm tra:", userData); 

  if (!userData.fullname.trim()) {
    Alert.alert("Lỗi", "Vui lòng nhập họ và tên");
    console.log("Lỗi: Họ và tên rỗng.");
    return;
  }

  if (!userData.phone.trim()) {
    Alert.alert("Lỗi", "Vui lòng nhập số điện thoại");
    console.log("Lỗi: Số điện thoại rỗng.");
    return;
  }


  if (!userData.id || userData.id.toString().trim() === "" || userData.id === 0) { 
    Alert.alert("Lỗi", "Không tìm thấy ID người dùng. Vui lòng đăng nhập lại.");
    console.log("Lỗi: userData.id không hợp lệ (trước setState isLoading):", userData.id);
    return;
  }

    setIsLoading(true);
    console.log("isLoading set to true (handleSave)");
    try {
      const updateData = {
        fullname: String(userData.fullname.trim()),
        phone: String(userData.phone.trim()),
      };

      console.log("Đang cố gắng cập nhật người dùng ID:", userData.id);
      console.log("Dữ liệu cập nhật lên Firebase:", updateData); 

      const userDocRef = doc(db, "users", userData.id.toString());
      console.log("Đang gửi yêu cầu updateDoc lên Firebase..."); 
      await updateDoc(userDocRef, updateData);
      console.log("updateDoc Firebase thành công."); 

      const updatedUserData = {
        ...userData,
        fullname: userData.fullname.trim(),
        phone: userData.phone.trim(),
      };
      console.log("Đang cập nhật userData trong AsyncStorage:", updatedUserData);
      await AsyncStorage.setItem("userData", JSON.stringify(updatedUserData));
      console.log("Cập nhật AsyncStorage thành công."); 

      setUserData(updatedUserData);
      setEditMode(false);
      Alert.alert("Thành công", "Thông tin đã được cập nhật");
      console.log("Thông tin đã được cập nhật thành công.");
    } catch (error) {
      console.error("Lỗi cập nhật thông tin người dùng:", error);
      console.error("Chi tiết lỗi:", error.message); 

      if (error.message.includes("permission-denied")) {
        Alert.alert("Lỗi", "Không có quyền cập nhật thông tin này. Vui lòng kiểm tra quyền Firebase.");
        console.log("Lỗi: Quyền Firebase bị từ chối."); 
      } else if (error.message.includes("not-found")) {
        Alert.alert("Lỗi", "Không tìm thấy thông tin người dùng trên Firebase. ID có thể sai.");
        console.log("Lỗi: Không tìm thấy tài liệu người dùng trên Firebase."); 
      } else {
        Alert.alert("Lỗi", "Không thể cập nhật thông tin. Vui lòng thử lại. Lỗi không xác định.");
        console.log("Lỗi: Lỗi không xác định khi cập nhật thông tin."); 
      }
    } finally {
      setIsLoading(false);
      console.log("isLoading set to false (handleSave)");
      console.log("--- Kết thúc xử lý Lưu thông tin ---"); 
    }
  };

  const handleChangePassword = async () => {
    console.log("--- Bắt đầu xử lý Đổi mật khẩu ---");
    console.log("Mật khẩu hiện tại (input):", currentPassword);
    console.log("Mật khẩu mới (input):", newPassword);
    console.log("Xác nhận mật khẩu (input):", confirmPassword);
    console.log("Mật khẩu trong state (userData.password):", userData.password);

    if (newPassword !== confirmPassword) {
      Alert.alert("Lỗi", "Mật khẩu mới không khớp");
      console.log("Lỗi: Mật khẩu mới không khớp.");
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert("Lỗi", "Mật khẩu phải có ít nhất 6 ký tự");
      console.log("Lỗi: Mật khẩu mới quá ngắn.");
      return;
    }

    if (String(currentPassword).trim() !== String(userData.password).trim()) {
      Alert.alert("Lỗi", "Mật khẩu hiện tại không đúng");
      console.log("Lỗi: Mật khẩu hiện tại không đúng.");
      return;
    }


      if (!userData.id || String(userData.id).trim() === "") { 
      Alert.alert("Lỗi", "Không tìm thấy ID người dùng. Vui lòng đăng nhập lại.");
      console.log("Lỗi: userData.id không hợp lệ (đổi mật khẩu):", userData.id);
      return;
    }

    setIsLoading(true);
    console.log("isLoading set to true (handleChangePassword)");
    try {
      const updateData = {
        password: String(newPassword), 
      };

      console.log("Đang cố gắng cập nhật mật khẩu cho người dùng ID:", userData.id);
      console.log("Dữ liệu mật khẩu cập nhật lên Firebase Firestore:", updateData);

      const userDocRef = doc(db, "users", String(userData.id));
      console.log("Đang gửi yêu cầu updateDoc mật khẩu lên Firebase Firestore...");
      await updateDoc(userDocRef, updateData);
      console.log("updateDoc mật khẩu Firebase Firestore thành công.");

      const updatedUserData = { ...userData, password: newPassword };
      console.log("Đang cập nhật userData trong AsyncStorage (mật khẩu):", updatedUserData);
      await AsyncStorage.setItem("userData", JSON.stringify(updatedUserData));
      console.log("Cập nhật AsyncStorage (mật khẩu) thành công.");

      setUserData(updatedUserData);
      setShowPasswordModal(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      Alert.alert("Thành công", "Mật khẩu đã được thay đổi");
      console.log("Mật khẩu đã được thay đổi thành công.");
    } catch (error) {
      console.error("Lỗi cập nhật mật khẩu:", error);
      console.error("Chi tiết lỗi:", error.message);

      if (error.message.includes("permission-denied")) {
        Alert.alert("Lỗi", "Không có quyền thay đổi mật khẩu. Vui lòng kiểm tra quyền Firebase Firestore.");
        console.log("Lỗi: Quyền Firebase Firestore bị từ chối khi đổi mật khẩu.");
      } else if (error.message.includes("not-found")) {
        Alert.alert("Lỗi", "Không tìm thấy thông tin người dùng trên Firebase Firestore. ID có thể sai.");
        console.log("Lỗi: Không tìm thấy tài liệu người dùng trên Firebase Firestore khi đổi mật khẩu.");
      } else {
        Alert.alert("Lỗi", `Không thể thay đổi mật khẩu. Vui lòng thử lại. Lỗi không xác định: ${error.message}`);
        console.log("Lỗi: Lỗi không xác định khi đổi mật khẩu.");
      }
    } finally {
      setIsLoading(false);
      console.log("isLoading set to false (handleChangePassword)");
      console.log("--- Kết thúc xử lý Đổi mật khẩu ---");
    }
  };

  const refreshUserDataFromFirebase = async () => {
    console.log("--- Bắt đầu làm mới dữ liệu người dùng từ Firebase ---"); 
    if (!userData.id || userData.id.trim() === "") {
      Alert.alert("Lỗi", "Không tìm thấy ID người dùng để làm mới.");
      console.log("Lỗi: userData.id không hợp lệ (làm mới):", userData.id); 
      return;
    }

    try {
      console.log("Đang truy vấn tài liệu người dùng từ Firebase với ID:", userData.id); 
      const userDocRef = doc(db, "users", userData.id.toString());
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const firebaseData = userDoc.data();
        console.log("Dữ liệu người dùng từ Firebase:", firebaseData); 
        const updatedData = {
          id: userData.id,
          fullname: firebaseData.fullname || "",
          email: firebaseData.email || "",
          phone: firebaseData.phone || "",
          password: firebaseData.password || "", 
        };

        setUserData(updatedData);
        console.log("Đang cập nhật userData trong AsyncStorage (làm mới):", updatedData); 
        await AsyncStorage.setItem("userData", JSON.stringify(updatedData));
        console.log("Cập nhật AsyncStorage (làm mới) thành công."); 
        Alert.alert("Thành công", "Dữ liệu đã được làm mới từ Firebase");
        console.log("Dữ liệu đã được làm mới thành công.");
      } else {
        Alert.alert("Lỗi", "Không tìm thấy thông tin người dùng trên Firebase.");
        console.log("Lỗi: Không tìm thấy tài liệu người dùng trên Firebase khi làm mới."); 
      }
    } catch (error) {
      console.error("Lỗi khi làm mới dữ liệu người dùng:", error); 
      Alert.alert("Lỗi", `Không thể làm mới dữ liệu. Chi tiết: ${error.message}`);
    }
    console.log("--- Kết thúc làm mới dữ liệu người dùng từ Firebase ---"); 
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={refreshUserDataFromFirebase}
        >
          <Ionicons name="refresh-outline" size={20} color="#8B4513" />
        </TouchableOpacity>

        {editMode ? (
          <TouchableOpacity
            style={[styles.saveButton, isLoading && styles.buttonDisabled]}
            onPress={handleSave}
            disabled={isLoading}
          >
            <Text style={styles.saveButtonText}>
              {isLoading ? "Đang lưu..." : "Lưu"}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => {
              setEditMode(true);
              console.log("Chuyển sang chế độ chỉnh sửa.");
            }}
          >
            <Text style={styles.editButtonText}>Sửa</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.profileSection}>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Họ và tên</Text>
          {editMode ? (
            <TextInput
              style={styles.input}
              value={userData.fullname}
              onChangeText={(text) => {
                setUserData({ ...userData, fullname: text });
                console.log("Họ và tên thay đổi:", text); 
              }}
              placeholder="Nhập họ và tên"
            />
          ) : (
            <Text style={styles.infoText}>{userData.fullname}</Text>
          )}
        </View>

        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Email</Text>
          <Text style={styles.infoText}>{userData.email}</Text>
          <Text style={styles.emailNote}>Email không thể thay đổi</Text>
        </View>

        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Số điện thoại</Text>
          {editMode ? (
            <TextInput
              style={styles.input}
              value={userData.phone}
              onChangeText={(text) => {
                setUserData({ ...userData, phone: text });
                console.log("Số điện thoại thay đổi:", text);
              }}
              placeholder="Nhập số điện thoại"
              keyboardType="phone-pad"
            />
          ) : (
            <Text style={styles.infoText}>{userData.phone}</Text>
          )}
        </View>
      </View>

      <TouchableOpacity
        style={styles.changePasswordButton}
        onPress={() => {
          setShowPasswordModal(true);
          console.log("Mở modal đổi mật khẩu."); 
        }}
      >
        <Text style={styles.changePasswordText}>Đổi mật khẩu</Text>
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={showPasswordModal}
        onRequestClose={() => {
          setShowPasswordModal(false);
          console.log("Đóng modal đổi mật khẩu."); 
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Đổi mật khẩu</Text>
              <TouchableOpacity onPress={() => {
                setShowPasswordModal(false);
                console.log("Đóng modal đổi mật khẩu từ nút X."); 
              }}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Mật khẩu hiện tại</Text>
              <TextInput
                style={styles.modalInput}
                secureTextEntry={true}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholder="Nhập mật khẩu hiện tại"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Mật khẩu mới</Text>
              <TextInput
                style={styles.modalInput}
                secureTextEntry={true}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Nhập mật khẩu mới"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Xác nhận mật khẩu</Text>
              <TextInput
                style={styles.modalInput}
                secureTextEntry={true}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Nhập lại mật khẩu mới"
              />
            </View>

            <TouchableOpacity
              style={[styles.confirmButton, isLoading && styles.buttonDisabled]}
              onPress={handleChangePassword}
              disabled={isLoading}
            >
              <Text style={styles.confirmButtonText}>
                {isLoading ? "Đang xử lý..." : "Xác nhận"}
              </Text>
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  refreshButton: {
    padding: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333333",
  },
  editButton: {
    padding: 5,
  },
  editButtonText: {
    color: "#8B4513",
    fontWeight: "bold",
  },
  saveButton: {
    padding: 5,
  },
  saveButtonText: {
    color: "#8B4513",
    fontWeight: "bold",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  profileSection: {
    marginTop: 15,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 10,
    marginHorizontal: 15,
  },
  infoItem: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  infoLabel: {
    fontSize: 14,
    color: "#777777",
    marginBottom: 5,
  },
  infoText: {
    fontSize: 16,
    color: "#333333",
  },
  emailNote: {
    fontSize: 12,
    color: "#999999",
    fontStyle: "italic",
    marginTop: 3,
  },
  input: {
    fontSize: 16,
    color: "#333333",
    borderBottomWidth: 1,
    borderBottomColor: "#8B4513",
    paddingVertical: 5,
  },
  changePasswordButton: {
    alignSelf: "center",
    marginTop: 30,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: "#8B4513",
    borderRadius: 5,
  },
  changePasswordText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 20,
    marginHorizontal: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  inputContainer: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 14,
    color: "#777777",
    marginBottom: 5,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "#CCCCCC",
    borderRadius: 5,
    padding: 10,
    fontSize: 16,
  },
  confirmButton: {
    backgroundColor: "#8B4513",
    borderRadius: 5,
    padding: 15,
    alignItems: "center",
    marginTop: 10,
  },
  confirmButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
});

export default ProfileDetail;