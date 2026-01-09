// src/screens/customer/OrderTrackingScreen.js

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions,
  Linking,
  Platform,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, Circle } from 'react-native-maps';
import { getFirestore, doc, onSnapshot } from "firebase/firestore";
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import app from "../../sever/firebase";

const { width, height } = Dimensions.get('window');
const db = getFirestore(app);

const OrderTrackingScreen = ({ route, navigation }) => {
  const { orderId } = route.params || {};
  const [loading, setLoading] = useState(true);
  const [orderData, setOrderData] = useState(null);
  const [driverLocation, setDriverLocation] = useState(null);
  const [estimatedTime, setEstimatedTime] = useState(null);
  const [distance, setDistance] = useState(null);
  const mapRef = useRef(null);

  // Vị trí mặc định của nhà hàng (DrinkShop)
  const restaurantLocation = {
    latitude: 21.028511,
    longitude: 105.804817,
  };

  useEffect(() => {
    if (!orderId) {
      Alert.alert("Lỗi", "Không tìm thấy thông tin đơn hàng.");
      navigation.goBack();
      return;
    }

    
    const unsubscribe = onSnapshot(
      doc(db, "orders", orderId), 
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          setOrderData(data);
          setLoading(false);
          
          // Cập nhật vị trí tài xế nếu có
          if (data.driverLocation) {
            setDriverLocation(data.driverLocation);
          }
          
          // Tự động căn chỉnh bản đồ để thấy cả 2 điểm
          if (mapRef.current && data.customerLocation) {
            const coordinates = [restaurantLocation];
            
            // Thêm vị trí khách hàng
            coordinates.push(data.customerLocation);
            
            // Thêm vị trí tài xế nếu có
            if (data.driverLocation) {
              coordinates.push(data.driverLocation);
            }
            
            mapRef.current.fitToCoordinates(coordinates, {
              edgePadding: { top: 100, right: 50, bottom: 300, left: 50 },
              animated: true,
            });
            
            
            if (doc.exists) {
          const data = doc.data();
          // Cập nhật lại vị trí từ database vào State
          if (data.customerLocation) {
            setRegion({
              ...region,
              latitude: data.customerLocation.latitude,
              longitude: data.customerLocation.longitude,
            });
          }
        }
      
            // Tính toán khoảng cách và thời gian ước tính
            if (data.customerLocation) {
              const targetLocation = data.status === 'delivering' && data.driverLocation 
                ? data.driverLocation 
                : restaurantLocation;
              
              calculateDistanceAndTime(targetLocation, data.customerLocation);
            }
          }
        } else {
          Alert.alert("Lỗi", "Không tìm thấy đơn hàng.");
          setLoading(false);
          navigation.goBack();
        }
      }, 
      (error) => {
        console.error("Firestore Error:", error);
        Alert.alert("Lỗi", "Không thể kết nối đến cơ sở dữ liệu.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [orderId]);

  // Hàm tính khoảng cách giữa 2 điểm (theo công thức Haversine)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Bán kính Trái Đất (km)
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return distance;
  };

  // Hàm tính khoảng cách và thời gian ước tính
  const calculateDistanceAndTime = (from, to) => {
    const dist = calculateDistance(
      from.latitude,
      from.longitude,
      to.latitude,
      to.longitude
    );
    
    setDistance(dist);
    
    // Giả sử tốc độ trung bình là 20 km/h trong thành phố
    const avgSpeed = 20;
    const time = (dist / avgSpeed) * 60; // Đổi sang phút
    
    setEstimatedTime(Math.ceil(time));
  };

  // Hàm gọi điện
  const handleCall = () => {
    if (orderData?.phone) {
      Linking.openURL(`tel:${orderData.phone}`);
    } else {
      Alert.alert("Thông báo", "Số điện thoại không khả dụng");
    }
  };

  // Hàm mở Google Maps để chỉ đường
  const openMapsForDirections = () => {
    if (!orderData?.customerLocation) {
      Alert.alert("Thông báo", "Không có thông tin vị trí giao hàng");
      return;
    }

    const { latitude, longitude } = orderData.customerLocation;
    const label = "Điểm giao hàng";
    
    const scheme = Platform.select({
      ios: 'maps:0,0?q=',
      android: 'geo:0,0?q='
    });
    const latLng = `${latitude},${longitude}`;
    const url = Platform.select({
      ios: `${scheme}${label}@${latLng}`,
      android: `${scheme}${latLng}(${label})`
    });

    Linking.openURL(url).catch(() => {
      // Fallback sang Google Maps web nếu app không có
      const webUrl = `https://www.google.com/maps/search/?api=1&query=${latLng}`;
      Linking.openURL(webUrl);
    });
  };

  // Hàm làm mới vị trí
  const refreshLocation = async () => {
    try {
      setLoading(true);
      
      // Giả lập làm mới - trong thực tế bạn sẽ gọi API hoặc cập nhật Firestore
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      Alert.alert("Thành công", "Đã làm mới vị trí");
      setLoading(false);
    } catch (error) {
      console.error("Error refreshing location:", error);
      Alert.alert("Lỗi", "Không thể làm mới vị trí");
      setLoading(false);
    }
  };

  // Hàm lấy màu sắc theo trạng thái
  const getStatusColor = (status) => {
    switch (status) {
      case 'preparing':
        return '#FF9800';
      case 'delivering':
        return '#2196F3';
      case 'completed':
        return '#4CAF50';
      case 'cancelled':
        return '#F44336';
      default:
        return '#9E9E9E';
    }
  };

  // Hàm lấy text theo trạng thái
  const getStatusText = (status) => {
    switch (status) {
      case 'preparing':
        return 'Đang chuẩn bị đồ uống';
      case 'delivering':
        return 'Tài xế đang giao hàng';
      case 'completed':
        return 'Đơn hàng đã hoàn tất';
      case 'cancelled':
        return 'Đơn hàng đã hủy';
      default:
        return 'Đang xử lý';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6F4E37" />
        <Text style={styles.loadingText}>Đang lấy thông tin đơn hàng...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Map Section */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={{
          ...restaurantLocation,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        }}
        showsUserLocation={true}
        showsMyLocationButton={false}
      >
        {/* Restaurant Marker */}
        <Marker 
          coordinate={restaurantLocation} 
          title="DrinkShop"
          description="Cửa hàng"
        >
          <View style={[styles.marker, { backgroundColor: '#FF6B6B' }]}>
            <Ionicons name="storefront" size={24} color="white" />
          </View>
        </Marker>

        {/* Customer Location Marker */}
        {orderData?.customerLocation && (
          <>
            <Marker 
              coordinate={orderData.customerLocation} 
              title="Vị trí giao hàng"
              description={orderData.address}
            >
              <View style={[styles.marker, { backgroundColor: '#4CAF50' }]}>
                <Ionicons name="home" size={24} color="white" />
              </View>
            </Marker>
            
            {/* Vòng tròn hiển thị độ chính xác */}
            {orderData.customerLocation.accuracy && (
              <Circle
                center={orderData.customerLocation}
                radius={orderData.customerLocation.accuracy}
                fillColor="rgba(76, 175, 80, 0.1)"
                strokeColor="rgba(76, 175, 80, 0.3)"
                strokeWidth={1}
              />
            )}
          </>
        )}

        {/* Driver Location Marker (nếu đang giao hàng) */}
        {driverLocation && orderData?.status === 'delivering' && (
          <Marker 
            coordinate={driverLocation} 
            title="Tài xế"
            description="Đang trên đường giao hàng"
          >
            <View style={[styles.marker, { backgroundColor: '#2196F3' }]}>
              <Ionicons name="bicycle" size={24} color="white" />
            </View>
          </Marker>
        )}

        {/* Đường đi từ nhà hàng đến khách hàng */}
        {orderData?.customerLocation && (
          <Polyline
            coordinates={
              driverLocation && orderData?.status === 'delivering'
                ? [driverLocation, orderData.customerLocation]
                : [restaurantLocation, orderData.customerLocation]
            }
            strokeColor={getStatusColor(orderData?.status)}
            strokeWidth={4}
            lineDashPattern={[10, 5]}
          />
        )}
      </MapView>

      {/* Floating Refresh Button */}
      <TouchableOpacity 
        style={styles.refreshButton}
        onPress={refreshLocation}
      >
        <Ionicons name="refresh" size={24} color="#6F4E37" />
      </TouchableOpacity>

      {/* Floating Directions Button */}
      {orderData?.customerLocation && (
        <TouchableOpacity 
          style={styles.directionsButton}
          onPress={openMapsForDirections}
        >
          <Ionicons name="navigate" size={24} color="white" />
        </TouchableOpacity>
      )}

      {/* Bottom Info Card */}
      <View style={styles.bottomCard}>
        {/* Status Section */}
        <View style={styles.statusSection}>
          <View style={[
            styles.statusBadge, 
            { backgroundColor: getStatusColor(orderData?.status) }
          ]}>
            <Ionicons 
              name={
                orderData?.status === 'preparing' ? 'time-outline' :
                orderData?.status === 'delivering' ? 'bicycle-outline' :
                orderData?.status === 'completed' ? 'checkmark-circle-outline' :
                'close-circle-outline'
              } 
              size={20} 
              color="white" 
            />
            <Text style={styles.statusBadgeText}>
              {getStatusText(orderData?.status)}
            </Text>
          </View>
          
          <Text style={styles.orderIdText}>
            Mã đơn: #{orderId.substring(0, 8).toUpperCase()}
          </Text>
        </View>

        {/* Distance and Time Info */}
        {distance !== null && estimatedTime !== null && orderData?.status !== 'completed' && (
          <View style={styles.infoSection}>
            <View style={styles.infoItem}>
              <Ionicons name="location-outline" size={20} color="#6F4E37" />
              <Text style={styles.infoText}>
                {distance < 1 
                  ? `${(distance * 1000).toFixed(0)}m` 
                  : `${distance.toFixed(1)}km`}
              </Text>
            </View>
            
            <View style={styles.infoDivider} />
            
            <View style={styles.infoItem}>
              <Ionicons name="time-outline" size={20} color="#6F4E37" />
              <Text style={styles.infoText}>
                ~{estimatedTime} phút
              </Text>
            </View>
          </View>
        )}

        {/* Address Info */}
        <View style={styles.infoRow}>
          <Ionicons name="location" size={20} color="#7F8C8D" />
          <View style={styles.addressContainer}>
            <Text style={styles.addressLabel}>Địa chỉ giao hàng:</Text>
            <Text style={styles.addressText} numberOfLines={2}>
              {orderData?.address || "Chưa có địa chỉ"}
            </Text>
          </View>
        </View>

        {/* Location Status Warning */}
        {!orderData?.customerLocation && (
          <View style={styles.warningBox}>
            <Ionicons name="warning-outline" size={20} color="#FF9800" />
            <Text style={styles.warningText}>
              Chưa có thông tin GPS. Tài xế sẽ liên hệ để xác nhận địa chỉ.
            </Text>
          </View>
        )}

        {/* Order Items Summary */}
        {orderData?.items && orderData.items.length > 0 && (
          <View style={styles.itemsSection}>
            <Text style={styles.itemsSectionTitle}>Đồ uống đã đặt:</Text>
            {orderData.items.map((item, index) => (
              <View key={index} style={styles.itemRow}>
                <Text style={styles.itemName}>
                  {item.quantity}x {item.name}
                </Text>
                <Text style={styles.itemPrice}>
                  {(item.price * item.quantity).toLocaleString()}đ
                </Text>
              </View>
            ))}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Tổng cộng:</Text>
              <Text style={styles.totalValue}>
                {orderData.total?.toLocaleString()}đ
              </Text>
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.callButton} onPress={handleCall}>
            <Ionicons name="call" size={20} color="white" />
            <Text style={styles.buttonText}>Gọi hỗ trợ</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.msgButton} 
            onPress={() => navigation.navigate('Chatbot')}
          >
            <Ionicons name="chatbubble-ellipses-outline" size={20} color="#6F4E37" />
            <Text style={[styles.buttonText, { color: '#6F4E37' }]}>Nhắn tin</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#7F8C8D',
  },
  map: {
    width: width,
    height: height * 0.45,
  },
  marker: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  refreshButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  directionsButton: {
    position: 'absolute',
    top: 110,
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#6F4E37',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  bottomCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 24,
    paddingHorizontal: 20,
    marginTop: -30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  statusSection: {
    marginBottom: 20,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginBottom: 10,
  },
  statusBadgeText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  orderIdText: {
    fontSize: 14,
    color: '#7F8C8D',
    fontWeight: '500',
  },
  infoSection: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  infoText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginLeft: 8,
  },
  infoDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#E0E0E0',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  addressContainer: {
    flex: 1,
    marginLeft: 12,
  },
  addressLabel: {
    fontSize: 12,
    color: '#7F8C8D',
    marginBottom: 4,
    fontWeight: '500',
  },
  addressText: {
    fontSize: 14,
    color: '#2C3E50',
    lineHeight: 20,
    fontWeight: '500',
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  warningText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 13,
    color: '#F57C00',
    lineHeight: 18,
  },
  itemsSection: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  itemsSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 12,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  itemName: {
    fontSize: 14,
    color: '#2C3E50',
    flex: 1,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6F4E37',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    marginTop: 8,
    borderTopWidth: 2,
    borderTopColor: '#6F4E37',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6F4E37',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
    marginTop: 8,
  },
  callButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#6F4E37',
    borderRadius: 12,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6F4E37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  msgButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#6F4E37',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default OrderTrackingScreen;