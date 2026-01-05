// src/screens/admin/AddCategoryScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Switch
} from 'react-native';


import { getFirestore, collection, addDoc } from 'firebase/firestore';
import app from '../../sever/firebase'; 

const db = getFirestore(app);

const AddCategoryScreen = ({ navigation }) => {
  const [categoryName, setCategoryName] = useState('');
  const [isActive, setIsActive] = useState(true); 
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddCategory = async () => {
    if (!categoryName.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên danh mục');
      return;
    }
    setIsSubmitting(true);
    try {
      console.log("AddCategoryScreen: Đang cố gắng thêm danh mục mới với tên:", categoryName.trim(), "và trạng thái active:", isActive);
      const customId = Math.random().toString(36).substring(4, 15);
      const docRef = await addDoc(collection(db, "danhmuc"), {
        categoryName: categoryName.trim(),
        id: customId, 
      });
      console.log("AddCategoryScreen: Thêm danh mục thành công vào Firestore. ID tài liệu mới (Firestore generated):", docRef.id);
      console.log("AddCategoryScreen: ID tùy chỉnh được lưu trong tài liệu:", customId);
      Alert.alert('Thành công', 'Đã thêm danh mục mới vào Firebase!', [
        {
          text: 'OK',
          onPress: () => navigation.goBack()
        }
      ]);
    } catch (error) {
      console.error("AddCategoryScreen: Lỗi khi thêm danh mục vào Firestore:", error);
      Alert.alert(
        'Lỗi',
        `Không thể thêm danh mục: ${error.message}. Vui lòng kiểm tra lại kết nối Firebase và quy tắc bảo mật (Security Rules) cho collection 'danhmuc' trên Firebase Console.`
      );
    } finally {
      setIsSubmitting(false);
      console.log("AddCategoryScreen: Kết thúc quá trình thêm danh mục.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Tên danh mục</Text>
      <TextInput
        style={styles.input}
        placeholder="Nhập tên danh mục"
        value={categoryName}
        onChangeText={setCategoryName}
        editable={!isSubmitting}
       
      />

      <View style={styles.switchContainer}>
        <Text style={styles.label}>Trạng thái hoạt động</Text>
        <Switch
          trackColor={{ false: "#767577", true: "#8B0000" }}
          thumbColor={isActive ? "#ffffff" : "#f4f3f4"}
          onValueChange={setIsActive}
          value={isActive}
          disabled={isSubmitting} 
        />
      </View>

      <TouchableOpacity
        style={styles.submitButton}
        onPress={handleAddCategory}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator size="small" color="white" />
        ) : (
          <Text style={styles.submitButtonText}>Thêm danh mục</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    padding: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  submitButton: {
    backgroundColor: '#8B0000',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default AddCategoryScreen;