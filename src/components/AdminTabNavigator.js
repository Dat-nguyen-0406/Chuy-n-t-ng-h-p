import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import {
  DashboardStackNavigator,
  CategoriesStackNavigator,
  DrinksStackNavigator,
  OrdersStackNavigator,
} from "./AdminStackNavigator";

const Tab = createBottomTabNavigator();

const AdminTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName;

          if (route.name === "Dashboard") {
            iconName = "grid";
          } else if (route.name === "Categories") {
            iconName = "albums";
          } else if (route.name === "Drinks") {
            iconName = "cafe";
          } else if (route.name === "Orders") {
            iconName = "list";
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: "#8B0000",
        tabBarInactiveTintColor: "gray",
        headerShown: false,
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardStackNavigator}
        options={{ title: "Trang chủ" }}
      />
      <Tab.Screen
        name="Categories"
        component={CategoriesStackNavigator}
        options={{ title: "Danh mục" }}
      />
      <Tab.Screen
        name="Drinks"
        component={DrinksStackNavigator}
        options={{ title: "Đồ uống" }}
      />
      <Tab.Screen
        name="Orders"
        component={OrdersStackNavigator}
        options={{ title: "Đơn hàng" }}
      />
    </Tab.Navigator>
  );
};

export default AdminTabNavigator;
