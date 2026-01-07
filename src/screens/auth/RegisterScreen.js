import React, { useState, useCallback } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import { app } from "../../sever/firebase";

const RegisterScreen = ({ navigation }) => {
  const [fullname, setFullname] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  const handleRegister = async () => {
    if (!fullname || !email || !phone || !password || !confirmPassword) {
      Alert.alert("Lỗi", "Vui lòng điền đầy đủ thông tin");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Lỗi", "Mật khẩu không trùng khớp");
      return;
    }

    setIsLoading(true);
    try {
      const auth = getAuth(app);
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );
      const user = userCredential.user;
      const db = getFirestore(app);
      await setDoc(doc(db, "users", user.uid), {
        fullname: fullname.trim(),
        email: email.trim(),
        phone: phone.trim(),
        role: "customer",
        createdAt: new Date().toISOString(),
        password: password, 
      });

      Alert.alert("Đăng ký thành công", "Bạn đã đăng ký thành công", [
        { text: "Đăng nhập ngay", onPress: () => navigation.navigate("Login") },
      ]);
    } catch (error) {
      let errorMessage = "Đã xảy ra lỗi khi đăng ký";
      if (error.code === "auth/email-already-in-use") errorMessage = "Email này đã được sử dụng";
      else if (error.code === "auth/invalid-email") errorMessage = "Email không hợp lệ";
      else if (error.code === "auth/weak-password") errorMessage = "Mật khẩu ít nhất 6 ký tự";
      Alert.alert("Đăng ký thất bại", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Hàm render Input tối ưu để không bị mất focus
  const renderInput = (iconName, placeholder, value, setValue, fieldName, keyboardType = "default", secure = false, toggle = null, show = true) => (
    <View style={[
      styles.inputWrapper,
      focusedField === fieldName && styles.inputWrapperFocused
    ]}>
      <View style={styles.iconContainer}>
        <Ionicons
          name={iconName}
          size={22}
          color={focusedField === fieldName ? "#8B4513" : "#A0A0A0"}
        />
      </View>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        value={value}
        onChangeText={setValue}
        keyboardType={keyboardType}
        secureTextEntry={secure && show}
        autoCapitalize="none"
        placeholderTextColor="#BDBDBD"
        onFocus={() => setFocusedField(fieldName)}
        onBlur={() => setFocusedField(null)}
        underlineColorAndroid="transparent"
      />
      {toggle && (
        <TouchableOpacity onPress={toggle} style={styles.eyeIcon} activeOpacity={0.7}>
          <Ionicons
            name={show ? "eye-off-outline" : "eye-outline"}
            size={22}
            color="#A0A0A0"
          />
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <LinearGradient colors={['#FFF8F0', '#FFE8D6']} style={styles.gradient}>
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled" // Giúp nhấn vào là ăn ngay
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Ionicons name="chevron-back" size={28} color="#5D4037" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Tạo tài khoản</Text>
            <View style={{ width: 44 }} />
          </View>

          {/* Welcome Text */}
          <View style={styles.welcomeContainer}>
            <Text style={styles.welcomeTitle}>Chào mừng bạn! 👋</Text>
            <Text style={styles.welcomeSubtitle}>Điền thông tin bên dưới để bắt đầu.</Text>
          </View>

          {/* Form Card */}
          <View style={styles.card}>
            {renderInput("person-outline", "Họ và tên", fullname, setFullname, "fullname")}
            {renderInput("mail-outline", "Email", email, setEmail, "email", "email-address")}
            {renderInput("call-outline", "Số điện thoại", phone, setPhone, "phone", "phone-pad")}
            
            {renderInput(
              "lock-closed-outline", 
              "Mật khẩu", 
              password, 
              setPassword, 
              "password", 
              "default", 
              true, 
              () => setShowPassword(!showPassword), 
              !showPassword
            )}

            {renderInput(
              "shield-checkmark-outline", 
              "Xác nhận mật khẩu", 
              confirmPassword, 
              setConfirmPassword, 
              "confirmPassword", 
              "default", 
              true, 
              () => setShowConfirmPassword(!showConfirmPassword), 
              !showConfirmPassword
            )}

            <TouchableOpacity
              style={styles.buttonWrapper}
              onPress={handleRegister}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={isLoading ? ['#D7CCC8', '#BCAAA4'] : ['#8B4513', '#6D4C41']}
                style={styles.button}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.buttonText}>ĐĂNG KÝ</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Login Link */}
          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Bạn đã có tài khoản? </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Login")}>
              <Text style={styles.loginLink}>Đăng nhập ngay</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1 },
  scrollContainer: { flexGrow: 1, paddingBottom: 40 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
  },
  backButton: {
    width: 44, height: 44, borderRadius: 12, backgroundColor: "#FFF",
    justifyContent: "center", alignItems: "center", elevation: 4,
  },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: "#5D4037" },
  welcomeContainer: { paddingHorizontal: 25, marginBottom: 20 },
  welcomeTitle: { fontSize: 28, fontWeight: "800", color: "#5D4037" },
  welcomeSubtitle: { fontSize: 15, color: "#8B6F47" },
  card: {
    backgroundColor: "#FFFFFF", borderRadius: 25, padding: 25,
    marginHorizontal: 20, elevation: 10, shadowColor: "#000",
    shadowOpacity: 0.1, shadowRadius: 10,
  },
  inputWrapper: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#F9F9F9",
    borderRadius: 15, marginBottom: 15, borderWidth: 1.5, borderColor: "#F0F0F0",
    height: 60,
  },
  inputWrapperFocused: { borderColor: "#8B4513", backgroundColor: "#FFF" },
  iconContainer: { width: 50, alignItems: "center" },
  input: { flex: 1, height: "100%", fontSize: 16, color: "#333" },
  eyeIcon: { width: 50, alignItems: "center" },
  buttonWrapper: { borderRadius: 15, overflow: "hidden", marginTop: 10 },
  button: { height: 60, alignItems: "center", justifyContent: "center" },
  buttonText: { color: "#FFF", fontSize: 17, fontWeight: "bold" },
  loginContainer: { flexDirection: "row", justifyContent: "center", marginTop: 30 },
  loginText: { color: "#666", fontSize: 15 },
  loginLink: { color: "#8B4513", fontSize: 15, fontWeight: "bold" },
});

export default RegisterScreen;