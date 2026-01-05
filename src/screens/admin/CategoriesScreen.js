import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import { getFirestore, collection, getDocs, doc, deleteDoc } from 'firebase/firestore';
import app from '../../sever/firebase';

const db = getFirestore(app);
const CategoriesScreen = ({ navigation }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) {
      console.log("CategoriesScreen: Màn hình đang được focus, gọi fetchCategories.");
      fetchCategories();
    }
  }, [isFocused]);

  const fetchCategories = async () => {
    setLoading(true);
    console.log("CategoriesScreen: Bắt đầu fetchCategories.");
    try {
      console.log("CategoriesScreen: Chuẩn bị lấy dữ liệu từ collection 'danhmuc'...");
      const querySnapshot = await getDocs(collection(db, "danhmuc")); 
      console.log(`CategoriesScreen: Đã nhận querySnapshot. Số lượng tài liệu: ${querySnapshot.size}`);
      
      const fetchedCategories = [];
      if (querySnapshot.empty) {
        console.log("CategoriesScreen: Collection 'danhmuc' rỗng hoặc không tìm thấy tài liệu nào.");
      } else {
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          console.log(`CategoriesScreen: Đang xử lý tài liệu ID: ${doc.id}, Dữ liệu:`, data);
          fetchedCategories.push({
            id: doc.id, 
            name: data.categoryName, 
            active: data.active,
          });
        });
      }
      console.log("CategoriesScreen: Đã fetch xong, tổng số danh mục:", fetchedCategories.length);
      setCategories(fetchedCategories);
    } 
    catch (error) 
    {
      console.error("CategoriesScreen: Lỗi khi fetch danh mục:", error);
      Alert.alert('Lỗi', `Không thể tải danh mục từ Firestore: ${error.message}`);
    } 
    finally 
    {
      setLoading(false);
      console.log("CategoriesScreen: Kết thúc fetchCategories.");
    }
  };

  const handleDeleteCategory = (id) => {
    Alert.alert(
      'Xác nhận',
      'Bạn có chắc chắn muốn xóa danh mục này?',
      [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Xóa', style: 'destructive', onPress: async () =>
           {
            setLoading(true);
            console.log(`CategoriesScreen: Bắt đầu xóa danh mục với ID: ${id}`);
            try {
              await deleteDoc(doc(db, "danhmuc", id)); 
              console.log(`CategoriesScreen: Đã xóa thành công danh mục ID: ${id}`);
              Alert.alert('Thành công', 'Danh mục đã được xóa.');
              fetchCategories(); 
            } catch (error) {
              console.error(`CategoriesScreen: Lỗi khi xóa danh mục ID ${id}:`, error);
              Alert.alert('Lỗi', `Không thể xóa danh mục: ${error.message}`);
            } finally {
              setLoading(false);
              console.log("CategoriesScreen: Kết thúc quá trình xóa.");
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const renderCategoryItem = ({ item }) => (
    <TouchableOpacity
      style={styles.categoryItem}
    >
      <Text style={styles.categoryName}>{item.name}</Text>
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={() => navigation.navigate("EditCategory", { category: item })}
        >
          <Ionicons name="pencil" size={20} color="white" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDeleteCategory(item.id)}
        >
          <Ionicons name="trash" size={20} color="white" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#8B0000" />
        <Text style={{ marginTop: 10 }}>Đang tải danh mục...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate("AddCategory")} 
      >
        <Ionicons name="add" size={24} color="white" />
        <Text style={styles.addButtonText}>Thêm danh mục mới</Text>
      </TouchableOpacity>

      {categories.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>Không tìm thấy danh mục nào.</Text>
          <Text style={styles.emptyText}>Vui lòng kiểm tra lại dữ liệu trên Firebase Firestore (collection 'danhmuc').</Text>
        </View>
      ) : (
        <FlatList
          data={categories}
          keyExtractor={(item) => item.id}
          renderItem={renderCategoryItem}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8B0000',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  addButtonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  list: {
    flexGrow: 1,
  },
  categoryItem: {
    backgroundColor: 'white',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  categoryName: {
    fontSize: 18,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 8,
    borderRadius: 6,
    marginLeft: 10,
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: '#4CAF50',
  },
  deleteButton: {
    backgroundColor: '#F44336',
  },
  emptyText: {
    fontSize: 18,
    color: "#757575",
    textAlign: "center",
    marginBottom: 5,
  },
});

export default CategoriesScreen;