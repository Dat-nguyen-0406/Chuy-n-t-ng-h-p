import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
} from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { collection, getDocs, getFirestore } from "firebase/firestore";
import app from "../../sever/firebase";
import { useNavigation } from "@react-navigation/native";

const SearchScreen = () => {
  const [searchText, setSearchText] = useState("");
  const [searchHistory, setSearchHistory] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const navigation = useNavigation();

  // Load dữ liệu sản phẩm và lịch sử tìm kiếm khi màn hình được tải
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const db = getFirestore(app);
        const productsSnapshot = await getDocs(collection(db, "douong"));
        const productsData = productsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setProducts(productsData);

      
        const history = await AsyncStorage.getItem("searchHistory");
        if (history) {
          setSearchHistory(JSON.parse(history));
        }
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

 
  useEffect(() => {
    const saveSearchHistory = async () => {
      try {
        await AsyncStorage.setItem(
          "searchHistory",
          JSON.stringify(searchHistory)
        );
      } catch (error) {
        console.error("Error saving search history:", error);
      }
    };
    if (searchHistory.length > 0 || (searchHistory.length === 0 && !isLoading)) {
      saveSearchHistory();
    }
  }, [searchHistory, isLoading]);


  // Xử lý tìm kiếm chính
  const handleSearch = () => {
    if (!searchText.trim()) {
      setFilteredProducts([]); 
      setSuggestions([]);
      return;
    }

    // Thêm vào lịch sử tìm kiếm (không trùng lặp)
    const newHistory = [
      searchText.trim(),
      ...searchHistory.filter((item) => item.toLowerCase() !== searchText.trim().toLowerCase()),
    ].slice(0, 5); //
    setSearchHistory(newHistory);

    // Lọc sản phẩm
    const filtered = products.filter((product) =>
      product.drinkname.toLowerCase().includes(searchText.trim().toLowerCase())
    );
    setFilteredProducts(filtered);
    setSuggestions([]); 
  };

  // Xử lý khi nhấn vào một mục trong lịch sử
  const handleHistoryItemPress = (item) => {
    setSearchText(item);
   
    const filtered = products.filter((product) =>
      product.drinkname.toLowerCase().includes(item.toLowerCase())
    );
    setFilteredProducts(filtered);
    setSuggestions([]); 
  };

  // Xử lý khi thay đổi text input (đề xuất)
  const handleTextChange = (text) => {
    setSearchText(text);
    if (text.length > 0) {
      const suggested = products.filter((product) =>
        product.drinkname.toLowerCase().includes(text.toLowerCase())
      );
      setSuggestions(suggested);
      setFilteredProducts([]); 
    } else {
      setSuggestions([]);
      setFilteredProducts([]);
    }
  };

  // Xóa một mục khỏi lịch sử
  const removeHistoryItem = (itemToRemove) => {
    const newHistory = searchHistory.filter((item) => item !== itemToRemove);
    setSearchHistory(newHistory);
  };

  // Xóa toàn bộ lịch sử
  const clearSearchHistory = () => {
    setSearchHistory([]);
  };

  // Render mỗi item sản phẩm
  const renderProductItem = ({ item }) => (
    <TouchableOpacity
      style={styles.productItem}
      onPress={() => navigation.navigate("Order", { drinkId: item.id })}
    >
      <Image source={{ uri: item.image }} style={styles.productImage} />
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{item.drinkname}</Text>
        <Text style={styles.productPrice}>{item.price}đ</Text>
      </View>
    </TouchableOpacity>
  );

  // Render mỗi item lịch sử tìm kiếm
  const renderHistoryItem = ({ item }) => (
    <View style={styles.historyItem}>
      <TouchableOpacity
        style={styles.historyTextContainer}
        onPress={() => handleHistoryItemPress(item)}
      >
        <FontAwesome name="history" size={16} color="#888" />
        <Text style={styles.historyText}>{item}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => removeHistoryItem(item)}>
        <FontAwesome name="times" size={16} color="#888" />
      </TouchableOpacity>
    </View>
  );

  // Render mỗi item đề xuất
  const renderSuggestionItem = ({ item }) => (
    <TouchableOpacity
      style={styles.suggestionItem}
      onPress={() => {
        setSearchText(item.drinkname);
        setFilteredProducts([item]); 
        setSuggestions([]); 
      }}
    >
      <FontAwesome name="search" size={16} color="#888" />
      <Text style={styles.suggestionText}>{item.drinkname}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
  
      <View style={styles.searchBar}>
        <FontAwesome
          name="search"
          size={20}
          color="#888"
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm kiếm đồ uống..."
          value={searchText}
          onChangeText={handleTextChange}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        {searchText.length > 0 && (
          <TouchableOpacity onPress={() => handleTextChange("")}>
            <FontAwesome name="times" size={20} color="#888" />
          </TouchableOpacity>
        )}
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#8B0000" />
          <Text>Đang tải dữ liệu...</Text>
        </View>
      ) : (
        <>
          {/* Hiển thị đề xuất khi có searchText và chưa có kết quả tìm kiếm */}
          {searchText.length > 0 && suggestions.length > 0 && filteredProducts.length === 0 && (
            <View style={styles.suggestionsContainer}>
              <FlatList
                data={suggestions}
                renderItem={renderSuggestionItem}
                keyExtractor={(item) => item.id}
              />
            </View>
          )}

      
          {filteredProducts.length > 0 ? (
            <FlatList
              data={filteredProducts}
              renderItem={renderProductItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.productList}
            />
          ) : (
    
            <View style={styles.historyContainer}>
              {searchText.length === 0 && searchHistory.length > 0 && (
                <>
                  <View style={styles.historyHeader}>
                    <Text style={styles.sectionTitle}>Lịch sử tìm kiếm</Text>
                    <TouchableOpacity onPress={clearSearchHistory}>
                      <Text style={styles.clearHistoryText}>Xóa tất cả</Text>
                    </TouchableOpacity>
                  </View>
                  <FlatList
                    data={searchHistory}
                    renderItem={renderHistoryItem}
                    keyExtractor={(item, index) => index.toString()}
                  />
                </>
              )}

              {/* Đề xuất sản phẩm phổ biến khi không có lịch sử và searchText trống */}
              {searchText.length === 0 && searchHistory.length === 0 && products.length > 0 && (
                <>
                  <Text style={styles.sectionTitle}>Đề xuất cho bạn</Text>
                  <FlatList
                    data={products.slice(0, 5)} 
                    renderItem={renderProductItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.productList}
                  />
                </>
              )}

              {/* Thông báo khi không tìm thấy gì và không có lịch sử/đề xuất chung */}
              {searchText.length > 0 && filteredProducts.length === 0 && suggestions.length === 0 && (
                <View style={styles.noResultsContainer}>
                  <Text style={styles.noResultsText}>Không tìm thấy kết quả phù hợp.</Text>
                </View>
              )}
               {searchText.length === 0 && searchHistory.length === 0 && products.length === 0 && !isLoading && (
                <View style={styles.noResultsContainer}>
                  <Text style={styles.noResultsText}>Không có dữ liệu sản phẩm để hiển thị đề xuất.</Text>
                </View>
              )}
            </View>
          )}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 16,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  suggestionsContainer: {
    backgroundColor: "#fff",
    borderRadius: 8,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  suggestionText: {
    marginLeft: 10,
    fontSize: 16,
    color: "#333",
  },
  historyContainer: {
    flex: 1,
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  clearHistoryText: {
    color: "#6F4E37",
    fontSize: 14,
  },
  historyItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  historyTextContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  historyText: {
    marginLeft: 10,
    fontSize: 16,
    color: "#333",
  },
  productList: {
    paddingBottom: 20,
  },
  productItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 4,
    color: "#333",
  },
  productPrice: {
    fontSize: 14,
    color: "#6F4E37",
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noResultsText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
  },
});

export default SearchScreen;