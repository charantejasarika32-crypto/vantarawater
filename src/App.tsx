import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingCart, Menu, X, Plus, Minus, ArrowRight, 
  Droplet, Truck, ShieldCheck, Award, MapPin, Phone, 
  Mail, ChevronRight, CheckCircle2, User, LayoutDashboard,
  LogOut, Trash2, MessageSquare, Send, Bot, Sparkles,
  Calculator, RefreshCw, Check, Star, Search, Clock,
  ExternalLink, FileText, Download, AlertCircle, Info
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ASSETS } from './assets';

// Types
export interface Product {
  id: string;
  name: string;
  size: string;
  price: number;
  image: string;
  badge?: string;
  popular?: boolean;
  description: string;
  bottleCount?: number;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  landmark?: string;
  city: string;
  pincode: string;
  deliveryNotes?: string;
  paymentMethod: string;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  totalAmount: number;
  status: 'New' | 'Confirmed' | 'Preparing' | 'Out for Delivery' | 'Delivered';
  createdAt: number;
  estimatedDelivery?: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  time?: string;
}

// Initial Products
const PRODUCTS: Product[] = [
  {
    id: 'vpw-1000',
    name: 'Vantara™ Premium Water (1 Litre)',
    size: '1 Litre (1000ml) Bottle',
    price: 40,
    image: ASSETS.bottle1000,
    badge: 'Official 1L Label',
    popular: true,
    description: 'Wrapped in our signature alpine mountain label. Pristine, mineral-balanced water with FSSAI Lic. No. 13621019000674.',
    bottleCount: 1
  },
  {
    id: 'vpw-500',
    name: 'Vantara™ Premium Water (500ml)',
    size: '500ml Compact Bottle',
    price: 20,
    image: ASSETS.bottle500,
    badge: 'On The Go',
    popular: false,
    description: 'Compact 500ml edition with the official Vantara mountain label. Ideal for meetings, workouts, and travel.',
    bottleCount: 1
  },
  {
    id: 'vpw-1000-crate',
    name: 'Family Crate (12 x 1 Litre)',
    size: '12 x 1L Crate Box',
    price: 440,
    image: ASSETS.bottle1000,
    badge: 'Save ₹40',
    popular: true,
    description: '12 sealed 1-litre bottles in official packaging. Bulk home stock delivered right to your kitchen or office.',
    bottleCount: 12
  },
  {
    id: 'vpw-500-crate',
    name: 'Event Pack (24 x 500ml)',
    size: '24 x 500ml Crate Box',
    price: 440,
    image: ASSETS.bottle500,
    badge: 'Save ₹40',
    popular: false,
    description: '24 sealed 500ml bottles with official Vantara mountain labels. Ideal for catering, parties, and conferences.',
    bottleCount: 24
  }
];

// Initial pre-loaded orders for demo/admin presentation
const INITIAL_ORDERS: Order[] = [
  {
    id: 'VAN-84920',
    customerName: 'Suresh Varma',
    customerPhone: '+91 98480 23411',
    deliveryAddress: 'Flat 302, Sri Sai Residency, Near Old Bus Stand',
    landmark: 'Opposite State Bank of India',
    city: 'Tadepalligudem',
    pincode: '534101',
    deliveryNotes: 'Please ring bell twice upon arrival',
    paymentMethod: 'UPI on Delivery',
    items: [
      { ...PRODUCTS[0], quantity: 10 },
      { ...PRODUCTS[1], quantity: 6 }
    ],
    subtotal: 520,
    deliveryFee: 0,
    totalAmount: 520,
    status: 'Out for Delivery',
    createdAt: Date.now() - 35 * 60 * 1000,
    estimatedDelivery: 'Within 25 mins'
  },
  {
    id: 'VAN-84918',
    customerName: 'K. Lakshmi Prasad',
    customerPhone: '+91 94901 88320',
    deliveryAddress: 'Door No 4-22/1, Ramannagudem Road',
    landmark: 'Near Anjaneya Temple',
    city: 'Tadepalligudem',
    pincode: '534101',
    deliveryNotes: 'Leave near security gate if unavailable',
    paymentMethod: 'Cash on Delivery',
    items: [
      { ...PRODUCTS[2], quantity: 1 }
    ],
    subtotal: 440,
    deliveryFee: 30,
    totalAmount: 470,
    status: 'Preparing',
    createdAt: Date.now() - 75 * 60 * 1000,
    estimatedDelivery: 'Within 45 mins'
  },
  {
    id: 'VAN-84895',
    customerName: 'Dr. Venkat Rao',
    customerPhone: '+91 91772 44901',
    deliveryAddress: 'Care Polyclinic, Subhash Road',
    landmark: 'Near Clock Tower Center',
    city: 'Tadepalligudem',
    pincode: '534101',
    paymentMethod: 'UPI on Delivery',
    items: [
      { ...PRODUCTS[0], quantity: 15 }
    ],
    subtotal: 600,
    deliveryFee: 0,
    totalAmount: 600,
    status: 'Delivered',
    createdAt: Date.now() - 180 * 60 * 1000,
    estimatedDelivery: 'Delivered'
  }
];

