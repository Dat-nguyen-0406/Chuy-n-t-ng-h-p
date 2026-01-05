import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import app from "../../sever/firebase"; // Đảm bảo đường dẫn này đúng
import { useAuth } from "../../context/AuthContext"; // Đảm bảo đường dẫn này đúng
import AsyncStorage from '@react-native-async-storage/async-storage';

const db = getFirestore(app);

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [welcomeUserName, setWelcomeUserName] = useState("");

  // States mới cho hiệu ứng Focus Input
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);


  const { login } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Lỗi", "Vui lòng nhập đầy đủ thông tin");
      return;
    }

    console.log("Bắt đầu đăng nhập...");

    setIsLoading(true);
    try {
      console.log("Kết nối Firestore...");
      // LƯU Ý: Việc lấy toàn bộ collection "users" về client để xác thực không được khuyến khích
      // vì lý do bảo mật và hiệu suất. Nên sử dụng Firebase Authentication.
      const querySnapshot = await getDocs(collection(db, "users"));

      console.log(`Tìm thấy ${querySnapshot.size} người dùng`);
      let foundUser = null;

      querySnapshot.forEach((doc) => {
        const userData = doc.data();
        if (userData.email === email && userData.password === password) {
          foundUser = { id: doc.id, ...userData };
        }
      });

      if (foundUser) {
        console.log("Đăng nhập thành công, chuẩn bị chuyển hướng...");
        await AsyncStorage.setItem("userData", JSON.stringify({
          id: foundUser.id,
          fullname: foundUser.fullname,
          email: foundUser.email,
          phone: foundUser.phone,
          role: foundUser.role,
          password: foundUser.password,
        }));


        setWelcomeUserName(foundUser.fullname);
        setShowWelcomeModal(true);


        setTimeout(async () => {
          await login(foundUser.id, foundUser.role);
          setShowWelcomeModal(false);
        }, 1500);

      } else {
        console.log("Sai thông tin đăng nhập");
        Alert.alert("Lỗi", "Email hoặc mật khẩu không đúng");
      }
    } catch (error) {
      console.error("Lỗi đăng nhập:", error);
      Alert.alert("Lỗi", `Chi tiết lỗi: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Logo và Tiêu đề */}
        <View style={styles.logoContainer}>
          <Image
            source={require("../../assets/images/icon.png")} // Đảm bảo đường dẫn này đúng
            style={styles.logo}
            defaultSource={require("../../assets/images/icon.png")}
          />
          <Text style={styles.appTitle}>Coffee Shop</Text>
        </View>

        {/* Input Group */}
        <View style={styles.inputGroup}>
          {/* Input Email */}
          <View style={[
            styles.inputContainer,
            isEmailFocused && styles.inputContainerFocused // Áp dụng style focus
          ]}>
            <Ionicons 
                name="mail-outline" 
                size={20} 
                style={[styles.icon, isEmailFocused && styles.iconFocused]} // Đổi màu icon
            />
            <TextInput
              style={styles.input}
              placeholder="Email"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
              placeholderTextColor="#999"
              onFocus={() => setIsEmailFocused(true)}
              onBlur={() => setIsEmailFocused(false)}
            />
          </View>

          {/* Input Password */}
          <View style={[
            styles.inputContainer,
            isPasswordFocused && styles.inputContainerFocused // Áp dụng style focus
          ]}>
            <Ionicons 
                name="lock-closed-outline" 
                size={20} 
                style={[styles.icon, isPasswordFocused && styles.iconFocused]} // Đổi màu icon
            />
            <TextInput
              style={styles.input}
              placeholder="Mật khẩu"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
              placeholderTextColor="#999"
              onFocus={() => setIsPasswordFocused(true)}
              onBlur={() => setIsPasswordFocused(false)}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.passwordToggle}>
              <Ionicons
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={20}
                color="#666"
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Nút Đăng nhập */}
        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
          </Text>
        </TouchableOpacity>

        {/* Link Đăng ký */}
        <TouchableOpacity onPress={() => navigation.navigate("Register")} style={styles.registerButton}>
          <Text style={styles.registerText}>Chưa có tài khoản? <Text style={styles.registerLink}>Đăng ký ngay</Text></Text>
        </TouchableOpacity>
      </ScrollView>


      {/* Modal Chào mừng */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showWelcomeModal}
        onRequestClose={() => {
          setShowWelcomeModal(false);
        }}
      >
        <View style={welcomeModalStyles.centeredView}>
          <View style={welcomeModalStyles.modalView}>
            <Image
              source={require("../../assets/images/icon.png")} // Đảm bảo đường dẫn này đúng
              style={welcomeModalStyles.modalIcon}
            />
            <Text style={welcomeModalStyles.modalTitle}>Chào mừng!</Text>
            <Text style={welcomeModalStyles.modalText}>
              Chào mừng bạn trở lại, **{welcomeUserName}**!
            </Text>
            <TouchableOpacity
              style={welcomeModalStyles.closeButton}
              onPress={() => setShowWelcomeModal(false)}
            >
              <Text style={welcomeModalStyles.closeButtonText}>Tiếp tục</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

export default LoginScreen;

// --- STYLESHEET CẢI TIẾN ---

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F8F8", // Nền sáng nhẹ
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 25,
    justifyContent: "center",
    paddingBottom: 40,
  },
  // --- LOGO/TITLE ---
  logoContainer: {
    alignItems: "center",
    marginTop: 60,
    marginBottom: 40,
  },
  logo: {
    width: 120,
    height: 120,
    resizeMode: "contain",
  },
  appTitle: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#4B2C20", // Màu nâu đậm
    marginTop: 10,
  },
  // --- INPUTS ---
  inputGroup: {
    marginBottom: 30,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12, // Tăng bo góc nhẹ
    paddingHorizontal: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    borderWidth: 1, 
    borderColor: '#E0E0E0', // Viền mỏng mặc định
  },
  // Style cho input khi focus
  inputContainerFocused: {
    borderColor: "#6D4C41", // Màu nâu ấm khi focus
    borderWidth: 2,
    shadowColor: "#6D4C41",
    shadowOpacity: 0.3,
    elevation: 5,
  },
  icon: {
    marginRight: 12,
    color: "#999", // Màu icon mặc định
  },
  iconFocused: {
    color: "#6D4C41", // Màu icon khi focus
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: "#333",
  },
  passwordToggle: {
    padding: 10,
  },
  // --- BUTTON ---
  button: {
    backgroundColor: "#6D4C41", // Màu nâu đậm (Coffee)
    paddingVertical: 15,
    borderRadius: 40, // Bo góc tròn hơn
    alignItems: "center",
    marginVertical: 15,
    shadowColor: "#4B2C20",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 8,
  },
  buttonDisabled: {
    backgroundColor: "#BCAAA4", // Màu xám nâu nhạt
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "900", // Rất đậm
    fontSize: 18,
    letterSpacing: 0.5,
  },
  // --- REGISTER LINK ---
  registerButton: {
    marginTop: 30,
    paddingVertical: 10,
  },
  registerText: {
    textAlign: "center",
    color: "#757575",
    fontSize: 16,
  },
  registerLink: {
    color: "#A1887F", // Màu nâu nhạt ấm
    fontWeight: "bold",
    textDecorationLine: "underline",
  },
});


const welcomeModalStyles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  modalView: {
    margin: 20,
    backgroundColor: "#FFFBF5", // Màu kem nhạt
    borderRadius: 25, // Bo góc tròn hơn
    padding: 40,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 10,
  },
  modalIcon: {
    width: 90,
    height: 90,
    marginBottom: 20,
    resizeMode: "contain",
  },
  modalTitle: {
    marginBottom: 10,
    textAlign: "center",
    fontSize: 26,
    fontWeight: "bold",
    color: "#6D4C41",
  },
  modalText: {
    marginBottom: 30,
    textAlign: "center",
    fontSize: 18,
    color: "#4B2C20",
    lineHeight: 28,
  },
  closeButton: {
    backgroundColor: "#6D4C41",
    borderRadius: 15,
    paddingVertical: 14,
    paddingHorizontal: 35,
    elevation: 5,
  },
  closeButtonText: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
    fontSize: 17,
  },
});