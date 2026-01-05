// src/screens/admin/AddDrinkScreen.js
import 'react-native-get-random-values';
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  Switch 
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from 'expo-image-picker';
import { v4 as uuidv4 } from 'uuid';
import { getFirestore, collection, addDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import app from '../../sever/firebase'; 

const db = getFirestore(app);
const storage = getStorage(app);

const AddDrinkScreen = ({ navigation }) => {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [selectedCategoryName, setSelectedCategoryName] = useState("");
  const [image, setImage] = useState(null);
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [categories, setCategories] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageUploadLoading, setImageUploadLoading] = useState(false);
  const [quatiy, setQuatiy] = useState("");
  const [start, setStart] = useState("");
  const [status, setStatus] = useState("");
  const [active, setActive] = useState(true); 

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "danhmuc"));
        const fetchedCategories = querySnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().categoryName
        }));
        setCategories(fetchedCategories);
        if (fetchedCategories.length > 0) {
          setSelectedCategoryId(fetchedCategories[0].id);
          setSelectedCategoryName(fetchedCategories[0].name);
        }
      } catch (error) {
        console.error("Lỗi khi tải danh mục:", error);
        Alert.alert("Lỗi", "Không thể tải danh mục.");
      }
    };

    fetchCategories();
  }, []);

  const pickImage = async () => {
  
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Quyền truy cập bị từ chối', 'Chúng tôi cần quyền truy cập thư viện ảnh để chọn ảnh.');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
      setImageUrlInput(''); 
    }
  };

  const uploadImage = async (uri) => {
    setImageUploadLoading(true);
    try {
      const response = await fetch(uri);
      const blob = await response.blob();

      const imageRef = ref(storage, `drink_images/${uuidv4()}`);
      const snapshot = await uploadBytes(imageRef, blob);
      const downloadURL = await getDownloadURL(snapshot.ref);
      setImageUploadLoading(false);
      return downloadURL;
    } catch (error) {
      console.error("Lỗi khi upload ảnh:", error);
      setImageUploadLoading(false);
      Alert.alert("Lỗi", `Không thể tải ảnh lên: ${error.message}`);
      return null;
    }
  };

  const handleAddDrink = async () => {
    if (!name.trim() || !price.trim() || !selectedCategoryId.trim() || !quatiy.trim() || !start.trim() || !status.trim()) {
      Alert.alert("Lỗi", "Vui lòng điền đầy đủ các trường bắt buộc (Tên, Giá, Danh mục, Số lượng, Điểm bắt đầu, Trạng thái).");
      return;
    }

    let finalImageUrl = '';
    if (imageUrlInput.trim()) {
      finalImageUrl = imageUrlInput.trim();
    } else if (image) {
      finalImageUrl = await uploadImage(image);
      if (!finalImageUrl) {
        return;
      }
    } else {
      Alert.alert("Lỗi", "Vui lòng chọn hoặc nhập URL ảnh cho đồ uống.");
      return;
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "douong"), { 
        drinkname: name,
        price: parseFloat(price),
        description: description,
        category: selectedCategoryName,
        categoryId: selectedCategoryId, 
        image: finalImageUrl,
        quatiy: parseInt(quatiy),
        start: parseFloat(start),
        status: status,
        active: active,
        createdAt: serverTimestamp(),
      });

      Alert.alert("Thành công", "Đã thêm đồ uống mới!", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
      setName("");
      setPrice("");
      setDescription("");
      setSelectedCategoryId(categories.length > 0 ? categories[0].id : "");
      setSelectedCategoryName(categories.length > 0 ? categories[0].name : "");
      setImage(null);
      setImageUrlInput(""); 
      setQuatiy("");
      setStart("");
      setStatus("");
      setActive(true);
    } catch (error) {
      console.error("Lỗi khi thêm đồ uống:", error);
      Alert.alert("Lỗi", `Không thể thêm đồ uống: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.imageContainer}>
        {/* Hiển thị ảnh xem trước từ ImagePicker hoặc URL nhập tay */}
        {(image || imageUrlInput) ? (
          <Image source={{ uri: image || imageUrlInput }} style={styles.drinkImage} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="image" size={50} color="#ccc" />
            <Text style={styles.placeholderText}>Chưa có ảnh</Text>
          </View>
        )}
        {imageUploadLoading && (
          <ActivityIndicator size="small" color="#8B0000" style={styles.uploadIndicator} />
        )}
      </View>

      <TouchableOpacity style={styles.uploadButton} onPress={pickImage} disabled={imageUploadLoading}>
        <Ionicons name="images-outline" size={20} color="white" />
        <Text style={styles.uploadButtonText}>Chọn ảnh từ thư viện</Text>
      </TouchableOpacity>

      <Text style={styles.orText}>HOẶC</Text>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Địa chỉ ảnh (URL):</Text>
        <TextInput
          style={styles.input}
          value={imageUrlInput}
          onChangeText={(text) => {
            setImageUrlInput(text);
            if (text.trim() !== '') {
              setImage(null); 
            }
          }}
          placeholder="Dán URL ảnh vào đây"
          keyboardType="url"
          autoCapitalize="none"
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
            selectedValue={selectedCategoryId}
            onValueChange={(itemValue, itemIndex) => {
              setSelectedCategoryId(itemValue);
              const selectedCat = categories.find(cat => cat.id === itemValue);
              setSelectedCategoryName(selectedCat ? selectedCat.name : '');
            }}
          >
            {categories.length > 0 ? (
              categories.map((cat) => (
                <Picker.Item key={cat.id} label={cat.name} value={cat.id} />
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
        onPress={handleAddDrink}
        disabled={isSubmitting || imageUploadLoading}
      >
        {(isSubmitting || imageUploadLoading) ? (
          <ActivityIndicator size="small" color="white" />
        ) : (
          <Text style={styles.submitButtonText}>Thêm đồ uống</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fff",
  },
  imageContainer: {
    alignItems: "center",
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
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  placeholderText: {
    color: "#999",
    marginTop: 8,
  },
  uploadButton: {
    flexDirection: 'row',
    backgroundColor: "#8B0000",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  uploadButtonText: {
    color: "#fff",
    fontWeight: "500",
    marginLeft: 8,
  },
  uploadIndicator: {
    marginTop: 10,
  },
  orText: {
    textAlign: 'center',
    marginVertical: 10,
    fontSize: 16,
    color: '#666',
    fontWeight: 'bold',
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
    color: "#333",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
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
    borderColor: "#ddd",
    borderRadius: 5,
    overflow: "hidden",
    backgroundColor: "#fff",
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  submitButton: {
    backgroundColor: "#8B0000",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  submitButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default AddDrinkScreen;