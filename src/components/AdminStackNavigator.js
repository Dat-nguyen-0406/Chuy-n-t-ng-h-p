import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { View, Text } from "react-native";

// Dashboard Screens
import DashboardScreen from "../screens/admin/DashboardScreen";
import RevenueStatsScreen from "../screens/admin/RevenueStatsScreen";

// Category Screens
import CategoriesScreen from "../screens/admin/CategoriesScreen";
import AddCategoryScreen from "../screens/admin/AddCategoryScreen";
import EditCategoryScreen from "../screens/admin/EditCategoryScreen";

// Drinks Screens
import DrinksScreen from "../screens/admin/DrinksScreen";
import EditDrinkScreen from "../screens/admin/EditDrinkScreen";

import AddDrinkScreen from "../screens/admin/AddDrinkScreen";

import DrinkDetailsScreen from "../screens/admin/DrinkDetailsScreen";

// Orders Screens
import OrdersScreen from "../screens/admin/OrdersScreen";
import OrderDetailsScreen from "../screens/admin/OrderDetailsScreen";

const DashboardStack = createStackNavigator();
const CategoriesStack = createStackNavigator();
const DrinksStack = createStackNavigator();
const OrdersStack = createStackNavigator();

//quản lý các màn hình
export const DashboardStackNavigator = () => {
  return (
    <DashboardStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: "#8B0000",
        },
        headerTintColor: "#fff",
        headerTitleStyle: {
          fontWeight: "bold",
        },
      }}
    >
     
      <DashboardStack.Screen
        name="DashboardMain"
        component={DashboardScreen}
        options={{ title: "Trang chủ Admin" }}
      />
      <DashboardStack.Screen
        name="RevenueStats"
        component={RevenueStatsScreen}
        options={{ title: "Thống kê doanh thu" }}
      />
    </DashboardStack.Navigator>
  );
};

//quản ly
export const CategoriesStackNavigator = () => {
  return (
    <CategoriesStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: "#8B0000",
        },
        headerTintColor: "#fff",
        headerTitleStyle: {
          fontWeight: "bold",
        },
      }}
    >
      <CategoriesStack.Screen
        name="CategoriesList"
        component={CategoriesScreen}
        options={{ title: "Danh mục đồ uống" }}
      />
      <CategoriesStack.Screen
        name="AddCategory"
        component={AddCategoryScreen}
        options={{ title: "Thêm danh mục" }}
      />
      <CategoriesStack.Screen
        name="EditCategory"
        component={EditCategoryScreen}
        options={{ title: "Sửa danh mục" }}
      />
    </CategoriesStack.Navigator>
  );
};

export const DrinksStackNavigator = () => {
  return (
    <DrinksStack.Navigator
      initialRouteName="DrinksList"
      screenOptions={{
        headerStyle: {
          backgroundColor: "#8B0000",
        },
        headerTintColor: "#fff",
        headerTitleStyle: {
          fontWeight: "bold",
        },
      }}
    >
      <DrinksStack.Screen
        name="DrinksList"
        component={DrinksScreen}
        options={{ title: "Danh sách đồ uống" }}
      />
      <DrinksStack.Screen
        name="AddDrink"
        component={AddDrinkScreen}
        options={{ title: "Thêm đồ uống" }}
      />
      <DrinksStack.Screen
        name="EditDrink"
        component={EditDrinkScreen}
        options={{ title: "Sửa đồ uống" }}
      />
      <DrinksStack.Screen
        name="DrinkDetails"
        component={DrinkDetailsScreen}
        options={{ title: "Chi tiết đồ uống" }}
      />
    </DrinksStack.Navigator>
  );
};

export const OrdersStackNavigator = () => {
  return (
    <OrdersStack.Navigator
     screenOptions={{
        headerStyle: {
          backgroundColor: "#8B0000",
        },
        headerTintColor: "#fff",
        headerTitleStyle: {
          fontWeight: "bold",
        },
      }}>
      <OrdersStack.Screen
        name="OrdersList"
        component={OrdersScreen}
        options={{ title: "Đơn hàng" }}
      />
      <OrdersStack.Screen
        name="OrderDetails"
        component={OrderDetailsScreen}
        options={{ title: "Chi tiết đơn hàng" }}
      />
    </OrdersStack.Navigator>
  );
};
