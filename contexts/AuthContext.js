import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/FirebaseConfig';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        // Buscar dados do perfil do usuário no Firestore
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setUserProfile(userDoc.data());
          }
        } catch (error) {
          console.error('Erro ao buscar perfil do usuário:', error);
        }
      } else {
        setUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const register = async (email, password, userData) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Atualizar o perfil do usuário
      await updateProfile(user, {
        displayName: userData.name,
      });

      // Salvar dados adicionais no Firestore
      const userDocData = {
        uid: user.uid,
        email: user.email,
        name: userData.name,
        userType: userData.userType || 'user', // 'user' ou 'admin'
        createdAt: new Date().toISOString(),
        ...userData,
      };

      await setDoc(doc(db, 'users', user.uid), userDocData);
      setUserProfile(userDocData);

      return { success: true, user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const login = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return { success: true, user: userCredential.user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setUserProfile(null);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const updateUserProfile = async (updatedData) => {
    try {
      if (user) {
        await setDoc(doc(db, 'users', user.uid), updatedData, { merge: true });
        setUserProfile(prev => ({ ...prev, ...updatedData }));
        return { success: true };
      }
      return { success: false, error: 'Usuário não encontrado' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const value = {
    user,
    userProfile,
    loading,
    register,
    login,
    logout,
    updateUserProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

