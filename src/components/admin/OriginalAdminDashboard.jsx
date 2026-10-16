import React, { useState, useEffect } from "react";

const RAW_API_URL = import.meta.env.VITE_API_URL || "";
const API_URL = RAW_API_URL ? RAW_API_URL.replace(/\/api\/?$/, "").replace(/\/+$/, "") : "";

export const resolveImageSrc = (img) => {
  if (!img || typeof img !== "string") return "";
  const trimmed = img.trim();
  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("data:") ||
    trimmed.startsWith("blob:")
  ) {
    return trimmed;
  }
  if (trimmed.startsWith("/uploads/") || trimmed.startsWith("uploads/")) {
    const cleanPath = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
    return `${API_URL}${cleanPath}`;
  }
  if (trimmed.startsWith("Images/")) {
    return `${API_URL}/${trimmed}`;
  }
  return `${API_URL}/Images/${trimmed}`;
};

const INITIAL_CATEGORY_LABELS = {};

export function parseMultiPrice(rawOrItem) {
  if (!rawOrItem) return null;

  let pricesArray = null;
  if (typeof rawOrItem === "object") {
    if (Array.isArray(rawOrItem.prices) && rawOrItem.prices.length > 0) {
      pricesArray = rawOrItem.prices;
    } else if (typeof rawOrItem.price === "string") {
      return parseMultiPrice(rawOrItem.price);
    }
  }

  if (pricesArray) {
    const valid = pricesArray.filter(
      p => p && p.size && p.price !== undefined && p.price !== null && String(p.price).trim() !== ""
    );
    const nonZero = valid.filter(p => {
      const n = typeof p.price === "number" ? p.price : parseFloat(String(p.price).replace("₾", "").replace(",", ".").trim());
      return !isNaN(n) && n > 0;
    });
    if (nonZero.length > 0) {
      return nonZero.map(p => {
        const num = typeof p.price === "number" ? p.price : parseFloat(String(p.price).replace("₾", "").replace(",", ".").trim());
        const priceStr = isNaN(num) ? String(p.price) : `₾${num.toFixed(2)}`;
        return { size: p.size, price: priceStr, priceNum: isNaN(num) ? 0 : num };
      });
    }
  }

  if (typeof rawOrItem !== "string") return null;
  const lines = rawOrItem.split(/\n|\n|\|/).map(l => l.trim()).filter(Boolean);
  const parsed = [];
  for (const line of lines) {
    const sizeMatch = line.match(/^([\d.,]+\s*[ლმლმL][\w]*)/u);
    if (sizeMatch) {
      const size = sizeMatch[1].trim();
      const rest = line.slice(sizeMatch[0].length).replace(/^[-:–—\s]+/, "").trim();
      const numMatch = rest.match(/([\d.,]+)/);
      const num = numMatch ? parseFloat(numMatch[1].replace(",", ".")) : NaN;
      if (!isNaN(num) && num > 0) {
        const priceStr = `₾${num.toFixed(2)}`;
        parsed.push({ size, price: priceStr, priceNum: num });
      }
    }
  }
  return parsed.length > 0 ? parsed : null;
}

export function getVolumeSizesForDish(categoryKey, dishName, categoryLabels = {}, dbCategories = []) {
  const catObj = dbCategories.find(c => (c.id || c._id) === categoryKey) || {};
  const catLabel = (categoryLabels[categoryKey]?.ka || catObj.name_ka || categoryKey || "").toLowerCase();
  const nameKa = (dishName || "").toLowerCase();

  const isBeer = categoryKey === "beer" || catLabel.includes("ლუდი") || catLabel.includes("beer") || catLabel.includes("пиво");
  const isSpirits = categoryKey === "Alcohol" || categoryKey === "alcohol" || categoryKey === "spirits" || catLabel.includes("სპირტიანი") || catLabel.includes("spirits") || catLabel.includes("крепкие") || catLabel.includes("alcohol");
  const isChacha = nameKa.includes("სოფლის ჭაჭა") || nameKa.includes("ჭაჭა");

  if (isBeer) {
    return ["0.4 ლ", "1.0 ლ"];
  }
  if (isSpirits || isChacha) {
    return ["0.25 ლ", "0.5 ლ"];
  }
  return null;
}

const authFetch = (url, options = {}) => {
  const token = typeof localStorage !== "undefined" ? (localStorage.getItem("staropub_admin_token") || "") : "";
  const headers = { ...(options.headers || {}) };
  if (token && !headers["Authorization"]) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return fetch(url, { ...options, headers, credentials: "include" });
};

