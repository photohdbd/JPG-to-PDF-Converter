import React, { useState } from 'react';
import { Page } from '../App';
import { auth, googleProvider } from '../firebase';
import { signInWithEmailAndPassword, signInWithPopup } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { AlertTriangleIcon, GoogleIcon } from '../components/Icons';

interface LoginPageProps {
  onNavigate: (page: Page) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigate }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      onNavigate('home');
    } catch (err: any) {
      setError("Failed to log in. Please check your email and password.");
    }
    setLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError('');
    try {
        await signInWithPopup(auth, googleProvider);
        onNavigate('home');
    } catch (error: any) {
        if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
             setError("Sign-in popup was closed. Please try again.");
        } else if (error.code === 'auth/popup-blocked') {
            setError("Popup blocked by browser. Please allow popups for this site.");
        } else {
            setError("Failed to sign in with Google. Please try again.");
        }
    }
    setGoogleLoading(false);
  }

  return (
    <div className="w-full max-w-md">
      <div className="bg-gray-800 border border-gray-700 p-8 rounded-xl shadow-2xl">
        <h2 className="text-2xl font-bold text-center text-white mb-6">Login</h2>
        {error && (
          <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-lg mb-4 flex items-center">
            <AlertTriangleIcon className="w-5 h-5 mr-3" />
            <span>{error}</span>
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-400 text-sm font-bold mb-2" htmlFor="email">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-brand-primary"
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-gray-400 text-sm font-bold mb-2" htmlFor="password">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-brand-primary"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading || googleLoading}
            className="w-full bg-brand-primary text-white font-bold py-3 rounded-lg hover:bg-brand-secondary transition-colors disabled:bg-gray-600"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="my-4 flex items-center">
            <div className="flex-grow border-t border-gray-600"></div>
            <span className="flex-shrink mx-4 text-gray-400">OR</span>
            <div className="flex-grow border-t border-gray-600"></div>
        </div>

        <button
            onClick={handleGoogleSignIn}
            disabled={loading || googleLoading}
            className="w-full bg-gray-700 text-white font-bold py-3 rounded-lg hover:bg-gray-600 transition-colors disabled:bg-gray-600 flex items-center justify-center gap-2"
        >
            <GoogleIcon className="w-5 h-5" />
            {googleLoading ? 'Signing in...' : 'Sign in with Google'}
        </button>

        <p className="text-center text-gray-400 text-sm mt-6">
          Don't have an account?{' '}
          <button onClick={() => onNavigate('signup')} className="text-brand-secondary hover:underline font-semibold">
            Sign Up
          </button>
        </p>
      </div>
    </div>
  );
};