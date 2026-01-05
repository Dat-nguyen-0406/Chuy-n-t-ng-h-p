// src/screens/admin/DrinkDetailsScreen.js

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getFirestore, doc, getDoc } from 'firebase/firestore'; 
import app from '../../sever/firebase'; 

const db = getFirestore(app); 

const DrinkDetailsScreen = ({ route, navigation }) => {
  const { drinkId } = route.params || {}; 
  const [isLoading, setIsLoading] = useState(true);
  const [drink, setDrink] = useState(null);

  useEffect(() => {
    const fetchDrinkDetails = async () => {
      if (!drinkId) {
        console.warn("Drink ID không được cung cấp khi điều hướng đến chi tiết đồ uống.");
        setIsLoading(false);
        return;
      }

      try {
 
        const docRef = doc(db, 'douong', drinkId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setDrink({
            id: docSnap.id, 
            name: data.drinkname,
            price: typeof data.price === 'number' ? data.price : (parseFloat(data.price) || 0), 
            description: data.description,
            category: data.category,
            imageUrl: data.image,
            quatiy: typeof data.quatiy === 'number' ? data.quatiy : (parseInt(data.quatiy) || 0),
            start: typeof data.start === 'number' ? data.start : (parseFloat(data.start) || 0),
            status: data.status,
            active: data.active,
          });
        } else {
          console.log("DrinkDetailsScreen: Không tìm thấy tài liệu với ID:", drinkId);
          Alert.alert("Lỗi", "Không tìm thấy thông tin đồ uống.");
          navigation.goBack(); 
        }
      } catch (error) {
        console.error("DrinkDetailsScreen: Lỗi khi fetch chi tiết đồ uống:", error);
        Alert.alert("Lỗi", `Không thể tải chi tiết đồ uống: ${error.message}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDrinkDetails();
  }, [drinkId, navigation]);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#8B0000" />
        <Text style={{ marginTop: 10 }}>Đang tải chi tiết đồ uống...</Text>
      </View>
    );
  }

  if (!drink) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>Không có dữ liệu đồ uống.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Image source={{ uri: drink.imageUrl }} style={styles.mainImage} />
        <View style={styles.headerContent}>
          <Text style={styles.drinkName}>{drink.name}</Text>
          <Text style={styles.price}>{drink.price.toLocaleString("vi-VN")} đ</Text>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => navigation.navigate("EditDrink", { drinkId: drink.id })} 
          >
            <Ionicons name="create-outline" size={20} color="#fff" />
            <Text style={styles.editButtonText}>Sửa đồ uống</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Mô tả</Text>
        <Text style={styles.description}>{drink.description || "Không có mô tả."}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Thông tin chi tiết</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Danh mục:</Text>
          <Text style={styles.infoValue}>{drink.category}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Số lượng:</Text>
          <Text style={styles.infoValue}>{drink.quatiy}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Điểm bắt đầu:</Text>
          <Text style={styles.infoValue}>{drink.start}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Trạng thái:</Text>
          <Text style={styles.infoValue}>{drink.status}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Có sẵn:</Text>
          <Text style={[styles.infoValue, drink.active ? styles.available : styles.notAvailable]}>
            {drink.active ? "Có" : "Không"}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#fff',
    paddingBottom: 16,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  mainImage: {
    width: '100%',
    height: 250,
    resizeMode: 'cover',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  headerContent: {
    padding: 16,
  },
  drinkName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  price: {
    fontSize: 18,
    color: '#8B0000',
    fontWeight: '600',
    marginTop: 4,
  },
  editButton: {
    flexDirection: 'row',
    backgroundColor: '#8B0000',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 15,
    alignSelf: 'flex-start', 
  },
  editButtonText: {
    color: '#fff',
    fontWeight: '500',
    marginLeft: 4,
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 10,
    marginTop: 10,
    padding: 16,
    borderRadius: 10,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#555',
    lineHeight: 24,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 16,
    color: '#666',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  available: {
    color: '#4CAF50',
  },
  notAvailable: {
    color: '#F44336',
  },
  emptyText: {
    fontSize: 18,
    color: '#757575',
    textAlign: 'center',
  },
});

export default DrinkDetailsScreen;