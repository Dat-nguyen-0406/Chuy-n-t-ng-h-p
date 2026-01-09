import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { FontAwesome } from "@expo/vector-icons";
import {
  getFirestore,
  doc,
  getDoc,
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import * as Location from 'expo-location';
import app from "../../sever/firebase";
import AsyncStorage from "@react-native-async-storage/async-storage";

const Option = ({ name, selected, onSelect, image }) => {
  return (
    <TouchableOpacity
      style={[styles.paymentOption, selected && styles.selectedPaymentOption]}
      onPress={onSelect}
    >
      {image && <Image source={image} style={styles.paymentImage}></Image>}
      <Text style={styles.paymentOptionText}>{name}</Text>
      {selected && (
        <FontAwesome
          name="check-circle"
          size={20}
          color="#6F4E37"
          style={styles.paymentCheckIcon}
        ></FontAwesome>
      )}
    </TouchableOpacity>
  );
};

const OptionSelector = ({ label, selectedValue, onSelect }) => {
  const options = ["0%", "30%", "50%", "70%", "100%"];
  return (
    <View style={{ marginBottom: 20 }}>
      <Text style={{ fontSize: 16, fontWeight: "bold", marginBottom: 8 }}>
        {label}
      </Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
        {options.map((value) => (
          <TouchableOpacity
            key={value}
            onPress={() => onSelect(value)}
            style={{
              paddingVertical: 6,
              paddingHorizontal: 12,
              backgroundColor: selectedValue === value ? "#6F4E37" : "#f5f5f5",
              borderRadius: 20,
              marginRight: 10,
              marginBottom: 10,
            }}
          >
            <Text style={{ color: selectedValue === value ? "#fff" : "#333" }}>
              {value}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const ReviewItem = ({ review }) => {
  const reviewDate = review.createdAt?.toDate ? new Date(review.createdAt.toDate()) : (review.createdAt ? new Date(review.createdAt) : null);

  return (
    <View style={styles.reviewItem}>
      <View style={styles.reviewHeader}>
        <Text style={styles.reviewUser}>{review.userName || "Khách hàng"}</Text>
        <Text style={styles.reviewDate}>
          {reviewDate ? reviewDate.toLocaleDateString("vi-VN") : 'N/A'}
        </Text>
      </View>
      <View style={styles.ratingStars}>
        {[1, 2, 3, 4, 5].map((star) => (
          <FontAwesome
            key={star}
            name="star"
            size={16}
            color={star <= review.rating ? "#FFD700" : "#ccc"}
            style={{ marginRight: 5 }}
          />
        ))}
      </View>
      <Text style={styles.reviewText}>{review.comment}</Text>
    </View>
  );
};

const OrderScreen = () => {
  const [drink, setDrink] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [iceLevel, setIceLevel] = useState("100%");
  const [sugarLevel, setSugarLevel] = useState("100%");
  const route = useRoute();
  const navigation = useNavigation();

  const { drinkId } = route.params;
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const [reviews, setReviews] = useState([]);

  const [loggedInUserName, setLoggedInUserName] = useState("Khách hàng");
  const [loggedInUserId, setLoggedInUserId] = useState(null);
  const [loggedInPhone, setLoggedInPhone] = useState("N/A");
  const [loggedInAddress, setLoggedInAddress] = useState("Chưa có địa chỉ");

  const [paymentMethod, setPaymentMethod] = useState("cash");
  
  // Thêm state để theo dõi trạng thái lấy vị trí
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationPermission, setLocationPermission] = useState(null);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const userDataString = await AsyncStorage.getItem("userData");
        if (userDataString) {
          const parsedUserData = JSON.parse(userDataString);
          setLoggedInUserName(parsedUserData.fullname || parsedUserData.name || "Khách hàng");
          setLoggedInUserId(parsedUserData.id || null);
          setLoggedInPhone(parsedUserData.phone || "N/A");
          setLoggedInAddress(parsedUserData.address || "Chưa có địa chỉ");
        } else {
          setLoggedInUserName("Khách hàng");
          setLoggedInUserId(null);
        }
      } catch (error) {
        console.error("Lỗi khi tải thông tin người dùng từ AsyncStorage:", error);
        setLoggedInUserName("Khách hàng");
        setLoggedInUserId(null);
      }
    };
    loadUserData();
    
    // Kiểm tra quyền location khi component mount
    checkLocationPermission();
  }, []);

  // Kiểm tra quyền truy cập location
  const checkLocationPermission = async () => {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      setLocationPermission(status);
      
      // Nếu đã có quyền, thử lấy vị trí ngay
      if (status === 'granted') {
        await getUserLocationSilently();
      }
    } catch (error) {
      console.error("Lỗi khi kiểm tra quyền location:", error);
    }
  };

  // Lấy vị trí mà không hiển thị alert (silent mode)
  const getUserLocationSilently = async () => {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced, // Sử dụng Balanced để nhanh hơn
        timeout: 10000, // Timeout 10 giây
      });

      const userLoc = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      
      setCurrentLocation(userLoc);
      return userLoc;
    } catch (error) {
      console.log("Không thể lấy vị trí tự động:", error.message);
      return null;
    }
  };

  useEffect(() => {
    const fetchDrinkDetails = async () => {
      try {
        const db = getFirestore(app);
        let currentDrink = null;

        if (route.params?.cartItem) {
          const { cartItem } = route.params;
          setQuantity(cartItem.quantity);
          setIceLevel(cartItem.iceLevel);
          setSugarLevel(cartItem.sugarLevel);

          const drinkRef = doc(db, "douong", cartItem.id.toString());
          const drinkSnap = await getDoc(drinkRef);

          if (drinkSnap.exists()) {
            currentDrink = { id: drinkSnap.id, ...drinkSnap.data() };
            setDrink(currentDrink);
          } else {
            Alert.alert("Lỗi", "Không tìm thấy đồ uống trong CSDL!");
            navigation.goBack();
            return;
          }
        } else if (drinkId) {
          const drinkRef = doc(db, "douong", drinkId.toString());
          const drinkSnap = await getDoc(drinkRef);

          if (drinkSnap.exists()) {
            currentDrink = { id: drinkSnap.id, ...drinkSnap.data() };
            setDrink(currentDrink);
          } else {
            Alert.alert("Lỗi", "Không tìm thấy đồ uống trong CSDL!");
            navigation.goBack();
            return;
          }
        } else {
          Alert.alert("Lỗi", "Không có thông tin đồ uống để hiển thị.");
          navigation.goBack();
          return;
        }

        if (currentDrink) {
          const unsubscribe = loadReviews(currentDrink.id);
          return () => unsubscribe();
        }

      } catch (error) {
        Alert.alert("Lỗi", "Có lỗi khi tải thông tin đồ uống");
        console.log("Lỗi thông tin đồ uống", error);
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    };
    fetchDrinkDetails();
  }, [drinkId, route.params?.cartItem]);

  const loadReviews = (id) => {
    const db = getFirestore(app);
    const reviewsRef = collection(db, "reviews");
    const q = query(reviewsRef, where("drinkId", "==", id));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const reviewsData = [];
      querySnapshot.forEach((doc) => {
        reviewsData.push({ id: doc.id, ...doc.data() });
      });
      setReviews(reviewsData);
    });

    return unsubscribe;
  };

  // Hàm lấy vị trí GPS của người dùng (cải tiến)
  const getUserLocation = async () => {
    setIsGettingLocation(true);
    
    try {
      // Kiểm tra quyền truy cập vị trí
      let { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        setIsGettingLocation(false);
        Alert.alert(
          "Cần quyền truy cập vị trí",
          "Ứng dụng cần quyền truy cập vị trí để xác định điểm giao hàng chính xác. Bạn có thể bật quyền này trong Cài đặt.",
          [
            { text: "Để sau", style: "cancel" },
            { 
              text: "Mở Cài đặt",
              onPress: () => {
                // Mở settings nếu cần (trên iOS/Android)
                if (Platform.OS === 'ios') {
                  Linking.openURL('app-settings:');
                } else {
                  Linking.openSettings();
                }
              }
            }
          ]
        );
        return null;
      }

      // Lấy vị trí hiện tại với độ chính xác cao
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeout: 15000, // Timeout 15 giây
        maximumAge: 10000, // Chấp nhận location cache trong 10 giây
      });

      const userLoc = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy, // Thêm độ chính xác
      };
      
      setCurrentLocation(userLoc);
      setIsGettingLocation(false);
      
      console.log("Đã lấy vị trí:", userLoc);
      return userLoc;
      
    } catch (error) {
      setIsGettingLocation(false);
      console.error("Lỗi khi lấy vị trí:", error);
      
      // Xử lý các loại lỗi khác nhau
      if (error.code === 'E_LOCATION_TIMEOUT') {
        Alert.alert(
          "Timeout", 
          "Không thể lấy vị trí trong thời gian quy định. Vui lòng kiểm tra kết nối GPS và thử lại."
        );
      } else if (error.code === 'E_LOCATION_UNAVAILABLE') {
        Alert.alert(
          "Vị trí không khả dụng", 
          "Không thể xác định vị trí. Vui lòng bật GPS và thử lại."
        );
      } else {
        Alert.alert(
          "Lỗi", 
          "Không thể lấy vị trí hiện tại. Vui lòng thử lại."
        );
      }
      
      return null;
    }
  };

  const handleOrderNow = async () => {
    try {
      // Kiểm tra đăng nhập
      if (!loggedInUserName || loggedInUserName === "Khách hàng" || !loggedInUserId) {
        Alert.alert("Thông báo", "Vui lòng đăng nhập để đặt hàng.");
        return;
      }

      // Kiểm tra địa chỉ
      if (!loggedInAddress || loggedInAddress === "Chưa có địa chỉ" || loggedInAddress === "N/A") {
        Alert.alert(
          "Thiếu thông tin",
          "Vui lòng cập nhật địa chỉ giao hàng trong trang cá nhân trước khi đặt hàng.",
          [{ text: "Đã hiểu" }]
        );
        return;
      }

      // Kiểm tra thông tin đồ uống
      if (!drink) {
        Alert.alert("Lỗi", "Thông tin đồ uống chưa được tải.");
        return;
      }

      // Thử sử dụng vị trí đã lấy trước đó (nếu có)
      let userLocation = currentLocation;
      
      // Nếu chưa có vị trí, thử lấy mới
      if (!userLocation) {
        userLocation = await getUserLocation();
      }
      
      // Nếu vẫn không có vị trí, hỏi người dùng
      if (!userLocation) {
        Alert.alert(
          "Không có vị trí",
          "Không thể xác định vị trí của bạn. Bạn có muốn tiếp tục đặt hàng không?\n\n(Tài xế sẽ liên hệ với bạn để xác nhận địa chỉ)",
          [
            { text: "Hủy", style: "cancel" },
            { 
              text: "Tiếp tục", 
              onPress: () => createOrder(null)
            },
            {
              text: "Thử lại",
              onPress: async () => {
                const newLocation = await getUserLocation();
                if (newLocation) {
                  await createOrder(newLocation);
                }
              }
            }
          ]
        );
        return;
      }

      // Tạo đơn hàng với vị trí
      await createOrder(userLocation);

    } catch (error) {
      console.error("Error placing order:", error);
      Alert.alert("Lỗi", "Không thể đặt hàng. Chi tiết: " + error.message);
    }
  };

  // Hàm tạo đơn hàng
  const createOrder = async (userLocation) => {
    try {
      const db = getFirestore(app);
      const ordersRef = collection(db, "orders");

      const newOrder = {
        userId: loggedInUserId,
        items: [
          {
            id: drink.id,
            name: drink.drinkname,
            price: parseInt(drink.price),
            quantity: quantity,
            image: drink.image,
            iceLevel: iceLevel,
            sugarLevel: sugarLevel,
            category: drink.category,
            description: drink.description,
            paymentMethod: paymentMethod,
          },
        ],
        status: "Đang xử lý", 
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        total: parseInt(drink.price) * quantity,
        userName: loggedInUserName,
        phone: loggedInPhone,
        address: loggedInAddress,
        // Thêm thông tin vị trí GPS với metadata
        customerLocation: userLocation ? {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          accuracy: userLocation.accuracy || null,
          timestamp: new Date().toISOString(),
        } : null,
        locationStatus: userLocation ? 'available' : 'unavailable', // Trạng thái vị trí
      };

      const docRef = await addDoc(ordersRef, newOrder);
      console.log("Order saved to Firestore with ID: ", docRef.id);

      // Xóa khỏi giỏ hàng nếu đặt từ giỏ hàng
      if (route.params?.fromCart) {
        const currentCart = await AsyncStorage.getItem("cart");
        let cart = currentCart ? JSON.parse(currentCart) : [];
        cart = cart.filter((item) => item.id !== drink.id);
        await AsyncStorage.setItem("cart", JSON.stringify(cart));
        console.log(`Đã xóa mục ${drink.drinkname} khỏi giỏ hàng.`);
      }

      // Hiển thị thông báo thành công
      Alert.alert(
        "Thành công", 
        userLocation 
          ? "Đơn hàng đã được đặt thành công! Chúng tôi đã xác định vị trí của bạn."
          : "Đơn hàng đã được đặt thành công! Tài xế sẽ liên hệ để xác nhận địa chỉ.",
        [
          {
            text: "Theo dõi đơn hàng",
            onPress: () => {
              navigation.navigate("Tracking", { orderId: docRef.id });
            },
          },
          {
            text: "Xem đơn hàng",
            onPress: () => {
              navigation.navigate("CartTab", {
                screen: "Cart",
                params: {
                  activeTab: "orders",
                },
              });
            },
          },
        ]
      );
    } catch (error) {
      console.error("Error creating order:", error);
      throw error;
    }
  };

  const handleSubmitReview = async () => {
    if (!review.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập nội dung đánh giá.");
      return;
    }

    if (rating === 0) {
      Alert.alert("Lỗi", "Vui lòng chọn số sao đánh giá.");
      return;
    }

    if (!loggedInUserName || loggedInUserName === "Khách hàng") {
      Alert.alert("Thông báo", "Vui lòng đăng nhập để gửi đánh giá.");
      return;
    }

    try {
      const db = getFirestore(app);
      const reviewsRef = collection(db, "reviews");

      await addDoc(reviewsRef, {
        drinkId: drink.id,
        drinkName: drink.drinkname,
        userName: loggedInUserName,
        rating: rating,
        comment: review,
        createdAt: new Date(),
      });

      Alert.alert("Thành công", "Đánh giá của bạn đã được gửi!");
      setReview("");
      setRating(0);
    } catch (error) {
      console.error("Error submitting review:", error);
      Alert.alert("Lỗi", "Có lỗi xảy ra khi gửi đánh giá");
    }
  };

  const increaseQuantity = () => setQuantity((prev) => prev + 1);
  const decreaseQuantity = () => {
    if (quantity > 1) setQuantity((prev) => prev - 1);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6F4E37" />
        <Text style={styles.loadingText}>Đang tải thông tin...</Text>
      </View>
    );
  }

  if (!drink) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Không tìm thấy thông tin đồ uống</Text>
      </View>
    );
  }

  const paymentMethods = [
    {
      id: "cash",
      name: "Tiền mặt",
    },
    {
      id: "qr",
      name: "Quét QR",
      image: require("../../assets/images/qr.jpg"),
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <Image source={{ uri: drink.image }} style={styles.drinkImage} />

      <View style={styles.drinkInfo}>
        <Text style={styles.drinkName}>{drink.drinkname}</Text>
        <Text style={styles.drinkPrice}>
          {parseInt(drink.price).toLocaleString()}đ
        </Text>
        <Text style={styles.drinkDescription}>{drink.description}</Text>

        {/* Hiển thị trạng thái vị trí */}
        {currentLocation && (
          <View style={styles.locationBadge}>
            <FontAwesome name="map-marker" size={16} color="#4CAF50" />
            <Text style={styles.locationBadgeText}>
              Đã xác định vị trí của bạn
            </Text>
          </View>
        )}

        <OptionSelector
          label="Chọn lượng đá"
          selectedValue={iceLevel}
          onSelect={setIceLevel}
        />

        <OptionSelector
          label="Chọn lượng đường"
          selectedValue={sugarLevel}
          onSelect={setSugarLevel}
        />

        <View style={styles.quantityContainer}>
          <Text style={styles.quantityLabel}>Số lượng:</Text>
          <View style={styles.quantityControls}>
            <TouchableOpacity
              onPress={decreaseQuantity}
              style={styles.quantityButton}
            >
              <FontAwesome name="minus" size={16} color="#6F4E37" />
            </TouchableOpacity>
            <Text style={styles.quantityText}>{quantity}</Text>
            <TouchableOpacity
              onPress={increaseQuantity}
              style={styles.quantityButton}
            >
              <FontAwesome name="plus" size={16} color="#6F4E37" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.paymentContainer}>
          <Text style={styles.paymentTitle}>Thanh Toán</Text>
          {paymentMethods.map((method) => (
            <Option
              key={method.id}
              name={method.name}
              image={method.image}
              selected={paymentMethod == method.id}
              onSelect={() => setPaymentMethod(method.id)}
            ></Option>
          ))}
        </View>

        <View style={styles.reviewSection}>
          <Text style={styles.sectionTitle}>
            Đánh giá sản phẩm ({reviews.length})
          </Text>

          <View style={styles.reviewForm}>
            <Text style={styles.reviewFormTitle}>Viết đánh giá của bạn</Text>
            <View style={styles.ratingStars}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => setRating(star)}>
                  <FontAwesome
                    name={star <= rating ? "star" : "star-o"}
                    size={28}
                    color="#FFD700"
                    style={{ marginRight: 5 }}
                  />
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              placeholder="Nhập đánh giá của bạn..."
              multiline
              numberOfLines={4}
              value={review}
              onChangeText={setReview}
              style={styles.reviewInput}
            />

            <TouchableOpacity
              onPress={handleSubmitReview}
              style={styles.submitButton}
            >
              <Text style={styles.submitButtonText}>Gửi đánh giá</Text>
            </TouchableOpacity>
          </View>

          {reviews.length > 0 ? (
            reviews.map((item) => <ReviewItem key={item.id} review={item} />)
          ) : (
            <Text style={styles.noReviewsText}>Chưa có đánh giá nào</Text>
          )}
        </View>

        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Tổng cộng:</Text>
          <Text style={styles.totalPrice}>
            {(parseInt(drink.price) * quantity).toLocaleString()}đ
          </Text>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.button, 
            styles.orderButton,
            isGettingLocation && styles.buttonDisabled
          ]}
          onPress={handleOrderNow}
          disabled={isGettingLocation}
        >
          {isGettingLocation ? (
            <>
              <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.buttonText}>Đang lấy vị trí...</Text>
            </>
          ) : (
            <Text style={styles.buttonText}>Đặt hàng ngay</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  drinkImage: {
    width: "100%",
    height: 250,
    borderRadius: 10,
    marginBottom: 20,
  },
  drinkInfo: {
    marginBottom: 20,
  },
  drinkName: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#333",
  },
  drinkPrice: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#6F4E37",
    marginBottom: 12,
  },
  drinkDescription: {
    fontSize: 16,
    color: "#666",
    marginBottom: 20,
    lineHeight: 24,
  },
  locationBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F5E9",
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
  },
  locationBadgeText: {
    marginLeft: 8,
    color: "#4CAF50",
    fontSize: 14,
    fontWeight: "600",
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  quantityLabel: {
    fontSize: 16,
    color: "#333",
  },
  quantityControls: {
    flexDirection: "row",
    alignItems: "center",
  },
  quantityButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
  },
  quantityText: {
    marginHorizontal: 15,
    fontSize: 18,
    fontWeight: "bold",
  },
  reviewSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#333",
  },
  reviewForm: {
    marginBottom: 20,
    backgroundColor: "#f9f9f9",
    padding: 15,
    borderRadius: 10,
  },
  reviewFormTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
  },
  ratingStars: {
    flexDirection: "row",
    marginBottom: 15,
  },
  reviewInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    minHeight: 100,
    marginBottom: 15,
    textAlignVertical: "top",
    backgroundColor: "#fff",
  },
  submitButton: {
    backgroundColor: "#6F4E37",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  submitButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  reviewItem: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  reviewUser: {
    fontWeight: "bold",
    color: "#333",
  },
  reviewDate: {
    color: "#999",
    fontSize: 12,
  },
  reviewText: {
    color: "#333",
    marginTop: 5,
    lineHeight: 20,
  },
  noReviewsText: {
    textAlign: "center",
    color: "#999",
    marginVertical: 20,
  },
  totalContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  totalPrice: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#6F4E37",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: "auto",
    marginBottom: 20,
  },
  button: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
  },
  orderButton: {
    backgroundColor: "#6F4E37",
  },
  buttonDisabled: {
    backgroundColor: "#999",
    opacity: 0.7,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },
  paymentContainer: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: "#f9f9f9",
    borderRadius: 10,
  },
  paymentTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#333",
  },
  paymentOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: "#fff",
  },
  selectedPaymentOption: {
    borderColor: "#6F4E37",
    backgroundColor: "#f5f0ec",
  },
  paymentImage: {
    width: 30,
    height: 30,
    marginRight: 10,
  },
  paymentOptionText: {
    fontSize: 16,
    flex: 1,
  },
  paymentCheckIcon: {
    marginLeft: 10,
  },
});

export default OrderScreen;