export default function App() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentView, setCurrentView] = useState<'home' | 'checkout' | 'admin' | 'tracking'>('home');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Cart state with persistence
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('vantara_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Orders state with persistence
  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const saved = localStorage.getItem('vantara_orders');
      return saved ? JSON.parse(saved) : INITIAL_ORDERS;
    } catch {
      return INITIAL_ORDERS;
    }
  });

  // Latest placed order for receipt modal
  const [lastPlacedOrder, setLastPlacedOrder] = useState<Order | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Filter & search in Admin
  const [adminStatusFilter, setAdminStatusFilter] = useState<string>('All');
  const [adminSearch, setAdminSearch] = useState('');
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<Order | null>(null);

  // Daily Hydration Calculator state
  const [calcWeight, setCalcWeight] = useState<number>(68);
  const [calcActivity, setCalcActivity] = useState<'sedentary' | 'moderate' | 'active'>('moderate');
  const [calcClimate, setCalcClimate] = useState<'normal' | 'hot'>('hot');

  // AI Chat state
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    {
      role: 'model',
      text: "Namaste! Welcome to Vantara Premium Water. I'm your Hydration Assistant. How can I help you today? Ask me about our pure water process, delivery in Tadepalligudem, bottle prices, or bulk event bookings!",
      time: 'Just now'
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Save cart to local storage
  useEffect(() => {
    try {
      localStorage.setItem('vantara_cart', JSON.stringify(cart));
    } catch (e) {
      console.error(e);
    }
  }, [cart]);

  // Save orders to local storage
  useEffect(() => {
    try {
      localStorage.setItem('vantara_orders', JSON.stringify(orders));
    } catch (e) {
      console.error(e);
    }
  }, [orders]);

  // Scroll chat to bottom when updated
  useEffect(() => {
    if (isChatOpen) {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory, isChatOpen]);

  // Cart operations
  const addToCart = (product: Product, quantity = 1) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item);
      }
      return [...prev, { ...product, quantity }];
    });
    setIsCartOpen(true);
  };

  const updateCartQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQ = item.quantity + delta;
        return newQ > 0 ? { ...item, quantity: newQ } : item;
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const clearCart = () => {
    setCart([]);
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const freeDeliveryThreshold = 500;
  const deliveryFee = cartTotal > 0 && cartTotal < freeDeliveryThreshold ? 30 : 0;
  const finalTotal = cartTotal + deliveryFee;
  const amountNeededForFreeDelivery = Math.max(0, freeDeliveryThreshold - cartTotal);

  const navigateTo = (view: 'home' | 'checkout' | 'admin' | 'tracking') => {
    setCurrentView(view);
    setIsMobileMenuOpen(false);
    setIsCartOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Chat message submission
  const handleSendMessage = async (textToSend?: string) => {
    const messageText = textToSend || chatInput;
    if (!messageText.trim()) return;

    const userMessage: ChatMessage = { 
      role: 'user', 
      text: messageText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatHistory(prev => [...prev, userMessage]);
    if (!textToSend) setChatInput('');
    setIsChatLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...chatHistory, userMessage].map(m => ({
            role: m.role,
            text: m.text
          }))
        })
      });

      if (!response.ok) {
        throw new Error('Chat network error');
      }

      const data = await response.json();
      const reply = data.reply || "Thank you for reaching out to Vantara Premium Water! We are available for doorstep delivery across Tadepalligudem.";
      
      setChatHistory(prev => [...prev, {
        role: 'model',
        text: reply,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } catch {
      // Safe fallback response
      let fallback = "Thank you for contacting Vantara! We deliver pure, hygienic water across Tadepalligudem. Call our helpline at +91 98765 43210 for prompt support.";
      const lower = messageText.toLowerCase();
      if (lower.includes('price') || lower.includes('cost') || lower.includes('rate')) {
        fallback = "Our 1000ml bottle is ₹40, and 500ml bottle is ₹20. Family and event bulk crates of 12 or 24 are available at ₹440 with free delivery over ₹500!";
      } else if (lower.includes('delivery') || lower.includes('area') || lower.includes('address')) {
        fallback = "We deliver across Tadepalligudem and Ramannagudem within 45-90 minutes. Delivery is 100% FREE on orders of ₹500 and above (or ₹30 below ₹500).";
      } else if (lower.includes('founder') || lower.includes('who')) {
        fallback = "Vantara Premium Water was founded by B.U.V Bhaskar Reddy & B.Manikanta Reddy at Building No: 431/5, Ramannagudem, Tadepalligudem.";
      }

      setChatHistory(prev => [...prev, {
        role: 'model',
        text: fallback,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Daily water calculator logic
  const calculatedIntakeLiters = (() => {
    let base = calcWeight * 0.033; // 33ml per kg
    if (calcActivity === 'moderate') base += 0.5;
    if (calcActivity === 'active') base += 1.0;
    if (calcClimate === 'hot') base += 0.5;
    return Math.round(base * 10) / 10;
  })();

  const recommended1000mlBottles = Math.ceil(calculatedIntakeLiters);

  // Trigger celebration confetti
  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#0284c7', '#06b6d4', '#38bdf8', '#0ea5e9', '#ffffff']
      });
    } catch {
      // ignore
    }
  };

  // -------------------------------------------------------------
  // NAVBAR COMPONENT
  // -------------------------------------------------------------
  const Navbar = () => (
    <nav className="fixed w-full z-40 transition-all duration-300 bg-white/90 backdrop-blur-md border-b border-blue-100/80 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo & Brand Name */}
          <div 
            className="flex items-center space-x-3 cursor-pointer select-none" 
            onClick={() => navigateTo('home')}
          >
            <img 
              src={ASSETS.logo} 
              alt="Vantara Premium Water" 
              className="h-12 w-12 sm:h-14 sm:w-14 object-cover rounded-xl shadow-md border border-blue-100" 
            />
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                  VANTARA
                </span>
                <span className="text-[10px] font-bold bg-cyan-100 text-cyan-800 px-1.5 py-0.5 rounded uppercase tracking-wider">
                  Pure
                </span>
              </div>
              <p className="text-[11px] font-medium text-blue-600 tracking-wide uppercase">
                Premium Packaged Water
              </p>
            </div>
          </div>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center space-x-8">
            <button 
              onClick={() => navigateTo('home')} 
              className={`text-sm font-semibold transition-colors ${currentView === 'home' ? 'text-blue-600' : 'text-slate-600 hover:text-blue-600'}`}
            >
              Home
            </button>
            <a 
              href="#products" 
              onClick={(e) => { 
                if (currentView !== 'home') { 
                  e.preventDefault(); 
                  navigateTo('home'); 
                  setTimeout(() => {
                    const el = document.getElementById('products');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }, 150); 
                } 
              }} 
              className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors"
            >
              Products
            </a>
            <a 
              href="#label" 
              onClick={(e) => { 
                if (currentView !== 'home') { 
                  e.preventDefault(); 
                  navigateTo('home'); 
                  setTimeout(() => {
                    const el = document.getElementById('label');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }, 150); 
                } 
              }} 
              className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors"
            >
              Official Label
            </a>
            <a 
              href="#purity" 
              onClick={(e) => {
                if (currentView !== 'home') {
                  e.preventDefault();
                  navigateTo('home');
                  setTimeout(() => {
                    document.getElementById('purity')?.scrollIntoView({ behavior: 'smooth' });
                  }, 150);
                }
              }}
              className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors"
            >
              8-Stage Purity
            </a>
            <a 
              href="#calculator" 
              onClick={(e) => {
                if (currentView !== 'home') {
                  e.preventDefault();
                  navigateTo('home');
                  setTimeout(() => {
                    document.getElementById('calculator')?.scrollIntoView({ behavior: 'smooth' });
                  }, 150);
                }
              }}
              className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors flex items-center space-x-1"
            >
              <Calculator size={15} className="text-blue-500" />
              <span>Hydration Calc</span>
            </a>
            <a 
              href="#delivery" 
              onClick={(e) => {
                if (currentView !== 'home') {
                  e.preventDefault();
                  navigateTo('home');
                  setTimeout(() => {
                    document.getElementById('delivery')?.scrollIntoView({ behavior: 'smooth' });
                  }, 150);
                }
              }}
              className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors"
            >
              Delivery Areas
            </a>
            <a 
              href="#about" 
              onClick={(e) => {
                if (currentView !== 'home') {
                  e.preventDefault();
                  navigateTo('home');
                  setTimeout(() => {
                    document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' });
                  }, 150);
                }
              }}
              className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors"
            >
              Founders & Story
            </a>

            {/* Admin Toggle & Cart */}
            <div className="flex items-center space-x-4 border-l border-slate-200 pl-6">
              <button 
                onClick={() => {
                  const nextAdmin = !isAdmin;
                  setIsAdmin(nextAdmin);
                  if (nextAdmin) navigateTo('admin');
                  else if (currentView === 'admin') navigateTo('home');
                }} 
                className={`p-2 rounded-xl text-xs font-semibold transition-all flex items-center space-x-1.5 ${
                  isAdmin 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
                title="Toggle Admin Dashboard"
              >
                <LayoutDashboard size={16} />
                <span>{isAdmin ? 'Admin On' : 'Admin'}</span>
              </button>

              <button 
                onClick={() => setIsCartOpen(true)}
                className="relative p-2.5 text-slate-700 bg-blue-50 hover:bg-blue-100 hover:text-blue-700 transition-all rounded-xl border border-blue-200 shadow-sm flex items-center space-x-2"
                aria-label="View Cart"
              >
                <ShoppingCart size={20} className="text-blue-600" />
                <span className="font-bold text-xs sm:text-sm text-slate-900">
                  ₹{cartTotal}
                </span>
                {cart.length > 0 && (
                  <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-blue-600 rounded-full">
                    {cart.reduce((sum, i) => sum + i.quantity, 0)}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Mobile Right Controls */}
          <div className="flex md:hidden items-center space-x-3">
            <button 
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 text-slate-700 bg-blue-50 rounded-lg border border-blue-100"
            >
              <ShoppingCart size={20} className="text-blue-600" />
              {cart.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold text-white bg-blue-600 rounded-full">
                  {cart.reduce((sum, i) => sum + i.quantity, 0)}
                </span>
              )}
            </button>
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
              className="text-slate-700 p-2 rounded-lg hover:bg-slate-100"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-b border-slate-200 px-6 py-5 space-y-3 shadow-lg"
          >
            <button 
              onClick={() => navigateTo('home')} 
              className="block w-full text-left font-semibold text-slate-800 hover:text-blue-600 py-2"
            >
              Home
            </button>
            <a 
              href="#products" 
              onClick={() => { setIsMobileMenuOpen(false); navigateTo('home'); }} 
              className="block font-semibold text-slate-800 hover:text-blue-600 py-2"
            >
              Our Products
            </a>
            <a 
              href="#label" 
              onClick={() => { setIsMobileMenuOpen(false); navigateTo('home'); }} 
              className="block font-semibold text-slate-800 hover:text-blue-600 py-2"
            >
              Official Bottle Label
            </a>
            <a 
              href="#purity" 
              onClick={() => { setIsMobileMenuOpen(false); navigateTo('home'); }} 
              className="block font-semibold text-slate-800 hover:text-blue-600 py-2"
            >
              8-Stage Purity Process
            </a>
            <a 
              href="#calculator" 
              onClick={() => { setIsMobileMenuOpen(false); navigateTo('home'); }} 
              className="block font-semibold text-slate-800 hover:text-blue-600 py-2"
            >
              Daily Hydration Calculator
            </a>
            <a 
              href="#delivery" 
              onClick={() => { setIsMobileMenuOpen(false); navigateTo('home'); }} 
              className="block font-semibold text-slate-800 hover:text-blue-600 py-2"
            >
              Delivery Coverage (Tadepalligudem)
            </a>
            <a 
              href="#about" 
              onClick={() => { setIsMobileMenuOpen(false); navigateTo('home'); }} 
              className="block font-semibold text-slate-800 hover:text-blue-600 py-2"
            >
              Founders: Bhaskar & Manikanta Reddy
            </a>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <button 
                onClick={() => {
                  const next = !isAdmin;
                  setIsAdmin(next);
                  setIsMobileMenuOpen(false);
                  if (next) navigateTo('admin');
                  else navigateTo('home');
                }} 
                className={`px-4 py-2 text-sm font-bold rounded-xl flex items-center space-x-2 ${
                  isAdmin ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'
                }`}
              >
                <LayoutDashboard size={18} />
                <span>{isAdmin ? 'Exit Admin Mode' : 'Open Admin Panel'}</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );

  // -------------------------------------------------------------
  // CART DRAWER COMPONENT
  // -------------------------------------------------------------
  const CartDrawer = () => (
    <AnimatePresence>
      {isCartOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            onClick={() => setIsCartOpen(false)}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50"
          />
          <motion.div 
            initial={{ x: '100%' }} 
            animate={{ x: 0 }} 
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center space-x-2">
                <ShoppingCart className="text-blue-600" size={22} />
                <h2 className="text-xl font-black text-slate-900">Your Hydration Bag</h2>
              </div>
              <button 
                onClick={() => setIsCartOpen(false)} 
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Free Delivery Bar */}
            <div className="p-4 bg-blue-50/70 border-b border-blue-100">
              {cartTotal >= freeDeliveryThreshold ? (
                <div className="flex items-center space-x-2 text-emerald-800 text-sm font-bold">
                  <CheckCircle2 size={18} className="text-emerald-600 flex-shrink-0" />
                  <span>Congratulations! You unlocked FREE Doorstep Delivery!</span>
                </div>
              ) : (
                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1.5">
                    <span>Add ₹{amountNeededForFreeDelivery} more for FREE delivery</span>
                    <span>₹{cartTotal} / ₹{freeDeliveryThreshold}</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-cyan-400 h-full transition-all duration-300"
                      style={{ width: `${Math.min(100, (cartTotal / freeDeliveryThreshold) * 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
            
            {/* Item List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-4">
                  <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center text-blue-400">
                    <Droplet size={38} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">Your cart is empty</h3>
                    <p className="text-sm text-slate-500 mt-1 max-w-xs">
                      Refresh your day with pure, laboratory-tested Vantara mineral water.
                    </p>
                  </div>
                  <button 
                    onClick={() => {
                      setIsCartOpen(false);
                      const el = document.getElementById('products');
                      el?.scrollIntoView({ behavior: 'smooth' });
                    }} 
                    className="bg-blue-600 text-white font-bold px-6 py-2.5 rounded-xl shadow-md hover:bg-blue-700 transition-all text-sm"
                  >
                    View Bottles & Crates
                  </button>
                </div>
              ) : (
                cart.map(item => (
                  <div 
                    key={item.id} 
                    className="flex gap-4 items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-100 hover:border-blue-200 transition-all"
                  >
                    <div className="h-16 w-14 flex-shrink-0 bg-blue-50/50 rounded-xl p-1.5 flex items-center justify-center">
                      <img 
                        src={item.image} 
                        alt={item.name} 
                        className="h-full w-full object-contain mix-blend-multiply" 
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-slate-900 text-sm truncate">{item.name}</h4>
                      <p className="text-slate-500 text-xs font-medium">{item.size} • ₹{item.price}</p>
                      <div className="flex items-center justify-between mt-2.5">
                        <div className="flex items-center space-x-2 bg-slate-100 rounded-lg px-2 py-1">
                          <button 
                            onClick={() => updateCartQuantity(item.id, -1)} 
                            className="text-slate-600 hover:text-blue-600 p-0.5"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="text-xs font-bold w-5 text-center text-slate-800">{item.quantity}</span>
                          <button 
                            onClick={() => updateCartQuantity(item.id, 1)} 
                            className="text-slate-600 hover:text-blue-600 p-0.5"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                        <span className="font-extrabold text-sm text-slate-900">
                          ₹{item.price * item.quantity}
                        </span>
                      </div>
                    </div>
                    <button 
                      onClick={() => removeFromCart(item.id)} 
                      className="p-2 text-slate-300 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                      title="Remove item"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Bottom Summary & Checkout */}
            {cart.length > 0 && (
              <div className="p-6 border-t border-slate-200 bg-slate-50 space-y-4">
                <div className="space-y-2 text-sm text-slate-600">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="font-bold text-slate-900">₹{cartTotal}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="flex items-center space-x-1">
                      <span>Delivery (Tadepalligudem)</span>
                      {deliveryFee === 0 && (
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.5 rounded">FREE</span>
                      )}
                    </span>
                    <span className="font-bold text-slate-900">
                      {deliveryFee === 0 ? '₹0' : `₹${deliveryFee}`}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center text-lg font-black text-slate-900 pt-3 border-t border-slate-200">
                  <span>Grand Total</span>
                  <span className="text-blue-600 text-2xl font-black">₹{finalTotal}</span>
                </div>

                <button 
                  onClick={() => navigateTo('checkout')}
                  className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white font-extrabold py-4 rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all flex items-center justify-center space-x-2"
                >
                  <span>Proceed to Doorstep Delivery</span>
                  <ArrowRight size={18} />
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  // -------------------------------------------------------------
  // AI HYDRATION ASSISTANT WIDGET
  // -------------------------------------------------------------
  const AIChatWidget = () => (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      <AnimatePresence>
        {isChatOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.94 }}
            transition={{ duration: 0.2 }}
            className="bg-white border border-slate-200 shadow-2xl rounded-3xl w-[360px] sm:w-[420px] h-[540px] mb-4 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-cyan-600 p-4 text-white flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                  <Bot size={22} className="text-white" />
                </div>
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="font-bold text-base leading-tight">Vantara AI Assistant</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  </div>
                  <p className="text-xs text-blue-100">Live Support & Hydration Guide</p>
                </div>
              </div>
              <button 
                onClick={() => setIsChatOpen(false)} 
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Quick Suggestion Chips */}
            <div className="px-4 py-2 bg-slate-100 border-b border-slate-200 flex gap-2 overflow-x-auto text-xs no-scrollbar">
              {[
                "Bottle Pricing?",
                "Delivery in Tadepalligudem?",
                "8-Stage Purity?",
                "Founder details?"
              ].map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(chip)}
                  className="bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 px-2.5 py-1 rounded-full whitespace-nowrap transition-colors font-medium shadow-2xs"
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Chat Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50">
              {chatHistory.map((msg, index) => (
                <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                    msg.role === 'user' 
                      ? 'bg-blue-600 text-white rounded-tr-none' 
                      : 'bg-white text-slate-800 border border-slate-200/70 rounded-tl-none leading-relaxed'
                  }`}>
                    <div className="whitespace-pre-line">{msg.text}</div>
                    {msg.time && (
                      <div className={`text-[10px] mt-1 text-right ${msg.role === 'user' ? 'text-blue-200' : 'text-slate-400'}`}>
                        {msg.time}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isChatLoading && (
                <div className="flex justify-start">
                  <div className="bg-white text-slate-500 border border-slate-200 rounded-2xl rounded-tl-none px-4 py-3 text-sm shadow-sm flex items-center space-x-2">
                    <span className="text-xs font-medium text-slate-500">Vantara Assistant is thinking</span>
                    <span className="flex space-x-1">
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></span>
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                    </span>
                  </div>
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Chat Input */}
            <div className="p-3 border-t border-slate-200 bg-white">
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center space-x-2"
              >
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask about water, delivery, prices..."
                  className="flex-1 bg-slate-100 text-slate-900 placeholder-slate-400 text-sm px-4 py-2.5 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  disabled={isChatLoading}
                />
                <button 
                  type="submit"
                  disabled={!chatInput.trim() || isChatLoading}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white p-2.5 rounded-xl transition-colors shadow-md"
                >
                  <Send size={16} />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsChatOpen(!isChatOpen)}
        className="group relative bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white p-4 rounded-full shadow-2xl shadow-blue-500/40 transition-transform hover:scale-105 active:scale-95 flex items-center justify-center border-2 border-white"
        aria-label="Toggle Hydration Assistant"
      >
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-300 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-400"></span>
        </span>
        {isChatOpen ? <X size={24} /> : <MessageSquare size={24} />}
      </button>
    </div>
  );

  // -------------------------------------------------------------
  // HOME VIEW
  // -------------------------------------------------------------
  const HomeView = () => {
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

    const handleMouseMove = (e: React.MouseEvent) => {
      const { clientX, clientY } = e;
      const { innerWidth, innerHeight } = window;
      const x = (clientX / innerWidth - 0.5) * 30;
      const y = (clientY / innerHeight - 0.5) * -30;
      setMousePosition({ x, y });
    };

    return (
      <div className="min-h-screen bg-slate-50 pb-20 overflow-hidden" onMouseMove={handleMouseMove}>
        {/* ================= HERO SECTION ================= */}
        <div className="relative pt-28 pb-20 lg:pt-36 lg:pb-28 overflow-hidden bg-gradient-to-b from-sky-100/90 via-blue-50/70 to-white">
          {/* Background Ambient Aquatic Glows */}
          <div className="absolute top-10 right-10 w-96 h-96 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-full blur-[140px] opacity-25 pointer-events-none" />
          <div className="absolute bottom-10 left-10 w-80 h-80 bg-gradient-to-tr from-blue-400 to-teal-300 rounded-full blur-[120px] opacity-20 pointer-events-none" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
              
              {/* Left Column: Brand Story & CTA */}
              <div className="lg:col-span-6 text-center lg:text-left z-20">
                <div className="inline-flex items-center space-x-2 bg-white/80 backdrop-blur-md px-4 py-2 rounded-full text-xs sm:text-sm font-bold text-blue-900 border border-blue-200 shadow-sm mb-6">
                  <Droplet size={16} className="text-cyan-600 animate-pulse" />
                  <span>Doorstep Delivery in Tadepalligudem</span>
                  <span className="bg-blue-600 text-white px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider">
                    Free &gt; ₹500
                  </span>
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.15] mb-6">
                  Pure Water. <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-700 via-cyan-600 to-teal-500">
                    Pure Confidence.
                  </span>
                </h1>

                <p className="text-base sm:text-lg text-slate-600 leading-relaxed mb-8 max-w-xl mx-auto lg:mx-0">
                  <span className="font-semibold text-slate-800">Pure by Nature, Better for Tomorrow.</span> Founded by 
                  <span className="font-semibold text-blue-700"> B.U.V Bhaskar Reddy</span> &amp; 
                  <span className="font-semibold text-blue-700"> B.Manikanta Reddy</span>. 
                  We deliver safe, hygienic, and refreshing packaged mineral water directly to homes, offices, and celebrations across Tadepalligudem.
                </p>

                {/* Badges / Key Specs */}
                <div className="grid grid-cols-3 gap-3 mb-8 max-w-lg mx-auto lg:mx-0">
                  <div className="bg-white/90 backdrop-blur-sm p-3 rounded-2xl border border-blue-100 shadow-xs text-center">
                    <p className="text-xs text-slate-500 font-medium">Single 1000ml</p>
                    <p className="text-lg font-black text-blue-700">₹40</p>
                  </div>
                  <div className="bg-white/90 backdrop-blur-sm p-3 rounded-2xl border border-blue-100 shadow-xs text-center">
                    <p className="text-xs text-slate-500 font-medium">Single 500ml</p>
                    <p className="text-lg font-black text-blue-700">₹20</p>
                  </div>
                  <div className="bg-white/90 backdrop-blur-sm p-3 rounded-2xl border border-blue-100 shadow-xs text-center">
                    <p className="text-xs text-slate-500 font-medium">Delivery</p>
                    <p className="text-xs font-bold text-emerald-600 mt-1">45-90 Mins</p>
                  </div>
                </div>

                {/* CTAs */}
                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                  <a 
                    href="#products" 
                    className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white font-extrabold rounded-2xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all flex items-center justify-center space-x-2 text-base"
                  >
                    <span>Order Water Online</span>
                    <ArrowRight size={18} />
                  </a>

                  <button 
                    onClick={() => {
                      const el = document.getElementById('calculator');
                      el?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="w-full sm:w-auto px-6 py-4 bg-white/90 hover:bg-white text-slate-800 font-bold rounded-2xl border border-slate-200 shadow-xs hover:border-blue-300 transition-all flex items-center justify-center space-x-2 text-sm"
                  >
                    <Calculator size={18} className="text-blue-600" />
                    <span>Hydration Calculator</span>
                  </button>
                </div>
              </div>

              {/* Right Column: 3D Interactive Bottle & Water Rings */}
              <div className="lg:col-span-6 relative flex justify-center items-center min-h-[460px]" style={{ perspective: '1100px' }}>
                <div className="relative z-10 w-full flex justify-center items-center">
                  
                  {/* Glowing halo */}
                  <div className="absolute w-72 h-72 sm:w-96 sm:h-96 bg-gradient-to-tr from-cyan-300/40 to-blue-500/40 rounded-full blur-[70px] pointer-events-none" />

                  {/* 3D Bottle container responding to mouse */}
                  <motion.div
                    animate={{
                      y: [-12, 12, -12],
                      rotateX: mousePosition.y,
                      rotateY: mousePosition.x
                    }}
                    transition={{
                      y: { duration: 4.5, repeat: Infinity, ease: "easeInOut" },
                      rotateX: { type: "spring", stiffness: 120, damping: 25 },
                      rotateY: { type: "spring", stiffness: 120, damping: 25 }
                    }}
                    style={{ transformStyle: 'preserve-3d' }}
                    className="relative z-20 flex flex-col items-center"
                  >
                    {/* Bottle Image */}
                    <div className="relative">
                      <img 
                        src={ASSETS.bottle1000} 
                        alt="Vantara Premium Water 1000ml Bottle" 
                        className="h-80 sm:h-96 md:h-[420px] w-auto object-contain drop-shadow-[0_25px_30px_rgba(2,132,199,0.35)] rounded-2xl"
                      />

                      {/* Floating feature pills around bottle */}
                      <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="absolute top-12 -left-4 sm:-left-8 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-xl shadow-lg border border-blue-100 flex items-center space-x-2 text-xs font-bold text-slate-800"
                      >
                        <ShieldCheck size={16} className="text-emerald-500" />
                        <span>ISI &amp; ISO Tested</span>
                      </motion.div>

                      <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="absolute bottom-20 -right-4 sm:-right-8 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-xl shadow-lg border border-blue-100 flex items-center space-x-2 text-xs font-bold text-slate-800"
                      >
                        <Sparkles size={16} className="text-cyan-500" />
                        <span>Essential Minerals</span>
                      </motion.div>
                    </div>

                    {/* 3D Orbiting Water Droplets around Bottle */}
                    {[...Array(6)].map((_, i) => {
                      const delays = [0, 0.8, 1.6, 2.4, 3.2, 4.0];
                      return (
                        <motion.div
                          key={`orbit-drop-${i}`}
                          className="absolute w-3.5 h-3.5 rounded-full bg-gradient-to-tr from-cyan-300 via-sky-200 to-white shadow-[0_0_15px_rgba(34,211,238,0.9)] pointer-events-none"
                          animate={{
                            rotate: [0, 360],
                            scale: [0.6, 1.2, 0.6],
                            opacity: [0.3, 0.95, 0.3],
                            y: [-30, 30, -30]
                          }}
                          transition={{
                            rotate: { duration: 7 + i * 1.5, repeat: Infinity, ease: "linear", delay: delays[i] },
                            scale: { duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: delays[i] },
                            opacity: { duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: delays[i] },
                            y: { duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: delays[i] }
                          }}
                          style={{
                            width: `${10 + (i % 3) * 3}px`,
                            height: `${10 + (i % 3) * 3}px`,
                            top: `${20 + i * 12}%`,
                            left: `${15 + (i % 2) * 65}%`
                          }}
                        />
                      );
                    })}

                    {/* 3D Water Ripple Rings on floor */}
                    <div className="relative -mt-6 w-64 h-16 flex items-center justify-center" style={{ transform: 'rotateX(75deg)' }}>
                      <motion.div
                        className="absolute w-56 h-56 rounded-full border-4 border-cyan-400/60 shadow-[0_0_25px_rgba(34,211,238,0.5)]"
                        animate={{ scale: [0.35, 2.3], opacity: [0.85, 0] }}
                        transition={{ duration: 2.6, repeat: Infinity, ease: "easeOut" }}
                      />
                      <motion.div
                        className="absolute w-56 h-56 rounded-full border-2 border-blue-400/50"
                        animate={{ scale: [0.35, 2.3], opacity: [0.85, 0] }}
                        transition={{ duration: 2.6, repeat: Infinity, ease: "easeOut", delay: 0.85 }}
                      />
                      <div className="w-36 h-12 rounded-full bg-gradient-to-r from-cyan-400/30 to-blue-500/30 blur-lg" />
                    </div>
                  </motion.div>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* ================= PRODUCTS CATALOG SECTION ================= */}
        <section id="products" className="py-24 bg-white relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="text-xs font-bold text-blue-600 uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                Pristine Bottles &amp; Bulk Crates
              </span>
              <h2 className="text-3xl sm:text-5xl font-black text-slate-900 mt-4 tracking-tight">
                Choose Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">Hydration Pack</span>
              </h2>
              <p className="text-slate-600 mt-3 text-base sm:text-lg">
                Freshly purified, laboratory-sealed, and delivered fast across Tadepalligudem. Enjoy free doorstep delivery on all orders above ₹500!
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {PRODUCTS.map(product => (
                <div 
                  key={product.id} 
                  className={`relative bg-gradient-to-b from-white to-slate-50 rounded-3xl p-6 border transition-all duration-300 flex flex-col justify-between hover:shadow-xl hover:-translate-y-1 ${
                    product.popular ? 'border-blue-400 shadow-md ring-1 ring-blue-400/20' : 'border-slate-200 shadow-sm'
                  }`}
                >
                  {product.badge && (
                    <div className="absolute top-4 left-4 bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-[11px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider shadow-xs">
                      {product.badge}
                    </div>
                  )}

                  {/* Bottle Image Container */}
                  <div className="h-56 w-full flex items-center justify-center p-2 mb-4">
                    <img 
                      src={product.image} 
                      alt={product.name} 
                      className="h-full max-h-52 w-auto object-contain transition-transform duration-300 hover:scale-105"
                    />
                  </div>

                  {/* Info */}
                  <div>
                    <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                      {product.size}
                    </span>
                    <h3 className="font-bold text-lg text-slate-900 mt-2 mb-1">
                      {product.name}
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed mb-4">
                      {product.description}
                    </p>
                  </div>

                  {/* Price & Action */}
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-400 block font-medium">Price</span>
                      <span className="text-2xl font-black text-slate-900">₹{product.price}</span>
                    </div>

                    <button
                      onClick={() => addToCart(product)}
                      className="bg-slate-900 hover:bg-blue-600 text-white px-4 py-2.5 rounded-xl font-bold text-sm transition-colors flex items-center space-x-1.5 shadow-sm"
                    >
                      <Plus size={16} />
                      <span>Add to Cart</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Bulk Notice */}
            <div className="mt-12 bg-gradient-to-r from-blue-50 via-sky-50 to-cyan-50 p-6 rounded-3xl border border-blue-100 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center flex-shrink-0 shadow-md">
                  <Award size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-base">Bulk Catering, Weddings &amp; Function Orders</h4>
                  <p className="text-xs sm:text-sm text-slate-600">
                    Need 50+ crates for an event in Tadepalligudem? We provide bulk wholesale discounts and direct truck unloading.
                  </p>
                </div>
              </div>
              <a 
                href="tel:+919876543210" 
                className="whitespace-nowrap px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-all shadow-sm flex items-center space-x-2"
              >
                <Phone size={16} />
                <span>Call +91 98765 43210</span>
              </a>
            </div>
          </div>
        </section>

        {/* ================= OFFICIAL BOTTLE LABEL & QUALITY SHOWCASE ================= */}
        <section id="label" className="py-24 bg-gradient-to-b from-white via-blue-50/40 to-slate-50 relative overflow-hidden border-t border-slate-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-14">
              <span className="text-xs font-bold text-blue-600 uppercase tracking-widest bg-blue-100/70 px-3.5 py-1 rounded-full border border-blue-200">
                Official Bottle Wrap Architecture
              </span>
              <h2 className="text-3xl sm:text-5xl font-black text-slate-900 mt-4 tracking-tight">
                Authentic Alpine Packaging. <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-700 via-cyan-600 to-teal-500">
                  Every Detail Certified &amp; Sealed.
                </span>
              </h2>
              <p className="text-slate-600 mt-3 text-base sm:text-lg">
                Inspected and verified. All Vantara bottles feature our signature panoramic mountain vista label with complete FSSAI licensing and statutory certifications.
              </p>
            </div>

            {/* Panoramic Label Banner Display */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-blue-100 mb-12">
              <div className="relative rounded-2xl overflow-hidden shadow-lg border border-slate-200 bg-slate-950">
                <img 
                  src={ASSETS.labelPanoramic} 
                  alt="Official Vantara Premium Water Panoramic Bottle Label Wrap" 
                  className="w-full h-auto object-cover max-h-[360px] sm:max-h-[400px] select-none"
                />

                {/* Overlaid badges */}
                <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur-md text-white px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center space-x-1.5 border border-white/20">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                  <span>Panoramic Bottle Wrap (1 Litre &amp; 500ml)</span>
                </div>

                <div className="absolute top-4 right-4 bg-emerald-950/80 backdrop-blur-md text-emerald-300 px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center space-x-1.5 border border-emerald-500/30">
                  <ShieldCheck size={14} className="text-emerald-400" />
                  <span>fssai Lic. No. 13621019000674</span>
                </div>
              </div>

              {/* Exact Label Key Specifications Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                
                {/* Panel 1: Brand Crest & Philosophy */}
                <div className="bg-gradient-to-br from-blue-50/70 to-sky-50/50 p-6 rounded-2xl border border-blue-100 flex flex-col justify-between">
                  <div className="flex items-start space-x-4 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center flex-shrink-0 shadow-md">
                      <Droplet size={24} />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-base">Vantara™ Crest</h4>
                      <p className="text-xs text-blue-700 font-bold uppercase tracking-wider mt-0.5">
                        Pure Water • Green Leaf Seal
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    A pure cyan water droplet resting gracefully within two vibrant tea-green leaves, enveloped by snowy alpine peaks and crystal mountain lakes.
                  </p>
                  <div className="mt-4 pt-3 border-t border-blue-200/60 flex items-center justify-between text-xs font-bold text-blue-900">
                    <span className="italic">"Pure by Nature, Better for Tomorrow."</span>
                  </div>
                </div>

                {/* Panel 2: Legal Manufacturing & FSSAI */}
                <div className="bg-gradient-to-br from-blue-50/70 to-sky-50/50 p-6 rounded-2xl border border-blue-100 flex flex-col justify-between">
                  <div className="flex items-start space-x-4 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-cyan-600 text-white flex items-center justify-center flex-shrink-0 shadow-md">
                      <ShieldCheck size={24} />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-base">Statutory Compliance</h4>
                      <p className="text-xs text-cyan-800 font-bold font-mono mt-0.5">
                        fssai Lic. 13621019000674
                      </p>
                    </div>
                  </div>
                  <div className="text-xs text-slate-600 space-y-1">
                    <p><strong className="text-slate-800">Product:</strong> Packaged Drinking Water</p>
                    <p><strong className="text-slate-800">Manufactured By:</strong> Vantara Beverages</p>
                    <p className="text-[11px] text-slate-500">
                      Sy. No. 24/1, Green Valley Industrial Area, Hyderabad - 500 072, Telangana, India.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-blue-200/60 flex items-center justify-between text-[11px] font-bold text-slate-700">
                    <span>Net Qty: 1 Litre / 500ml</span>
                    <span className="text-emerald-700">Best Before 6 Months</span>
                  </div>
                </div>

                {/* Panel 3: Customer Care & Sustainability */}
                <div className="bg-gradient-to-br from-blue-50/70 to-sky-50/50 p-6 rounded-2xl border border-blue-100 flex flex-col justify-between">
                  <div className="flex items-start space-x-4 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow-md">
                      <Award size={24} />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-base">Consumer &amp; Eco Care</h4>
                      <p className="text-xs text-emerald-800 font-bold mt-0.5">
                        Toll-Free Helpline
                      </p>
                    </div>
                  </div>
                  <div className="text-xs text-slate-600 space-y-1.5">
                    <div className="flex items-center space-x-2">
                      <Phone size={14} className="text-blue-600" />
                      <a href="tel:18001234567" className="font-bold text-slate-900 hover:text-blue-600">1800 123 4567</a>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Mail size={14} className="text-blue-600" />
                      <a href="mailto:care@vantara.in" className="text-slate-700 hover:text-blue-600">care@vantara.in</a>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-blue-200/60 flex items-center space-x-2 text-[10px] font-extrabold">
                    <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">Please Recycle</span>
                    <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded">Keep City Clean</span>
                    <span className="bg-slate-200 text-slate-800 px-2 py-0.5 rounded">Made in India</span>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </section>

        {/* ================= 8-STAGE PURITY PROCESS ================= */}
        <section id="purity" className="py-24 bg-slate-900 text-white relative overflow-hidden">
          {/* Ambient Lighting */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500 rounded-full blur-[140px] opacity-15 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-400 rounded-full blur-[140px] opacity-15 pointer-events-none" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest bg-cyan-950/60 px-3 py-1 rounded-full border border-cyan-800">
                Purity &amp; Quality Architecture
              </span>
              <h2 className="text-3xl sm:text-5xl font-black mt-4 tracking-tight">
                Our Advanced <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">8-Stage Purification</span>
              </h2>
              <p className="text-slate-400 mt-3 text-base sm:text-lg">
                Engineered to surpass standard packaged water metrics. Clean, balanced, and untouched by human hands until sealed.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { stage: '01', title: 'Sand & Silica Filtration', desc: 'Removes visible suspended particles, dust, and turbidity.' },
                { stage: '02', title: 'Activated Carbon Filter', desc: 'Eliminates chlorine, odors, volatile organic compounds, and bad taste.' },
                { stage: '03', title: 'Dual Micron Filters', desc: '10-micron & 5-micron spun cartridges capture minute sediment.' },
                { stage: '04', title: 'High-Pressure Reverse Osmosis', desc: 'Advanced semi-permeable membranes filter dissolved heavy metals.' },
                { stage: '05', title: 'Mineral Balance Infusion', desc: 'Replenishes essential calcium and magnesium for crisp taste and health.' },
                { stage: '06', title: 'Intense UV Sterilization', desc: 'Germicidal ultraviolet rays neutralize 99.99% of bacteria and viruses.' },
                { stage: '07', title: 'Ozonation Shield', desc: 'Ozone treatment keeps the water microbially pure inside the bottle.' },
                { stage: '08', title: 'Touch-Free Automated Bottling', desc: 'Rinsed, filled, capped, and date-stamped in an isolated sterile chamber.' },
              ].map((item, idx) => (
                <div 
                  key={idx} 
                  className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-3xl border border-slate-700/60 hover:border-cyan-500/50 transition-all hover:-translate-y-1"
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl font-black text-cyan-400">{item.stage}</span>
                    <Droplet size={18} className="text-cyan-500" />
                  </div>
                  <h4 className="font-bold text-lg text-white mb-2">{item.title}</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>

            {/* Quality Standard Metrics */}
            <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 text-center border-t border-slate-800 pt-12">
              <div>
                <p className="text-3xl font-black text-cyan-400">100-150</p>
                <p className="text-xs text-slate-400 mt-1 uppercase font-semibold">TDS (PPM) Optimal Range</p>
              </div>
              <div>
                <p className="text-3xl font-black text-cyan-400">7.2 - 7.5</p>
                <p className="text-xs text-slate-400 mt-1 uppercase font-semibold">Naturally Balanced pH</p>
              </div>
              <div>
                <p className="text-3xl font-black text-cyan-400">0%</p>
                <p className="text-xs text-slate-400 mt-1 uppercase font-semibold">Zero Human Touch Bottling</p>
              </div>
              <div>
                <p className="text-3xl font-black text-cyan-400">100%</p>
                <p className="text-xs text-slate-400 mt-1 uppercase font-semibold">BPA-Free Recyclable PET</p>
              </div>
            </div>
          </div>
        </section>

        {/* ================= DAILY HYDRATION CALCULATOR ================= */}
        <section id="calculator" className="py-24 bg-gradient-to-b from-white to-blue-50/50 relative">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-xl border border-blue-100">
              <div className="text-center max-w-2xl mx-auto mb-10">
                <div className="inline-flex items-center space-x-2 bg-blue-100 text-blue-800 px-3.5 py-1.5 rounded-full text-xs font-bold mb-3">
                  <Calculator size={16} />
                  <span>Personal Hydration Engine</span>
                </div>
                <h3 className="text-2xl sm:text-4xl font-black text-slate-900">
                  Calculate Your Daily Water Intake
                </h3>
                <p className="text-slate-600 text-sm mt-2">
                  Everyone's body is unique. Find out exactly how many liters your body needs based on your body weight and daily activity.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-10 items-center">
                {/* Inputs */}
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between text-sm font-bold text-slate-800 mb-2">
                      <span>Body Weight</span>
                      <span className="text-blue-600">{calcWeight} kg</span>
                    </div>
                    <input 
                      type="range" 
                      min="35" 
                      max="130" 
                      value={calcWeight}
                      onChange={(e) => setCalcWeight(Number(e.target.value))}
                      className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                    <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                      <span>35 kg</span>
                      <span>80 kg</span>
                      <span>130 kg</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-800 mb-2">
                      Daily Activity Level
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['sedentary', 'moderate', 'active'] as const).map(level => (
                        <button
                          key={level}
                          type="button"
                          onClick={() => setCalcActivity(level)}
                          className={`py-2 px-3 text-xs font-bold rounded-xl border capitalize transition-all ${
                            calcActivity === level 
                              ? 'bg-blue-600 text-white border-blue-600 shadow-sm' 
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-800 mb-2">
                      Surrounding Climate
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {(['normal', 'hot'] as const).map(c => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setCalcClimate(c)}
                          className={`py-2 px-3 text-xs font-bold rounded-xl border capitalize transition-all ${
                            calcClimate === c 
                              ? 'bg-blue-600 text-white border-blue-600 shadow-sm' 
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {c === 'hot' ? 'Hot / Humid (Coastal)' : 'Mild / Indoor AC'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Output Card */}
                <div className="bg-gradient-to-br from-blue-600 to-cyan-600 rounded-3xl p-8 text-white text-center flex flex-col justify-center items-center shadow-lg">
                  <span className="text-xs uppercase font-extrabold tracking-widest text-cyan-200">
                    Recommended Daily Target
                  </span>
                  <div className="text-6xl font-black my-3">
                    {calculatedIntakeLiters} <span className="text-2xl font-bold text-cyan-100">Liters</span>
                  </div>
                  <p className="text-xs text-blue-100 max-w-xs mb-6">
                    Equals approx. <strong>{recommended1000mlBottles} bottles</strong> of Vantara 1000ml or <strong>{recommended1000mlBottles * 2} bottles</strong> of 500ml per day.
                  </p>

                  <button
                    onClick={() => {
                      addToCart(PRODUCTS[0], recommended1000mlBottles);
                    }}
                    className="w-full bg-white text-blue-700 font-extrabold py-3.5 px-6 rounded-xl hover:bg-blue-50 transition-all text-sm shadow-md flex items-center justify-center space-x-2"
                  >
                    <ShoppingCart size={16} />
                    <span>Add Today's Supply ({recommended1000mlBottles}L) to Cart</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================= DELIVERY COVERAGE SECTION ================= */}
        <section id="delivery" className="py-24 bg-white relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <span className="text-xs font-bold text-blue-600 uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                  Logistics &amp; Express Delivery
                </span>
                <h2 className="text-3xl sm:text-5xl font-black text-slate-900 mt-4 tracking-tight leading-tight">
                  Doorstep Delivery In <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">
                    Tadepalligudem &amp; Beyond
                  </span>
                </h2>
                <p className="text-slate-600 mt-4 text-base leading-relaxed">
                  Our fleet is stationed strategically to ensure your pure water order arrives crisp and fresh within 45 to 90 minutes.
                </p>

                <div className="mt-8 space-y-4">
                  {[
                    {
                      icon: <Truck className="text-blue-600" size={24} />,
                      title: 'Free Delivery Above ₹500',
                      desc: 'Order ₹500 or more in bottles or crates and delivery charges are 100% waived.'
                    },
                    {
                      icon: <MapPin className="text-blue-600" size={24} />,
                      title: 'Direct From Ramannagudem Facility',
                      desc: 'Plant located at Building No: 431/5, Ramannagudem. Quick transit directly from source.'
                    },
                    {
                      icon: <Phone className="text-blue-600" size={24} />,
                      title: 'Instant Order Tracking & Assistance',
                      desc: 'Chat with our AI assistant or call our direct helpline (+91 98765 43210).'
                    }
                  ].map((f, i) => (
                    <div key={i} className="flex items-start space-x-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <div className="p-3 bg-white rounded-xl shadow-2xs flex-shrink-0">
                        {f.icon}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{f.title}</h4>
                        <p className="text-xs text-slate-500 mt-0.5">{f.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Delivery Areas Grid */}
              <div className="bg-gradient-to-br from-blue-900 to-slate-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-bold">Covered Locations</h3>
                    <p className="text-xs text-slate-400 mt-1">Pincode: 534101 and surrounding West Godavari pockets</p>
                  </div>
                  <span className="bg-emerald-500/20 text-emerald-300 text-xs font-bold px-3 py-1 rounded-full border border-emerald-500/30">
                    Active Delivery
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  {[
                    'Ramannagudem', 'Subhash Road', 'Railway Station Road',
                    'Old Bus Stand Area', 'Clock Tower Circle', 'Pentapadu Road',
                    'K.N. Road', 'Venkataramannagudem', 'Mudirajpet', 'Housing Board Colony',
                    'Main Bazaar Commercial', 'Airport Area Corridor'
                  ].map((area, idx) => (
                    <div key={idx} className="flex items-center space-x-2 bg-white/10 p-3 rounded-xl backdrop-blur-sm border border-white/5">
                      <CheckCircle2 size={16} className="text-cyan-400 flex-shrink-0" />
                      <span className="font-medium truncate">{area}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between text-xs text-slate-300">
                  <span>Standard Delivery Fee below ₹500</span>
                  <span className="text-lg font-black text-cyan-400">Just ₹30</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================= ABOUT & FOUNDERS ================= */}
        <section id="about" className="py-24 bg-slate-50 relative overflow-hidden">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="text-xs font-bold text-blue-600 uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                Leadership &amp; Roots
              </span>
              <h2 className="text-3xl sm:text-5xl font-black text-slate-900 mt-4 tracking-tight">
                About <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">Vantara Premium Water</span>
              </h2>
              <p className="text-slate-600 mt-4 text-base sm:text-lg leading-relaxed">
                Vantara Premium Water was established with a singular devotion: to provide pure, lab-tested, hygienic drinking water that families and businesses can trust with their eyes closed.
              </p>
            </div>

            {/* Founders Card */}
            <div className="bg-white rounded-3xl p-8 sm:p-10 shadow-lg border border-slate-100 mb-12">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white flex items-center justify-center flex-shrink-0 shadow-md">
                  <Award size={48} />
                </div>
                <div className="text-center md:text-left flex-1">
                  <span className="text-xs uppercase font-extrabold tracking-wider text-blue-600">
                    Founded &amp; Managed By
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                    B.U.V Bhaskar Reddy &amp; B.Manikanta Reddy
                  </h3>
                  <p className="text-slate-600 text-sm mt-3 leading-relaxed">
                    Under their guidance, our plant maintains strict microbiological and chemical safety parameters. Every batch is cataloged and checked before it leaves for your home or enterprise.
                  </p>
                </div>
              </div>
            </div>

            {/* Mission & Vision */}
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-4">
                  <ShieldCheck size={24} />
                </div>
                <h4 className="text-xl font-bold text-slate-900 mb-2">Our Mission</h4>
                <p className="text-slate-600 text-sm leading-relaxed">
                  To provide safe, pure, and high-quality packaged drinking water that customers can trust every day, without exception.
                </p>
              </div>

              <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                <div className="w-12 h-12 rounded-xl bg-cyan-100 text-cyan-700 flex items-center justify-center mb-4">
                  <Sparkles size={24} />
                </div>
                <h4 className="text-xl font-bold text-slate-900 mb-2">Our Vision</h4>
                <p className="text-slate-600 text-sm leading-relaxed">
                  To build Vantara Premium Water into Andhra Pradesh's most respected hydration brand, celebrated for consistency, purity, and prompt delivery.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ================= FOOTER ================= */}
        <footer className="bg-slate-950 text-slate-400 py-16 border-t border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
              {/* Brand info */}
              <div className="md:col-span-2">
                <div className="flex items-center space-x-3 mb-4">
                  <img 
                    src={ASSETS.logo} 
                    alt="Vantara Logo" 
                    className="h-10 w-10 rounded-lg object-cover" 
                  />
                  <span className="text-xl font-black text-white tracking-tight">VANTARA</span>
                </div>
                <p className="text-sm text-slate-400 max-w-sm mb-6 leading-relaxed">
                  Pure Water. Pure Confidence. Delivering hygienic, laboratory-tested packaged drinking water straight to your doorstep across Tadepalligudem.
                </p>
                <div className="text-xs text-slate-500">
                  Founded by B.U.V Bhaskar Reddy &amp; B.Manikanta Reddy
                </div>
              </div>

              {/* Quick links */}
              <div>
                <h5 className="text-white text-xs uppercase font-extrabold tracking-wider mb-4">
                  Quick Navigation
                </h5>
                <ul className="space-y-2 text-sm">
                  <li><button onClick={() => navigateTo('home')} className="hover:text-cyan-400 transition-colors">Home</button></li>
                  <li><a href="#products" className="hover:text-cyan-400 transition-colors">Products &amp; Pricing</a></li>
                  <li><a href="#purity" className="hover:text-cyan-400 transition-colors">8-Stage Purity</a></li>
                  <li><a href="#calculator" className="hover:text-cyan-400 transition-colors">Hydration Calculator</a></li>
                  <li><a href="#delivery" className="hover:text-cyan-400 transition-colors">Delivery Coverage</a></li>
                </ul>
              </div>

              {/* Contact info */}
              <div>
                <h5 className="text-white text-xs uppercase font-extrabold tracking-wider mb-4">
                  Licensing &amp; Support
                </h5>
                <ul className="space-y-3 text-xs leading-relaxed">
                  <li className="flex items-start space-x-2">
                    <ShieldCheck size={16} className="text-cyan-400 flex-shrink-0 mt-0.5" />
                    <span><strong>fssai Lic. No:</strong> 13621019000674</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <MapPin size={16} className="text-cyan-400 flex-shrink-0 mt-0.5" />
                    <span><strong>Mfg &amp; Mkt:</strong> Vantara Beverages, Sy. No. 24/1, Green Valley Ind. Area, Hyderabad - 500072</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <MapPin size={16} className="text-cyan-400 flex-shrink-0 mt-0.5" />
                    <span><strong>Bottling &amp; Dispatch:</strong> 431/5, Ramannagudem, Tadepalligudem, AP 534101</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Phone size={16} className="text-cyan-400 flex-shrink-0" />
                    <span>Toll-Free: <a href="tel:18001234567" className="text-white hover:text-cyan-400 font-bold">1800 123 4567</a></span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Mail size={16} className="text-cyan-400 flex-shrink-0" />
                    <a href="mailto:care@vantara.in" className="hover:text-cyan-400">care@vantara.in</a>
                  </li>
                </ul>
              </div>
            </div>

            <div className="mt-12 pt-6 border-t border-slate-800 text-xs text-slate-500 flex flex-col sm:flex-row justify-between items-center gap-4">
              <p>&copy; {new Date().getFullYear()} Vantara Premium Water. All rights reserved.</p>
              <div className="flex space-x-6">
                <span>Free delivery on &gt; ₹500</span>
                <span>Tadepalligudem, AP 534101</span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    );
  };

  // -------------------------------------------------------------
  // CHECKOUT VIEW
  // -------------------------------------------------------------
  const CheckoutView = () => {
    const [formData, setFormData] = useState({
      name: '',
      phone: '',
      address: '',
      landmark: '',
      city: 'Tadepalligudem',
      pincode: '534101',
      deliveryNotes: '',
      paymentMethod: 'UPI on Delivery'
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
      if (cart.length === 0 && !lastPlacedOrder) {
        navigateTo('home');
      }
    }, [cart]);

    const handleFormSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!formData.name.trim() || !formData.phone.trim() || !formData.address.trim()) {
        alert('Please fill in your name, phone number, and address.');
        return;
      }

      setIsSubmitting(true);

      const newOrderId = `VAN-${Math.floor(10000 + Math.random() * 90000)}`;
      const newOrder: Order = {
        id: newOrderId,
        customerName: formData.name.trim(),
        customerPhone: formData.phone.trim(),
        deliveryAddress: formData.address.trim(),
        landmark: formData.landmark.trim(),
        city: formData.city,
        pincode: formData.pincode.trim() || '534101',
        deliveryNotes: formData.deliveryNotes.trim(),
        paymentMethod: formData.paymentMethod,
        items: [...cart],
        subtotal: cartTotal,
        deliveryFee: deliveryFee,
        totalAmount: finalTotal,
        status: 'New',
        createdAt: Date.now(),
        estimatedDelivery: 'Within 45-60 mins'
      };

      setTimeout(() => {
        setOrders(prev => [newOrder, ...prev]);
        setLastPlacedOrder(newOrder);
        setCart([]);
        setIsSubmitting(false);
        setShowSuccessModal(true);
        triggerConfetti();
      }, 700);
    };

    return (
      <div className="min-h-screen bg-slate-50 pt-28 pb-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Breadcrumb */}
          <div className="mb-6 flex items-center space-x-2 text-xs font-semibold text-slate-500">
            <button onClick={() => navigateTo('home')} className="hover:text-blue-600">Home</button>
            <ChevronRight size={14} />
            <button onClick={() => setIsCartOpen(true)} className="hover:text-blue-600">Cart</button>
            <ChevronRight size={14} />
            <span className="text-slate-900">Doorstep Checkout</span>
          </div>

          <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden grid lg:grid-cols-12">
            
            {/* Form details (Left) */}
            <div className="lg:col-span-7 p-6 sm:p-10">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  <MapPin size={20} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900">Delivery Details</h2>
                  <p className="text-xs text-slate-500">Delivering to Tadepalligudem &amp; nearby areas</p>
                </div>
              </div>

              <form onSubmit={handleFormSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Full Name *
                    </label>
                    <input 
                      required 
                      type="text" 
                      placeholder="e.g. Bhaskar Reddy"
                      value={formData.name} 
                      onChange={e => setFormData({ ...formData, name: e.target.value })} 
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                    />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Contact Phone *
                    </label>
                    <input 
                      required 
                      type="tel" 
                      placeholder="e.g. 98480 12345"
                      value={formData.phone} 
                      onChange={e => setFormData({ ...formData, phone: e.target.value })} 
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Street Address / House No. / Flat *
                  </label>
                  <textarea 
                    required 
                    placeholder="Enter complete building number, street, or colony..."
                    value={formData.address} 
                    onChange={e => setFormData({ ...formData, address: e.target.value })} 
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent h-20 resize-none" 
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-3 sm:col-span-1">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Landmark (Optional)
                    </label>
                    <input 
                      type="text" 
                      placeholder="Near Temple / School"
                      value={formData.landmark} 
                      onChange={e => setFormData({ ...formData, landmark: e.target.value })} 
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-500" 
                    />
                  </div>
                  <div className="col-span-3 sm:col-span-1">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      City
                    </label>
                    <input 
                      type="text" 
                      readOnly 
                      value={formData.city} 
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 text-sm font-semibold outline-none" 
                    />
                  </div>
                  <div className="col-span-3 sm:col-span-1">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Pincode
                    </label>
                    <input 
                      type="text" 
                      value={formData.pincode} 
                      onChange={e => setFormData({ ...formData, pincode: e.target.value })} 
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-500" 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Delivery Instructions (Optional)
                  </label>
                  <input 
                    type="text" 
                    placeholder="e.g. Ring bell, leave near entrance, etc."
                    value={formData.deliveryNotes} 
                    onChange={e => setFormData({ ...formData, deliveryNotes: e.target.value })} 
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-500" 
                  />
                </div>

                <div className="pt-3">
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    Payment Option
                  </label>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <label className={`flex items-center space-x-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                      formData.paymentMethod === 'UPI on Delivery' 
                        ? 'border-blue-600 bg-blue-50/70 text-blue-900 font-bold' 
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}>
                      <input 
                        type="radio" 
                        name="payment" 
                        value="UPI on Delivery"
                        checked={formData.paymentMethod === 'UPI on Delivery'}
                        onChange={e => setFormData({ ...formData, paymentMethod: e.target.value })}
                        className="text-blue-600" 
                      />
                      <span className="text-sm">UPI on Delivery (GPay / PhonePe)</span>
                    </label>

                    <label className={`flex items-center space-x-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                      formData.paymentMethod === 'Cash on Delivery' 
                        ? 'border-blue-600 bg-blue-50/70 text-blue-900 font-bold' 
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}>
                      <input 
                        type="radio" 
                        name="payment" 
                        value="Cash on Delivery"
                        checked={formData.paymentMethod === 'Cash on Delivery'}
                        onChange={e => setFormData({ ...formData, paymentMethod: e.target.value })}
                        className="text-blue-600" 
                      />
                      <span className="text-sm">Cash on Delivery (COD)</span>
                    </label>
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={isSubmitting || cart.length === 0}
                  className="w-full mt-6 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white font-extrabold py-4 rounded-xl shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center space-x-2 text-base"
                >
                  {isSubmitting ? (
                    <div className="flex items-center space-x-2">
                      <RefreshCw size={18} className="animate-spin" />
                      <span>Confirming Your Order...</span>
                    </div>
                  ) : (
                    <span>Confirm Order • ₹{finalTotal}</span>
                  )}
                </button>
              </form>
            </div>

            {/* Order Summary (Right) */}
            <div className="lg:col-span-5 bg-slate-50/80 p-6 sm:p-10 border-t lg:border-t-0 lg:border-l border-slate-200 flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-900 mb-4">Order Summary</h3>
                <div className="space-y-3 mb-6 max-h-72 overflow-y-auto pr-1">
                  {cart.map(item => (
                    <div key={item.id} className="flex items-center justify-between text-sm bg-white p-3 rounded-xl border border-slate-200/70">
                      <div className="flex items-center space-x-2.5">
                        <span className="w-6 h-6 rounded-md bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center">
                          {item.quantity}x
                        </span>
                        <div>
                          <p className="font-semibold text-slate-900 text-xs truncate max-w-[150px]">{item.name}</p>
                          <p className="text-[10px] text-slate-500">{item.size}</p>
                        </div>
                      </div>
                      <span className="font-bold text-slate-900 text-xs">₹{item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-slate-200 pt-4 space-y-2 text-sm text-slate-600">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="font-bold text-slate-800">₹{cartTotal}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery Fee</span>
                    <span className="font-bold text-slate-800">
                      {deliveryFee === 0 ? <span className="text-emerald-600 font-bold">FREE</span> : `₹${deliveryFee}`}
                    </span>
                  </div>
                  {deliveryFee > 0 && (
                    <p className="text-[11px] text-blue-600">
                      Tip: Add ₹{amountNeededForFreeDelivery} more to enjoy Free Delivery!
                    </p>
                  )}
                </div>

                <div className="border-t border-slate-300 pt-4 mt-4 flex justify-between items-center">
                  <span className="font-bold text-slate-900 text-base">Total Amount</span>
                  <span className="text-2xl font-black text-blue-600">₹{finalTotal}</span>
                </div>
              </div>

              <div className="mt-8 bg-blue-50/70 p-4 rounded-2xl border border-blue-100 text-xs text-blue-900 flex items-start space-x-2">
                <Truck size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Fast Dispatch from Ramannagudem</p>
                  <p className="text-blue-700 mt-0.5">Average doorstep arrival: 45 - 60 minutes after confirmation.</p>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* ================= ORDER SUCCESS CONFIRMATION MODAL ================= */}
        <AnimatePresence>
          {showSuccessModal && lastPlacedOrder && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white rounded-3xl max-w-lg w-full p-8 shadow-2xl border border-slate-100 text-center"
              >
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center mb-4">
                  <CheckCircle2 size={36} />
                </div>

                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-wider">
                  Order Placed Successfully
                </span>

                <h3 className="text-2xl font-black text-slate-900 mt-3">
                  Thank You, {lastPlacedOrder.customerName}!
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Order ID: <span className="font-mono font-bold text-slate-800">{lastPlacedOrder.id}</span>
                </p>

                <div className="my-6 p-4 bg-slate-50 rounded-2xl text-left text-xs space-y-2 border border-slate-100">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Estimated Delivery:</span>
                    <span className="font-bold text-blue-600">{lastPlacedOrder.estimatedDelivery}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Destination:</span>
                    <span className="font-semibold text-slate-800 truncate max-w-[200px]">{lastPlacedOrder.deliveryAddress}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Amount to Pay:</span>
                    <span className="font-black text-slate-900 text-sm">₹{lastPlacedOrder.totalAmount} ({lastPlacedOrder.paymentMethod})</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => {
                      setShowSuccessModal(false);
                      navigateTo('home');
                    }}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors text-sm shadow-md"
                  >
                    Back to Home
                  </button>
                  <button
                    onClick={() => {
                      setShowSuccessModal(false);
                      navigateTo('admin');
                    }}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl transition-colors text-sm"
                  >
                    Track in Admin Panel
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  // -------------------------------------------------------------
  // ADMIN DASHBOARD VIEW
  // -------------------------------------------------------------
  const AdminView = () => {
    const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
    const deliveredCount = orders.filter(o => o.status === 'Delivered').length;
    const activeCount = orders.filter(o => o.status !== 'Delivered').length;

    // Filtered orders
    const filteredOrders = orders.filter(order => {
      const matchesStatus = adminStatusFilter === 'All' || order.status === adminStatusFilter;
      const matchesSearch = 
        order.customerName.toLowerCase().includes(adminSearch.toLowerCase()) ||
        order.customerPhone.includes(adminSearch) ||
        order.id.toLowerCase().includes(adminSearch.toLowerCase());
      return matchesStatus && matchesSearch;
    });

    const updateStatus = (orderId: string, newStatus: Order['status']) => {
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    };

    const deleteOrder = (orderId: string) => {
      if (confirm(`Are you sure you want to delete order ${orderId}?`)) {
        setOrders(prev => prev.filter(o => o.id !== orderId));
      }
    };

    const getStatusBadge = (status: Order['status']) => {
      switch (status) {
        case 'New':
          return 'bg-blue-100 text-blue-800 border-blue-200';
        case 'Confirmed':
          return 'bg-indigo-100 text-indigo-800 border-indigo-200';
        case 'Preparing':
          return 'bg-amber-100 text-amber-800 border-amber-200';
        case 'Out for Delivery':
          return 'bg-cyan-100 text-cyan-800 border-cyan-200 animate-pulse';
        case 'Delivered':
          return 'bg-emerald-100 text-emerald-800 border-emerald-200';
        default:
          return 'bg-slate-100 text-slate-800 border-slate-200';
      }
    };

    return (
      <div className="min-h-screen bg-slate-50 pt-28 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-blue-600 uppercase tracking-widest bg-blue-100 px-2.5 py-0.5 rounded-md">
                  Vantara Management
                </span>
              </div>
              <h1 className="text-3xl font-black text-slate-900 mt-1">Orders &amp; Dispatch Dashboard</h1>
            </div>

            <div className="flex items-center space-x-3">
              <button 
                onClick={() => {
                  if (confirm("Reset to sample orders?")) {
                    setOrders(INITIAL_ORDERS);
                  }
                }}
                className="px-3.5 py-2 text-xs font-bold bg-white text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors flex items-center space-x-1.5"
              >
                <RefreshCw size={14} />
                <span>Reset Demo Orders</span>
              </button>
              <button 
                onClick={() => navigateTo('home')}
                className="px-4 py-2 text-xs font-bold bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors"
              >
                Back to Store
              </button>
            </div>
          </div>

          {/* Metrics Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
              <p className="text-xs font-bold text-slate-500 uppercase">Total Orders</p>
              <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">{orders.length}</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
              <p className="text-xs font-bold text-slate-500 uppercase">Active Dispatches</p>
              <p className="text-2xl sm:text-3xl font-black text-cyan-600 mt-1">{activeCount}</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
              <p className="text-xs font-bold text-slate-500 uppercase">Delivered Orders</p>
              <p className="text-2xl sm:text-3xl font-black text-emerald-600 mt-1">{deliveredCount}</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
              <p className="text-xs font-bold text-slate-500 uppercase">Total Revenue</p>
              <p className="text-2xl sm:text-3xl font-black text-blue-700 mt-1">₹{totalRevenue}</p>
            </div>
          </div>

          {/* Filter & Search Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-72">
                <Search size={16} className="absolute left-3 top-3 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search by name, phone, or ID..."
                  value={adminSearch}
                  onChange={(e) => setAdminSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>
            </div>

            {/* Status pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto no-scrollbar">
              {(['All', 'New', 'Confirmed', 'Preparing', 'Out for Delivery', 'Delivered'] as const).map(status => (
                <button
                  key={status}
                  onClick={() => setAdminStatusFilter(status)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                    adminStatusFilter === status 
                      ? 'bg-blue-600 text-white shadow-xs' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* Orders Table */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 text-[11px] uppercase tracking-wider border-b border-slate-200">
                    <th className="p-4 font-bold">Order ID</th>
                    <th className="p-4 font-bold">Customer &amp; Phone</th>
                    <th className="p-4 font-bold">Address &amp; Notes</th>
                    <th className="p-4 font-bold">Items</th>
                    <th className="p-4 font-bold">Total</th>
                    <th className="p-4 font-bold">Status</th>
                    <th className="p-4 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        No orders match the current filter or search criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map(order => (
                      <tr key={order.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-4 align-top">
                          <span className="font-mono text-xs font-bold text-slate-800">{order.id}</span>
                          <span className="block text-[10px] text-slate-400 mt-0.5">
                            {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </td>

                        <td className="p-4 align-top">
                          <p className="font-bold text-slate-900 text-xs">{order.customerName}</p>
                          <a href={`tel:${order.customerPhone}`} className="text-xs text-blue-600 hover:underline">
                            {order.customerPhone}
                          </a>
                        </td>

                        <td className="p-4 align-top max-w-xs">
                          <p className="text-xs text-slate-700 truncate" title={order.deliveryAddress}>
                            {order.deliveryAddress}
                          </p>
                          {order.landmark && (
                            <p className="text-[10px] text-slate-500">Landmark: {order.landmark}</p>
                          )}
                          {order.deliveryNotes && (
                            <p className="text-[10px] text-amber-600 italic">"{order.deliveryNotes}"</p>
                          )}
                        </td>

                        <td className="p-4 align-top">
                          <div className="text-xs space-y-1">
                            {order.items.map((i, idx) => (
                              <div key={idx} className="text-slate-800">
                                <span className="font-bold">{i.quantity}x</span> {i.size}
                              </div>
                            ))}
                          </div>
                        </td>

                        <td className="p-4 align-top">
                          <span className="font-black text-slate-900 text-sm">₹{order.totalAmount}</span>
                          <span className="block text-[10px] text-slate-500">{order.paymentMethod}</span>
                        </td>

                        <td className="p-4 align-top">
                          <select
                            value={order.status}
                            onChange={(e) => updateStatus(order.id, e.target.value as Order['status'])}
                            className={`text-xs font-bold rounded-lg px-2.5 py-1 border outline-none cursor-pointer ${getStatusBadge(order.status)}`}
                          >
                            <option value="New">New</option>
                            <option value="Confirmed">Confirmed</option>
                            <option value="Preparing">Preparing</option>
                            <option value="Out for Delivery">Out for Delivery</option>
                            <option value="Delivered">Delivered</option>
                          </select>
                        </td>

                        <td className="p-4 align-top text-right">
                          <div className="flex items-center justify-end space-x-1">
                            <button
                              onClick={() => setSelectedOrderDetails(order)}
                              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="View Order Slip"
                            >
                              <FileText size={16} />
                            </button>
                            <button
                              onClick={() => deleteOrder(order.id)}
                              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete Order"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Order Details Slip Modal */}
        <AnimatePresence>
          {selectedOrderDetails && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100"
              >
                <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                  <div className="flex items-center space-x-2">
                    <img src={ASSETS.logo} alt="Logo" className="w-8 h-8 rounded-md object-cover" />
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">Vantara Delivery Invoice</h4>
                      <p className="text-[10px] text-slate-400">Order #{selectedOrderDetails.id}</p>
                    </div>
                  </div>
                  <button onClick={() => setSelectedOrderDetails(null)} className="p-1 text-slate-400 hover:text-slate-600">
                    <X size={18} />
                  </button>
                </div>

                <div className="py-4 space-y-3 text-xs">
                  <div>
                    <span className="text-slate-400 uppercase text-[10px] font-bold">Customer</span>
                    <p className="font-bold text-slate-800 text-sm">{selectedOrderDetails.customerName}</p>
                    <p className="text-slate-600">{selectedOrderDetails.customerPhone}</p>
                  </div>

                  <div>
                    <span className="text-slate-400 uppercase text-[10px] font-bold">Destination Address</span>
                    <p className="text-slate-700">{selectedOrderDetails.deliveryAddress}</p>
                    <p className="text-slate-500">{selectedOrderDetails.city} - {selectedOrderDetails.pincode}</p>
                  </div>

                  <div className="border-t border-slate-100 pt-3">
                    <span className="text-slate-400 uppercase text-[10px] font-bold mb-1 block">Items Ordered</span>
                    {selectedOrderDetails.items.map((i, idx) => (
                      <div key={idx} className="flex justify-between py-1">
                        <span>{i.quantity}x {i.name}</span>
                        <span className="font-bold">₹{i.price * i.quantity}</span>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-slate-100 pt-2 flex justify-between font-black text-sm text-slate-900">
                    <span>Total Amount</span>
                    <span className="text-blue-600">₹{selectedOrderDetails.totalAmount}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex gap-2">
                  <button
                    onClick={() => window.print()}
                    className="flex-1 bg-slate-900 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center space-x-1.5"
                  >
                    <Download size={14} />
                    <span>Print Invoice</span>
                  </button>
                  <button
                    onClick={() => setSelectedOrderDetails(null)}
                    className="px-4 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-200"
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div className="font-sans text-slate-900 bg-white selection:bg-cyan-200">
      <Navbar />

      {currentView === 'home' && <HomeView />}
      {currentView === 'checkout' && <CheckoutView />}
      {currentView === 'admin' && <AdminView />}

      <CartDrawer />
      <AIChatWidget />
    </div>
  );
}
