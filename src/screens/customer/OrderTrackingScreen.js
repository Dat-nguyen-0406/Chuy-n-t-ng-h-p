// src/screens/customer/OrderTrackingScreen.js

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

const OrderTrackingScreen = ({ navigation }) => {
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [orderStatus, setOrderStatus] = useState('preparing'); // preparing, delivering, delivered
  const mapRef = useRef(null);

  // Tọa độ mẫu cho demo
  const restaurantLocation = {
    latitude: 21.028511,
    longitude: 105.804817,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  };

  const [deliveryLocation, setDeliveryLocation] = useState(null);
  const [driverLocation, setDriverLocation] = useState({
    latitude: 21.025,
    longitude: 105.810,
  });

  useEffect(() => {
    getCurrentLocation();
    // Simulate driver movement
    const interval = setInterval(() => {
      simulateDriverMovement();
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const getCurrentLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Quyền truy cập vị trí',
          'Ứng dụng cần quyền truy cập vị trí để theo dõi đơn hàng'
        );
        setLoading(false);
        return;
      }

      let currentLocation = await Location.getCurrentPositionAsync({});
      const userLocation = {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };

      setLocation(userLocation);
      setDeliveryLocation(userLocation);
      setLoading(false);

      // Fit map to show all markers
      if (mapRef.current) {
        setTimeout(() => {
          mapRef.current.fitToCoordinates(
            [
              restaurantLocation,
              userLocation,
              driverLocation,
            ],
            {
              edgePadding: { top: 50, right: 50, bottom: 250, left: 50 },
              animated: true,
            }
          );
        }, 500);
      }
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Lỗi', 'Không thể lấy vị trí hiện tại');
      setLoading(false);
    }
  };

  const simulateDriverMovement = () => {
    setDriverLocation(prev => ({
      latitude: prev.latitude + (Math.random() - 0.5) * 0.002,
      longitude: prev.longitude + (Math.random() - 0.5) * 0.002,
    }));
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (R * c).toFixed(1);
  };

  const getStatusInfo = () => {
    switch (orderStatus) {
      case 'preparing':
        return {
          title: 'Đang chuẩn bị',
          icon: 'restaurant-outline',
          color: '#FFA500',
          message: 'Nhà hàng đang chuẩn bị đơn hàng của bạn',
        };
      case 'delivering':
        return {
          title: 'Đang giao hàng',
          icon: 'bicycle-outline',
          color: '#4ECDC4',
          message: 'Tài xế đang trên đường giao hàng',
        };
      case 'delivered':
        return {
          title: 'Đã giao hàng',
          icon: 'checkmark-circle-outline',
          color: '#2ECC71',
          message: 'Đơn hàng đã được giao thành công',
        };
      default:
        return {
          title: 'Đang xử lý',
          icon: 'time-outline',
          color: '#95A5A6',
          message: 'Đơn hàng đang được xử lý',
        };
    }
  };

  const statusInfo = getStatusInfo();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4b74ba" />
        <Text style={styles.loadingText}>Đang tải bản đồ...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      
      
      {/* Map */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={location || restaurantLocation}
        showsUserLocation={true}
        showsMyLocationButton={true}
      >
        {/* Restaurant Marker */}
        <Marker
          coordinate={restaurantLocation}
          title="Nhà hàng"
          description="Vị trí nhà hàng"
        >
          <View style={styles.markerContainer}>
            <View style={[styles.marker, { backgroundColor: '#FF6B6B' }]}>
              <Ionicons name="restaurant" size={24} color="#FFFFFF" />
            </View>
          </View>
        </Marker>

        {/* Driver Marker */}
        {orderStatus === 'delivering' && (
          <Marker
            coordinate={driverLocation}
            title="Tài xế"
            description="Vị trí tài xế"
          >
            <View style={styles.markerContainer}>
              <View style={[styles.marker, { backgroundColor: '#4ECDC4' }]}>
                <Ionicons name="bicycle" size={24} color="#FFFFFF" />
              </View>
            </View>
          </Marker>
        )}

        {/* Delivery Location Marker */}
        {deliveryLocation && (
          <Marker
            coordinate={deliveryLocation}
            title="Điểm giao hàng"
            description="Vị trí của bạn"
          >
            <View style={styles.markerContainer}>
              <View style={[styles.marker, { backgroundColor: '#4b74ba' }]}>
                <Ionicons name="home" size={24} color="#FFFFFF" />
              </View>
            </View>
          </Marker>
        )}

        {/* Route Line */}
        {deliveryLocation && orderStatus === 'delivering' && (
          <>
            <Polyline
              coordinates={[restaurantLocation, driverLocation]}
              strokeColor="#4ECDC4"
              strokeWidth={3}
              lineDashPattern={[0]}
            />
            <Polyline
              coordinates={[driverLocation, deliveryLocation]}
              strokeColor="#95A5A6"
              strokeWidth={3}
              lineDashPattern={[10, 5]}
            />
          </>
        )}
      </MapView>

      {/* Bottom Info Card */}
      <View style={styles.bottomCard}>
        {/* Status Header */}
        <View style={styles.statusHeader}>
          <View style={[styles.statusIcon, { backgroundColor: statusInfo.color + '20' }]}>
            <Ionicons name={statusInfo.icon} size={28} color={statusInfo.color} />
          </View>
          <View style={styles.statusTextContainer}>
            <Text style={styles.statusTitle}>{statusInfo.title}</Text>
            <Text style={styles.statusMessage}>{statusInfo.message}</Text>
          </View>
        </View>

        {/* Order Details */}
        <View style={styles.orderDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="receipt-outline" size={20} color="#7F8C8D" />
            <Text style={styles.detailLabel}>Mã đơn hàng:</Text>
            <Text style={styles.detailValue}>#ORD12345</Text>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="time-outline" size={20} color="#7F8C8D" />
            <Text style={styles.detailLabel}>Thời gian dự kiến:</Text>
            <Text style={styles.detailValue}>25-30 phút</Text>
          </View>

          {deliveryLocation && (
            <View style={styles.detailRow}>
              <Ionicons name="location-outline" size={20} color="#7F8C8D" />
              <Text style={styles.detailLabel}>Khoảng cách:</Text>
              <Text style={styles.detailValue}>
                {calculateDistance(
                  driverLocation.latitude,
                  driverLocation.longitude,
                  deliveryLocation.latitude,
                  deliveryLocation.longitude
                )}{' '}
                km
              </Text>
            </View>
          )}
        </View>

        {/* Timeline */}
        <View style={styles.timeline}>
          <View style={styles.timelineItem}>
            <View style={[styles.timelineDot, orderStatus !== 'preparing' && styles.timelineDotCompleted]}>
              {orderStatus !== 'preparing' && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
            </View>
            <View style={styles.timelineContent}>
              <Text style={styles.timelineTitle}>Đã xác nhận</Text>
              <Text style={styles.timelineTime}>14:30</Text>
            </View>
          </View>

          <View style={[styles.timelineLine, orderStatus !== 'preparing' && styles.timelineLineCompleted]} />

          <View style={styles.timelineItem}>
            <View style={[
              styles.timelineDot,
              (orderStatus === 'delivering' || orderStatus === 'delivered') && styles.timelineDotCompleted
            ]}>
              {(orderStatus === 'delivering' || orderStatus === 'delivered') && (
                <Ionicons name="checkmark" size={14} color="#FFFFFF" />
              )}
            </View>
            <View style={styles.timelineContent}>
              <Text style={styles.timelineTitle}>Đang giao</Text>
              <Text style={styles.timelineTime}>14:45</Text>
            </View>
          </View>

          <View style={[
            styles.timelineLine,
            orderStatus === 'delivered' && styles.timelineLineCompleted
          ]} />

          <View style={styles.timelineItem}>
            <View style={[styles.timelineDot, orderStatus === 'delivered' && styles.timelineDotCompleted]}>
              {orderStatus === 'delivered' && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
            </View>
            <View style={styles.timelineContent}>
              <Text style={styles.timelineTitle}>Đã giao</Text>
              <Text style={styles.timelineTime}>15:00</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.callButton}>
            <Ionicons name="call" size={20} color="#FFFFFF" />
            <Text style={styles.callButtonText}>Gọi tài xế</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.messageButton}
            onPress={() => navigation.navigate('Chatbot')}
          >
            <Ionicons name="chatbubble-outline" size={20} color="#4b74ba" />
            <Text style={styles.messageButtonText}>Nhắn tin</Text>
          </TouchableOpacity>
        </View>

        {/* Demo Controls */}
        <View style={styles.demoControls}>
          <Text style={styles.demoLabel}>Demo: Thay đổi trạng thái</Text>
          <View style={styles.demoButtons}>
            <TouchableOpacity
              style={[styles.demoButton, { backgroundColor: '#FFA500' }]}
              onPress={() => setOrderStatus('preparing')}
            >
              <Text style={styles.demoButtonText}>Chuẩn bị</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.demoButton, { backgroundColor: '#4ECDC4' }]}
              onPress={() => setOrderStatus('delivering')}
            >
              <Text style={styles.demoButtonText}>Giao hàng</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.demoButton, { backgroundColor: '#2ECC71' }]}
              onPress={() => setOrderStatus('delivered')}
            >
              <Text style={styles.demoButtonText}>Đã giao</Text>
            </TouchableOpacity>
          </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2C3E50',
  },
  map: {
    width: width,
    height: height * 0.4,
  },
  markerContainer: {
    alignItems: 'center',
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
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  statusIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  statusTextContainer: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2C3E50',
    marginBottom: 4,
  },
  statusMessage: {
    fontSize: 14,
    color: '#7F8C8D',
  },
  orderDetails: {
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: '#7F8C8D',
    marginLeft: 8,
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C3E50',
  },
  timeline: {
    marginBottom: 20,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timelineDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E8E8E8',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  timelineDotCompleted: {
    backgroundColor: '#4b74ba',
  },
  timelineContent: {
    flex: 1,
    marginLeft: 12,
    paddingVertical: 4,
  },
  timelineTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2C3E50',
  },
  timelineTime: {
    fontSize: 13,
    color: '#95A5A6',
    marginTop: 2,
  },
  timelineLine: {
    width: 2,
    height: 30,
    backgroundColor: '#E8E8E8',
    marginLeft: 13,
  },
  timelineLineCompleted: {
    backgroundColor: '#4b74ba',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  callButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#4b74ba',
    borderRadius: 16,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4b74ba',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  callButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  messageButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4b74ba',
  },
  messageButtonText: {
    color: '#4b74ba',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  demoControls: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  demoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7F8C8D',
    marginBottom: 12,
    textAlign: 'center',
  },
  demoButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  demoButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  demoButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
});

export default OrderTrackingScreen;