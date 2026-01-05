// src/screens/auth/RegisterScreen.js
import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
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
        email,
        password
      );
      const user = userCredential.user;
      const db = getFirestore(app);
      await setDoc(doc(db, "users", user.uid), {
        fullname,
        email,
        phone,
        role: "customer", 
        createdAt: new Date().toISOString(),
        password, 
      });

      Alert.alert("Đăng ký thành công", "Bạn đã đăng ký thành công", [
        {
          text: "Đăng nhập ngay",
          onPress: () => navigation.navigate("Login"),
        },
      ]);
    } catch (error) {
      let errorMessage = "Đã xảy ra lỗi khi đăng ký";
      console.error("Lỗi đăng ký:", error.code, error.message); // Log detailed error
      if (error.code === "auth/email-already-in-use") {
        errorMessage = "Email này đã được sử dụng";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Email không hợp lệ";
      } else if (error.code === "auth/weak-password") {
        errorMessage = "Mật khẩu ít nhất 6 ký tự";
      }
      Alert.alert("Đăng ký thất bại", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const renderInput = (
    iconName,
    placeholder,
    value,
    setValue,
    keyboardType = "default",
    secure = false,
    toggle = null,
    show = true
  ) => (
    <View style={styles.inputContainer}>
      <Ionicons
        name={iconName}
        size={20}
        color="#666"
        style={styles.inputIcon}
      />
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        value={value}
        onChangeText={setValue}
        keyboardType={keyboardType}
        secureTextEntry={secure && show}
        autoCapitalize="none"
        placeholderTextColor="#999"
      />
      {toggle && (
        <TouchableOpacity onPress={toggle} style={styles.passwordToggle}>
          <Ionicons
            name={show ? "eye-outline" : "eye-off-outline"}
            size={20}
            color="#666"
          />
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Đăng ký</Text>
          <View style={styles.emptySpace} />
        </View>

        <View style={styles.formContainer}>
          {renderInput("person-outline", "Họ và tên", fullname, setFullname)}
          {renderInput(
            "mail-outline",
            "Email",
            email,
            setEmail,
            "email-address"
          )}
          {renderInput(
            "call-outline",
            "Số điện thoại",
            phone,
            setPhone,
            "phone-pad"
          )}
          {renderInput(
            "lock-closed-outline",
            "Mật khẩu",
            password,
            setPassword,
            "default",
            true,
            () => setShowPassword(!showPassword),
            !showPassword
          )}
          {renderInput(
            "lock-closed-outline",
            "Xác nhận mật khẩu",
            confirmPassword,
            setConfirmPassword,
            "default",
            true,
            () => setShowConfirmPassword(!showConfirmPassword),
            !showConfirmPassword
          )}

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.buttonText}>Đăng ký</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.orText}>HOẶC</Text>

          <View style={styles.socialButtonsContainer}>
            <TouchableOpacity style={styles.socialButton}>
              <Image
                source={require("../../assets/images/icon.png")} // Thay bằng icon Google của bạn
                style={styles.socialIcon}
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialButton}>
              <Image
                source={require("../../assets/images/icon.png")} // Thay bằng icon Facebook của bạn
                style={styles.socialIcon}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Bạn đã có tài khoản? </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Login")}>
              <Text style={styles.loginLink}>Đăng nhập ngay</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 30,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  emptySpace: {
    width: 24,
  },
  formContainer: {
    paddingHorizontal: 30,
    paddingTop: 20,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#DDD",
    marginBottom: 20,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: '#333',
  },
  passwordToggle: {
    padding: 10,
  },
  button: {
    backgroundColor: "#8B4513",
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: "center",
    marginVertical: 20,
  },
  buttonDisabled: {
    backgroundColor: "#A9A9A9",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  orText: {
    textAlign: "center",
    color: "#999",
    marginVertical: 20,
  },
  socialButtonsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 30,
  },
  socialButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  socialIcon: {
    width: 30,
    height: 30,
    resizeMode: "contain",
  },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
  },
  loginText: {
    color: "#666",
    fontSize: 14,
  },
  loginLink: {
    color: "#8B4513",
    fontSize: 14,
    fontWeight: "bold",
  },
});

export default RegisterScreen;