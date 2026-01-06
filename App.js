import React from 'react';
import Navigation from './src/components/Navigation'; // Đường dẫn tùy vị trí file bạn
import { AuthProvider } from './src/context/AuthContext';


export default function App() {
  return (
    <AuthProvider>
      <Navigation />
    </AuthProvider>
  );
}