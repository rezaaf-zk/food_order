import React, { useState } from 'react';
import { X, LogIn, UserPlus, LogOut } from 'lucide-react';

export default function AuthMenu({ user, onLoginSuccess, onLogout, isOpen, onClose }) {
  const [mode, setMode] = useState('select'); // select, login, register
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [registerData, setRegisterData] = useState({ phone: '', username: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');

  // Get stored users from localStorage
  const getStoredUsers = () => {
    const saved = localStorage.getItem('foodorder_users');
    return saved ? JSON.parse(saved) : [];
  };

  const saveUser = (userData) => {
    const users = getStoredUsers();
    users.push(userData);
    localStorage.setItem('foodorder_users', JSON.stringify(users));
  };

  const handleLogin = () => {
    setError('');
    
    if (!loginData.username.trim() || !loginData.password.trim()) {
      setError('Username dan password harus diisi!');
      return;
    }

    const users = getStoredUsers();
    const foundUser = users.find(
      u => u.username === loginData.username && u.password === loginData.password
    );

    if (foundUser) {
      onLoginSuccess({
        userType: 'customer',
        username: foundUser.username,
        phone: foundUser.phone,
        userId: foundUser.id,
        loginTime: new Date().toISOString(),
      });
      handleClose();
    } else {
      setError('Username atau password salah!');
    }
  };

  const handleRegister = () => {
    setError('');

    if (!registerData.phone.trim() || !registerData.username.trim() || !registerData.password.trim()) {
      setError('Semua field harus diisi!');
      return;
    }

    if (registerData.password !== registerData.confirmPassword) {
      setError('Password tidak cocok!');
      return;
    }

    if (registerData.password.length < 6) {
      setError('Password minimal 6 karakter!');
      return;
    }

    const users = getStoredUsers();
    const userExists = users.find(u => u.username === registerData.username);

    if (userExists) {
      setError('Username sudah digunakan!');
      return;
    }

    const newUser = {
      id: 'user_' + Date.now(),
      phone: registerData.phone,
      username: registerData.username,
      password: registerData.password,
      userType: 'customer',
      createdAt: new Date().toISOString(),
    };

    saveUser(newUser);
    setError('');
    setMode('login');
    setRegisterData({ phone: '', username: '', password: '', confirmPassword: '' });
    alert('Akun berhasil dibuat! Silahkan login.');
  };

  const handleAdminLogin = () => {
    // Admin hanya bisa login dengan akun khusus
    const adminPassword = localStorage.getItem('foodorder_admin_password') || 'admin123';
    
    if (loginData.username === 'admin' && loginData.password === adminPassword) {
      onLoginSuccess({
        userType: 'admin',
        username: 'admin',
        loginTime: new Date().toISOString(),
      });
      handleClose();
    } else {
      setError('Username atau password admin salah!');
    }
  };

  const handleClose = () => {
    setMode('select');
    setLoginData({ username: '', password: '' });
    setRegisterData({ phone: '', username: '', password: '', confirmPassword: '' });
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 animate-in">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">
            {mode === 'select' ? 'Akun' : mode === 'login' ? 'Login' : 'Daftar Akun'}
          </h2>
          <button onClick={handleClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-700" />
          </button>
        </div>

        {/* Mode Selection */}
        {mode === 'select' && (
          <div className="space-y-3">
            <button
              onClick={() => { setMode('login'); setError(''); }}
              className="w-full flex items-center justify-center gap-2 bg-fuchsia-500 hover:bg-fuchsia-600 text-white py-3 rounded-xl font-semibold transition"
            >
              <LogIn className="w-4 h-4" /> Login
            </button>
            <button
              onClick={() => { setMode('register'); setError(''); }}
              className="w-full flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-xl font-semibold transition"
            >
              <UserPlus className="w-4 h-4" /> Daftar
            </button>
          </div>
        )}

        {/* Login Mode */}
        {mode === 'login' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
              <input
                type="text"
                value={loginData.username}
                onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                placeholder="Masukkan username"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <input
                type="password"
                value={loginData.password}
                onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                placeholder="Masukkan password"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
              />
            </div>
            {error && <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">{error}</div>}
            <button
              onClick={handleLogin}
              className="w-full bg-fuchsia-500 hover:bg-fuchsia-600 text-white py-2 rounded-lg font-semibold transition"
            >
              Login Pelanggan
            </button>
            <button
              onClick={handleAdminLogin}
              className="w-full bg-amber-500 hover:bg-amber-600 text-white py-2 rounded-lg font-semibold transition"
            >
              Login Admin
            </button>
            <button
              onClick={() => setMode('select')}
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 rounded-lg font-semibold transition"
            >
              Kembali
            </button>
          </div>
        )}

        {/* Register Mode */}
        {mode === 'register' && (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nomor HP</label>
              <input
                type="tel"
                value={registerData.phone}
                onChange={(e) => setRegisterData({ ...registerData, phone: e.target.value })}
                placeholder="08XXXXXXXXXX"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <input
                type="text"
                value={registerData.username}
                onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })}
                placeholder="Pilih username"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={registerData.password}
                onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                placeholder="Min 6 karakter"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Konfirmasi Password</label>
              <input
                type="password"
                value={registerData.confirmPassword}
                onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                placeholder="Ulangi password"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            {error && <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">{error}</div>}
            <button
              onClick={handleRegister}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg font-semibold transition text-sm"
            >
              Daftar
            </button>
            <button
              onClick={() => setMode('select')}
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 rounded-lg font-semibold transition text-sm"
            >
              Kembali
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
