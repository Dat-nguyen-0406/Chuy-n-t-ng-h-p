import React, { useState, useEffect } from 'react';
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

import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
import {  db } from '../../sever/firebase'; 
const EditCategoryScreen = ({ route, navigation }) => {
  const { category } = route.params; 
  const [categoryName, setCategoryName] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCategoryDetails = async () => {
      try {
        if (!category || !category.id) {
          Alert.alert("Lỗi", "Không tìm thấy thông tin danh mục.");
          navigation.goBack();
          return;
        }

        const categoryRef = doc(db, "danhmuc", category.id);
        const docSnap = await getDoc(categoryRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setCategoryName(data.categoryName || '');
          setIsActive(data.isActive === undefined ? true : data.isActive); 
        } else {
          Alert.alert("Lỗi", "Không tìm thấy danh mục này trong cơ sở dữ liệu.");
          navigation.goBack();
        }
      } catch (error) {
        console.error("Lỗi khi tải chi tiết danh mục:", error);
        Alert.alert("Lỗi", "Không thể tải chi tiết danh mục. Vui lòng thử lại.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategoryDetails();
  }, [category.id, navigation]); 

  const handleUpdateCategory = async () => {
    if (!categoryName.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên danh mục');
      return;
    }

    setIsSubmitting(true);
    try {
      const categoryRef = doc(db, "danhmuc", category.id);
      await updateDoc(categoryRef, {
        categoryName: categoryName,
        isActive: isActive,
      });

      Alert.alert('Thành công', 'Đã cập nhật danh mục', [
        {
          text: 'OK',
          onPress: () => navigation.goBack()
        }
      ]);
    } catch (error) {
      console.error("Lỗi khi cập nhật danh mục:", error);
      Alert.alert('Lỗi', 'Không thể cập nhật danh mục. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#8B0000" />
        <Text>Đang tải danh mục...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Tên danh mục</Text>
      <TextInput
        style={styles.input}
        value={categoryName}
        onChangeText={setCategoryName}
        placeholder="Nhập tên danh mục"
        autoCapitalize="none"
      />

      <View style={styles.switchContainer}>
        <Text style={styles.label}>Trạng thái hoạt động</Text>
        <Switch
          trackColor={{ false: "#767577", true: "#8B0000" }}
          thumbColor={isActive ? "#ffffff" : "#f4f3f4"}
          onValueChange={setIsActive}
          value={isActive}
        />
      </View>

      <TouchableOpacity
        style={styles.submitButton}
        onPress={handleUpdateCategory}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator size="small" color="white" />
        ) : (
          <Text style={styles.submitButtonText}>Cập nhật</Text>
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
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  submitButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default EditCategoryScreen;