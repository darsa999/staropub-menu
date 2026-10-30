import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";

const LanguageContext = createContext(null);

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
    orderSentSuccess: "თქვენი შეკვეთა გადაეგზავნა პერსონალს.",
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
    callWaiter: "ოფიციანტის გამოძახება",
    requestBill: "ანგარიშის მოთხოვნა",
    shareMenu: "მენიუს გაზიარება",
    shareSuccess: "ბმული დაკოპირდა!",
    leaveReview: "შეფასების დატოვება",
    tableNumber: "მაგიდის ნომერი",
    tableNumberPlaceholder: "მაგ. 5",
    enterTableNumber: "მიუთითეთ მაგიდის ნომერი",
    paymentMethod: "გადახდის მეთოდი",
    cash: "ნაღდი ფული",
    card: "ბარათი",
    cancel: "გაუქმება",
    send: "გაგზავნა",
    submitting: "იგზავნება...",
    waiterCalledSuccess: "ოფიციანტი გამოძახებულია! მალე მოგემსახურებათ.",
    billRequestedSuccess: "ანგარიში მოთხოვნილია! ოფიციანტი მალე მოგიტანთ.",
    reviewSuccess: "გმადლობთ შეფასებისთვის!",
    yourName: "თქვენი სახელი",
    yourComment: "თქვენი კომენტარი",
    optional: "(არასავალდებულო)",
    rating: "შეფასება",
    service: "სერვისი",
    soldOut: "ამოიწურა",
    dishesCount: "კერძი",
    menuLoadError: "მენიუს ჩატვირთვა ვერ მოხერხდა",
    menuLoadErrorHint: "შეამოწმეთ ინტერნეტ კავშირი და სცადეთ თავიდან.",
    retry: "თავიდან ცდა",
    requestFailed: "მოთხოვნა ვერ გაიგზავნა. სცადეთ თავიდან ან მიმართეთ პერსონალს.",
    tooManyRequests: "ძალიან ბევრი მოთხოვნა. სცადეთ ცოტა ხანში.",
    orderFailed: "შეკვეთა ვერ გაიგზავნა. სცადეთ თავიდან ან მიმართეთ ოფიციანტს.",
    clearSearch: "ძებნის გასუფთავება",
    noSearchResults: "საძიებო სიტყვით „{query}“ კერძები ვერ მოიძებნა.",
    backToCategories: "მთავარი / კატეგორიები",
    backToMenu: "მთავარი / მენიუ",
    somethingWentWrong: "რაღაც შეცდომა მოხდა",
    reloadPage: "გვერდის გადატვირთვა",
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
    orderSentSuccess: "Your order has been sent to the staff.",
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
    callWaiter: "Call Waiter",
    requestBill: "Request Bill",
    shareMenu: "Share Menu",
    shareSuccess: "Link copied to clipboard!",
    leaveReview: "Leave a Review",
    tableNumber: "Table Number",
    tableNumberPlaceholder: "e.g. 5",
    enterTableNumber: "Please enter table number",
    paymentMethod: "Payment Method",
    cash: "Cash",
    card: "Card",
    cancel: "Cancel",
    send: "Send",
    submitting: "Sending...",
    waiterCalledSuccess: "Waiter called! Someone will attend to you shortly.",
    billRequestedSuccess: "Bill requested! The waiter will bring it shortly.",
    reviewSuccess: "Thank you for your feedback!",
    yourName: "Your Name",
    yourComment: "Your Comment",
    optional: "(optional)",
    rating: "Rating",
    service: "Service",
    soldOut: "Sold out",
    dishesCount: "dishes",
    menuLoadError: "Could not load the menu",
    menuLoadErrorHint: "Check your connection and try again.",
    retry: "Try again",
    requestFailed: "The request could not be sent. Please try again or ask the staff.",
    tooManyRequests: "Too many requests. Please try again shortly.",
    orderFailed: "The order could not be sent. Please try again or ask a waiter.",
    clearSearch: "Clear search",
    noSearchResults: "No dishes found for “{query}”.",
    backToCategories: "Home / Categories",
    backToMenu: "Home / Menu",
    somethingWentWrong: "Something went wrong",
    reloadPage: "Reload page",
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
    orderSentSuccess: "Ваш заказ отправлен персоналу.",
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
    callWaiter: "Вызов официанта",
    requestBill: "Попросить счет",
    shareMenu: "Поделиться меню",
    shareSuccess: "Ссылка скопирована!",
    leaveReview: "Оставить отзыв",
    tableNumber: "Номер стола",
    tableNumberPlaceholder: "напр. 5",
    enterTableNumber: "Укажите номер стола",
    paymentMethod: "Способ оплаты",
    cash: "Наличные",
    card: "Карта",
    cancel: "Отмена",
    send: "Отправить",
    submitting: "Отправка...",
    waiterCalledSuccess: "Официант вызван! Скоро к вам подойдет.",
    billRequestedSuccess: "Счет запрошен! Официант скоро принесет его.",
    reviewSuccess: "Спасибо за ваш отзыв!",
    yourName: "Ваше имя",
    yourComment: "Ваш отзыв",
    optional: "(необязательно)",
    rating: "Оценка",
    service: "Обслуживание",
    soldOut: "Нет в наличии",
    dishesCount: "блюд",
    menuLoadError: "Не удалось загрузить меню",
    menuLoadErrorHint: "Проверьте подключение и попробуйте снова.",
    retry: "Повторить",
    requestFailed: "Не удалось отправить запрос. Попробуйте снова или обратитесь к персоналу.",
    tooManyRequests: "Слишком много запросов. Попробуйте чуть позже.",
    orderFailed: "Не удалось отправить заказ. Попробуйте снова или обратитесь к официанту.",
    clearSearch: "Очистить поиск",
    noSearchResults: "По запросу «{query}» блюда не найдены.",
    backToCategories: "Главная / Категории",
    backToMenu: "Главная / Меню",
    somethingWentWrong: "Что-то пошло не так",
    reloadPage: "Перезагрузить страницу",
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

const SUPPORTED = ["ka", "en", "ru"];

// index.html sets <html lang> from storage before first paint; read the same source here.
function getInitialLanguage() {
  try {
    const saved = localStorage.getItem("app_lang");
    if (SUPPORTED.includes(saved)) return saved;
  } catch {}
  return "ka";
}

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(getInitialLanguage);

  useEffect(() => {
    document.documentElement.lang = language;
    try {
      localStorage.setItem("app_lang", language);
    } catch {}
  }, [language]);

  /** Translates a key; `{name}` placeholders are filled from `vars`. */
  const t = useCallback(
    (key, vars) => {
      const text = translations[language]?.[key] || translations.ka[key] || key;
      return vars ? text.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? "") : text;
    },
    [language]
  );

  const getLocalizedField = useCallback(
    (fieldObj) => {
      if (!fieldObj) return "";
      return fieldObj[language] || fieldObj.ka || fieldObj.en || "";
    },
    [language]
  );

  const value = useMemo(
    () => ({ language, setLanguage, t, getLocalizedField, languages: LANGUAGES }),
    [language, t, getLocalizedField]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
