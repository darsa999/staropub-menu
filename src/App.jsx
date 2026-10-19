import React, { useState, useEffect, useMemo, useRef } from "react";
import Header from "./components/Header";
import StickyCategoryNav from "./components/StickyCategoryNav";
import LanguageDrawer from "./components/LanguageDrawer";
import CartDrawer from "./components/CartDrawer";
import Footer from "./components/Footer";
import HomePage from "./pages/HomePage";
import CatalogPage from "./pages/CatalogPage";
import AboutPage from "./pages/AboutPage";
import AdminPage from "./pages/admin/AdminPage";
import ServiceFab from "./components/ServiceFab";
import ReviewModal from "./components/ReviewModal";
import { ThemeProvider } from "./context/ThemeContext";
import { LanguageProvider } from "./context/LanguageContext";
import { CartProvider } from "./context/CartContext";
import { ViewModeProvider } from "./context/ViewModeContext";
import { SettingsProvider, useSettings } from "./context/SettingsContext";
import { useScrollSpy } from "./hooks/useScrollSpy";
import { getMenuData } from "./services/api";

function MainApp() {
  const [mounted, setMounted] = useState(false);
  const [isAdminRoute, setIsAdminRoute] = useState(false);
  const { refreshSettings } = useSettings();

  // Current view: 'home' (Categories Grid ONLY) | 'catalog' (Grouped Products Catalog) | 'about'
  const [currentView, setCurrentView] = useState("home");
  const [menuData, setMenuData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLangDrawerOpen, setIsLangDrawerOpen] = useState(false);
  const pendingScrollCategoryRef = useRef(null);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem("staropub_prod_menu_cache_v4");
        localStorage.removeItem("staropub_menu");
      } catch {}

      const isNowAdmin =
        window.location.pathname.startsWith("/admin") ||
        window.location.search.includes("admin=true");
      setIsAdminRoute(isNowAdmin);
    }

    const handlePopState = () => {
      if (typeof window !== "undefined") {
        const isNowAdmin =
          window.location.pathname.startsWith("/admin") ||
          window.location.search.includes("admin=true");
        setIsAdminRoute(isNowAdmin);
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const handleExitAdmin = async () => {
    if (typeof window !== "undefined") {
      window.history.pushState({}, "", "/");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    setIsAdminRoute(false);
    setCurrentView("home");
    try {
      const [freshData] = await Promise.allSettled([
        getMenuData({ forceRefresh: true }),
        refreshSettings(true),
      ]);
      if (freshData.status === "fulfilled" && Array.isArray(freshData.value) && freshData.value.length > 0) {
        setMenuData(freshData.value);
      }
    } catch {}
  };

  // Fetch live menu data from serverless route /api/menu
  useEffect(() => {
    let isCancelled = false;
    async function loadData() {
      try {
        setIsLoading(true);
        const data = await getMenuData();
        if (!isCancelled && Array.isArray(data) && data.length > 0) {
          setMenuData(data);
        }
      } catch (err) {
        console.error("Failed to fetch menu data:", err);
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }
    loadData();
    return () => {
      isCancelled = true;
    };
  }, []);

  // Category-Preserving Live Search:
  // Filters products within categories; category titles remain visible above matched items;
  // Empty categories (0 matching items) are hidden.
  const filteredMenu = useMemo(() => {
    if (!searchQuery.trim()) {
      return menuData;
    }

    const q = searchQuery.trim().toLowerCase();

    return menuData
      .map((cat) => {
        const matchingProducts = cat.products.filter((p) => {
          const nameKa = (p.name?.ka || p.title?.ka || "").toLowerCase();
          const nameEn = (p.name?.en || p.title?.en || "").toLowerCase();
          const nameRu = (p.name?.ru || p.title?.ru || "").toLowerCase();
          return (
            nameKa.includes(q) ||
            nameEn.includes(q) ||
            nameRu.includes(q)
          );
        });

        return {
          ...cat,
          products: matchingProducts,
        };
      })
      .filter((cat) => cat.products.length > 0);
  }, [menuData, searchQuery]);

  // Section IDs for Scrollspy
  const sectionIds = useMemo(() => {
    return filteredMenu.map((cat) => `category-${cat.id}`);
  }, [filteredMenu]);

  // Two-way synchronized scrolling (Scrollspy) with offset for sticky header + sticky category bar
  const { activeId, scrollToSection } = useScrollSpy(sectionIds, 150);

  const activeCategoryId = useMemo(() => {
    if (activeId) {
      return activeId.replace("category-", "");
    }
    return filteredMenu[0]?.id || "";
  }, [activeId, filteredMenu]);

  // Handle auto-scroll to category when transitioning from Home to Catalog
  useEffect(() => {
    if (currentView === "catalog" && pendingScrollCategoryRef.current) {
      const targetCatId = pendingScrollCategoryRef.current;
      pendingScrollCategoryRef.current = null;

      // Small delay to ensure Catalog DOM elements are mounted and laid out
      const timer = setTimeout(() => {
        scrollToSection(`category-${targetCatId}`);
      }, 70);

      return () => clearTimeout(timer);
    }
  }, [currentView, scrollToSection]);

  // 1. When clicking a Category card on Home page:
  // Navigates to Catalog View AND smoothly auto-scrolls directly to that specific Category section
  const handleSelectCategoryFromHome = (category) => {
    const catId = typeof category === "object" ? category.id : category;
    pendingScrollCategoryRef.current = catId;
    setCurrentView("catalog");
  };

  // 2. When clicking "ყველა პროდუქტი":
  // Navigates to Catalog View starting from the very top
  const handleViewAllProducts = () => {
    setSearchQuery("");
    setCurrentView("catalog");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // 3. When clicking Header Logo/Title:
  // Returns to Home View (Categories)
  const handleLogoClick = () => {
    setCurrentView("home");
    setSearchQuery("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // 4. When clicking Footer "ჩვენს შესახებ":
  // Navigates to About Us View
  const handleNavAbout = () => {
    setCurrentView("about");
    setSearchQuery("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // 5. When typing in search on Home View:
  // Automatically transitions to Catalog View with the search filter active
  const handleSearchChange = (query) => {
    setSearchQuery(query);
    if (currentView === "home" && query.trim()) {
      setCurrentView("catalog");
    }
  };

  const handleSelectCategoryInCatalog = (categoryId) => {
    scrollToSection(`category-${categoryId}`);
  };

  if (mounted && isAdminRoute) {
    return <AdminPage onBackToSite={handleExitAdmin} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50/70 dark:bg-zinc-950 text-gray-900 dark:text-zinc-100 transition-colors duration-200">
      {/* Header: Logo, Title, Dark toggle, Lang drawer trigger, Cart */}
      {/* Zero authentication or login icons */}
      <Header
        onOpenLanguageDrawer={() => setIsLangDrawerOpen(true)}
        onLogoClick={handleLogoClick}
        onNavigateToAbout={handleNavAbout}
      />

      {/* Sticky Category Navigation Bar: Persistently visible under header on Catalog View */}
      {currentView === "catalog" && (
        <StickyCategoryNav
          categories={filteredMenu}
          activeCategoryId={activeCategoryId}
          onSelectCategory={handleSelectCategoryInCatalog}
        />
      )}

      {/* Main View Router */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        {currentView === "home" && (
          <div className="pt-6">
            {/* VIEW 1: HOME PAGE - ONLY Categories Grid */}
            <HomePage
              categories={menuData}
              isLoading={isLoading}
              searchQuery={searchQuery}
              onSearchChange={handleSearchChange}
              onSelectCategory={handleSelectCategoryFromHome}
              onViewAllProducts={handleViewAllProducts}
              onSearchSubmit={() => {
                if (searchQuery.trim()) {
                  setCurrentView("catalog");
                }
              }}
            />
          </div>
        )}

        {currentView === "catalog" && (
          /* VIEW 2: CATALOG / PRODUCTS PAGE - Grouped Sections with Scrollspy */
          <CatalogPage
            categories={filteredMenu}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onBackToHome={handleLogoClick}
            isLoading={isLoading}
          />
        )}

        {currentView === "about" && (
          /* VIEW 3: ABOUT US PAGE - 360 Tour Hero & Dual Column Contacts / Map */
          <AboutPage onBackToHome={handleLogoClick} />
        )}
      </main>

      {/* Slide-over Drawers & Overlays */}
      <LanguageDrawer
        isOpen={isLangDrawerOpen}
        onClose={() => setIsLangDrawerOpen(false)}
      />
      <CartDrawer />
      <ServiceFab />
      <ReviewModal />

      {/* Dark Footer with contacts and legal links */}
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
