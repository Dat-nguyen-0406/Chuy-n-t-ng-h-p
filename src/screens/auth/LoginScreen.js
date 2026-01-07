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
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';
import { getFirestore, collection, query, where, getDocs } from "firebase/firestore";
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

  // States cho hiệu ứng Focus Input
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  const { login } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Thông báo", "Vui lòng nhập đầy đủ email và mật khẩu");
      return;
    }

    setIsLoading(true);
    try {
      // Tối ưu hóa: Chỉ tìm user có email khớp thay vì tải toàn bộ bảng users
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", email.trim()));
      const querySnapshot = await getDocs(q);

      let foundUser = null;
      querySnapshot.forEach((doc) => {
        const userData = doc.data();
        if (userData.password === password) {
          foundUser = { id: doc.id, ...userData };
        }
      });

      if (foundUser) {
        // Lưu thông tin vào AsyncStorage
        await AsyncStorage.setItem("userData", JSON.stringify({
          id: foundUser.id,
          fullname: foundUser.fullname,
          email: foundUser.email,
          phone: foundUser.phone || "",
          address: foundUser.address || "",
          role: foundUser.role,
        }));

        setWelcomeUserName(foundUser.fullname);
        setShowWelcomeModal(true);

        // Đợi 1.5s để hiện Modal chào mừng rồi mới vào App
        setTimeout(async () => {
          setShowWelcomeModal(false);
          await login(foundUser.id, foundUser.role);
        }, 1500);

      } else {
        Alert.alert("Đăng nhập thất bại", "Email hoặc mật khẩu không chính xác");
      }
    } catch (error) {
      console.error("Lỗi đăng nhập:", error);
      Alert.alert("Lỗi hệ thống", "Không thể kết nối đến máy chủ. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <LinearGradient
        colors={['#FFF8F0', '#FFE8D6', '#FFF8F0']}
        style={styles.backgroundGradient}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled" // Giúp bấm vào input mượt hơn khi bàn phím đang hiện
        >
          {/* Logo Section */}
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Image
                source={require("../../assets/images/logo.png")}
                style={styles.logo}
              />
            </View>
            <Text style={styles.appTitle}>Coffee Shop</Text>
            <Text style={styles.appSubtitle}>Hương vị truyền thống, phong cách hiện đại</Text>
          </View>

          {/* Form Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Đăng Nhập</Text>
            
            {/* Input Email */}
            <View style={[
              styles.inputWrapper,
              isEmailFocused && styles.inputWrapperFocused
            ]}>
              <View style={styles.iconContainer}>
                <Ionicons 
                  name="mail-outline" 
                  size={22} 
                  color={isEmailFocused ? "#8B4513" : "#999"}
                />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Email của bạn"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
                placeholderTextColor="#AAAAAA"
                onFocus={() => setIsEmailFocused(true)}
                onBlur={() => setIsEmailFocused(false)}
              />
            </View>

            {/* Input Password */}
            <View style={[
              styles.inputWrapper,
              isPasswordFocused && styles.inputWrapperFocused
            ]}>
              <View style={styles.iconContainer}>
                <Ionicons 
                  name="lock-closed-outline" 
                  size={22} 
                  color={isPasswordFocused ? "#8B4513" : "#999"}
                />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Mật khẩu"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                placeholderTextColor="#AAAAAA"
                onFocus={() => setIsPasswordFocused(true)}
                onBlur={() => setIsPasswordFocused(false)}
              />
              <TouchableOpacity 
                onPress={() => setShowPassword(!showPassword)} 
                style={styles.eyeIcon}
              >
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={22}
                  color="#999"
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.forgotPasswordContainer}>
              <Text style={styles.forgotPasswordText}>Quên mật khẩu?</Text>
            </TouchableOpacity>

            {/* Login Button */}
            <TouchableOpacity
              style={styles.buttonContainer}
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={isLoading ? ['#BCAAA4', '#A1887F'] : ['#6D4C41', '#5D4037', '#3E2723']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.loginButton}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.buttonText}>ĐĂNG NHẬP</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Bottom Register Link */}
          <View style={styles.registerContainer}>
            <Text style={styles.registerText}>Chưa có tài khoản? </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Register")}>
              <Text style={styles.registerLink}>Đăng ký ngay</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </LinearGradient>

      {/* Welcome Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showWelcomeModal}
      >
        <View style={modalStyles.overlay}>
          <View style={modalStyles.modalView}>
            <LinearGradient
              colors={['#FFF', '#FFF8F0']}
              style={modalStyles.modalGradient}
            >
              <View style={modalStyles.checkCircle}>
                <Ionicons name="checkmark" size={50} color="#FFF" />
              </View>
              <Text style={modalStyles.welcomeTitle}>Thành công!</Text>
              <Text style={modalStyles.welcomeText}>
                Chào mừng bạn trở lại,{"\n"}
                <Text style={modalStyles.userName}>{welcomeUserName}</Text>
              </Text>
            </LinearGradient>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundGradient: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 25,
    paddingTop: 50,
    paddingBottom: 30,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  logoCircle: {
    width: 120,                // Độ rộng vòng tròn
    height: 120,               // Chiều cao vòng tròn (phải bằng width)
    borderRadius: 60,          // Bo tròn (phải bằng 1/2 width)
    backgroundColor: "#FFFFFF",
    // --- HAI DÒNG QUAN TRỌNG ĐỂ CĂN GIỮA ---
    justifyContent: "center",  
    alignItems: "center",      
    // ---------------------------------------
    elevation: 8,              // Bóng đổ Android
    shadowColor: "#8B4513",    // Bóng đổ iOS
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    borderWidth: 2,            // Thêm viền nhẹ cho đẹp
    borderColor: "#F5F5F5",
  },
  logo: {
    width: 80,                 // Kích thước logo bên trong
    height: 80,                // Kích thước logo bên trong
    resizeMode: "contain",     // Đảm bảo logo không bị bóp méo
  },
  appTitle: {
    fontSize: 34,
    fontWeight: "900",
    color: "#3E2723",
    marginTop: 15,
    letterSpacing: 1,
  },
  appSubtitle: {
    fontSize: 14,
    color: "#795548",
    marginTop: 5,
    fontWeight: "500",
  },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 30,
    padding: 25,
    elevation: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#3E2723",
    textAlign: "center",
    marginBottom: 25,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FDFDFD",
    borderRadius: 15,
    marginBottom: 15,
    borderWidth: 1.5,
    borderColor: "#F0F0F0",
    height: 55,
  },
  inputWrapperFocused: {
    borderColor: "#8B4513",
    backgroundColor: "#FFF",
  },
  iconContainer: {
    width: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    flex: 1,
    height: "100%",
    fontSize: 16,
    color: "#3E2723",
  },
  eyeIcon: {
    width: 50,
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  forgotPasswordContainer: {
    alignSelf: "flex-end",
    marginBottom: 20,
  },
  forgotPasswordText: {
    color: "#8B4513",
    fontSize: 14,
    fontWeight: "600",
  },
  buttonContainer: {
    borderRadius: 15,
    overflow: "hidden",
    elevation: 5,
  },
  loginButton: {
    height: 55,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  registerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 30,
  },
  registerText: {
    color: "#5D4037",
    fontSize: 15,
  },
  registerLink: {
    color: "#8B4513",
    fontSize: 15,
    fontWeight: "bold",
    textDecorationLine: 'underline',
  },
});

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalView: {
    width: '80%',
    borderRadius: 30,
    overflow: 'hidden',
  },
  modalGradient: {
    padding: 40,
    alignItems: 'center',
  },
  checkCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#6D4C41',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3E2723',
    marginBottom: 10,
  },
  welcomeText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#5D4037',
    lineHeight: 24,
  },
  userName: {
    fontWeight: 'bold',
    fontSize: 20,
    color: '#8B4513',
  },
});

export default LoginScreen;