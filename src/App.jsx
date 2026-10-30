import React, { lazy, Suspense, useState, useEffect, useMemo, useCallback, useDeferredValue } from "react";
import Header from "./components/Header";
import StickyCategoryNav from "./components/StickyCategoryNav";
import LanguageDrawer from "./components/LanguageDrawer";
import CartDrawer from "./components/CartDrawer";
import Footer from "./components/Footer";
import HomePage from "./pages/HomePage";
import CatalogPage from "./pages/CatalogPage";
import ServiceFab from "./components/ServiceFab";
import ReviewModal from "./components/ReviewModal";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./context/ThemeContext";
import { LanguageProvider } from "./context/LanguageContext";
import { CartProvider } from "./context/CartContext";
import { ViewModeProvider } from "./context/ViewModeContext";
import { SettingsProvider, useSettings } from "./context/SettingsContext";
import { useScrollSpy } from "./hooks/useScrollSpy";
import { useRoute } from "./hooks/useRoute";
import { filterMenu, getMenuData } from "./services/api";
import { getAuthHeaders } from "./services/adminApi";

// Rarely visited views (and Firebase, via the admin page) are split into separate chunks.
const AboutPage = lazy(() => import("./pages/AboutPage"));
const AdminPage = lazy(() => import("./pages/admin/AdminPage"));

const SCROLL_OFFSET = 150; // sticky header + sticky category bar

function PageSpinner() {
  return (
    <div className="flex items-center justify-center py-24" aria-busy="true">
      <div className="w-9 h-9 rounded-full border-[3px] border-amber-500/20 border-t-amber-500 animate-spin" />
    </div>
  );
}

function MainApp() {
  const { refreshSettings } = useSettings();
  const { view: currentView, hash, navigate } = useRoute();

  const [menuData, setMenuData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLangDrawerOpen, setIsLangDrawerOpen] = useState(false);
  const deferredQuery = useDeferredValue(searchQuery);

  const applyMenu = useCallback((data) => {
    if (data.length > 0) setMenuData(data);
    setLoadError(data.length === 0);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    getMenuData().then(applyMenu);
  }, [applyMenu]);

  const retryLoad = useCallback(() => {
    setIsLoading(true);
    setLoadError(false);
    getMenuData().then(applyMenu);
  }, [applyMenu]);

  const handleExitAdmin = useCallback(async () => {
    navigate("home");
    window.scrollTo({ top: 0 });
    // The admin may have changed dishes or feature flags; bypass the caches once.
    const authHeaders = getAuthHeaders();
    const [fresh] = await Promise.allSettled([
      getMenuData({ forceRefresh: true, authHeaders }),
      refreshSettings(true),
    ]);
    if (fresh.status === "fulfilled" && fresh.value.length > 0) setMenuData(fresh.value);
  }, [navigate, refreshSettings]);

  // Category-preserving live search: categories with no matches are hidden.
  const filteredMenu = useMemo(() => filterMenu(menuData, deferredQuery), [menuData, deferredQuery]);

  const sectionIds = useMemo(() => filteredMenu.map((cat) => `category-${cat.id}`), [filteredMenu]);
  const { activeId, scrollToSection } = useScrollSpy(sectionIds, SCROLL_OFFSET);
  const activeCategoryId = activeId ? activeId.replace("category-", "") : filteredMenu[0]?.id || "";

  // Deep links (/menu#category-x) and clicks from the home grid scroll once sections exist.
  useEffect(() => {
    if (currentView !== "catalog" || !hash || isLoading) return undefined;
    const timer = setTimeout(() => scrollToSection(hash), 70);
    return () => clearTimeout(timer);
  }, [currentView, hash, isLoading, scrollToSection]);

  const handleSelectCategoryFromHome = useCallback(
    (category) => {
      const catId = typeof category === "object" ? category.id : category;
      navigate("catalog", { hash: `category-${catId}` });
    },
    [navigate]
  );

  const goTo = useCallback(
    (view) => {
      setSearchQuery("");
      navigate(view);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [navigate]
  );

  const handleViewAllProducts = useCallback(() => goTo("catalog"), [goTo]);
  const handleLogoClick = useCallback(() => goTo("home"), [goTo]);
  const handleNavAbout = useCallback(() => goTo("about"), [goTo]);

  // Typing on the home view switches to the catalog with the filter applied.
  const handleSearchChange = useCallback(
    (query) => {
      setSearchQuery(query);
      if (currentView === "home" && query.trim()) navigate("catalog");
    },
    [currentView, navigate]
  );

  const handleSearchSubmit = useCallback(() => {
    if (searchQuery.trim()) navigate("catalog");
  }, [searchQuery, navigate]);

  const handleSelectCategoryInCatalog = useCallback(
    (categoryId) => {
      const id = `category-${categoryId}`;
      window.history.replaceState({}, "", `${window.location.pathname}${window.location.search}#${id}`);
      scrollToSection(id);
    },
    [scrollToSection]
  );

  const openLanguageDrawer = useCallback(() => setIsLangDrawerOpen(true), []);
  const closeLanguageDrawer = useCallback(() => setIsLangDrawerOpen(false), []);

  if (currentView === "admin") {
    return (
      <ErrorBoundary>
        <Suspense fallback={<div className="min-h-screen bg-[#0a0f1d]"><PageSpinner /></div>}>
          <AdminPage onBackToSite={handleExitAdmin} />
        </Suspense>
      </ErrorBoundary>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50/70 dark:bg-zinc-950 text-gray-900 dark:text-zinc-100 transition-colors duration-200">
      <Header
        onOpenLanguageDrawer={openLanguageDrawer}
        onLogoClick={handleLogoClick}
        onNavigateToAbout={handleNavAbout}
      />

      {currentView === "catalog" && (
        <StickyCategoryNav
          categories={filteredMenu}
          activeCategoryId={activeCategoryId}
          onSelectCategory={handleSelectCategoryInCatalog}
        />
      )}

      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <ErrorBoundary key={currentView}>
          {currentView === "home" && (
            <div className="pt-6">
              <HomePage
                categories={menuData}
                isLoading={isLoading}
                loadError={loadError}
                onRetry={retryLoad}
                searchQuery={searchQuery}
                onSearchChange={handleSearchChange}
                onSelectCategory={handleSelectCategoryFromHome}
                onViewAllProducts={handleViewAllProducts}
                onSearchSubmit={handleSearchSubmit}
              />
            </div>
          )}

          {currentView === "catalog" && (
            <CatalogPage
              categories={filteredMenu}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onBackToHome={handleLogoClick}
              isLoading={isLoading}
              loadError={loadError}
              onRetry={retryLoad}
            />
          )}

          {currentView === "about" && (
            <Suspense fallback={<PageSpinner />}>
              <AboutPage onBackToHome={handleLogoClick} />
            </Suspense>
          )}
        </ErrorBoundary>
      </main>

      <LanguageDrawer isOpen={isLangDrawerOpen} onClose={closeLanguageDrawer} />
      <CartDrawer />
      <ServiceFab />
      <ReviewModal />

      <Footer onNavHome={handleLogoClick} onNavAbout={handleNavAbout} />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <SettingsProvider>
          <CartProvider>
            <ViewModeProvider>
              <MainApp />
            </ViewModeProvider>
          </CartProvider>
        </SettingsProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
