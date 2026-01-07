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

  const handleSearch = () => {
    if (!searchText.trim()) {
      setFilteredProducts([]);
      setSuggestions([]);
      return;
    }

    const newHistory = [
      searchText.trim(),
      ...searchHistory.filter((item) => item.toLowerCase() !== searchText.trim().toLowerCase()),
    ].slice(0, 5);
    setSearchHistory(newHistory);

    const filtered = products.filter((product) =>
      product.drinkname.toLowerCase().includes(searchText.trim().toLowerCase())
    );
    setFilteredProducts(filtered);
    setSuggestions([]);
  };

  const handleHistoryItemPress = (item) => {
    setSearchText(item);
    const filtered = products.filter((product) =>
      product.drinkname.toLowerCase().includes(item.toLowerCase())
    );
    setFilteredProducts(filtered);
    setSuggestions([]);
  };

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

  const removeHistoryItem = (itemToRemove) => {
    const newHistory = searchHistory.filter((item) => item !== itemToRemove);
    setSearchHistory(newHistory);
  };

  const clearSearchHistory = () => {
    setSearchHistory([]);
  };

  const renderProductItem = ({ item }) => (
    <TouchableOpacity
      style={styles.productItem}
      onPress={() => navigation.navigate("Order", { drinkId: item.id })}
      activeOpacity={0.8}
    >
      <View style={styles.productCard}>
        <View style={styles.productImageWrapper}>
          <Image source={{ uri: item.image }} style={styles.productImage} />
        </View>
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={2}>{item.drinkname}</Text>
          <Text style={styles.productPrice}>{item.price}đ</Text>
        </View>
        <FontAwesome name="chevron-right" size={16} color="#CCC" />
      </View>
    </TouchableOpacity>
  );

  const renderHistoryItem = ({ item }) => (
    <View style={styles.historyItem}>
      <TouchableOpacity
        style={styles.historyTextContainer}
        onPress={() => handleHistoryItemPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.historyIconCircle}>
          <FontAwesome name="history" size={14} color="#0f367aff" />
        </View>
        <Text style={styles.historyText}>{item}</Text>
      </TouchableOpacity>
      <TouchableOpacity 
        onPress={() => removeHistoryItem(item)}
        style={styles.deleteButton}
        activeOpacity={0.7}
      >
        <FontAwesome name="times" size={16} color="#999" />
      </TouchableOpacity>
    </View>
  );

  const renderSuggestionItem = ({ item }) => (
    <TouchableOpacity
      style={styles.suggestionItem}
      onPress={() => {
        setSearchText(item.drinkname);
        setFilteredProducts([item]);
        setSuggestions([]);
      }}
      activeOpacity={0.7}
    >
      <View style={styles.suggestionIconCircle}>
        <FontAwesome name="search" size={14} color="#0f367aff" />
      </View>
      <Text style={styles.suggestionText}>{item.drinkname}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchBarContainer}>
        <View style={styles.searchBar}>
          <FontAwesome
            name="search"
            size={18}
            color="#999"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm đồ uống..."
            placeholderTextColor="#999"
            value={searchText}
            onChangeText={handleTextChange}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {searchText.length > 0 && (
            <TouchableOpacity 
              onPress={() => handleTextChange("")}
              style={styles.clearButton}
              activeOpacity={0.7}
            >
              <FontAwesome name="times-circle" size={18} color="#999" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#0f367aff" />
          <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
        </View>
      ) : (
        <>
          {searchText.length > 0 && suggestions.length > 0 && filteredProducts.length === 0 && (
            <View style={styles.suggestionsContainer}>
              <Text style={styles.suggestionsTitle}>Gợi ý tìm kiếm</Text>
              <FlatList
                data={suggestions}
                renderItem={renderSuggestionItem}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
              />
            </View>
          )}

          {filteredProducts.length > 0 ? (
            <View style={styles.resultsContainer}>
              <Text style={styles.resultsTitle}>
                Tìm thấy {filteredProducts.length} kết quả
              </Text>
              <FlatList
                data={filteredProducts}
                renderItem={renderProductItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.productList}
                showsVerticalScrollIndicator={false}
              />
            </View>
          ) : (
            <View style={styles.historyContainer}>
              {searchText.length === 0 && searchHistory.length > 0 && (
                <>
                  <View style={styles.historyHeader}>
                    <Text style={styles.sectionTitle}>Lịch sử tìm kiếm</Text>
                    <TouchableOpacity 
                      onPress={clearSearchHistory}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.clearHistoryText}>Xóa tất cả</Text>
                    </TouchableOpacity>
                  </View>
                  <FlatList
                    data={searchHistory}
                    renderItem={renderHistoryItem}
                    keyExtractor={(item, index) => index.toString()}
                    showsVerticalScrollIndicator={false}
                  />
                </>
              )}

              {searchText.length === 0 && searchHistory.length === 0 && products.length > 0 && (
                <>
                  <Text style={styles.sectionTitle}>Đề xuất cho bạn</Text>
                  <FlatList
                    data={products.slice(0, 5)}
                    renderItem={renderProductItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.productList}
                    showsVerticalScrollIndicator={false}
                  />
                </>
              )}

              {searchText.length > 0 && filteredProducts.length === 0 && suggestions.length === 0 && (
                <View style={styles.noResultsContainer}>
                  <FontAwesome name="search" size={64} color="#E0E0E0" />
                  <Text style={styles.noResultsText}>Không tìm thấy kết quả</Text>
                  <Text style={styles.noResultsSubtext}>
                    Thử tìm kiếm với từ khóa khác
                  </Text>
                </View>
              )}

              {searchText.length === 0 && searchHistory.length === 0 && products.length === 0 && !isLoading && (
                <View style={styles.noResultsContainer}>
                  <FontAwesome name="coffee" size={64} color="#E0E0E0" />
                  <Text style={styles.noResultsText}>Chưa có sản phẩm</Text>
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
    backgroundColor: "#F8F9FA",
  },
  searchBarContainer: {
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingVertical: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#E8E8E8",
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  clearButton: {
    padding: 4,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: "#666",
    fontWeight: "500",
  },
  suggestionsContainer: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 12,
    paddingVertical: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  suggestionsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    paddingHorizontal: 16,
    paddingBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  suggestionIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#E8F0FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  suggestionText: {
    flex: 1,
    fontSize: 15,
    color: "#333",
    fontWeight: "500",
  },
  historyContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1a1a1a",
    letterSpacing: 0.3,
  },
  clearHistoryText: {
    color: "#0f367aff",
    fontSize: 15,
    fontWeight: "600",
  },
  historyItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    backgroundColor: "#fff",
    marginBottom: 8,
    borderRadius: 12,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  historyTextContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  historyIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#E8F0FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  historyText: {
    flex: 1,
    fontSize: 15,
    color: "#333",
    fontWeight: "500",
  },
  deleteButton: {
    padding: 8,
  },
  resultsContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
    marginBottom: 16,
  },
  productList: {
    paddingBottom: 20,
  },
  productItem: {
    marginBottom: 12,
  },
  productCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  productImageWrapper: {
    width: 70,
    height: 70,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#F5F5F5",
  },
  productImage: {
    width: "100%",
    height: "100%",
  },
  productInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  productName: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 6,
    color: "#1a1a1a",
    lineHeight: 20,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0f367aff",
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 60,
  },
  noResultsText: {
    fontSize: 18,
    color: "#666",
    fontWeight: "600",
    marginTop: 20,
    marginBottom: 8,
  },
  noResultsSubtext: {
    fontSize: 14,
    color: "#999",
  },
});

export default SearchScreen;