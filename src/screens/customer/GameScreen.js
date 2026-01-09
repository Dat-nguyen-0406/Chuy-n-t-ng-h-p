// src/screens/customer/GameScreen.js
import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, ScrollView, 
  Alert, ActivityIndicator, Modal, Animated, Dimensions 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getFirestore, doc, updateDoc, increment, getDoc } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import app from "../../sever/firebase"; 

const db = getFirestore(app);
const { width } = Dimensions.get('window');

const GameScreen = () => {
  const [points, setPoints] = useState(0);
  const [userId, setUserId] = useState(null);
  const [claimedToday, setClaimedToday] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // States điều khiển Game
  const [isSpinning, setIsSpinning] = useState(false);
  const [showMemoryGame, setShowMemoryGame] = useState(false);
  const [cards, setCards] = useState([]);
  const [flippedIndices, setFlippedIndices] = useState([]);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const dataString = await AsyncStorage.getItem("userData");
      if (dataString) {
        const user = JSON.parse(dataString);
        setUserId(user.id);
        const userRef = doc(db, "users", user.id);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const data = userSnap.data();
          setPoints(data.coin || 0);
          const today = new Date().toISOString().split('T')[0];
          if (data.lastCheckIn === today) setClaimedToday(true);
        }
      }
    } catch (error) { console.error(error); }
  };

  const updateCoinFirebase = async (amount) => {
    if (!userId) return;
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, { coin: increment(amount) });
    const newTotal = points + amount;
    setPoints(newTotal);
    const dataString = await AsyncStorage.getItem("userData");
    const currentData = JSON.parse(dataString);
    await AsyncStorage.setItem("userData", JSON.stringify({ ...currentData, coin: newTotal }));
  };

  
  const startSpin = () => {
    if (isSpinning) return;
    setIsSpinning(true);
    setTimeout(async () => {
      const rewards = [5, 10, 20, 50, 0];
      const result = rewards[Math.floor(Math.random() * rewards.length)];
      setIsSpinning(false);
      if (result > 0) {
        await updateCoinFirebase(result);
        Alert.alert("🎉 CHÚC MỪNG", `Bạn đã quay trúng ${result} Coin!`);
      } else {
        Alert.alert("😢 TIẾC QUÁ", "Chúc bạn may mắn lần sau!");
      }
    }, 2000);
  };

  // --- GAME 2: LẬT THẺ BÀI ---
  const initMemoryGame = () => {
    const icons = ['cafe', 'ice-cream', 'pizza', 'wine', 'cafe', 'ice-cream', 'pizza', 'wine'];
    const shuffled = icons.sort(() => Math.random() - 0.5);
    setCards(shuffled);
    setFlippedIndices([]);
    setShowMemoryGame(true);
  };

  const handleCardPress = (index) => {
    if (flippedIndices.length === 2 || flippedIndices.includes(index)) return;
    const newFlipped = [...flippedIndices, index];
    setFlippedIndices(newFlipped);

    if (newFlipped.length === 2) {
      if (cards[newFlipped[0]] === cards[newFlipped[1]]) {
        updateCoinFirebase(20);
        Alert.alert("Thắng rồi!", "Cặp bài trùng khớp, bạn nhận 20 Coin!");
        setTimeout(() => setShowMemoryGame(false), 1500);
      } else {
        setTimeout(() => setFlippedIndices([]), 1000);
      }
    }
  };

  return (
    <ScrollView style={styles.container}>
      <LinearGradient colors={['#3e4ca7ff', '#352da0ff']} style={styles.header}>
        <Text style={styles.pointsText}>Số dư Coin: {points} 🪙</Text>
      </LinearGradient>

      {/* Điểm danh */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Nhiệm vụ hàng ngày</Text>
        <TouchableOpacity 
           style={[styles.checkInCard, claimedToday && styles.disabledCard]}
           onPress={() => !claimedToday && updateCoinFirebase(10).then(() => setClaimedToday(true))}
        >
          <Ionicons name="calendar" size={30} color={claimedToday ? "#999" : "#3e4ca7ff"} />
          <Text style={styles.checkInText}>{claimedToday ? "Đã điểm danh" : "Điểm danh nhận 10 Coin"}</Text>
        </TouchableOpacity>
      </View>

      {/* Danh sách trò chơi */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Trò chơi giải trí</Text>
        
        <TouchableOpacity style={styles.gameCard} onPress={startSpin}>
          <LinearGradient colors={['#FF6B6B', '#EE5253']} style={styles.gameIcon}>
            {isSpinning ? <ActivityIndicator color="#FFF" /> : <Ionicons name="sync" size={30} color="#FFF" />}
          </LinearGradient>
          <View style={styles.gameInfo}>
            <Text style={styles.gameTitle}>Vòng quay may mắn</Text>
            <Text style={styles.gameDesc}>Thử vận may nhận tới 50 Coin</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.gameCard} onPress={initMemoryGame}>
          <LinearGradient colors={['#4CAF50', '#2E7D32']} style={styles.gameIcon}>
            <Ionicons name="grid" size={30} color="#FFF" />
          </LinearGradient>
          <View style={styles.gameInfo}>
            <Text style={styles.gameTitle}>Lật thẻ bài</Text>
            <Text style={styles.gameDesc}>Tìm cặp hình giống nhau nhận 20 Coin</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Modal trò chơi Lật thẻ bài */}
      <Modal visible={showMemoryGame} animationType="slide">
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Tìm cặp hình giống nhau</Text>
          <View style={styles.cardGrid}>
            {cards.map((icon, index) => (
              <TouchableOpacity key={index} style={styles.memoryCard} onPress={() => handleCardPress(index)}>
                <Ionicons 
                  name={flippedIndices.includes(index) ? icon : "help-circle"} 
                  size={40} 
                  color={flippedIndices.includes(index) ? "#3e4ca7ff" : "#CCC"} 
                />
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={styles.closeBtn} onPress={() => setShowMemoryGame(false)}>
            <Text style={styles.closeBtnText}>Đóng</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
 
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },

  header: {
    paddingVertical: 40,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
  },
  pointsText: {
    color: '#FFF',
    fontSize: 26,
    fontWeight: '800', 
    letterSpacing: 1,
  },

 
  section: {
    paddingHorizontal: 20,
    paddingTop: 25,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 15,
    paddingLeft: 5,
  },

  checkInCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 20, 
    alignItems: 'center',
    marginBottom: 10,
    
    
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  checkInText: {
    marginLeft: 15,
    fontSize: 17,
    fontWeight: '600',
    color: '#2C3E50',
  },
  disabledCard: {
    backgroundColor: '#EAEAEA',
    opacity: 0.7,
  },

 
  gameCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: 15,
    
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
  },
  gameIcon: {
    width: 65,
    height: 65,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gameInfo: {
    flex: 1,
    marginLeft: 15,
  },
  gameTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  gameDesc: {
    fontSize: 13,
    color: '#7F8C8D', // Màu xám nhẹ cho mô tả
    lineHeight: 18,
  },
});

export default GameScreen;