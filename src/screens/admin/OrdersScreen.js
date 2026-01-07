// src/screens/admin/OrdersScreen.js

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import {
  getFirestore,
  collection,
  query,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';
import app from '../../sever/firebase';

const OrdersScreen = ({ navigation }) => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const isFocused = useIsFocused();
  const db = getFirestore(app);

  useEffect(() => {
    let unsubscribe;
    if (isFocused) {
      const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
      unsubscribe = onSnapshot(
        q,
        snap => {
          const data = snap.docs.map(doc => {
            const d = doc.data();
            return {
              id: doc.id,
              ...d,
              createdAt: d.createdAt?.toDate?.().getTime() || Date.now(),
              customer: d.userName || 'Khách hàng',
              phone: d.phone || 'N/A',
              items: d.items || [],
              status: d.status || 'Đang xử lý',
            };
          });
          setOrders(data);
          setIsLoading(false);
        },
        () => {
          Alert.alert('Lỗi', 'Không thể tải đơn hàng');
          setIsLoading(false);
        }
      );
    }
    return () => unsubscribe && unsubscribe();
  }, [isFocused]);

  useEffect(() => {
    let temp = orders;

    if (statusFilter !== 'all') {
      temp = temp.filter(o => o.status === statusFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      temp = temp.filter(
        o =>
          o.id.toLowerCase().includes(q) ||
          o.customer.toLowerCase().includes(q) ||
          o.phone.includes(q)
      );
    }

    setFilteredOrders(temp);
  }, [orders, statusFilter, searchQuery]);

  const statusColor = status => {
    switch (status) {
      case 'Đã hoàn thành':
        return '#16a34a';
      case 'Đang giao':
        return '#2563eb';
      case 'Đang xử lý':
        return '#f59e0b';
      case 'Đã hủy':
        return '#dc2626';
      default:
        return '#6b7280';
    }
  };

  const renderTab = (value, label) => (
    <TouchableOpacity
      key={value}
      style={[
        styles.tab,
        statusFilter === value && styles.tabActive,
      ]}
      onPress={() => setStatusFilter(value)}
    >
      <Text
        style={[
          styles.tabText,
          statusFilter === value && styles.tabTextActive,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderItem = ({ item }) => {
    const date = new Date(item.createdAt);
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() =>
          navigation.navigate('OrderDetails', { orderId: item.id })
        }
      >
        <View style={styles.cardHeader}>
          <Text style={styles.orderId}>
            #{item.id.slice(-6).toUpperCase()}
          </Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: statusColor(item.status) },
            ]}
          >
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </View>

        <Text style={styles.customer}>{item.customer}</Text>
        <Text style={styles.phone}>{item.phone}</Text>

        <View style={styles.divider} />

        <View style={styles.footer}>
          <Text style={styles.time}>
            {date.toLocaleTimeString('vi-VN', {
              hour: '2-digit',
              minute: '2-digit',
            })}{' '}
            · {date.toLocaleDateString('vi-VN')}
          </Text>
          <Text style={styles.total}>
            {item.items.length} món ·{' '}
            {item.total?.toLocaleString('vi-VN') || 0}đ
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#16a34a" />
        <Text style={styles.loadingText}>Đang tải đơn hàng...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search */}
      <View style={styles.searchBox}>
        <Ionicons name="search" size={20} color="#9ca3af" />
        <TextInput
          placeholder="Tìm theo mã, khách hàng, SĐT..."
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {renderTab('all', 'Tất cả')}
        {renderTab('Đang xử lý', 'Xử lý')}
        {renderTab('Đang giao', 'Giao')}
        {renderTab('Đã hoàn thành', 'Hoàn thành')}
        {renderTab('Đã hủy', 'Hủy')}
      </View>

      <FlatList
        data={filteredOrders}
        keyExtractor={i => i.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};




const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb', padding: 16 },

  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 8, color: '#6b7280' },

  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    marginBottom: 12,
    elevation: 3,
  },
  searchInput: {
    marginLeft: 8,
    flex: 1,
    fontSize: 15,
  },

  tabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 14,
    marginBottom: 12,
    overflow: 'hidden',
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#16a34a',
  },
  tabText: {
    fontSize: 13,
    color: '#6b7280',
  },
  tabTextActive: {
    color: '#fff',
    fontWeight: '600',
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  orderId: { fontWeight: '700', fontSize: 15 },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusText: { color: '#fff', fontSize: 12 },

  customer: { marginTop: 6, fontSize: 16, fontWeight: '600' },
  phone: { color: '#6b7280', marginTop: 2 },

  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 10,
  },

  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  time: { color: '#6b7280', fontSize: 12 },
  total: { fontWeight: '700', color: '#16a34a' },
});

export default OrdersScreen;