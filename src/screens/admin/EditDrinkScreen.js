// src/screens/admin/EditDrinkScreen.js

import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Image, ActivityIndicator, Switch, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import { getFirestore, doc, getDoc, updateDoc, collection, getDocs } from 'firebase/firestore';
import app from '../../sever/firebase'; 

const db = getFirestore(app); 

const EditDrinkScreen = ({ route, navigation }) => {
  const { drinkId } = route.params || {}; 
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [quatiy, setQuatiy] = useState('');
  const [start, setStart] = useState('');
  const [status, setStatus] = useState('');
  const [active, setActive] = useState(false); 
  const [categories, setCategories] = useState([]); 

  useEffect(() => {
   const fetchDrinkAndCategories = async () => {
      try {

        const categorySnapshot = await getDocs(collection(db, "danhmuc"));
        const fetchedCategories = categorySnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().categoryName 
        }));
        setCategories(fetchedCategories);

        if (drinkId) {     
          const docRef = doc(db, 'douong', drinkId); 
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const data = docSnap.data();
            setName(data.drinkname || '');
            setPrice(String(data.price || ''));
            setDescription(data.description || '');
            setCategory(data.category || '');
            setImageUrl(data.image || '');
            setQuatiy(String(data.quatiy || ''));
            setStart(String(data.start || ''));
            setStatus(data.status || '');
            setActive(data.active !== undefined ? data.active : false);
          } else {
            Alert.alert("Lỗi", "Không tìm thấy đồ uống để sửa.");
            navigation.goBack();
          }
        }
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu:", error);
        Alert.alert("Lỗi", `Không thể tải dữ liệu: ${error.message}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDrinkAndCategories();
  }, [drinkId, navigation]);

  const handleUpdateDrink = async () => {
    if (!name.trim() || !price.trim() || !category.trim()) {
      Alert.alert('Lỗi', 'Vui lòng điền đầy đủ các trường Tên, Giá và Danh mục.');
      return;
    }

    setIsSubmitting(true);
    try {

      const drinkRef = doc(db, 'douong', drinkId); 
      await updateDoc(drinkRef, {
        drinkname: name,
        price: parseFloat(price),
        description: description,
        category: category,
        image: imageUrl, 
        quatiy: parseInt(quatiy),
        start: parseFloat(start),
        status: status,
        active: active,
      });
      Alert.alert('Thành công', 'Đã cập nhật đồ uống thành công!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error("Lỗi khi cập nhật đồ uống:", error);
      Alert.alert('Lỗi', `Không thể cập nhật đồ uống: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImagePick = () => {
    Alert.alert("Tính năng chọn ảnh", "Tính năng này cần tích hợp ImagePicker.");
   
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#8B0000" />
        <Text style={{ marginTop: 10 }}>Đang tải dữ liệu đồ uống...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.imageContainer}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.drinkImage} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="image" size={50} color="#ccc" />
            <Text style={styles.placeholderText}>Chưa có ảnh</Text>
          </View>
        )}
        <TouchableOpacity style={styles.uploadButton} onPress={handleImagePick}>
          <Text style={styles.uploadButtonText}>Chọn ảnh</Text>
        </TouchableOpacity>
      </View>
       <View style={styles.formGroup}>
        <Text style={styles.label}>Địa chỉ ảnh (URL):</Text>
        <TextInput
          style={styles.input}
          value={imageUrl}
          onChangeText={setImageUrl}
          placeholder="Nhập địa chỉ ảnh URL"
          keyboardType="url"
        />
      </View>
      <View style={styles.formGroup}>
        <Text style={styles.label}>Tên đồ uống:</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Nhập tên đồ uống"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Giá:</Text>
        <TextInput
          style={styles.input}
          value={price}
          onChangeText={setPrice}
          placeholder="Nhập giá"
          keyboardType="numeric"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Mô tả:</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="Nhập mô tả"
          multiline
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Danh mục:</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={category}
            onValueChange={(itemValue) => setCategory(itemValue)}
          >
            {categories.length > 0 ? (
              categories.map((cat) => (
                <Picker.Item key={cat.id} label={cat.name} value={cat.name} />
              ))
            ) : (
              <Picker.Item label="Đang tải danh mục..." value="" />
            )}
          </Picker>
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Số lượng:</Text>
        <TextInput
          style={styles.input}
          value={quatiy}
          onChangeText={setQuatiy}
          placeholder="Nhập số lượng"
          keyboardType="numeric"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Điểm bắt đầu:</Text>
        <TextInput
          style={styles.input}
          value={start}
          onChangeText={setStart}
          placeholder="Nhập điểm bắt đầu"
          keyboardType="numeric"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Trạng thái:</Text>
        <TextInput
          style={styles.input}
          value={status}
          onChangeText={setStatus}
          placeholder="Nhập trạng thái (ví dụ: 'Còn hàng', 'Hết hàng')"
        />
      </View>

      <View style={styles.switchContainer}>
        <Text style={styles.label}>Hoạt động:</Text>
        <Switch
          trackColor={{ false: "#767577", true: "#8B0000" }}
          thumbColor={active ? "#ffffff" : "#f4f3f4"}
          onValueChange={setActive}
          value={active}
        />
      </View>

      <TouchableOpacity
        style={styles.submitButton}
        onPress={handleUpdateDrink}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator size="small" color="white" />
        ) : (
          <Text style={styles.submitButtonText}>Cập nhật đồ uống</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  drinkImage: {
    width: 200,
    height: 200,
    borderRadius: 8,
    marginBottom: 10,
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    width: 200,
    height: 200,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  placeholderText: {
    color: '#999',
    marginTop: 8,
  },
  uploadButton: {
    backgroundColor: '#8B0000',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  uploadButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    overflow: 'hidden',
    backgroundColor: '#fff',
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
    justifyContent: 'center',
  },
   formGroup: {
    marginBottom: 20,
  },
   label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333',
  },
   input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    fontSize: 16,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default EditDrinkScreen;