export default function AdminDashboard({
  lang, onClose, onLogout, onSaveSuccess,
  waiterCalls, setWaiterCalls,
  bannerSettings, setBannerSettings,
  customMenuEnabled, setCustomMenuEnabled,
  callWaiterEnabled, setCallWaiterEnabled,
  requestBillEnabled, setRequestBillEnabled,
  isCartEnabled, setIsCartEnabled,
  reviewFormEnabled, setReviewFormEnabled,
  reviews, setReviews,
  unavailableDishIds = [], setUnavailableDishIds,
  allItems = [], setAllItems,
  categoryOrder = [], setCategoryOrder,
  dishOrder = [], setDishOrder,
  categoryLabels, setCategoryLabels,
  categoryIcons, setCategoryIcons,
  hotCategories, setHotCategories,
  dbCategories, setDbCategories
}) {
  const [activeAdminSection, setActiveAdminSection] = useState("calls");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Global Save states and handler
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const handleGlobalSave = async () => {
    setIsSaving(true);
    try {
      if (categoryOrder.length > 0) {
        await authFetch(`${API_URL}/api/categories/reorder`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids: categoryOrder, order: categoryOrder }),
          credentials: "include"
        });
      }

      if (dishOrder.length > 0) {
        await authFetch(`${API_URL}/api/dishes/reorder`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids: dishOrder, order: dishOrder }),
          credentials: "include"
        });
      }

      await authFetch(`${API_URL}/api/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          callWaiterEnabled,
          requestBillEnabled,
          isCartEnabled,
          reviewFormEnabled,
          isFeedbackEnabled: reviewFormEnabled,
          bannerSettings,
          customMenuEnabled
        }),
        credentials: "include"
      });

      if (onSaveSuccess) {
        await onSaveSuccess();
      }

      const msg = lang === "ka" ? "✓ ცვლილებები წარმატებით შენახულია!" : lang === "ru" ? "✓ Изменения успешно сохранены!" : "✓ Changes saved successfully!";
      setToastMessage(msg);
      setTimeout(() => setToastMessage(""), 3500);
    } catch (err) {
      setToastMessage(`⚠️ ${err.message}`);
      setTimeout(() => setToastMessage(""), 4000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleReviewForm = async () => {
    const nextVal = !reviewFormEnabled;
    setReviewFormEnabled(nextVal);
    try {
      await authFetch(`${API_URL}/api/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewFormEnabled: nextVal,
          isFeedbackEnabled: nextVal
        }),
        credentials: "include"
      });
    } catch (err) {
      console.error("Failed to update review form setting:", err);
    }
  };

  const [selectedSortCategory, setSelectedSortCategory] = useState("");
  const [draggedCatIdx, setDraggedCatIdx] = useState(null);
  const [dragOverCatIdx, setDragOverCatIdx] = useState(null);
  const [draggedDishIdx, setDraggedDishIdx] = useState(null);
  const [dragOverDishIdx, setDragOverDishIdx] = useState(null);

  useEffect(() => {
    if (!selectedSortCategory && categoryOrder.length > 0) {
      setSelectedSortCategory(categoryOrder[0]);
    }
  }, [categoryOrder, selectedSortCategory]);

  // Category creation states
  const [newCatKey, setNewCatKey]   = useState("");
  const [newCatKa, setNewCatKa]     = useState("");
  const [newCatEn, setNewCatEn]     = useState("");
  const [newCatRu, setNewCatRu]     = useState("");
  const [newCatIcon, setNewCatIcon] = useState("");
  const [newCatImageFile, setNewCatImageFile] = useState(null);
  const [newCatImagePreview, setNewCatImagePreview] = useState("");

  // Dish creation states
  const [newDishNameKa, setNewDishNameKa] = useState("");
  const [newDishNameEn, setNewDishNameEn] = useState("");
  const [newDishNameRu, setNewDishNameRu] = useState("");
  const [newDishDescKa, setNewDishDescKa] = useState("");
  const [newDishDescEn, setNewDishDescEn] = useState("");
  const [newDishDescRu, setNewDishDescRu] = useState("");
  const [newDishPrice, setNewDishPrice]   = useState("");
  const [newDishVolumePrices, setNewDishVolumePrices] = useState({});
  const [newDishCat, setNewDishCat]       = useState("");
  const [newDishImageFile, setNewDishImageFile] = useState(null);
  const [newDishImagePreview, setNewDishImagePreview] = useState("");

  // Category Edit states
  const [editingCategory, setEditingCategory] = useState(null);
  const [editCatKa, setEditCatKa] = useState("");
  const [editCatEn, setEditCatEn] = useState("");
  const [editCatRu, setEditCatRu] = useState("");
  const [editCatIcon, setEditCatIcon] = useState("");
  const [editCatIsHot, setEditCatIsHot] = useState(false);
  const [editCatImageFile, setEditCatImageFile] = useState(null);
  const [editCatImagePreview, setEditCatImagePreview] = useState("");
  const [isUpdatingCategory, setIsUpdatingCategory] = useState(false);

  // Dish Edit states
  const [editingDish, setEditingDish] = useState(null);
  const [editDishNameKa, setEditDishNameKa] = useState("");
  const [editDishNameEn, setEditDishNameEn] = useState("");
  const [editDishNameRu, setEditDishNameRu] = useState("");
  const [editDishDescKa, setEditDishDescKa] = useState("");
  const [editDishDescEn, setEditDishDescEn] = useState("");
  const [editDishDescRu, setEditDishDescRu] = useState("");
  const [editDishPrice, setEditDishPrice] = useState("");
  const [editDishVolumePrices, setEditDishVolumePrices] = useState({});
  const [editDishCat, setEditDishCat] = useState("");
  const [editDishImageFile, setEditDishImageFile] = useState(null);
  const [editDishImagePreview, setEditDishImagePreview] = useState("");
  const [isUpdatingDish, setIsUpdatingDish] = useState(false);

  // Standardized categories list for form selectors
  const categories = React.useMemo(() => {
    const rawKeys = Array.from(new Set([
      ...categoryOrder,
      ...dbCategories.map(c => c.id || c._id).filter(Boolean),
      ...Object.keys(categoryLabels || {}),
      ...Object.keys(INITIAL_CATEGORY_LABELS),
      ...(editingDish?.category ? [editingDish.category] : []),
      ...(editingDish?.categoryId ? [editingDish.categoryId] : []),
      ...(editDishCat ? [editDishCat] : [])
    ])).filter(Boolean);

    return rawKeys.map(key => {
      const catObj = dbCategories.find(c => (c.id || c._id) === key) || {};
      const labelObj = (categoryLabels && categoryLabels[key]) || INITIAL_CATEGORY_LABELS[key] || {};
      const nameKa = labelObj.ka || catObj.name_ka || catObj.name || key;
      const nameEn = labelObj.en || catObj.name_en || key;
      const nameRu = labelObj.ru || catObj.name_ru || key;
      return {
        id: key,
        key: key,
        title: nameKa,
        name: {
          ka: nameKa,
          en: nameEn,
          ru: nameRu
        }
      };
    });
  }, [categoryOrder, dbCategories, categoryLabels, editingDish, editDishCat]);

  const openEditCategory = (catKey) => {
    const catObj = dbCategories.find(c => (c.id || c._id) === catKey) || {};
    const labels = categoryLabels[catKey] || {};
    setEditingCategory(catKey);
    setEditCatKa(labels.ka || catObj.name_ka || catKey);
    setEditCatEn(labels.en || catObj.name_en || catKey);
    setEditCatRu(labels.ru || catObj.name_ru || catKey);
    setEditCatIcon(categoryIcons[catKey] || catObj.icon || "🍽️");
    setEditCatIsHot(hotCategories ? hotCategories.has(catKey) || !!catObj.isHot : !!catObj.isHot);
    setEditCatImageFile(null);
    setEditCatImagePreview(catObj.image || "");
  };

  const handleUpdateCategory = async (e) => {
    e.preventDefault();
    if (!editingCategory) return;
    setIsUpdatingCategory(true);

    const formData = new FormData();
    formData.append("name_ka", editCatKa.trim() || editingCategory);
    formData.append("name_en", editCatEn.trim() || editingCategory);
    formData.append("name_ru", editCatRu.trim() || editingCategory);
    formData.append("icon", editCatIcon.trim() || "🍽️");
    formData.append("isHot", editCatIsHot ? "true" : "false");
    if (editCatImageFile) {
      formData.append("image", editCatImageFile);
    }

    try {
      const response = await authFetch(`${API_URL}/api/categories/${editingCategory}`, {
        method: "PUT",
        body: formData,
        credentials: "include"
      });
      if (!response.ok) {
        throw new Error("კატეგორიის განახლება ვერ მოხერხდა");
      }
      const updatedCategory = await response.json();
      const catId = updatedCategory.id || updatedCategory._id || editingCategory;

      setDbCategories(prev => prev.map(c => ((c.id || c._id) === catId ? { ...c, ...updatedCategory } : c)));
      setCategoryLabels(prev => ({
        ...prev,
        [catId]: {
          ka: updatedCategory.name_ka || catId,
          en: updatedCategory.name_en || catId,
          ru: updatedCategory.name_ru || catId,
        }
      }));
      setCategoryIcons(prev => ({
        ...prev,
        [catId]: updatedCategory.icon || "🍽️"
      }));
      if (setHotCategories) {
        setHotCategories(prev => {
          const next = new Set(prev);
          if (editCatIsHot) next.add(catId);
          else next.delete(catId);
          return next;
        });
      }

      setEditingCategory(null);
      const msg = lang === "ka" ? "✓ კატეგორია წარმატებით განახლდა!" : lang === "ru" ? "✓ Категория успешно обновлена!" : "✓ Category updated successfully!";
      setToastMessage(msg);
      setTimeout(() => setToastMessage(""), 3500);
      if (onSaveSuccess) await onSaveSuccess();
    } catch (err) {
      alert(`შეცდომა: ${err.message}`);
    } finally {
      setIsUpdatingCategory(false);
    }
  };

  const openEditDish = (dish) => {
    if (!dish) return;
    const currentCat = dish.category || dish.categoryId || "";
    const allKnownCats = Array.from(new Set([
      ...categoryOrder,
      ...dbCategories.map(c => c.id || c._id).filter(Boolean),
      ...Object.keys(categoryLabels || {}),
      ...Object.keys(INITIAL_CATEGORY_LABELS)
    ]));
    const matchedCat = allKnownCats.find(c => c.toLowerCase() === currentCat.toLowerCase()) || currentCat || (allKnownCats.length > 0 ? allKnownCats[0] : "");
    setEditingDish({
      ...dish,
      category: matchedCat,
      categoryId: matchedCat
    });
    setEditDishNameKa(dish.name_ka || "");
    setEditDishNameEn(dish.name_en || "");
    setEditDishNameRu(dish.name_ru || "");
    setEditDishDescKa(dish.desc_ka || "");
    setEditDishDescEn(dish.desc_en || "");
    setEditDishDescRu(dish.desc_ru || "");
    setEditDishCat(matchedCat);
    setEditDishImageFile(null);
    setEditDishImagePreview(dish.image || "");

    let rawPrice = "";
    if (dish.price) {
      if (String(dish.price).includes("|")) {
        if (Array.isArray(dish.prices) && dish.prices.length > 0 && dish.prices[0].price !== undefined) {
          rawPrice = String(dish.prices[0].price);
        } else {
          const match = String(dish.price).match(/[\d.]+/);
          rawPrice = match ? match[0] : "";
        }
      } else {
        rawPrice = String(dish.price).replace(/[^\d.]/g, "");
      }
    }
    setEditDishPrice(rawPrice);

    const volPrices = {};
    if (Array.isArray(dish.prices) && dish.prices.length > 0) {
      dish.prices.forEach(p => {
        if (p && p.size) volPrices[p.size] = p.price !== undefined && p.price !== null ? String(p.price) : "";
      });
    } else {
      const parsed = parseMultiPrice(dish);
      if (parsed) {
        parsed.forEach(p => {
          if (p && p.size) volPrices[p.size] = p.priceNum !== undefined ? String(p.priceNum) : "";
        });
      }
    }
    setEditDishVolumePrices(volPrices);
  };

  const handleUpdateDish = async (e) => {
    e.preventDefault();
    if (!editDishNameKa.trim()) return alert("გთხოვთ მიუთითოთ კერძის დასახელება ქართულად!");

    const targetCategory = editingDish?.category || editingDish?.categoryId || editDishCat;
    const targetSizes = getVolumeSizesForDish(targetCategory, editDishNameKa, categoryLabels, dbCategories);

    let priceVal = "";
    let pricesArray = null;

    if (targetSizes && targetSizes.length > 0) {
      const validPrices = targetSizes
        .map(size => {
          const raw = editDishVolumePrices[size];
          const val = raw !== undefined && raw !== null && String(raw).trim() !== "" ? parseFloat(raw) : NaN;
          return { size, price: val };
        })
        .filter(p => !isNaN(p.price) && p.price > 0);

      if (validPrices.length > 0) {
        pricesArray = validPrices;
        priceVal = pricesArray.map(p => `${p.size.replace(/\s+/g, '')} - ${p.price}₾`).join(" | ");
      } else {
        const priceNum = parseFloat(editDishPrice);
        if (isNaN(priceNum) || priceNum <= 0) {
          return alert("გთხოვთ მიუთითოთ მინიმუმ ერთი მოცულობის ფასი ან კერძის ფასი!");
        }
        priceVal = `${priceNum} ₾`;
      }
    } else {
      const priceNum = parseFloat(editDishPrice);
      if (isNaN(priceNum) || priceNum <= 0) return alert("გთხოვთ მიუთითოთ კერძის სწორი ფასი!");
      priceVal = `${priceNum} ₾`;
    }

    setIsUpdatingDish(true);
    const formData = new FormData();
    formData.append("name_ka", editDishNameKa.trim());
    formData.append("name_en", editDishNameEn.trim() || editDishNameKa.trim());
    formData.append("name_ru", editDishNameRu.trim() || editDishNameKa.trim());
    formData.append("desc_ka", editDishDescKa.trim());
    formData.append("desc_en", editDishDescEn.trim());
    formData.append("desc_ru", editDishDescRu.trim());
    formData.append("price", priceVal);
    if (pricesArray && pricesArray.length > 0) {
      formData.append("prices", JSON.stringify(pricesArray));
    } else {
      formData.append("prices", JSON.stringify([]));
    }
    formData.append("category", targetCategory);
    formData.append("categoryId", targetCategory);
    if (editDishImageFile) {
      formData.append("image", editDishImageFile);
    }

    try {
      const dishId = editingDish.id || editingDish._id;
      const response = await authFetch(`${API_URL}/api/dishes/${dishId}`, {
        method: "PUT",
        body: formData,
        credentials: "include"
      });
      if (!response.ok) {
        throw new Error("კერძის განახლება ვერ მოხერხდა");
      }
      const updatedDish = await response.json();
      const finalCategory = updatedDish.category || targetCategory;
      const formatted = {
        ...updatedDish,
        id: updatedDish.id || updatedDish._id || dishId,
        category: finalCategory,
        prices: (pricesArray && pricesArray.length > 0) ? pricesArray : (updatedDish.prices || [])
      };

      setAllItems(prev => prev.map(item => ((item.id === formatted.id || item._id === formatted.id) ? formatted : item)));
      setEditingDish(null);
      const msg = lang === "ka" ? "✓ კერძი წარმატებით განახლდა!" : lang === "ru" ? "✓ Блюдо успешно обновлено!" : "✓ Dish updated successfully!";
      setToastMessage(msg);
      setTimeout(() => setToastMessage(""), 3500);
      if (onSaveSuccess) await onSaveSuccess();
    } catch (err) {
      alert(`შეცდომა: ${err.message}`);
    } finally {
      setIsUpdatingDish(false);
    }
  };

  useEffect(() => {
    if (!newDishCat && categoryOrder.length > 0) {
      setNewDishCat(categoryOrder[0]);
    }
  }, [categoryOrder, newDishCat]);

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    const key = newCatKey.trim().toLowerCase();
    if (!key) return alert("გთხოვთ მიუთითოთ კატეგორიის გასაღები (მაგ: dessert)!");
    if (categoryOrder.includes(key)) return alert("კატეგორია ამ გასაღებით უკვე არსებობს!");

    const formData = new FormData();
    formData.append("id", key);
    formData.append("name_ka", newCatKa.trim() || key);
    formData.append("name_en", newCatEn.trim() || key);
    formData.append("name_ru", newCatRu.trim() || key);
    formData.append("icon", newCatIcon.trim() || "🍽️");
    formData.append("isHot", "false");
    if (newCatImageFile) {
      formData.append("image", newCatImageFile);
    }

    try {
      const response = await authFetch(`${API_URL}/api/categories`, {
        method: "POST",
        body: formData,
        credentials: "include"
      });
      if (!response.ok) {
        throw new Error("კატეგორიის დამატება ვერ მოხერხდა");
      }
      const createdCategory = await response.json();
      const catId = createdCategory.id || createdCategory._id;

      setDbCategories(prev => [...prev, createdCategory]);
      setCategoryOrder(prev => [...prev, catId]);
      setCategoryLabels(prev => ({
        ...prev,
        [catId]: {
          ka: createdCategory.name_ka || catId,
          en: createdCategory.name_en || catId,
          ru: createdCategory.name_ru || catId,
        }
      }));
      setCategoryIcons(prev => ({
        ...prev,
        [catId]: createdCategory.icon || "🍽️"
      }));

      setNewCatKey("");
      setNewCatKa("");
      setNewCatEn("");
      setNewCatRu("");
      setNewCatIcon("");
      setNewCatImageFile(null);
      setNewCatImagePreview("");
      // Try to reset file input via standard query selector or key reset
      const fileInput = document.querySelector('input[type="file"][accept="image/*"]');
      if (fileInput) fileInput.value = "";

      if (onSaveSuccess) await onSaveSuccess();
      alert("კატეგორია წარმატებით დაემატა!");
    } catch (err) {
      alert(`შეცდომა: ${err.message}`);
    }
  };

  const handleCreateDish = async (e) => {
    e.preventDefault();
    if (!newDishNameKa.trim()) return alert("გთხოვთ მიუთითოთ კერძის დასახელება ქართულად!");
    if (!newDishCat) return alert("გთხოვთ აირჩიოთ კერძის კატეგორია!");

    const targetSizes = getVolumeSizesForDish(newDishCat, newDishNameKa, categoryLabels, dbCategories);

    let priceVal = "";
    let pricesArray = null;

    if (targetSizes && targetSizes.length > 0) {
      const validPrices = targetSizes
        .map(size => {
          const raw = newDishVolumePrices[size];
          const val = raw !== undefined && raw !== null && String(raw).trim() !== "" ? parseFloat(raw) : NaN;
          return { size, price: val };
        })
        .filter(p => !isNaN(p.price) && p.price > 0);

      if (validPrices.length > 0) {
        pricesArray = validPrices;
        priceVal = pricesArray.map(p => `${p.size.replace(/\s+/g, '')} - ${p.price}₾`).join(" | ");
      } else {
        const priceNum = parseFloat(newDishPrice);
        if (isNaN(priceNum) || priceNum <= 0) {
          return alert("გთხოვთ მიუთითოთ მინიმუმ ერთი მოცულობის ფასი ან კერძის ფასი!");
        }
        priceVal = `${priceNum} ₾`;
      }
    } else {
      const priceNum = parseFloat(newDishPrice);
      if (isNaN(priceNum) || priceNum <= 0) return alert("გთხოვთ მიუთითოთ კერძის ფასი!");
      priceVal = `${priceNum} ₾`;
    }

    const formData = new FormData();
    formData.append("name_ka", newDishNameKa.trim());
    formData.append("name_en", newDishNameEn.trim() || newDishNameKa.trim());
    formData.append("name_ru", newDishNameRu.trim() || newDishNameKa.trim());
    formData.append("desc_ka", newDishDescKa.trim());
    formData.append("desc_en", newDishDescEn.trim());
    formData.append("desc_ru", newDishDescRu.trim());
    formData.append("price", priceVal);
    if (pricesArray && pricesArray.length > 0) {
      formData.append("prices", JSON.stringify(pricesArray));
    }
    formData.append("category", newDishCat);
    if (newDishImageFile) {
      formData.append("image", newDishImageFile);
    }

    try {
      const response = await authFetch(`${API_URL}/api/dishes`, {
        method: "POST",
        body: formData,
        credentials: "include"
      });
      if (!response.ok) {
        throw new Error("კერძის დამატება ვერ მოხერხდა");
      }
      const createdDish = await response.json();
      const dishObj = {
        ...createdDish,
        id: createdDish.id || createdDish._id,
        prices: (pricesArray && pricesArray.length > 0) ? pricesArray : (createdDish.prices || [])
      };

      setAllItems(prev => [...prev, dishObj]);

      setNewDishNameKa("");
      setNewDishNameEn("");
      setNewDishNameRu("");
      setNewDishDescKa("");
      setNewDishDescEn("");
      setNewDishDescRu("");
      setNewDishPrice("");
      setNewDishVolumePrices({});
      setNewDishImageFile(null);
      setNewDishImagePreview("");
      // Try to reset file input via standard query selector or key reset
      const fileInputs = document.querySelectorAll('input[type="file"][accept="image/*"]');
      fileInputs.forEach(input => { input.value = ""; });

      if (onSaveSuccess) await onSaveSuccess();
      alert("კერძი წარმატებით დაემატა!");
    } catch (err) {
      alert(`შეცდომა: ${err.message}`);
    }
  };

  const handleDeleteCategory = async (catKey) => {
    const labelObj = categoryLabels[catKey] || { ka: catKey };
    const label = labelObj.ka || catKey;

    const categoryDishesCount = allItems.filter(dish => dish.category === catKey).length;
    let confirmMsg = `ნამდვილად გსურთ კატეგორიის "${label}" წაშლა?`;
    if (categoryDishesCount > 0) {
      confirmMsg += `\n\nგაფრთხილება: ეს კატეგორია შეიცავს ${categoryDishesCount} კერძს. კატეგორიის წაშლით ეს კერძებიც წაიშლება!`;
    }

    if (window.confirm(confirmMsg)) {
      try {
        const response = await authFetch(`${API_URL}/api/categories/${catKey}`, {
          method: "DELETE",
          credentials: "include"
        });
        if (!response.ok) {
          throw new Error("კატეგორიის წაშლა ვერ მოხერხდა");
        }

        setCategoryOrder(prev => prev.filter(x => x !== catKey));
        setDbCategories(prev => prev.filter(x => (x.id || x._id) !== catKey));
        if (categoryDishesCount > 0) {
          setAllItems(prev => prev.filter(dish => dish.category !== catKey));
        }

        setCategoryLabels(prev => {
          const next = { ...prev };
          delete next[catKey];
          return next;
        });
        setCategoryIcons(prev => {
          const next = { ...prev };
          delete next[catKey];
          return next;
        });

        alert(`კატეგორია "${label}" წარმატებით წაიშალა!`);
      } catch (err) {
        alert(`შეცდომა: ${err.message}`);
      }
    }
  };

  const handleDeleteDish = async (dishId) => {
    const dish = allItems.find(x => x.id === dishId);
    if (!dish) return;
    const name = dish.name_ka || dish.name_en || "";

    if (window.confirm(`ნამდვილად გსურთ კერძის "${name}" წაშლა?`)) {
      try {
        const response = await authFetch(`${API_URL}/api/dishes/${dishId}`, {
          method: "DELETE",
          credentials: "include"
        });
        if (!response.ok) {
          throw new Error("კერძის წაშლა ვერ მოხერხდა");
        }

        setAllItems(prev => prev.filter(x => x.id !== dishId));
        alert(`კერძი "${name}" წარმატებით წაიშალა!`);
      } catch (err) {
        alert(`შეცდომა: ${err.message}`);
      }
    }
  };

  const handleReorderCategory = async (fromIdx, toIdx) => {
    if (fromIdx === toIdx || fromIdx < 0 || toIdx < 0 || toIdx >= categoryOrder.length) return;

    const items = Array.from(categoryOrder);
    const [moved] = items.splice(fromIdx, 1);
    items.splice(toIdx, 0, moved);

    setCategoryOrder(items);

    try {
      const response = await authFetch(`${API_URL}/api/categories/reorder`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: items, order: items }),
        credentials: "include"
      });
      if (!response.ok) {
        throw new Error("კატეგორიების რიგითობის განახლება ვერ მოხერხდა");
      }
    } catch (err) {
      console.error(err);
      alert(`შეცდომა: ${err.message}`);
      setCategoryOrder(categoryOrder);
    }
  };

  const moveCategory = (index, direction) => {
    handleReorderCategory(index, index + direction);
  };

  const categoryDishes = allItems
    .filter(dish => dish.category === selectedSortCategory)
    .sort((a, b) => {
      const idxA = dishOrder.indexOf(a.id || a._id);
      const idxB = dishOrder.indexOf(b.id || b._id);
      return (idxA === -1 ? 999999 : idxA) - (idxB === -1 ? 999999 : idxB);
    });

  const handleReorderDish = async (fromFilteredIdx, toFilteredIdx) => {
    if (fromFilteredIdx === toFilteredIdx || fromFilteredIdx < 0 || toFilteredIdx < 0 || toFilteredIdx >= categoryDishes.length) return;

    const currentList = Array.from(categoryDishes);
    const [movedDish] = currentList.splice(fromFilteredIdx, 1);
    currentList.splice(toFilteredIdx, 0, movedDish);

    const categoryDishIds = new Set(currentList.map(d => d.id || d._id));
    const newOrder = [];
    let categoryInserted = false;

    for (const id of dishOrder) {
      if (categoryDishIds.has(id)) {
        if (!categoryInserted) {
          currentList.forEach(d => newOrder.push(d.id || d._id));
          categoryInserted = true;
        }
      } else {
        newOrder.push(id);
      }
    }
    if (!categoryInserted) {
      currentList.forEach(d => newOrder.push(d.id || d._id));
    }

    const updatedAllItems = allItems.map(item => {
      const orderIdx = newOrder.indexOf(item.id || item._id);
      return orderIdx !== -1 ? { ...item, order: orderIdx } : item;
    });

    setDishOrder(newOrder);
    setAllItems(updatedAllItems);

    try {
      const response = await authFetch(`${API_URL}/api/dishes/reorder`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: newOrder, order: newOrder }),
        credentials: "include"
      });
      if (!response.ok) {
        throw new Error("კერძების რიგითობის განახლება ვერ მოხერხდა");
      }
    } catch (err) {
      console.error(err);
      alert(`შეცდომა: ${err.message}`);
      setDishOrder(dishOrder);
    }
  };

  const moveDish = (dishId, direction) => {
    const currentFilteredIndex = categoryDishes.findIndex(d => (d.id === dishId || d._id === dishId));
    if (currentFilteredIndex === -1) return;
    handleReorderDish(currentFilteredIndex, currentFilteredIndex + direction);
  };

  const bannerImages = [
    { label: "საფირმო ჩეხური ნეკნები", value: "sapirmo chexuri neknebi.jpg" },
    { label: "ღორის მწვადი", value: "goris mcvadi.jpg" },
    { label: "ღორის ნეკნები", value: "goris nekni.jpg" },
    { label: "სტაროპაბის მთავარი ფონი", value: "staropub_main.jpg" },
  ];

  return (
    <div className="admin-container dark bg-neutral-900 text-white">
      <style>{`
        .admin-container {
          display: flex;
          min-height: 100vh;
          color: #f0c060;
          background: #0a0f1d;
          width: 100%;
          flex-direction: row;
          position: relative;
        }
        .admin-sidebar {
          width: 280px;
          min-width: 280px;
          border-right: 1px solid rgba(245,158,11,0.2);
          background: #060a13;
          padding: 24px 16px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          z-index: 10;
        }
        .admin-content {
          flex: 1;
          padding: 32px 40px;
          overflow-y: auto;
          background: #0a0f1d;
          width: 100%;
        }
        .admin-mobile-header {
          display: none;
        }
        .admin-sidebar-backdrop {
          display: none;
        }
        .admin-sidebar-close-btn {
          display: none;
        }
        @media (max-width: 767px) {
          .admin-sidebar {
            position: fixed;
            top: 0;
            left: 0;
            height: 100vh;
            z-index: 1001;
            transform: translateX(-100%);
            transition: transform 0.3s ease;
            box-shadow: 5px 0 25px rgba(0, 0, 0, 0.8);
            border-right: 1px solid rgba(245,158,11,0.3);
          }
          .admin-sidebar.open {
            transform: translateX(0);
          }
          .admin-sidebar-close-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(255,255,255,0.05);
            border: 1px solid rgba(245,158,11,0.2);
            color: #f0c060;
            width: 36px;
            height: 36px;
            border-radius: 50%;
            cursor: pointer;
            position: absolute;
            top: 16px;
            right: 16px;
            font-size: 18px;
            font-weight: bold;
            z-index: 1002;
          }
          .admin-content {
            padding: 80px 16px 20px;
            overflow-y: auto;
          }
          .admin-mobile-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 60px;
            background: #060a13;
            border-bottom: 1px solid rgba(245,158,11,0.2);
            padding: 0 16px;
            z-index: 999;
          }
          .hamburger-btn {
            background: linear-gradient(135deg, #b86520, #7a3a08);
            border: 1px solid #e8a030;
            border-radius: 8px;
            color: #fff;
            padding: 8px 16px;
            font-size: 13px;
            font-weight: 700;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 6px;
          }
          .admin-sidebar-backdrop {
            display: block;
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0, 0, 0, 0.7);
            backdrop-filter: blur(4px);
            z-index: 1000;
          }
          .save-spinner {
            display: inline-block;
            width: 14px;
            height: 14px;
            border: 2px solid rgba(255,255,255,0.3);
            border-top-color: #ffffff;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
          }
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          @keyframes fadeIn { from { opacity: 0; transform: translate(-50%, -10px); } to { opacity: 1; transform: translate(-50%, 0); } }
        }
      `}</style>

      {/* Mobile Top Header */}
      <div className="admin-mobile-header">
        <button onClick={() => setIsMobileSidebarOpen(true)} className="hamburger-btn">
          ☰ მენიუ
        </button>
        <span style={{ fontSize: 14, fontWeight: "bold", fontFamily: "'Georgia', serif", color: "#f0c060" }}>
          ადმინისტრატორი
        </span>
        <button
          onClick={handleGlobalSave}
          disabled={isSaving}
          style={{
            background: isSaving ? "rgba(34,197,94,0.4)" : "linear-gradient(135deg, #16a34a, #15803d)",
            border: "1px solid #4ade80",
            borderRadius: 8,
            color: "#fff",
            padding: "6px 12px",
            fontSize: 11,
            fontWeight: 800,
            cursor: isSaving ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            gap: 5
          }}
        >
          {isSaving ? <span className="save-spinner" /> : "💾"}
          {lang === "ka" ? "შენახვა" : lang === "ru" ? "Сохранить" : "Save"}
        </button>
      </div>

      {/* Dark backdrop overlay for mobile */}
      {isMobileSidebarOpen && (
        <div className="admin-sidebar-backdrop" onClick={() => setIsMobileSidebarOpen(false)} />
      )}

      {/* Left Sidebar */}
      <div className={`admin-sidebar ${isMobileSidebarOpen ? "open" : ""}`}>
        {/* Close Button on Mobile */}
        <button className="admin-sidebar-close-btn" onClick={() => setIsMobileSidebarOpen(false)}>
          ✕
        </button>
        <div>
          <h2 style={{ margin: 0, fontFamily: "'Georgia', serif", fontSize: 20, color: "#f0c060" }}>ადმინისტრატორი</h2>
          <span style={{ fontSize: 10, color: "#8a6040", letterSpacing: "1px", textTransform: "uppercase" }}>StaroPub Menu</span>
        </div>

        {/* Vertical Tabs */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
          {[
            { key: "calls", label: `🔔 გამოძახებები (${waiterCalls.length})` },
            { key: "banner", label: "📢 ბანერის პარამეტრები" },
            { key: "global", label: "⚙️ გლობალური პარამეტრები" },
            { key: "reviews", label: `💬 შეფასებები (${reviews.length})` },
            { key: "availability", label: `🚫 ხელმისაწვდომობა (${allItems.length})` },
            { key: "sorting", label: "↕️ სორტირება და რიგითობა" },
            { key: "create", label: "➕ კერძის/კატეგორიის დამატება" },
          ].map(tab => {
            const isActive = activeAdminSection === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveAdminSection(tab.key);
                  setIsMobileSidebarOpen(false);
                }}
                style={{
                  width: "100%",
                  textAlign: "left",
                  background: isActive ? "linear-gradient(135deg, #b86520, #7a3a08)" : "rgba(255,255,255,0.03)",
                  border: isActive ? "1px solid #e8a030" : "1px solid rgba(180,120,40,0.15)",
                  borderRadius: 12,
                  color: isActive ? "#fff" : "#8a6040",
                  padding: "12px 16px",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 700,
                  transition: "all 0.2s"
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Action Buttons: Save, Logout and Close */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, borderTop: "1px solid rgba(245,158,11,0.15)", paddingTop: 16 }}>
          <button
            onClick={handleGlobalSave}
            disabled={isSaving}
            style={{
              background: isSaving ? "rgba(34,197,94,0.4)" : "linear-gradient(135deg, #16a34a, #15803d)",
              border: "1px solid #4ade80",
              borderRadius: 10,
              color: "#ffffff",
              padding: "10px 14px",
              cursor: isSaving ? "not-allowed" : "pointer",
              fontSize: 13,
              fontWeight: 800,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              boxShadow: "0 4px 12px rgba(34,197,94,0.3)"
            }}
          >
            {isSaving ? (
              <>
                <span className="save-spinner" />
                {lang === "ka" ? "ინახება..." : lang === "ru" ? "Сохранение..." : "Saving..."}
              </>
            ) : (
              <>
                💾 {lang === "ka" ? "ცვლილებების შენახვა" : lang === "ru" ? "Сохранить изменения" : "Save Changes"}
              </>
            )}
          </button>

          <button
            onClick={onLogout}
            style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, color: "#f87171", padding: "10px 14px", cursor: "pointer", fontSize: 13, fontWeight: 700 }}
          >
            სისტემიდან გამოსვლა
          </button>
          <button
            onClick={onClose}
            style={{ background: "rgba(180,120,40,0.1)", border: "1px solid rgba(180,120,40,0.3)", borderRadius: 10, color: "#f0c060", padding: "10px 14px", cursor: "pointer", fontSize: 13, fontWeight: 700 }}
          >
            დახურვა
          </button>
        </div>
      </div>

      <div className="admin-content">
        {/* Floating Toast Notification */}
        {toastMessage && (
          <div style={{
            position: "fixed",
            top: 24,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 10000,
            background: toastMessage.startsWith("⚠️") ? "rgba(220,38,38,0.95)" : "linear-gradient(135deg, #15803d, #166534)",
            color: "#fff",
            padding: "12px 24px",
            borderRadius: 14,
            boxShadow: "0 8px 30px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.2)",
            fontWeight: 700,
            fontSize: 14,
            fontFamily: "'Georgia', serif",
            display: "flex",
            alignItems: "center",
            gap: 10,
            animation: "fadeIn 0.3s ease"
          }}>
            {toastMessage}
          </div>
        )}

        {/* Top Header Action Bar inside Admin Content */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 16,
          marginBottom: 24,
          paddingBottom: 16,
          borderBottom: "1px solid rgba(245,158,11,0.18)"
        }}>
          <div>
            <span style={{ fontSize: 11, color: "#8a6040", textTransform: "uppercase", letterSpacing: "1.5px", fontWeight: 700 }}>
              {lang === "ka" ? "ადმინისტრატორის პანელი" : lang === "ru" ? "Панель администратора" : "Admin Panel"}
            </span>
            <h2 style={{ margin: "2px 0 0", fontFamily: "'Georgia', serif", fontSize: 22, color: "#f0c060", fontWeight: 700 }}>
              {activeAdminSection === "calls" && (lang === "ka" ? "🔔 გამოძახებები" : "🔔 Calls")}
              {activeAdminSection === "banner" && (lang === "ka" ? "📢 ბანერის პარამეტრები" : "📢 Banner Settings")}
              {activeAdminSection === "global" && (lang === "ka" ? "⚙️ გლობალური პარამეტრები" : "⚙️ Global Settings")}
              {activeAdminSection === "reviews" && (lang === "ka" ? "💬 შეფასებები" : "💬 Reviews")}
              {activeAdminSection === "availability" && (lang === "ka" ? "🚫 ხელმისაწვდომობა" : "🚫 Availability")}
              {activeAdminSection === "sorting" && (lang === "ka" ? "↕️ სორტირება და რიგითობა" : "↕️ Sorting & Order")}
              {activeAdminSection === "create" && (lang === "ka" ? "➕ კერძის/კატეგორიის დამატება" : "➕ Add Item/Category")}
            </h2>
          </div>

          <button
            onClick={handleGlobalSave}
            disabled={isSaving}
            style={{
              background: isSaving ? "rgba(34,197,94,0.4)" : "linear-gradient(135deg, #16a34a, #15803d)",
              border: "1px solid #4ade80",
              borderRadius: 12,
              color: "#ffffff",
              padding: "10px 22px",
              fontSize: 13,
              fontWeight: 800,
              cursor: isSaving ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
              boxShadow: "0 4px 16px rgba(34,197,94,0.35)",
              transition: "all 0.2s ease",
              fontFamily: "'Georgia', serif",
              whiteSpace: "nowrap"
            }}
          >
            {isSaving ? (
              <>
                <span className="save-spinner" />
                {lang === "ka" ? "ინახება..." : lang === "ru" ? "Сохранение..." : "Saving..."}
              </>
            ) : (
              <>
                💾 {lang === "ka" ? "ცვლილებების შენახვა" : lang === "ru" ? "Сохранить изменения" : "Save Changes"}
              </>
            )}
          </button>
        </div>
        
        {activeAdminSection === "calls" && (
          <div>
            <h3 style={{ margin: "0 0 16px", fontFamily: "'Georgia', serif" }}>მიმტანისა და ანგარიშის გამოძახება რეალურ დროში</h3>
            <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
              <button
                onClick={() => {
                  const now = new Date().toLocaleTimeString();
                  setWaiterCalls(prev => [{ id: Date.now(), table: "3", type: "მიმტანი 💁‍♂️", time: now }, ...prev]);
                }}
                style={{ background: "rgba(180,120,40,0.1)", border: "1px solid rgba(180,120,40,0.25)", color: "#e8a030", borderRadius: 8, padding: "8px 14px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
              >
                + მაგიდა 3 მიმტანი (სიმულაცია)
              </button>
              <button
                onClick={() => {
                  const now = new Date().toLocaleTimeString();
                  setWaiterCalls(prev => [{ id: Date.now(), table: "5", type: "ანგარიში 🧾", time: now }, ...prev]);
                }}
                style={{ background: "rgba(180,120,40,0.1)", border: "1px solid rgba(180,120,40,0.25)", color: "#e8a030", borderRadius: 8, padding: "8px 14px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
              >
                + მაგიდა 5 ანგარიში (სიმულაცია)
              </button>
              <button
                onClick={() => setWaiterCalls([])}
                style={{ background: "rgba(180,40,40,0.1)", border: "1px solid rgba(180,40,40,0.25)", color: "#e06060", borderRadius: 8, padding: "8px 14px", fontSize: 11, fontWeight: 700, cursor: "pointer", marginLeft: "auto" }}
              >
                ყველას წაშლა
              </button>
            </div>

            {waiterCalls.length === 0 ? (
              <p style={{ color: "#8a6040", textAlign: "center", margin: "40px 0" }}>მაგიდებიდან აქტიური გამოძახება არ არის.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {waiterCalls.map(call => (
                  <div key={call.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(0,0,0,0.2)", border: "1px solid rgba(180,120,40,0.12)", borderRadius: 10, padding: 14 }}>
                    <div>
                      <span style={{ fontSize: 14, fontWeight: "bold" }}>მაგიდა {call.table}</span>
                      <span style={{ background: "rgba(184,101,32,0.15)", color: "#e8a030", fontSize: 11, padding: "2px 8px", borderRadius: 10, marginLeft: 10 }}>
                        {call.type === "Waiter 💁‍♂️" || call.type === "მიმტანი 💁‍♂️" ? "მიმტანი 💁‍♂️" : call.type === "Bill 🧾" || call.type === "ანგარიში 🧾" ? "ანგარიში 🧾" : call.type}
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span style={{ fontSize: 12, color: "#8a6040" }}>{call.time}</span>
                      <button
                        onClick={() => setWaiterCalls(prev => prev.filter(c => c.id !== call.id))}
                        style={{ background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.25)", color: "#4ade80", borderRadius: 6, padding: "4px 10px", fontSize: 11, cursor: "pointer" }}
                      >
                        დასრულება
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeAdminSection === "global" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 650 }}>
            <div>
              <h3 style={{ margin: "0 0 6px", fontFamily: "'Georgia', serif", fontSize: 22, color: "#f0c060" }}>გლობალური პარამეტრები</h3>
              <p style={{ margin: 0, fontSize: 13, color: "#8a6040" }}>მომსახურების ფუნქციონალისა და ღილაკების მართვა საიტზე</p>
            </div>

            {/* Call Waiter Toggle */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(245,158,11,0.18)", borderRadius: 16, padding: "18px 22px", gap: 16 }}>
              <div>
                <h4 style={{ margin: "0 0 4px", fontSize: 15, color: "#e8a030", fontWeight: 700 }}>💁‍♂️ ოფიციანტის გამოძახება</h4>
                <span style={{ fontSize: 12, color: "#8a6040", lineHeight: 1.4, display: "block" }}>სტუმრისთვის ოფიციანტის გამოძახების ფუნქციის ჩართვა/გათიშვა</span>
              </div>
              <button
                onClick={() => setCallWaiterEnabled(prev => !prev)}
                style={{
                  background: callWaiterEnabled ? "linear-gradient(135deg, #16a34a, #15803d)" : "rgba(74,48,24,0.6)",
                  color: callWaiterEnabled ? "#ffffff" : "#94a3b8",
                  border: `1px solid ${callWaiterEnabled ? "#4ade80" : "rgba(180,120,40,0.3)"}`,
                  borderRadius: 10,
                  padding: "8px 18px",
                  cursor: "pointer",
                  fontWeight: 800,
                  fontSize: 12,
                  transition: "all 0.2s ease",
                  whiteSpace: "nowrap"
                }}
              >
                {callWaiterEnabled ? "ჩართულია ✓" : "გათიშულია ✕"}
              </button>
            </div>

            {/* Request Bill Toggle */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(245,158,11,0.18)", borderRadius: 16, padding: "18px 22px", gap: 16 }}>
              <div>
                <h4 style={{ margin: "0 0 4px", fontSize: 15, color: "#e8a030", fontWeight: 700 }}>🧾 ანგარიშის მოთხოვნა</h4>
                <span style={{ fontSize: 12, color: "#8a6040", lineHeight: 1.4, display: "block" }}>სტუმრისთვის ანგარიშის მოთხოვნის ფუნქციის ჩართვა/გათიშვა</span>
              </div>
              <button
                onClick={() => setRequestBillEnabled(prev => !prev)}
                style={{
                  background: requestBillEnabled ? "linear-gradient(135deg, #16a34a, #15803d)" : "rgba(74,48,24,0.6)",
                  color: requestBillEnabled ? "#ffffff" : "#94a3b8",
                  border: `1px solid ${requestBillEnabled ? "#4ade80" : "rgba(180,120,40,0.3)"}`,
                  borderRadius: 10,
                  padding: "8px 18px",
                  cursor: "pointer",
                  fontWeight: 800,
                  fontSize: 12,
                  transition: "all 0.2s ease",
                  whiteSpace: "nowrap"
                }}
              >
                {requestBillEnabled ? "ჩართულია ✓" : "გათიშულია ✕"}
              </button>
            </div>

            {/* Cart / Ordering Toggle */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(245,158,11,0.18)", borderRadius: 16, padding: "18px 22px", gap: 16 }}>
              <div>
                <h4 style={{ margin: "0 0 4px", fontSize: 15, color: "#e8a030", fontWeight: 700 }}>🛒 კალათაში დამატება / შეკვეთა</h4>
                <span style={{ fontSize: 12, color: "#8a6040", lineHeight: 1.4, display: "block" }}>სტუმრისთვის კალათის და შეკვეთის ფუნქციონალის ჩართვა/გათიშვა</span>
              </div>
              <button
                onClick={() => setIsCartEnabled(prev => !prev)}
                style={{
                  background: isCartEnabled ? "linear-gradient(135deg, #16a34a, #15803d)" : "rgba(74,48,24,0.6)",
                  color: isCartEnabled ? "#ffffff" : "#94a3b8",
                  border: `1px solid ${isCartEnabled ? "#4ade80" : "rgba(180,120,40,0.3)"}`,
                  borderRadius: 10,
                  padding: "8px 18px",
                  cursor: "pointer",
                  fontWeight: 800,
                  fontSize: 12,
                  transition: "all 0.2s ease",
                  whiteSpace: "nowrap"
                }}
              >
                {isCartEnabled ? "ჩართულია ✓" : "გათიშულია ✕"}
              </button>
            </div>
          </div>
        )}

        {activeAdminSection === "banner" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <h3 style={{ margin: 0, fontFamily: "'Georgia', serif" }}>სარეკლამო ბანერის კონსტრუქტორი</h3>
            
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span>ბანერის ჩვენების ჩართვა</span>
              <button
                onClick={() => setBannerSettings(b => ({ ...b, enabled: !b.enabled }))}
                style={{
                  background: bannerSettings.enabled ? "#4ade80" : "#4a3018",
                  color: bannerSettings.enabled ? "#000" : "#fff",
                  border: "none", borderRadius: 8, padding: "6px 14px", cursor: "pointer", fontWeight: "bold"
                }}
              >
                {bannerSettings.enabled ? "აქტიური" : "გათიშული"}
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 12, color: "#8a6040", textTransform: "uppercase" }}>ბანერის სარეკლამო ტექსტი</label>
              <input
                type="text"
                value={bannerSettings.text}
                onChange={e => setBannerSettings(b => ({ ...b, text: e.target.value }))}
                style={{ background: "#141210", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 10, padding: 10, color: "#f0c060", outline: "none" }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 12, color: "#8a6040", textTransform: "uppercase" }}>ბეიჯის სათაური</label>
              <input
                type="text"
                value={bannerSettings.badge}
                onChange={e => setBannerSettings(b => ({ ...b, badge: e.target.value }))}
                style={{ background: "#141210", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 10, padding: 10, color: "#f0c060", outline: "none" }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 12, color: "#8a6040", textTransform: "uppercase" }}>ბანერის სურათი</label>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {bannerImages.map(img => (
                  <button
                    key={img.value}
                    onClick={() => setBannerSettings(b => ({ ...b, image: img.value }))}
                    style={{
                      background: bannerSettings.image === img.value ? "rgba(184,101,32,0.2)" : "rgba(255,255,255,0.03)",
                      border: `1px solid ${bannerSettings.image === img.value ? "#f0c060" : "rgba(180,120,40,0.15)"}`,
                      color: bannerSettings.image === img.value ? "#f0c060" : "#8a6040",
                      borderRadius: 8, padding: "8px 12px", fontSize: 11, cursor: "pointer", transition: "all 0.2s"
                    }}
                  >
                    {img.label}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={bannerSettings.image}
                onChange={e => setBannerSettings(b => ({ ...b, image: e.target.value }))}
                placeholder="ან ჩაწერეთ სურათის ლინკი/სახელი..."
                style={{ background: "#141210", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 10, padding: 10, color: "#f0c060", outline: "none", marginTop: 8 }}
              />
            </div>
          </div>
        )}

        {activeAdminSection === "global" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <h3 style={{ margin: 0, fontFamily: "'Georgia', serif" }}>ფუნქციების კონფიგურაცია</h3>
            
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(180,120,40,0.1)", paddingBottom: 16 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: "bold" }}>მენიუს შერჩევა და გაზიარება</div>
                <div style={{ fontSize: 11, color: "#8a6040" }}>საშუალებას აძლევს მომხმარებლებს შეადგინონ და გააზიარონ საკუთარი მენიუ.</div>
              </div>
              <button
                onClick={() => setCustomMenuEnabled(!customMenuEnabled)}
                style={{
                  background: customMenuEnabled ? "#4ade80" : "#4a3018",
                  color: customMenuEnabled ? "#000" : "#fff",
                  border: "none", borderRadius: 8, padding: "6px 14px", cursor: "pointer", fontWeight: "bold"
                }}
              >
                {customMenuEnabled ? "ჩართული" : "გათიშული"}
              </button>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: "bold" }}>შეფასების ფორმის საჯარო ჩვენება</div>
                <div style={{ fontSize: 11, color: "#8a6040" }}>აჩვენებს ღილაკს სტუმრებისთვის შეფასების დასაწერად.</div>
              </div>
              <button
                onClick={handleToggleReviewForm}
                style={{
                  background: reviewFormEnabled ? "#4ade80" : "#4a3018",
                  color: reviewFormEnabled ? "#000" : "#fff",
                  border: "none", borderRadius: 8, padding: "6px 14px", cursor: "pointer", fontWeight: "bold"
                }}
              >
                {reviewFormEnabled ? "ხილული" : "დამალული"}
              </button>
            </div>
          </div>
        )}

        {activeAdminSection === "reviews" && (
          <div>
            <h3 style={{ margin: "0 0 16px", fontFamily: "'Georgia', serif" }}>სტუმრების შეფასებების ჟურნალი</h3>
            {reviews.length === 0 ? (
              <p style={{ color: "#8a6040", textAlign: "center", margin: "40px 0" }}>სტუმრების შეფასებები ჯერ არ არის შემოსული.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {reviews.map(rev => (
                  <div key={rev.id || `${rev.date}-${rev.name}`} style={{ background: "rgba(0,0,0,0.2)", border: "1px solid rgba(180,120,40,0.12)", borderRadius: 12, padding: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                      <div>
                        <span style={{ fontWeight: "bold", fontSize: 14 }}>{rev.name}</span>
                        <span style={{ fontSize: 11, color: "#8a6040", marginLeft: 10 }}>მაგიდა {rev.table}</span>
                      </div>
                      <div style={{ color: "#f59e0b" }}>
                        {"★".repeat(rev.rating)}{"☆".repeat(5 - rev.rating)}
                      </div>
                    </div>
                    <p style={{ color: "#cbd5e1", fontSize: 13, margin: "0 0 10px", lineHeight: 1.5 }}>{rev.comment}</p>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 10, color: "#8a6040" }}>
                      <span>{rev.date}</span>
                      <span style={{ color: "#4ade80" }}>📧 იმიტირებული იმეილი გაეგზავნა ადმინისტრატორს</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeAdminSection === "availability" && (
          <div>
            <h3 style={{ margin: "0 0 16px", fontFamily: "'Georgia', serif" }}>კერძების ხელმისაწვდომობის მენეჯერი</h3>
            <p style={{ fontSize: 12, color: "#8a6040", marginBottom: 16 }}>
              გამორთეთ კერძები, რათა დროებით დამალოთ ისინი მენიუს ძირითადი ბადიდან და ყოველდღიური შემოთავაზებებიდან.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, maxHeight: 400, overflowY: "auto", paddingRight: 6 }}>
              {allItems.map(dish => {
                const dishName = dish.name_ka || dish.name_en || "";
                const isAvailable = !unavailableDishIds.includes(dish.id);
                return (
                  <div key={dish.id || dish.name_ka} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(0,0,0,0.2)", border: "1px solid rgba(180,120,40,0.12)", borderRadius: 10, padding: "10px 14px" }}>
                    <div>
                      <span style={{ fontSize: 14, fontWeight: "bold", color: isAvailable ? "#f0c060" : "#64748b" }}>{dishName}</span>
                      <span style={{ fontSize: 10, color: "#8a6040", marginLeft: 10, textTransform: "uppercase" }}>
                        {categoryLabels[dish.category]?.ka || dish.category}
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <button
                        onClick={() => openEditDish(dish)}
                        style={{
                          background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.35)",
                          borderRadius: 8, color: "#f0c060", padding: "6px 12px", cursor: "pointer", fontSize: 11, fontWeight: "bold", transition: "all 0.2s"
                        }}
                      >
                        ✏️ რედაქტირება
                      </button>
                      <button
                        onClick={() => {
                          setUnavailableDishIds(prev =>
                            prev.includes(dish.id) ? prev.filter(id => id !== dish.id) : [...prev, dish.id]
                          );
                        }}
                        style={{
                          background: isAvailable ? "#4ade80" : "#4a3018",
                          color: isAvailable ? "#000" : "#fff",
                          border: "none", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontSize: 11, fontWeight: "bold", transition: "all 0.2s"
                        }}
                      >
                        {isAvailable ? "აქტიური" : "გათიშული"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeAdminSection === "sorting" && (
          <div>
            <h3 style={{ margin: "0 0 16px", fontFamily: "'Georgia', serif" }}>პრიორიტეტებისა და სორტირების მენეჯერი</h3>
            
            {/* Category sorting section */}
            <div style={{ marginBottom: 32 }}>
              <h4 style={{ margin: "0 0 12px", fontFamily: "'Georgia', serif", fontSize: 16, display: "flex", alignItems: "center", gap: 8 }}>
                <span>📁 კატეგორიების რიგითობა</span>
                <span style={{ fontSize: 11, color: "#8a6040", fontWeight: "normal" }}>(გადაათრიეთ ან გამოიყენეთ ისრები)</span>
              </h4>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 320, overflowY: "auto", paddingRight: 6 }}>
                {categoryOrder.map((cat, idx) => {
                  const catLabelObj = categoryLabels[cat] || { ka: cat, en: cat, ru: cat };
                  const isDragging = draggedCatIdx === idx;
                  const isDragOver = dragOverCatIdx === idx;

                  return (
                    <div
                      key={cat}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData("text/plain", idx.toString());
                        e.dataTransfer.effectAllowed = "move";
                        setDraggedCatIdx(idx);
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = "move";
                        if (dragOverCatIdx !== idx) setDragOverCatIdx(idx);
                      }}
                      onDragLeave={() => {
                        if (dragOverCatIdx === idx) setDragOverCatIdx(null);
                      }}
                      onDragEnd={() => {
                        setDraggedCatIdx(null);
                        setDragOverCatIdx(null);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        const sourceIdx = draggedCatIdx !== null ? draggedCatIdx : parseInt(e.dataTransfer.getData("text/plain"), 10);
                        setDraggedCatIdx(null);
                        setDragOverCatIdx(null);
                        if (!isNaN(sourceIdx)) {
                          handleReorderCategory(sourceIdx, idx);
                        }
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        background: isDragging ? "rgba(245,158,11,0.15)" : isDragOver ? "rgba(245,158,11,0.25)" : "rgba(0,0,0,0.2)",
                        border: isDragOver ? "1.5px dashed #f0c060" : "1px solid rgba(180,120,40,0.12)",
                        borderRadius: 10,
                        padding: "8px 12px",
                        cursor: "grab",
                        opacity: isDragging ? 0.5 : 1,
                        transition: "background 0.2s, border 0.2s, opacity 0.2s",
                        userSelect: "none"
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ color: "#8a6040", fontSize: 16, lineHeight: 1, userSelect: "none" }}>⠿</span>
                        <span style={{ fontSize: 13, fontWeight: "bold" }}>{catLabelObj.ka || cat}</span>
                      </div>
                      <div style={{ display: "flex", gap: 6 }} onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => moveCategory(idx, -1)}
                          disabled={idx === 0}
                          title="ზემოთ ატანა"
                          style={{
                            background: "rgba(180,120,40,0.1)", border: "1px solid rgba(180,120,40,0.3)",
                            borderRadius: 6, color: idx === 0 ? "#4a3018" : "#f0c060",
                            width: 32, height: 32, cursor: idx === 0 ? "default" : "pointer", fontSize: 12, fontWeight: "bold"
                          }}
                        >
                          ▲
                        </button>
                        <button
                          onClick={() => moveCategory(idx, 1)}
                          disabled={idx === categoryOrder.length - 1}
                          title="ქვემოთ ჩამოტანა"
                          style={{
                            background: "rgba(180,120,40,0.1)", border: "1px solid rgba(180,120,40,0.3)",
                            borderRadius: 6, color: idx === categoryOrder.length - 1 ? "#4a3018" : "#f0c060",
                            width: 32, height: 32, cursor: idx === categoryOrder.length - 1 ? "default" : "pointer", fontSize: 12, fontWeight: "bold"
                          }}
                        >
                          ▼
                        </button>
                        <button
                          onClick={() => openEditCategory(cat)}
                          style={{
                            background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.35)",
                            borderRadius: 6, color: "#f0c060",
                            padding: "0 10px", height: 32, cursor: "pointer", fontSize: 11, fontWeight: "bold"
                          }}
                        >
                          ✏️ რედაქტირება
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(cat)}
                          style={{
                            background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.35)",
                            borderRadius: 6, color: "#ef4444",
                            padding: "0 10px", height: 32, cursor: "pointer", fontSize: 11, fontWeight: "bold"
                          }}
                        >
                          წაშლა
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Dishes sorting section */}
            <div>
              <h4 style={{ margin: "0 0 12px", fontFamily: "'Georgia', serif", fontSize: 16, display: "flex", alignItems: "center", gap: 8 }}>
                <span>🍽️ კერძების რიგითობა</span>
                <span style={{ fontSize: 11, color: "#8a6040", fontWeight: "normal" }}>(გადაათრიეთ ან გამოიყენეთ ისრები)</span>
              </h4>
              
              <div style={{ marginBottom: 24, display: "flex", flexDirection: "column", gap: 6, overflow: "visible" }}>
                <label style={{ fontSize: 12, color: "#8a6040", textTransform: "uppercase", fontWeight: "bold" }}>აირჩიეთ კატეგორია</label>
                <select
                  value={selectedSortCategory}
                  onChange={e => setSelectedSortCategory(e.target.value)}
                  style={{
                    background: "#141210", border: "1px solid rgba(245,158,11,0.2)",
                    borderRadius: 10, padding: 10, color: "#f0c060", outline: "none", width: "100%", fontFamily: "'Georgia', serif",
                    colorScheme: "dark", overflow: "visible"
                  }}
                >
                  {categoryOrder.map(cat => {
                    const catLabelObj = categoryLabels[cat] || { ka: cat, en: cat, ru: cat };
                    return (
                      <option key={cat} value={cat} style={{ background: "#141210", color: "#f0c060" }}>
                        {catLabelObj.ka || cat}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 320, overflowY: "auto", paddingRight: 6 }}>
                {categoryDishes.length === 0 ? (
                  <p style={{ color: "#8a6040", fontSize: 12, textAlign: "center", margin: "20px 0" }}>ამ კატეგორიაში კერძები არ არის.</p>
                ) : (
                  categoryDishes.map((dish, idx) => {
                    const dishName = dish.name_ka || dish.name_en || "";
                    const isDragging = draggedDishIdx === idx;
                    const isDragOver = dragOverDishIdx === idx;

                    return (
                      <div
                        key={dish.id || dish._id}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData("text/plain", idx.toString());
                          e.dataTransfer.effectAllowed = "move";
                          setDraggedDishIdx(idx);
                        }}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.dataTransfer.dropEffect = "move";
                          if (dragOverDishIdx !== idx) setDragOverDishIdx(idx);
                        }}
                        onDragLeave={() => {
                          if (dragOverDishIdx === idx) setDragOverDishIdx(null);
                        }}
                        onDragEnd={() => {
                          setDraggedDishIdx(null);
                          setDragOverDishIdx(null);
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          const sourceIdx = draggedDishIdx !== null ? draggedDishIdx : parseInt(e.dataTransfer.getData("text/plain"), 10);
                          setDraggedDishIdx(null);
                          setDragOverDishIdx(null);
                          if (!isNaN(sourceIdx)) {
                            handleReorderDish(sourceIdx, idx);
                          }
                        }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          background: isDragging ? "rgba(245,158,11,0.15)" : isDragOver ? "rgba(245,158,11,0.25)" : "rgba(0,0,0,0.2)",
                          border: isDragOver ? "1.5px dashed #f0c060" : "1px solid rgba(180,120,40,0.12)",
                          borderRadius: 10,
                          padding: "8px 12px",
                          cursor: "grab",
                          opacity: isDragging ? 0.5 : 1,
                          transition: "background 0.2s, border 0.2s, opacity 0.2s",
                          userSelect: "none"
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{ color: "#8a6040", fontSize: 16, lineHeight: 1, userSelect: "none" }}>⠿</span>
                          <span style={{ fontSize: 13, color: "#cbd5e1" }}>{dishName}</span>
                        </div>
                        <div style={{ display: "flex", gap: 6 }} onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => moveDish(dish.id, -1)}
                            disabled={idx === 0}
                            title="ზემოთ ატანა"
                            style={{
                              background: "rgba(180,120,40,0.1)", border: "1px solid rgba(180,120,40,0.3)",
                              borderRadius: 6, color: idx === 0 ? "#4a3018" : "#f0c060",
                              width: 32, height: 32, cursor: idx === 0 ? "default" : "pointer", fontSize: 12, fontWeight: "bold"
                            }}
                          >
                            ▲
                          </button>
                          <button
                            onClick={() => moveDish(dish.id, 1)}
                            disabled={idx === categoryDishes.length - 1}
                            title="ქვემოთ ჩამოტანა"
                            style={{
                              background: "rgba(180,120,40,0.1)", border: "1px solid rgba(180,120,40,0.3)",
                              borderRadius: 6, color: idx === categoryDishes.length - 1 ? "#4a3018" : "#f0c060",
                              width: 32, height: 32, cursor: idx === categoryDishes.length - 1 ? "default" : "pointer", fontSize: 12, fontWeight: "bold"
                            }}
                          >
                            ▼
                          </button>
                          <button
                            onClick={() => openEditDish(dish)}
                            style={{
                              background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.35)",
                              borderRadius: 6, color: "#f0c060",
                              padding: "0 10px", height: 32, cursor: "pointer", fontSize: 11, fontWeight: "bold"
                            }}
                          >
                            ✏️ რედაქტირება
                          </button>
                          <button
                            onClick={() => handleDeleteDish(dish.id)}
                            style={{
                              background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.35)",
                              borderRadius: 6, color: "#ef4444",
                              padding: "0 10px", height: 32, cursor: "pointer", fontSize: 11, fontWeight: "bold"
                            }}
                          >
                            წაშლა
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {activeAdminSection === "create" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
            {/* Form 1: Add Category */}
            <div style={{ background: "rgba(0,0,0,0.15)", border: "1px solid rgba(180,120,40,0.15)", borderRadius: 14, padding: 20 }}>
              <h3 style={{ margin: "0 0 16px", fontFamily: "'Georgia', serif", fontSize: 18, color: "#f0c060" }}>
                ➕ ახალი კატეგორიის დამატება
              </h3>
              <form onSubmit={handleCreateCategory} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <label style={{ fontSize: 11, color: "#8a6040", textTransform: "uppercase" }}>გასაღები (ID / Key)</label>
                    <input
                      type="text"
                      required
                      placeholder="მაგ: desserts"
                      value={newCatKey}
                      onChange={e => setNewCatKey(e.target.value)}
                      style={{ background: "#141210", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 10, padding: 10, color: "#f0c060", outline: "none", fontSize: 13 }}
                    />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <label style={{ fontSize: 11, color: "#8a6040", textTransform: "uppercase" }}>ემოჯი / იკონი</label>
                    <input
                      type="text"
                      placeholder="მაგ: 🍰"
                      value={newCatIcon}
                      onChange={e => setNewCatIcon(e.target.value)}
                      style={{ background: "#141210", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 10, padding: 10, color: "#f0c060", outline: "none", fontSize: 13 }}
                    />
                  </div>
                </div>
                
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <label style={{ fontSize: 11, color: "#8a6040", textTransform: "uppercase" }}>სახელი (KA)</label>
                    <input
                      type="text"
                      required
                      placeholder="დესერტები"
                      value={newCatKa}
                      onChange={e => setNewCatKa(e.target.value)}
                      style={{ background: "#141210", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 10, padding: 10, color: "#f0c060", outline: "none", fontSize: 13 }}
                    />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <label style={{ fontSize: 11, color: "#8a6040", textTransform: "uppercase" }}>სახელი (EN)</label>
                    <input
                      type="text"
                      required
                      placeholder="Desserts"
                      value={newCatEn}
                      onChange={e => setNewCatEn(e.target.value)}
                      style={{ background: "#141210", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 10, padding: 10, color: "#f0c060", outline: "none", fontSize: 13 }}
                    />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <label style={{ fontSize: 11, color: "#8a6040", textTransform: "uppercase" }}>სახელი (RU)</label>
                    <input
                      type="text"
                      required
                      placeholder="Десерты"
                      value={newCatRu}
                      onChange={e => setNewCatRu(e.target.value)}
                      style={{ background: "#141210", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 10, padding: 10, color: "#f0c060", outline: "none", fontSize: 13 }}
                    />
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 11, color: "#8a6040", textTransform: "uppercase" }}>კატეგორიის სურათი (ატვირთვა)</label>
                  {newCatImagePreview && (
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
                      <img
                        src={resolveImageSrc(newCatImagePreview)}
                        alt="Category Preview"
                        style={{ width: 50, height: 50, objectFit: "cover", borderRadius: 8, border: "1px solid rgba(245,158,11,0.3)" }}
                        onError={e => { e.target.style.display = "none"; }}
                      />
                      <span style={{ color: "#4ade80", fontSize: 11, fontWeight: 600 }}>✓ სურათი შერჩეულია</span>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setNewCatImageFile(file);
                        const reader = new FileReader();
                        reader.onloadend = () => setNewCatImagePreview(reader.result);
                        reader.readAsDataURL(file);
                      } else {
                        setNewCatImageFile(null);
                        setNewCatImagePreview("");
                      }
                    }}
                    style={{ background: "#141210", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 10, padding: 10, color: "#f0c060", outline: "none", fontSize: 13 }}
                  />
                </div>

                <button
                  type="submit"
                  style={{ background: "linear-gradient(135deg,#b86520,#7a3a08)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 10, color: "#fff", padding: "10px 16px", cursor: "pointer", fontSize: 13, fontWeight: "bold", marginTop: 8, width: "fit-content" }}
                >
                  კატეგორიის დამატება
                </button>
              </form>
            </div>

            {/* Form 2: Add Dish */}
            <div style={{ background: "rgba(0,0,0,0.15)", border: "1px solid rgba(180,120,40,0.15)", borderRadius: 14, padding: 20 }}>
              <h3 style={{ margin: "0 0 16px", fontFamily: "'Georgia', serif", fontSize: 18, color: "#f0c060" }}>
                ➕ ახალი კერძის დამატება
              </h3>
              <form onSubmit={handleCreateDish} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <label style={{ fontSize: 11, color: "#8a6040", textTransform: "uppercase" }}>დასახელება (KA)</label>
                    <input
                      type="text"
                      required
                      placeholder="ჩიზქეიქი"
                      value={newDishNameKa}
                      onChange={e => setNewDishNameKa(e.target.value)}
                      style={{ background: "#141210", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 10, padding: 10, color: "#f0c060", outline: "none", fontSize: 13 }}
                    />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <label style={{ fontSize: 11, color: "#8a6040", textTransform: "uppercase" }}>სახელი (EN)</label>
                    <input
                      type="text"
                      placeholder="Cheesecake"
                      value={newDishNameEn}
                      onChange={e => setNewDishNameEn(e.target.value)}
                      style={{ background: "#141210", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 10, padding: 10, color: "#f0c060", outline: "none", fontSize: 13 }}
                    />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <label style={{ fontSize: 11, color: "#8a6040", textTransform: "uppercase" }}>სახელი (RU)</label>
                    <input
                      type="text"
                      placeholder="Чизкейк"
                      value={newDishNameRu}
                      onChange={e => setNewDishNameRu(e.target.value)}
                      style={{ background: "#141210", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 10, padding: 10, color: "#f0c060", outline: "none", fontSize: 13 }}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <label style={{ fontSize: 11, color: "#8a6040", textTransform: "uppercase" }}>აღწერა (KA)</label>
                    <input
                      type="text"
                      placeholder="კენკრის სოუსით"
                      value={newDishDescKa}
                      onChange={e => setNewDishDescKa(e.target.value)}
                      style={{ background: "#141210", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 10, padding: 10, color: "#f0c060", outline: "none", fontSize: 13 }}
                    />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <label style={{ fontSize: 11, color: "#8a6040", textTransform: "uppercase" }}>აღწერა (EN)</label>
                    <input
                      type="text"
                      placeholder="With berry sauce"
                      value={newDishDescEn}
                      onChange={e => setNewDishDescEn(e.target.value)}
                      style={{ background: "#141210", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 10, padding: 10, color: "#f0c060", outline: "none", fontSize: 13 }}
                    />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <label style={{ fontSize: 11, color: "#8a6040", textTransform: "uppercase" }}>აღწერა (RU)</label>
                    <input
                      type="text"
                      placeholder="С ягодным соусом"
                      value={newDishDescRu}
                      onChange={e => setNewDishDescRu(e.target.value)}
                      style={{ background: "#141210", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 10, padding: 10, color: "#f0c060", outline: "none", fontSize: 13 }}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <label style={{ fontSize: 11, color: "#8a6040", textTransform: "uppercase" }}>კატეგორია</label>
                    <select
                      value={newDishCat}
                      onChange={e => setNewDishCat(e.target.value)}
                      style={{ background: "#141210", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 10, padding: "8px 10px", color: "#f0c060", outline: "none", fontSize: 13, height: 41, boxSizing: "border-box" }}
                    >
                      {categoryOrder.map(cat => {
                        const labelObj = categoryLabels[cat] || { ka: cat };
                        return (
                          <option key={cat} value={cat}>
                            {labelObj.ka || cat}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  <div style={{ gridColumn: "span 2", display: "flex", flexDirection: "column", gap: 6 }}>
                    {(() => {
                      const targetSizes = getVolumeSizesForDish(newDishCat, newDishNameKa, categoryLabels, dbCategories);
                      if (targetSizes && targetSizes.length > 0) {
                        return (
                          <div style={{ display: "flex", flexDirection: "column", gap: 6, background: "rgba(245,158,11,0.06)", padding: 10, borderRadius: 10, border: "1px solid rgba(245,158,11,0.2)" }}>
                            <label style={{ fontSize: 11, color: "#f0c060", textTransform: "uppercase", fontWeight: "bold" }}>
                              🍺 / 🥃 მოცულობების მიხედვით ფასები (ლარი)
                            </label>
                            <div style={{ display: "grid", gridTemplateColumns: `repeat(${targetSizes.length}, 1fr)`, gap: 10 }}>
                              {targetSizes.map(size => (
                                <div key={size} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                  <label style={{ fontSize: 11, color: "#8a6040" }}>{size}</label>
                                  <input
                                    type="number"
                                    step="0.01"
                                    placeholder="5.00"
                                    value={newDishVolumePrices[size] || ""}
                                    onChange={e => {
                                      const val = e.target.value;
                                      setNewDishVolumePrices(prev => ({ ...prev, [size]: val }));
                                    }}
                                    style={{ background: "#141210", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 10, padding: "8px 10px", color: "#f0c060", outline: "none", fontSize: 13, boxSizing: "border-box" }}
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      }
                      return (
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                          <label style={{ fontSize: 11, color: "#8a6040", textTransform: "uppercase" }}>ფასი (₾ / ლარი)</label>
                          <input
                            type="number"
                            step="0.01"
                            required
                            placeholder="12.50"
                            value={newDishPrice}
                            onChange={e => setNewDishPrice(e.target.value)}
                            style={{ background: "#141210", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 10, padding: "8px 10px", color: "#f0c060", outline: "none", fontSize: 13, height: 41, boxSizing: "border-box" }}
                          />
                        </div>
                      );
                    })()}
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 11, color: "#8a6040", textTransform: "uppercase" }}>სურათი (ატვირთვა)</label>
                  {newDishImagePreview && (
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
                      <img
                        src={resolveImageSrc(newDishImagePreview)}
                        alt="Dish Preview"
                        style={{ width: 50, height: 50, objectFit: "cover", borderRadius: 8, border: "1px solid rgba(245,158,11,0.3)" }}
                        onError={e => { e.target.style.display = "none"; }}
                      />
                      <span style={{ color: "#4ade80", fontSize: 11, fontWeight: 600 }}>✓ სურათი შერჩეულია</span>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setNewDishImageFile(file);
                        const reader = new FileReader();
                        reader.onloadend = () => setNewDishImagePreview(reader.result);
                        reader.readAsDataURL(file);
                      } else {
                        setNewDishImageFile(null);
                        setNewDishImagePreview("");
                      }
                    }}
                    style={{ background: "#141210", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 10, padding: 10, color: "#f0c060", outline: "none", fontSize: 13 }}
                  />
                </div>

                <button
                  type="submit"
                  style={{ background: "linear-gradient(135deg,#b86520,#7a3a08)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 10, color: "#fff", padding: "10px 16px", cursor: "pointer", fontSize: 13, fontWeight: "bold", marginTop: 8, width: "fit-content"}}
                >
                  კერძის დამატება
                </button>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* ── Modal: Edit Category ── */}
      {editingCategory && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0, 0, 0, 0.78)",
          backdropFilter: "blur(6px)",
          zIndex: 10050,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 16,
          animation: "fadeIn 0.2s ease-out"
        }}>
          <div style={{
            background: "#0d1424",
            border: "1px solid rgba(245, 158, 11, 0.35)",
            borderRadius: 18,
            boxShadow: "0 20px 60px rgba(0,0,0,0.8), 0 0 30px rgba(245,158,11,0.15)",
            width: "100%",
            maxWidth: 580,
            maxHeight: "90vh",
            overflowY: "auto",
            padding: 24,
            position: "relative"
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, borderBottom: "1px solid rgba(245,158,11,0.15)", paddingBottom: 14 }}>
              <div>
                <h3 style={{ margin: 0, fontFamily: "'Georgia', serif", fontSize: 18, color: "#f0c060" }}>
                  ✏️ კატეგორიის რედაქტირება
                </h3>
                <span style={{ fontSize: 11, color: "#8a6040" }}>ID / Key: <strong style={{ color: "#f0c060" }}>{editingCategory}</strong></span>
              </div>
              <button
                onClick={() => setEditingCategory(null)}
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(245,158,11,0.2)", color: "#cbd5e1", width: 32, height: 32, borderRadius: "50%", cursor: "pointer", fontSize: 16, fontWeight: "bold" }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateCategory} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 11, color: "#8a6040", textTransform: "uppercase" }}>გასაღები (ID - უცვლელია)</label>
                  <input
                    type="text"
                    disabled
                    value={editingCategory}
                    style={{ background: "#080c16", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: 10, color: "#94a3b8", fontSize: 13 }}
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 11, color: "#8a6040", textTransform: "uppercase" }}>ემოჯი / იკონი</label>
                  <input
                    type="text"
                    placeholder="მაგ: 🍰"
                    value={editCatIcon}
                    onChange={e => setEditCatIcon(e.target.value)}
                    style={{ background: "#141210", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 10, padding: 10, color: "#f0c060", outline: "none", fontSize: 13 }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 11, color: "#8a6040", textTransform: "uppercase" }}>სახელი (KA)</label>
                  <input
                    type="text"
                    required
                    value={editCatKa}
                    onChange={e => setEditCatKa(e.target.value)}
                    style={{ background: "#141210", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 10, padding: 10, color: "#f0c060", outline: "none", fontSize: 13 }}
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 11, color: "#8a6040", textTransform: "uppercase" }}>სახელი (EN)</label>
                  <input
                    type="text"
                    value={editCatEn}
                    onChange={e => setEditCatEn(e.target.value)}
                    style={{ background: "#141210", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 10, padding: 10, color: "#f0c060", outline: "none", fontSize: 13 }}
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 11, color: "#8a6040", textTransform: "uppercase" }}>სახელი (RU)</label>
                  <input
                    type="text"
                    value={editCatRu}
                    onChange={e => setEditCatRu(e.target.value)}
                    style={{ background: "#141210", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 10, padding: 10, color: "#f0c060", outline: "none", fontSize: 13 }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "6px 0", background: "rgba(245,158,11,0.06)", padding: "10px 14px", borderRadius: 10, border: "1px solid rgba(245,158,11,0.15)" }}>
                <input
                  type="checkbox"
                  id="edit-cat-is-hot"
                  checked={editCatIsHot}
                  onChange={e => setEditCatIsHot(e.target.checked)}
                  style={{ width: 18, height: 18, accentColor: "#b86520", cursor: "pointer" }}
                />
                <label htmlFor="edit-cat-is-hot" style={{ fontSize: 13, color: "#f0c060", cursor: "pointer", fontWeight: 600 }}>
                  🔥 პოპულარული / Hot კატეგორია
                </label>
              </div>

              {/* Image Preview & Replacement */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8, background: "rgba(0,0,0,0.2)", padding: 14, borderRadius: 12, border: "1px solid rgba(180,120,40,0.15)" }}>
                <label style={{ fontSize: 11, color: "#8a6040", textTransform: "uppercase", fontWeight: "bold" }}>
                  კატეგორიის სურათი
                </label>
                {editCatImagePreview && (
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <img
                      src={resolveImageSrc(editCatImagePreview)}
                      alt="Category Preview"
                      style={{ width: 70, height: 70, objectFit: "cover", borderRadius: 10, border: "1px solid rgba(245,158,11,0.3)" }}
                      onError={e => { e.target.style.display = "none"; }}
                    />
                    <div style={{ fontSize: 12, color: "#cbd5e1" }}>
                      <span style={{ color: "#4ade80", fontWeight: 600 }}>{editCatImageFile ? "✓ ახალი ფაილი შერჩეულია" : "მიმდინარე სურათი"}</span>
                      <p style={{ margin: "4px 0 0", fontSize: 10, color: "#94a3b8" }}>თუ ახალ ფაილს არ აირჩევთ, ძველი სურათი შენარჩუნდება.</p>
                    </div>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setEditCatImageFile(file);
                      const reader = new FileReader();
                      reader.onloadend = () => setEditCatImagePreview(reader.result);
                      reader.readAsDataURL(file);
                    }
                  }}
                  style={{ background: "#141210", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 10, padding: 10, color: "#f0c060", outline: "none", fontSize: 12 }}
                />
              </div>

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 12 }}>
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
                  disabled={isUpdatingCategory}
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 10, color: "#cbd5e1", padding: "10px 18px", cursor: "pointer", fontSize: 13, fontWeight: 700 }}
                >
                  გაუქმება
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingCategory}
                  style={{
                    background: isUpdatingCategory ? "rgba(184,101,32,0.5)" : "linear-gradient(135deg, #16a34a, #15803d)",
                    border: "1px solid #4ade80",
                    borderRadius: 10,
                    color: "#fff",
                    padding: "10px 22px",
                    cursor: isUpdatingCategory ? "not-allowed" : "pointer",
                    fontSize: 13,
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    gap: 6
                  }}
                >
                  {isUpdatingCategory ? <span className="save-spinner" /> : "💾"}
                  {isUpdatingCategory ? "ინახება..." : "ცვლილებების შენახვა"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Edit Dish ── */}
      {editingDish && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0, 0, 0, 0.78)",
          backdropFilter: "blur(6px)",
          zIndex: 10050,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 16,
          animation: "fadeIn 0.2s ease-out"
        }}>
          <div style={{
            background: "#0d1424",
            border: "1px solid rgba(245, 158, 11, 0.35)",
            borderRadius: 18,
            boxShadow: "0 20px 60px rgba(0,0,0,0.8), 0 0 30px rgba(245,158,11,0.15)",
            width: "100%",
            maxWidth: 640,
            maxHeight: "90vh",
            overflowY: "auto",
            padding: 24,
            position: "relative"
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, borderBottom: "1px solid rgba(245,158,11,0.15)", paddingBottom: 14 }}>
              <div>
                <h3 style={{ margin: 0, fontFamily: "'Georgia', serif", fontSize: 18, color: "#f0c060" }}>
                  ✏️ კერძის რედაქტირება
                </h3>
                <span style={{ fontSize: 11, color: "#8a6040" }}>ID: <strong style={{ color: "#f0c060" }}>{editingDish.id || editingDish._id}</strong></span>
              </div>
              <button
                onClick={() => setEditingDish(null)}
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(245,158,11,0.2)", color: "#cbd5e1", width: 32, height: 32, borderRadius: "50%", cursor: "pointer", fontSize: 16, fontWeight: "bold" }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateDish} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 11, color: "#8a6040", textTransform: "uppercase" }}>დასახელება (KA)</label>
                  <input
                    type="text"
                    required
                    value={editDishNameKa}
                    onChange={e => setEditDishNameKa(e.target.value)}
                    style={{ background: "#141210", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 10, padding: 10, color: "#f0c060", outline: "none", fontSize: 13 }}
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 11, color: "#8a6040", textTransform: "uppercase" }}>დასახელება (EN)</label>
                  <input
                    type="text"
                    value={editDishNameEn}
                    onChange={e => setEditDishNameEn(e.target.value)}
                    style={{ background: "#141210", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 10, padding: 10, color: "#f0c060", outline: "none", fontSize: 13 }}
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 11, color: "#8a6040", textTransform: "uppercase" }}>დასახელება (RU)</label>
                  <input
                    type="text"
                    value={editDishNameRu}
                    onChange={e => setEditDishNameRu(e.target.value)}
                    style={{ background: "#141210", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 10, padding: 10, color: "#f0c060", outline: "none", fontSize: 13 }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 11, color: "#8a6040", textTransform: "uppercase" }}>აღწერა (KA)</label>
                  <input
                    type="text"
                    value={editDishDescKa}
                    onChange={e => setEditDishDescKa(e.target.value)}
                    style={{ background: "#141210", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 10, padding: 10, color: "#f0c060", outline: "none", fontSize: 13 }}
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 11, color: "#8a6040", textTransform: "uppercase" }}>აღწერა (EN)</label>
                  <input
                    type="text"
                    value={editDishDescEn}
                    onChange={e => setEditDishDescEn(e.target.value)}
                    style={{ background: "#141210", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 10, padding: 10, color: "#f0c060", outline: "none", fontSize: 13 }}
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 11, color: "#8a6040", textTransform: "uppercase" }}>აღწერა (RU)</label>
                  <input
                    type="text"
                    value={editDishDescRu}
                    onChange={e => setEditDishDescRu(e.target.value)}
                    style={{ background: "#141210", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 10, padding: 10, color: "#f0c060", outline: "none", fontSize: 13 }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                <div className="flex flex-col gap-1" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label className="text-xs text-amber-200/70" style={{ fontSize: 11, color: "#8a6040", textTransform: "uppercase" }}>
                    კატეგორია
                  </label>
                  <select
                    value={editingDish?.category || editingDish?.categoryId || editDishCat || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEditDishCat(val);
                      setEditingDish(prev => prev ? { ...prev, category: val, categoryId: val } : prev);
                    }}
                    className="h-[41px] bg-[#141210] border border-[#2a2e3d] text-[#f0c060] rounded px-3 text-sm focus:outline-none"
                    style={{
                      height: 41,
                      background: "#141210",
                      border: "1px solid rgba(245, 158, 11, 0.2)",
                      color: "#f0c060",
                      borderRadius: 10,
                      padding: "8px 10px",
                      outline: "none",
                      fontSize: 13,
                      width: "100%",
                      boxSizing: "border-box",
                      colorScheme: "dark",
                      cursor: "pointer"
                    }}
                  >
                    {categories.map((cat) => (
                      <option key={cat.id || cat.key} value={cat.id || cat.key} style={{ background: "#141210", color: "#f0c060" }}>
                        {cat.name?.ka || cat.name || cat.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={{ gridColumn: "span 2", display: "flex", flexDirection: "column", gap: 6 }}>
                  {(() => {
                    const currentCategory = editingDish?.category || editingDish?.categoryId || editDishCat;
                    const targetSizes = getVolumeSizesForDish(currentCategory, editDishNameKa, categoryLabels, dbCategories);
                    if (targetSizes && targetSizes.length > 0) {
                      return (
                        <div style={{ display: "flex", flexDirection: "column", gap: 6, background: "rgba(245,158,11,0.06)", padding: 10, borderRadius: 10, border: "1px solid rgba(245,158,11,0.2)" }}>
                          <label style={{ fontSize: 11, color: "#f0c060", textTransform: "uppercase", fontWeight: "bold" }}>
                            🍺 / 🥃 მოცულობების მიხედვით ფასები (ლარი)
                          </label>
                          <div style={{ display: "grid", gridTemplateColumns: `repeat(${targetSizes.length}, 1fr)`, gap: 10 }}>
                            {targetSizes.map(size => (
                              <div key={size} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                <label style={{ fontSize: 11, color: "#8a6040" }}>{size}</label>
                                <input
                                  type="number"
                                  step="0.01"
                                  placeholder="5.00"
                                  value={editDishVolumePrices[size] || ""}
                                  onChange={e => {
                                    const val = e.target.value;
                                    setEditDishVolumePrices(prev => ({ ...prev, [size]: val }));
                                  }}
                                  style={{ background: "#141210", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 10, padding: "8px 10px", color: "#f0c060", outline: "none", fontSize: 13, boxSizing: "border-box" }}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }
                    return (
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        <label style={{ fontSize: 11, color: "#8a6040", textTransform: "uppercase" }}>ფასი (₾ / ლარი)</label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          placeholder="12.50"
                          value={editDishPrice}
                          onChange={e => setEditDishPrice(e.target.value)}
                          style={{ background: "#141210", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 10, padding: "8px 10px", color: "#f0c060", outline: "none", fontSize: 13, height: 41, boxSizing: "border-box" }}
                        />
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Image Preview & Replacement */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8, background: "rgba(0,0,0,0.2)", padding: 14, borderRadius: 12, border: "1px solid rgba(180,120,40,0.15)" }}>
                <label style={{ fontSize: 11, color: "#8a6040", textTransform: "uppercase", fontWeight: "bold" }}>
                  კერძის სურათი
                </label>
                {editDishImagePreview && (
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <img
                      src={resolveImageSrc(editDishImagePreview)}
                      alt="Dish Preview"
                      style={{ width: 70, height: 70, objectFit: "cover", borderRadius: 10, border: "1px solid rgba(245,158,11,0.3)" }}
                      onError={e => { e.target.style.display = "none"; }}
                    />
                    <div style={{ fontSize: 12, color: "#cbd5e1" }}>
                      <span style={{ color: "#4ade80", fontWeight: 600 }}>{editDishImageFile ? "✓ ახალი ფაილი შერჩეულია" : "მიმდინარე სურათი"}</span>
                      <p style={{ margin: "4px 0 0", fontSize: 10, color: "#94a3b8" }}>თუ ახალ ფაილს არ აირჩევთ, ძველი სურათი შენარჩუნდება.</p>
                    </div>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setEditDishImageFile(file);
                      const reader = new FileReader();
                      reader.onloadend = () => setEditDishImagePreview(reader.result);
                      reader.readAsDataURL(file);
                    }
                  }}
                  style={{ background: "#141210", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 10, padding: 10, color: "#f0c060", outline: "none", fontSize: 12 }}
                />
              </div>

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 12 }}>
                <button
                  type="button"
                  onClick={() => setEditingDish(null)}
                  disabled={isUpdatingDish}
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 10, color: "#cbd5e1", padding: "10px 18px", cursor: "pointer", fontSize: 13, fontWeight: 700 }}
                >
                  გაუქმება
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingDish}
                  style={{
                    background: isUpdatingDish ? "rgba(184,101,32,0.5)" : "linear-gradient(135deg, #16a34a, #15803d)",
                    border: "1px solid #4ade80",
                    borderRadius: 10,
                    color: "#fff",
                    padding: "10px 22px",
                    cursor: isUpdatingDish ? "not-allowed" : "pointer",
                    fontSize: 13,
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    gap: 6
                  }}
                >
                  {isUpdatingDish ? <span className="save-spinner" /> : "💾"}
                  {isUpdatingDish ? "ინახება..." : "ცვლილებების შენახვა"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════════════════