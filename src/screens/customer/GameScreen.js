// src/screens/customer/GameScreen.js
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const GameScreen = () => {
  const [points, setPoints] = useState(150);
  const [claimedToday, setClaimedToday] = useState(false);

  const handleDailyCheckin = () => {
    if (!claimedToday) {
      setPoints(points + 10);
      setClaimedToday(true);
      Alert.alert("Thành công", "Bạn nhận được 10 điểm tích lũy!");
    } else {
      Alert.alert("Thông báo", "Bạn đã điểm danh hôm nay rồi.");
    }
  };

  const renderGameItem = (title, icon, color, description) => (
    <TouchableOpacity style={styles.gameCard}>
      <LinearGradient colors={[color, color + 'CC']} style={styles.gameIcon}>
        <Ionicons name={icon} size={30} color="#FFF" />
      </LinearGradient>
      <View style={styles.gameInfo}>
        <Text style={styles.gameTitle}>{title}</Text>
        <Text style={styles.gameDesc}>{description}</Text>
      </View>
      <Ionicons name="play-circle" size={32} color={color} />
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      <LinearGradient colors={['#3e4ca7ff', '#352da0ff']} style={styles.header}>
        <Text style={styles.pointsText}>Điểm hiện tại: {points} ⭐️</Text>
      </LinearGradient>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Nhiệm vụ hàng ngày</Text>
        <TouchableOpacity 
          style={[styles.checkInCard, claimedToday && styles.disabledCard]} 
          onPress={handleDailyCheckin}
        >
          <Ionicons name="calendar" size={24} color={claimedToday ? "#999" : "#0f367aff"} />
          <Text style={styles.checkInText}>
            {claimedToday ? "Đã điểm danh" : "Điểm danh nhận 10 điểm"}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Trò chơi săn Voucher</Text>
        {renderGameItem("Vòng quay may mắn", "sync", "#FF6B6B", "Quay là trúng Voucher 10k, 20k...")}
        {renderGameItem("Trồng cây Cafe", "leaf", "#4CAF50", "Chăm sóc cây nhận hạt giống ưu đãi")}
        {renderGameItem("Lật thẻ bài", "copy", "#FFD93D", "Tìm cặp hình giống nhau nhận quà")}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { padding: 30, borderBottomLeftRadius: 30, borderBottomRightRadius: 30, alignItems: 'center' },
  pointsText: { color: '#FFF', fontSize: 22, fontWeight: 'bold' },
  section: { padding: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, color: '#333' },
  checkInCard: { 
    flexDirection: 'row', backgroundColor: '#FFF', padding: 20, borderRadius: 15, 
    alignItems: 'center', elevation: 3, shadowOpacity: 0.1 
  },
  disabledCard: { backgroundColor: '#E0E0E0' },
  checkInText: { marginLeft: 15, fontSize: 16, fontWeight: '600' },
  gameCard: { 
    flexDirection: 'row', backgroundColor: '#FFF', padding: 15, borderRadius: 15, 
    alignItems: 'center', marginBottom: 15, elevation: 2 
  },
  gameIcon: { width: 60, height: 60, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  gameInfo: { flex: 1, marginLeft: 15 },
  gameTitle: { fontSize: 16, fontWeight: 'bold' },
  gameDesc: { fontSize: 13, color: '#666' },
});

export default GameScreen;