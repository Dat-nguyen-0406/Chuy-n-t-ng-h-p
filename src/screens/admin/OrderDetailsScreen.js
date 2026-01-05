// src/screens/admin/OrderDetailsScreen.js

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getFirestore, doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import app from '../../sever/firebase';
const OrderDetailsScreen = ({ route, navigation }) => {
  const { orderId } = route.params || { orderId: null };
  const [isLoading, setIsLoading] = useState(true);
  const [order, setOrder] = useState(null);

  const db = getFirestore(app);

  
  const statusConfig = {
    'Đang xử lý': { color: '#FF9800', icon: 'time-outline', label: 'Đang xử lý' },
    'Đang giao': { color: '#2196F3', icon: 'bicycle-outline', label: 'Đang giao' },
    'Đã hoàn thành': { color: '#4CAF50', icon: 'checkmark-done-outline', label: 'Đã hoàn thành' },
    'Đã hủy': { color: '#F44336', icon: 'close-outline', label: 'Đã hủy' },
    'Chờ xác nhận': { color: '#FF9800', icon: 'hourglass-outline', label: 'Chờ xác nhận' }, 
    'Không xác định': { color: '#757575', icon: 'help-circle-outline', label: 'Không xác định' },
  };

  useEffect(() => {
    if (!orderId) {
      Alert.alert('Lỗi', 'Không có mã đơn hàng để hiển thị.');
      setIsLoading(false);
      return;
    }

    const fetchOrderDetails = async () => {
      try {
        const orderRef = doc(db, 'orders', orderId);
        const docSnap = await getDoc(orderRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          const createdAt = data.createdAt && typeof data.createdAt.toDate === 'function'
            ? data.createdAt.toDate().getTime()
            : (data.createdAt || new Date().getTime());

          const formattedOrder = {
            id: docSnap.id,
            ...data,
            orderNumber: `HD${docSnap.id.slice(-6).toUpperCase()}`, 
            orderDate: new Date(createdAt).toLocaleString('vi-VN', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            }),
            customer: {
              name: data.userName || 'N/A',
              phone: data.phone || 'N/A',
              address: data.deliveryAddress || 'N/A',
            },
            items: data.items || [],
            payment: {
              method: data.paymentMethod || 'N/A',
              status: data.paymentStatus || 'Đã thanh toán', 
            },
            subtotal: data.subtotal || 0,
            deliveryFee: data.deliveryFee || 0, 
            discount: data.discount || 0,    
            total: data.total || 0,
            notes: data.notes || '',
            staff: {
              created: data.staffCreated || 'Hệ thống',
              lastUpdated: data.staffLastUpdated || 'Chưa cập nhật',
            },
            logs: data.logs || [],
            status: data.status || 'Không xác định',
          };
          setOrder(formattedOrder);
        } else {
          Alert.alert('Không tìm thấy', 'Không tìm thấy đơn hàng này.');
          navigation.goBack();
        }
      } catch (error) {
        console.error('Lỗi khi tải chi tiết đơn hàng:', error);
        Alert.alert('Lỗi', 'Không thể tải thông tin đơn hàng!');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrderDetails();
  }, [orderId, db, navigation]);

  const handleUpdateStatus = async (newStatus) => {
    if (!order || !orderId) return;

    Alert.alert(
      'Cập nhật trạng thái',
      `Bạn có chắc muốn chuyển đơn hàng sang trạng thái "${statusConfig[newStatus]?.label || newStatus}"?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xác nhận',
          onPress: async () => {
            try {
              const orderRef = doc(db, 'orders', orderId);
              const newLogEntry = {
                time: new Date().toLocaleString('vi-VN'),
                action: `Chuyển sang ${statusConfig[newStatus]?.label || newStatus}`,
                user: 'Admin (Bạn)', 
              };

              await updateDoc(orderRef, {
                status: newStatus,
                logs: [newLogEntry, ...order.logs], 
                staffLastUpdated: 'Admin (Bạn)', 
                updatedAt: serverTimestamp(),
              });

          
              setOrder(prev => ({
                ...prev,
                status: newStatus,
                logs: [newLogEntry, ...prev.logs],
                staffLastUpdated: 'Admin (Bạn)',
              }));

              Alert.alert('Thành công', 'Cập nhật trạng thái đơn hàng thành công!');
            } catch (error) {
              console.error('Lỗi khi cập nhật trạng thái:', error);
              Alert.alert('Lỗi', 'Không thể cập nhật trạng thái đơn hàng!');
            }
          }
        }
      ]
    );
  };

  const handlePrintOrder = () => {
    Alert.alert('In đơn hàng', 'Chức năng in đơn hàng đang được phát triển...');
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6F4E37" />
        <Text style={styles.loadingText}>Đang tải thông tin đơn hàng...</Text>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-outline" size={60} color="#D32F2F" />
        <Text style={styles.errorText}>Không tìm thấy thông tin đơn hàng hoặc đã xảy ra lỗi!</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const getNextStatus = () => {
    const statusFlow = ['Đang xử lý', 'Đang giao', 'Đã hoàn thành'];
    const currentIndex = statusFlow.indexOf(order.status);

    if (order.status === 'Đã hủy' || order.status === 'Đã hoàn thành') {
      return null; 
    }

    if (currentIndex < statusFlow.length - 1) {
      return statusFlow[currentIndex + 1];
    }
    return null;
  };

  const nextStatus = getNextStatus();

  return (
    <ScrollView style={styles.container}>
      {/* Header with order number and status */}
      <View style={styles.header}>
        <View>
          <Text style={styles.orderNumber}>Đơn hàng #{order.orderNumber}</Text>
          <Text style={styles.orderDate}>Ngày đặt: {order.orderDate}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusConfig[order.status]?.color || '#757575' }]}>
          <Ionicons name={statusConfig[order.status]?.icon || 'help-circle-outline'} size={18} color="#fff" />
          <Text style={styles.statusText}>{statusConfig[order.status]?.label || order.status}</Text>
        </View>
      </View>

      {/* Action buttons */}
      <View style={styles.actionButtons}>
        {nextStatus && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: statusConfig[nextStatus]?.color || '#607D8B' }]}
            onPress={() => handleUpdateStatus(nextStatus)}
          >
            <Ionicons name="arrow-forward" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>
              Chuyển sang {statusConfig[nextStatus]?.label || nextStatus}
            </Text>
          </TouchableOpacity>
        )}

        {order.status !== 'Đã hủy' && order.status !== 'Đã hoàn thành' && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#F44336' }]}
            onPress={() => handleUpdateStatus('Đã hủy')}
          >
            <Ionicons name="close" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>Hủy đơn hàng</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#607D8B' }]}
          onPress={handlePrintOrder}
        >
          <Ionicons name="print" size={20} color="#fff" />
          <Text style={styles.actionButtonText}>In đơn hàng</Text>
        </TouchableOpacity>
      </View>

      {/* Customer Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Thông tin khách hàng</Text>
        <View style={styles.customerInfo}>
          <View style={styles.infoRow}>
            <Ionicons name="person" size={18} color="#6F4E37" />
            <Text style={styles.infoLabel}>Tên:</Text>
            <Text style={styles.infoValue}>{order.customer.name}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="call" size={18} color="#6F4E37" />
            <Text style={styles.infoLabel}>SĐT:</Text>
            <Text style={styles.infoValue}>{order.customer.phone}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="location" size={18} color="#6F4E37" />
            <Text style={styles.infoLabel}>Địa chỉ:</Text>
            <Text style={styles.infoValue}>{order.customer.address}</Text>
          </View>
        </View>
      </View>

      {/* Order Items - Using map instead of FlatList to avoid nesting warning */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sản phẩm đặt hàng</Text>
        {order.items.length > 0 ? (
          order.items.map((item, index) => (
            <View key={item.id || index} style={styles.orderItem}>
              <View style={styles.itemHeader}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemQuantity}>x{item.quantity}</Text>
              </View>
              {item.options && item.options.length > 0 && (
                <View style={styles.itemOptions}>
                  {item.options.map((option, optIndex) => (
                    <View key={optIndex} style={styles.optionTag}>
                      <Text style={styles.optionText}>{option}</Text>
                    </View>
                  ))}
                </View>
              )}
              <View style={styles.itemPriceRow}>
                <Text style={styles.itemPrice}>
                  {(item.price || 0).toLocaleString('vi-VN')}đ
                </Text>
                <Text style={styles.itemSubtotal}>
                  {(item.price * item.quantity || 0).toLocaleString('vi-VN')}đ
                </Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.emptyItemsText}>Không có sản phẩm nào trong đơn hàng.</Text>
        )}
      </View>

      {/* Order Summary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tổng kết đơn hàng</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Tạm tính:</Text>
          <Text style={styles.summaryValue}>{(order.subtotal || 0).toLocaleString('vi-VN')}đ</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Phí giao hàng:</Text>
          <Text style={styles.summaryValue}>{(order.deliveryFee || 0).toLocaleString('vi-VN')}đ</Text>
        </View>
        {order.discount > 0 && (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Giảm giá:</Text>
            <Text style={styles.summaryValue}>-{(order.discount || 0).toLocaleString('vi-VN')}đ</Text>
          </View>
        )}
        <View style={[styles.summaryRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>Tổng cộng:</Text>
          <Text style={styles.totalValue}>{(order.total || 0).toLocaleString('vi-VN')}đ</Text>
        </View>
      </View>

      {/* Payment Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Thông tin thanh toán</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Phương thức:</Text>
          <Text style={styles.infoValue}>{order.payment.method}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Trạng thái:</Text>
          <Text style={styles.infoValue}>{order.payment.status}</Text>
        </View>
      </View>

      {/* Additional Information */}
      {order.notes ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ghi chú đơn hàng</Text>
          <View style={styles.notesContainer}>
            <Ionicons name="chatbubble-ellipses" size={20} color="#6F4E37" />
            <Text style={styles.notesText}>{order.notes}</Text>
          </View>
        </View>
      ) : (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ghi chú đơn hàng</Text>
          <Text style={styles.notesText}>Không có ghi chú nào cho đơn hàng này.</Text>
        </View>
      )}


      {/* Order Timeline */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Lịch sử đơn hàng</Text>
        {order.logs.length > 0 ? (
          order.logs.map((log, index) => (
            <View key={index} style={styles.logItem}>
              <View style={styles.logDot} />
              <View style={styles.logContent}>
                <Text style={styles.logTime}>{log.time}</Text>
                <Text style={styles.logAction}>{log.action}</Text>
                <Text style={styles.logUser}>Bởi: {log.user}</Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.emptyItemsText}>Chưa có lịch sử cập nhật nào.</Text>
        )}
      </View>

      {/* Staff Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Thông tin nhân viên</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Người tạo:</Text>
          <Text style={styles.infoValue}>{order.staff.created}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Người cập nhật cuối:</Text>
          <Text style={styles.infoValue}>{order.staff.lastUpdated}</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f9f9f9',
  },
  errorText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#6F4E37',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  orderNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  orderDate: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    minWidth: 120, 
    justifyContent: 'center',
  },
  statusText: {
    color: '#fff',
    fontWeight: '500',
    marginLeft: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginBottom: 10,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0.5 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,  
    marginHorizontal: 5,
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '500',
    marginLeft: 8,
    fontSize: 14,
  },
  section: {
    backgroundColor: '#fff',
    padding: 16,
    marginTop: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 3,
    marginHorizontal: 10,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 8,
  },
  customerInfo: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 5,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    marginRight: 8,
    width: 80,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    flex: 1,
  },
  orderItem: {
    backgroundColor: '#fcfcfc',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#eee',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    flexShrink: 1,
  },
  itemQuantity: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6F4E37', 
    marginLeft: 10,
  },
  itemOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 6,
  },
  optionTag: {
    backgroundColor: '#eef',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 6,
    borderColor: '#ddd',
    borderWidth: 1,
  },
  optionText: {
    fontSize: 12,
    color: '#555',
  },
  itemPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  itemPrice: {
    fontSize: 14,
    color: '#666',
  },
  itemSubtotal: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  emptyItemsText: {
    textAlign: 'center',
    color: '#999',
    fontStyle: 'italic',
    paddingVertical: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 12,
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6F4E37',
  },
  notesContainer: {
    flexDirection: 'row',
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 5,
    alignItems: 'flex-start',
  },
  notesText: {
    fontSize: 14,
    color: '#555',
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  logItem: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  logDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#6F4E37',
    marginTop: 5, 
    marginRight: 12,
    flexShrink: 0,
  },
  logContent: {
    flex: 1,
  },
  logTime: {
    fontSize: 12,
    color: '#888',
  },
  logAction: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  logUser: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
});

export default OrderDetailsScreen;