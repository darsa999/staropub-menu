import React, { createContext, useContext, useState, useEffect } from "react";

export const LanguageContext = createContext();

export const translations = {
  ka: {
    restaurantName: "StaroPub - სტარო პაბი",
    welcomeText: "StaroPub-სტარო პაბი",
    allProducts: "ყველა პროდუქტი",
    searchPlaceholder: "ძებნა...",
    categoriesTitle: "კატეგორიები",
    addToCart: "+ დამატება",
    added: "დაემატა ✓",
    cartTitle: "თქვენი კალათა",
    emptyCart: "თქვენი კალათა ცარიელია",
    emptyCartSubtext: "დაამატეთ თქვენთვის სასურველი კერძები მენიუდან.",
    orderReceived: "შეკვეთა მიღებულია!",
    orderSentSuccess: "თქვენი შეკვეთა წარმატებით გადაეგზავნა სამზარეულოს.",
    subtotal: "ჯამური ღირებულება",
    total: "სულ გადასახდელი",
    checkout: "შეკვეთის გაფორმება",
    clearCart: "კალათის გასუფთავება",
    currency: "₾",
    phone: "ტელეფონი",
    email: "ელ. ფოსტა",
    aboutUs: "ჩვენს შესახებ",
    theme: "თემა",
    footerSlogan: "საუკეთესო ჩეხური და ევროპული ლუდი, საფირმო ნეკნები და მყუდრო გარემო გლდანში.",
    contact: "კონტაქტი",
    navigation: "ნავიგაცია",
    navHome: "მთავარი",
    navAbout: "ჩვენს შესახებ",
    navTerms: "წესები და პირობები",
    navPrivacy: "კონფიდენციალურობის პოლიტიკა",
    copyright: "Powered by OFOODO 2026©",
    selectLanguage: "აირჩიეთ ენა",
    noProductsFound: "პროდუქტი ვერ მოიძებნა",
    itemsCount: "პროდუქტი",
  },
  en: {
    restaurantName: "StaroPub - სტარო პაბი",
    welcomeText: "StaroPub-სტარო პაბი",
    allProducts: "All Products",
    searchPlaceholder: "Search dishes...",
    categoriesTitle: "Categories",
    addToCart: "+ Add",
    added: "Added ✓",
    cartTitle: "Your Order Cart",
    emptyCart: "Your cart is currently empty",
    emptyCartSubtext: "Add your favorite dishes from the menu.",
    orderReceived: "Order Received!",
    orderSentSuccess: "Your order has been successfully sent to the kitchen.",
    subtotal: "Subtotal",
    total: "Total Amount",
    checkout: "Proceed to Checkout",
    clearCart: "Clear Cart",
    currency: "₾",
    phone: "Phone",
    email: "Email",
    aboutUs: "About Us",
    theme: "Theme",
    footerSlogan: "Best Czech & European beer, signature ribs and cozy atmosphere in Gldani.",
    contact: "Contact",
    navigation: "Navigation",
    navHome: "Home",
    navAbout: "About Us",
    navTerms: "Terms & Conditions",
    navPrivacy: "Privacy Policy",
    copyright: "Powered by OFOODO 2026©",
    selectLanguage: "Select Language",
    noProductsFound: "No products found",
    itemsCount: "items",
  },
  ru: {
    restaurantName: "StaroPub - სტარო პაბი",
    welcomeText: "StaroPub-სტარო პაბი",
    allProducts: "Все блюда",
    searchPlaceholder: "Поиск блюд...",
    categoriesTitle: "Категории",
    addToCart: "+ Добавить",
    added: "Добавлено ✓",
    cartTitle: "Ваша корзина",
    emptyCart: "Ваша корзина пуста",
    emptyCartSubtext: "Добавьте любимые блюда из меню.",
    orderReceived: "Заказ принят!",
    orderSentSuccess: "Ваш заказ успешно отправлен на кухню.",
    subtotal: "Сумма",
    total: "Итого к оплате",
    checkout: "Оформить заказ",
    clearCart: "Очистить корзину",
    currency: "₾",
    phone: "Телефон",
    email: "Эл. почта",
    aboutUs: "О нас",
    theme: "Тема",
    footerSlogan: "Лучшее чешское и европейское пиво, фирменные ребрышки и уютная атмосфера в Глдани.",
    contact: "Контакты",
    navigation: "Навигация",
    navHome: "Главная",
    navAbout: "О нас",
    navTerms: "Условия использования",
    navPrivacy: "Политика конфиденциальности",
    copyright: "Powered by OFOODO 2026©",
    selectLanguage: "Выберите язык",
    noProductsFound: "Блюда не найдены",
    itemsCount: "блюд",
  },
};

export const LANGUAGES = [
  {
    code: "ka",
    label: "ქართული",
    subLabel: "KA",
    flag: "🇬🇪",
  },
  {
    code: "en",
    label: "ENGLISH (US)",
    subLabel: "EN",
    flag: "🇺🇸",
  },
  {
    code: "ru",
    label: "РУССКИЙ",
    subLabel: "RU",
    flag: "🇷🇺",
  },
];

export function LanguageProvider({ children }) {
  // Safe initial state matching server/HTML default
  const [language, setLanguage] = useState("ka");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem("app_lang");
      if (saved && ["ka", "en", "ru"].includes(saved)) {
        setLanguage(saved);
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem("app_lang", language);
      document.documentElement.lang = language;
    } catch {}
  }, [language, mounted]);

  const t = (key) => {
    return translations[language]?.[key] || translations.ka[key] || key;
  };

  const getLocalizedField = (fieldObj) => {
    if (!fieldObj) return "";
    return fieldObj[language] || fieldObj.ka || fieldObj.en || "";
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        getLocalizedField,
        languages: LANGUAGES,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
