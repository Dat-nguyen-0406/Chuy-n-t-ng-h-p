import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import { Ionicons } from "@expo/vector-icons";

// Screens
import HomeScreen from "../screens/customer/HomeScreen";
import DrinkListScreen from "../screens/customer/DrinkListScreen";
import ChatbotScreen from "../screens/customer/ChatbotScreen"; // Import file vừa tạo
import SearchScreen from "../screens/customer/SearchScreen";
import CartScreen from "../screens/customer/CartScreen";
import ProfileScreen from "../screens/customer/ProfileScreen";
import OrderScreen from "../screens/customer/OrderScreen";
import ProfileDetailScreen from "../screens/customer/ProfileDetailScreen";

const Tab = createBottomTabNavigator();
const HomeStack = createStackNavigator();
const SearchStack = createStackNavigator();
const CartStack = createStackNavigator();
const ProfileStack = createStackNavigator();

const HomeStackScreen = () => (
  <HomeStack.Navigator
   screenOptions={{
        headerStyle: {
          backgroundColor: "#8B0000",
        },
        headerTintColor: "#fff",
        headerTitleStyle: {
          fontWeight: "bold",
        },
      }}>
    <HomeStack.Screen
      name="Home"
      component={HomeScreen}
      options={{ title: "Trang chủ" }}
    />
    <HomeStack.Screen
      name="DrinkList"
      component={DrinkListScreen}
      options={{ title: "Danh sách đồ uống" }}
    />
    <HomeStack.Screen
      name="Order"
      component={OrderScreen}
      options={{ title: "Order" }}
    ></HomeStack.Screen>
  </HomeStack.Navigator>
);

const SearchStackScreen = () => (
  <SearchStack.Navigator
   screenOptions={{
        headerStyle: {
          backgroundColor: "#8B0000",
        },
        headerTintColor: "#fff",
        headerTitleStyle: {
          fontWeight: "bold",
        },
      }}>
    <SearchStack.Screen
      name="Search"
      component={SearchScreen}
      options={{ title: "Tìm kiếm" }}
    />
    <SearchStack.Screen
       name="Order"
      component={OrderScreen}
      options={{ title: "Order" }}
    />
  </SearchStack.Navigator>
);

const CartStackScreen = () => (
  <CartStack.Navigator screenOptions={{
        headerStyle: {
          backgroundColor: "#8B0000",
        },
        headerTintColor: "#fff",
        headerTitleStyle: {
          fontWeight: "bold",
        },
      }}>
    <CartStack.Screen
      name="Cart"
      component={CartScreen}
      options={{ title: "Đơn Hàng" }}
    />
  </CartStack.Navigator>
);

const ProfileStackScreen = () => (
  <ProfileStack.Navigator
   screenOptions={{
        headerStyle: {
          backgroundColor: "#8B0000",
        },
        headerTintColor: "#fff",
        headerTitleStyle: {
          fontWeight: "bold",
        },
      }}>
    <ProfileStack.Screen
      name="Profile"
      component={ProfileScreen}
      options={{ title: "Tài khoản" }}
    />
    <ProfileStack.Screen
      name="ProfileDetail"
      component={ProfileDetailScreen}
      options={{ title: "Thông tin tài khoản" }}
    ></ProfileStack.Screen>
     <ProfileStack.Screen
      name="Cart"
      component={CartScreen}
      options={{ title: "Đơn Hàng" }}
    ></ProfileStack.Screen>
    <ProfileStack.Screen
     name="Chatbot" 
     component={ChatbotScreen} 
     options={{ title: "Hỗ trợ trực tuyến" }} />
  </ProfileStack.Navigator>
  
);

const CustomerTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === "HomeTab") {
            iconName = focused ? "home" : "home-outline";
          } else if (route.name === "SearchTab") {
            iconName = focused ? "search" : "search-outline";
          } else if (route.name === "CartTab") {
            iconName = focused ? "cart" : "cart-outline";
          } else if (route.name === "ProfileTab") {
            iconName = focused ? "person" : "person-outline";
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: "#8B4513",
        tabBarInactiveTintColor: "gray",
      })}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStackScreen}
        options={{ title: "Trang chủ", headerShown: false }}
      />
      <Tab.Screen
        name="SearchTab"
        component={SearchStackScreen}
        options={{ title: "Tìm kiếm", headerShown: false }}
      />
      <Tab.Screen
        name="CartTab"
        component={CartStackScreen}
        options={{ title: "Đơn hàng", headerShown: false }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStackScreen}
        options={{ title: "Tài khoản", headerShown: false }}
      />
    </Tab.Navigator>
  );
};

export default CustomerTabNavigator;
