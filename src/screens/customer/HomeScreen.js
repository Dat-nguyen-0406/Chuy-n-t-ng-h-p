import React, { useState, useEffect } from "react";
import { db } from "../../sever/firebase";
import { collection, getDocs } from "firebase/firestore";
import {
  View,
  Image,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { StyleSheet } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { useNavigation, useIsFocused } from "@react-navigation/native";
import { LinearGradient } from 'expo-linear-gradient';

const HomeScreen = () => {
  const [coffeeItems, setCoffeeItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [headerData, setHeaderData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categories, setCategories] = useState([]);
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    console.log("HomeScreen: Bắt đầu fetchData.");
    try {
      const categorySnapshot = await getDocs(collection(db, "danhmuc"));
      const fetchedCategories = categorySnapshot.docs.map((doc) => ({
        id: doc.id,
        name: doc.data().categoryName,
      }));
      setCategories([{ id: "all", name: "Tất cả" }, ...fetchedCategories]);

      const coffeeSnapshot = await getDocs(collection(db, "douong"));
      const coffeeItemsData = coffeeSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setCoffeeItems(coffeeItemsData);
      setFilteredItems(coffeeItemsData);

      const headerSnapshot = await getDocs(collection(db, "photo"));
      if (!headerSnapshot.empty) {
        const headerDoc = headerSnapshot.docs[0].data();
        setHeaderData({
          title: headerDoc.title || "Cà phê chất lượng",
          image: headerDoc.Image || "https://via.placeholder.com/400x200",
        });
      } else {
        setHeaderData({
          title: "Cà phê chất lượng",
          image: "https://via.placeholder.com/400x200",
        });
      }

      setPromotions([
        {
          id: 1,
          text: "Giảm 20%",
          description: "Cho đơn hàng đầu tiên",
          image:
            "https://media.istockphoto.com/id/1344512181/vi/vec-to/bi%E1%BB%83u-t%C6%B0%E1%BB%A3ng-loa-m%C3%A0u-%C4%91%E1%BB%8F.jpg?s=612x612&w=0&k=20&c=t8xmvCQKhdqmyG2ify0vXMIgK5ty7IpOyicWE-Rrpzg=",
        },
      ]);
    } catch (err) {
      console.error("HomeScreen: Lỗi Firestore:", err);
      setError(err.message);
    } finally {
      setLoading(false);
      console.log("HomeScreen: Kết thúc fetchData.");
    }
  };

  useEffect(() => {
    if (isFocused) {
      console.log("HomeScreen: Màn hình đang được focus, gọi fetchData.");
      fetchData();
    }
  }, [isFocused]);

  useEffect(() => {
    let result = coffeeItems;

    if (searchText.trim()) {
      result = result.filter((item) =>
        item.drinkname &&
        item.drinkname.toLowerCase().includes(searchText.toLowerCase().trim())
      );
    }

    if (selectedCategory && selectedCategory.id !== "all") {
      result = result.filter((item) => {
        return item.category && item.category.trim().toLowerCase() === selectedCategory.name.trim().toLowerCase();
      });
    }

    setFilteredItems(result);
    console.log("HomeScreen: Cập nhật danh sách lọc hoặc tìm kiếm.");
  }, [selectedCategory, searchText, coffeeItems]);

  const renderCategoryHeader = () => (
    <View style={styles.headerContainer}>
      {headerData ? (
        <>
          <Text style={styles.mainTitle}>{headerData.title}</Text>
          <View style={styles.imageWrapper}>
            <Image
              source={{ uri: headerData.image }}
              style={styles.headerImage}
              resizeMode="cover"
            />
            <View style={styles.imageOverlay} />
          </View>

          <View style={styles.categorySection}>
            <Text style={styles.sectionTitle}>Danh mục</Text>
            <View style={styles.categoryGrid}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryItem,
                    selectedCategory?.id === cat.id ||
                    (cat.id === "all" && !selectedCategory)
                      ? styles.selectedCategoryItem
                      : null,
                  ]}
                  onPress={() => setSelectedCategory(cat)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      selectedCategory?.id === cat.id ||
                      (cat.id === "all" && !selectedCategory)
                        ? styles.selectedCategoryText
                        : null,
                    ]}
                  >
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </>
      ) : (
        <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
      )}
    </View>
  );

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(
          <FontAwesome key={i} name="star" size={14} color="#FFB800" />
        );
      } else if (i === fullStars + 1 && hasHalfStar) {
        stars.push(
          <FontAwesome
            key={i}
            name="star-half-full"
            size={14}
            color="#FFB800"
          />
        );
      } else {
        stars.push(
          <FontAwesome key={i} name="star-o" size={14} color="#E0E0E0" />
        );
      }
    }

    return (
      <View style={styles.ratingContainer}>
        {stars}
        <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
      </View>
    );
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.itemContainer}
      onPress={() => navigation.navigate("Order", { drinkId: item.id })}
      activeOpacity={0.8}
    >
      <View style={styles.itemCard}>
        <View style={styles.imageContainer}>
          <Image source={{ uri: item.image }} style={styles.itemImage} />
        </View>
        <View style={styles.itemDetails}>
          <Text style={styles.itemName} numberOfLines={2}>{item.drinkname}</Text>
          <View style={styles.priceRatingRow}>
            <Text style={styles.itemPrice}>{item.price}đ</Text>
            {renderStars(item.start || 0)}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderPromotion = ({ item }) => (
    <TouchableOpacity style={styles.promotionContainer} activeOpacity={0.9}>
      <View style={styles.promotionCard}>
        <View style={styles.promotionImageWrapper}>
          <Image
            source={{ uri: item.image }}
            style={styles.promotionImage}
            resizeMode="cover"
          />
        </View>
        <View style={styles.promotionTextContainer}>
          <Text style={styles.promotionTitle}>{item.text}</Text>
          <Text style={styles.promotionDescription}>{item.description}</Text>
        </View>
        <FontAwesome name="chevron-right" size={16} color="#0f367aff" />
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0f367aff" />
        <Text style={styles.loadingSubtext}>Đang tải...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <FontAwesome name="exclamation-circle" size={48} color="#FF6B6B" />
        <Text style={styles.errorText}>Lỗi khi tải dữ liệu</Text>
        <Text style={styles.errorSubtext}>Vui lòng thử lại sau</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredItems}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={renderCategoryHeader}
        ListFooterComponent={
          <FlatList
            data={promotions}
            renderItem={renderPromotion}
            keyExtractor={(item) => item.id.toString()}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  headerContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1a1a1a",
    marginTop: 10,
    marginBottom: 15,
    letterSpacing: 0.5,
  },
  imageWrapper: {
    position: "relative",
    marginBottom: 20,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  headerImage: {
    width: "100%",
    height: 180,
  },
  imageOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "40%",
    backgroundColor: "rgba(0,0,0,0.1)",
  },
  categorySection: {
    marginTop: 5,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 15,
    color: "#1a1a1a",
    letterSpacing: 0.3,
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  categoryItem: {
    width: "23%",
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E8E8E8",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedCategoryItem: {
    backgroundColor: "#0f367aff",
    borderColor: "#0f367aff",
    shadowColor: "#0f367aff",
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#555",
  },
  selectedCategoryText: {
    color: "#fff",
    fontWeight: "700",
  },
  itemContainer: {
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  itemCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  imageContainer: {
    width: 100,
    height: 100,
    backgroundColor: "#F5F5F5",
  },
  itemImage: {
    width: "100%",
    height: "100%",
  },
  itemDetails: {
    flex: 1,
    padding: 12,
    justifyContent: "space-between",
  },
  itemName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 8,
    lineHeight: 22,
  },
  priceRatingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  itemPrice: {
    fontSize: 17,
    fontWeight: "700",
    color: "#0f367aff",
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ratingText: {
    fontSize: 13,
    color: "#666",
    marginLeft: 4,
    fontWeight: "600",
  },
  promotionContainer: {
    paddingHorizontal: 20,
    marginVertical: 15,
    marginBottom: 30,
  },
  promotionCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    shadowColor: "#0f367aff",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 5,
    borderLeftWidth: 4,
    borderLeftColor: "#0f367aff",
  },
  promotionImageWrapper: {
    width: 60,
    height: 60,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#F5F5F5",
  },
  promotionImage: {
    width: "100%",
    height: "100%",
  },
  promotionTextContainer: {
    flex: 1,
    marginLeft: 16,
  },
  promotionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0f367aff",
    marginBottom: 4,
  },
  promotionDescription: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
  },
  loadingSubtext: {
    marginTop: 12,
    fontSize: 15,
    color: "#666",
    fontWeight: "500",
  },
  errorText: {
    color: "#FF6B6B",
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
  },
  errorSubtext: {
    color: "#999",
    fontSize: 14,
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
});

export default HomeScreen;