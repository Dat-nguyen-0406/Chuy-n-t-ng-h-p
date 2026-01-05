// src/components/Navigation.js
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { useAuth } from "../context/AuthContext";
import LoginScreen from "../screens/auth/LoginScreen";
import RegisterScreen from "../screens/auth/RegisterScreen";
import CustomerTabNavigator from "./CustomerTabNavigator";
import AdminTabNavigator from "./AdminTabNavigator";

const Stack = createStackNavigator();

const Navigation = () => {
  const { isLoggedIn, userRole } = useAuth();

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isLoggedIn ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen}></Stack.Screen>
            <Stack.Screen
              name="Register"
              component={RegisterScreen}
            ></Stack.Screen>
          </>
        ) : userRole === "admin" ? (
          <Stack.Screen
            name="AdminHome"
            component={AdminTabNavigator}
          ></Stack.Screen>
        ) : (
          <Stack.Screen
            name="CustomerHome"
            component={CustomerTabNavigator}
          ></Stack.Screen>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default Navigation;
