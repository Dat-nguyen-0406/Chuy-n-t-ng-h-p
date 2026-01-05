
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet } from 'react-native';
import CoffeeImage from '../../assets/images/cafe.jpg';
const drinks = [
  {
    id: 1,
    name: 'Cà Phê Sữa',
    price: 35000,
    image: CoffeeImage,
    imageName: 'coffee',
    rating: 4.5,
    reviews: 120,
    description: 'Cà phê đậm đà pha với sữa đặc...',
    ingredients: ['Cà phê', 'Sữa đặc'],
    category: 'Cà phê'
  }
];

const DrinkListScreen = ({ navigation }) => {
  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('DrinkDetailScreen', { drinkId: item.id })}
    >
      <Image source={item.image} style={styles.image} />
      <Text style={styles.name}>{item.name}</Text>
      <Text style={styles.price}>{item.price.toLocaleString('vi-VN')} đ</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={drinks}
        keyExtractor={item => item.id.toString()}
        renderItem={renderItem}
        numColumns={2}
        contentContainerStyle={styles.list}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  list: { padding: 10 },
  card: {
    flex: 1,
    backgroundColor: '#f0e5d8',
    margin: 10,
    borderRadius: 10,
    alignItems: 'center',
    padding: 10
  },
  image: { width: 100, height: 100, borderRadius: 10, marginBottom: 10 },
  name: { fontSize: 16, fontWeight: 'bold' },
  price: { fontSize: 14, color: '#8B4513' }
});

export default DrinkListScreen;
