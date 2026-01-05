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
          <Image
            source={{ uri: headerData.image }}
            style={styles.headerImage}
            resizeMode="cover"
          />

          {/* Phần danh mục */}
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
                    {" "}
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
          <FontAwesome key={i} name="star" size={16} color="#FFD700" />
        );
      } else if (i === fullStars + 1 && hasHalfStar) {
        stars.push(
          <FontAwesome
            key={i}
            name="star-half-full"
            size={16}
            color="#FFD700"
          />
        );
      } else {
        stars.push(
          <FontAwesome key={i} name="star-o" size={16} color="#FFD700" />
        );
      }
    }

    return (
      <View style={styles.ratingContainer}>
        {stars}
        <Text style={styles.ratingText}>({rating})</Text>
      </View>
    );
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.itemContainer}
      onPress={() => navigation.navigate("Order", { drinkId: item.id })}
    >
      <View style={styles.itemContent}>
        <Image source={{ uri: item.image }} style={styles.itemImage} />
        <View style={styles.itemDetails}>
          <Text style={styles.itemName}>{item.drinkname}</Text>
          <Text style={styles.itemPrice}>{item.price}đ</Text>
          {renderStars(item.start || 0)}
        </View>
      </View>
      <View style={styles.divider} />
    </TouchableOpacity>
  );

  const renderPromotion = ({ item }) => (
    <View style={styles.promotionContainer}>
      <Image
        source={{ uri: item.image }}
        style={styles.promotionImage}
        resizeMode="cover"
      />
      <View style={styles.promotionTextContainer}>
        <Text style={styles.promotionTitle}>{item.text}</Text>
        <Text style={styles.promotionDescription}>{item.description}</Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Lỗi khi tải dữ liệu: {error}</Text>
        <Text>Vui lòng kiểm tra kết nối hoặc liên hệ quản trị viên</Text>
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
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 15,
    paddingTop: 10,
    paddingBottom: 20,
    marginBottom: 20,
  },
  headerContainer: {
    marginBottom: 20,
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000",
    marginTop: 20,
    textAlign: "center",
  },
  headerImage: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    marginVertical: 10,
  },
  searchContainer: {
    marginVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: "#ddd",
    borderWidth: 1,
    borderRadius: 8,
    paddingRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 40,
    paddingHorizontal: 15,
    fontSize: 16,
  },
  categorySection: {
    marginTop: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  categoryItem: {
    width: "23%",
    paddingVertical: 10,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 10,
  },
  selectedCategoryItem: {
    backgroundColor: "#8B4513",
  },
  categoryText: {
    fontSize: 14,
    color: "#333",
  },
  selectedCategoryText: {
    color: "white",
  },
  itemContainer: {
    marginBottom: 15,
  },
  itemContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
    marginRight: 15,
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },
  itemPrice: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  ratingText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 5,
  },
  promotionContainer: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    borderRadius: 12,
    marginVertical: 10,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: "center",
  },
  promotionImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  promotionTextContainer: {
    flex: 1,
    marginLeft: 15,
  },
  promotionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#6F4E37",
    marginBottom: 5,
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
  },
  errorText: {
    color: "red",
    marginBottom: 10,
  },
});

export default HomeScreen;