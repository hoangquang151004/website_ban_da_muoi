"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { productService } from "@/services/productService";
import type { Product, Category } from "@/types";

const SORT_OPTIONS = [
  { value: "ban-chay", label: "Bán chạy nhất" },
  { value: "gia-tang", label: "Giá: Thấp đến Cao" },
  { value: "gia-giam", label: "Giá: Cao đến Thấp" },
  { value: "moi-nhat", label: "Mới nhất" },
];

function formatPrice(p: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(p);
}

function getImageUrl(url: string | null | undefined): string {
  if (!url) return "https://placehold.co/400x500/f1ede9/c9a97a?text=Da+muoi";
  if (url.startsWith("http") || url.startsWith("data:")) return url;
  const baseUrl =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
  const host = baseUrl.replace("/api/v1", "");
  return `${host}${url.startsWith("/") ? "" : "/"}${url}`;
}

function StarIcons({ rating }: { rating: number }) {
  return (
    <div className="flex text-primary text-[14px]">
      {[1, 2, 3, 4, 5].map((i) => {
        const icon =
          rating >= i
            ? "star"
            : rating >= i - 0.5
              ? "star_half"
              : "star_border";
        return (
          <span
            key={i}
            className="material-symbols-outlined fill-current text-[16px]"
          >
            {icon}
          </span>
        );
      })}
    </div>
  );
}

// ─── Main interactive content ─────────────────────────────────
function ShopContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const qParam = searchParams.get("q") || "";
  const categoryParam = searchParams.get("category") || "";
  const useParam = searchParams.get("use") || "";
  const sortParam = searchParams.get("sort") || "ban-chay";
  const minPriceParam = searchParams.get("min_price") || "";
  const maxPriceParam = searchParams.get("max_price") || "";
  const currentPage = parseInt(searchParams.get("page") || "1", 10);

  // Local state for debounced search input
  const [inputValue, setInputValue] = useState(qParam);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [uses, setUses] = useState<{ id: number; name: string }[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // Sync input when URL changes externally (back/forward)
  useEffect(() => {
    setInputValue(qParam);
  }, [qParam]);

  // Debounce: update URL 450ms after user stops typing
  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (inputValue) params.set("q", inputValue);
      else params.delete("q");
      params.delete("page");
      router.replace(`/?${params.toString()}`, { scroll: false });
    }, 450);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputValue]);

  const selectedCategories = categoryParam ? categoryParam.split(",") : [];
  const selectedUses = useParam ? useParam.split(",").map(Number) : [];

  // Fetch products from API
  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        const params: Record<string, unknown> = {
          page: currentPage,
          limit: 12,
        };
        if (qParam) params.search = qParam;
        if (selectedCategories.length === 1)
          params.category_slug = selectedCategories[0];
        // If multiple, would need backend support. Right now backend expects 1 category slug or category_id
        if (selectedUses.length === 1) params.use_id = selectedUses[0];

        if (minPriceParam) params.min_price = minPriceParam;
        if (maxPriceParam) params.max_price = maxPriceParam;

        if (sortParam === "gia-tang") params.sort_by = "price_asc";
        else if (sortParam === "gia-giam") params.sort_by = "price_desc";
        else if (sortParam === "moi-nhat") params.sort_by = "newest";

        const res = await productService.getProducts(params);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const paginatedData = (res as any)?.data ?? res;
        setProducts(paginatedData.items ?? []);
        setTotalPages(paginatedData.total_pages ?? 1);
      } catch (err) {
        console.error("Lỗi tải sản phẩm:", err);
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    qParam,
    categoryParam,
    useParam,
    sortParam,
    minPriceParam,
    maxPriceParam,
    currentPage,
  ]);

  // Fetch categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await productService.getCategories();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data = (res as any)?.data ?? res;
        setCategories(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Lỗi tải danh mục:", err);
      }
    };
    fetchCategories();
  }, []);

  // Fetch uses from API
  useEffect(() => {
    const fetchUses = async () => {
      try {
        const res = await productService.getUses();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data = (res as any)?.data ?? res;
        setUses(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Lỗi tải công dụng:", err);
      }
    };
    fetchUses();
  }, []);

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    if (key !== "page") params.delete("page");
    router.replace(`/?${params.toString()}`, { scroll: false });
  };

  const toggleCategory = (slug: string) => {
    const current = categoryParam ? categoryParam.split(",") : [];
    const next = current.includes(slug)
      ? current.filter((c) => c !== slug)
      : [...current, slug];
    updateParam("category", next.join(","));
  };

  const toggleUse = (id: number) => {
    const next = selectedUses.includes(id)
      ? selectedUses.filter((u) => u !== id)
      : [...selectedUses, id];
    updateParam("use", next.join(","));
  };

  const goToPage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page));
    router.replace(`/?${params.toString()}`, { scroll: false });
  };

  return (
    <main className="flex-grow w-full max-w-[1440px] mx-auto px-6 py-8">
      <div className="flex items-center gap-2 mb-8 text-sm">
        <Link href="/" className="text-neutral-medium hover:text-primary">
          Trang chủ
        </Link>
        <span className="text-neutral-medium">/</span>
        <span className="text-neutral-dark font-medium">
          Bộ sưu tập Đèn đá muối
        </span>
      </div>

      <div className="flex flex-col lg:flex-row gap-10">
        <aside className="w-full lg:w-1/4 flex flex-col gap-8">
          <div className="lg:hidden">
            <h1 className="text-3xl font-bold text-neutral-dark mb-4">
              Bộ sưu tập Đèn đá muối
            </h1>
            <button className="w-full flex items-center justify-center gap-2 bg-neutral-light py-3 rounded-lg font-medium text-neutral-dark">
              <span className="material-symbols-outlined">filter_list</span>
              Bộ lọc
            </button>
          </div>
          <div className="hidden lg:flex flex-col gap-8 pr-4">
            <div>
              <h3 className="text-lg font-bold text-neutral-dark mb-4">
                Tìm kiếm sản phẩm
              </h3>
              <div className="relative">
                <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-neutral-medium">
                  <span className="material-symbols-outlined text-[20px]">
                    search
                  </span>
                </span>
                <input
                  className="w-full bg-white border border-border-color rounded-lg py-3 pl-10 pr-4 text-sm focus:border-primary focus:ring-1 focus:ring-primary placeholder:text-neutral-medium transition-shadow outline-none"
                  placeholder="Từ khóa..."
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                />
              </div>
            </div>
            <div className="border-t border-border-color pt-6">
              <h3 className="text-lg font-bold text-neutral-dark mb-4">
                Danh mục
              </h3>
              <div className="flex flex-col gap-3">
                {categories.map((cat) => (
                  <label
                    key={cat.slug}
                    className="flex items-center gap-3 cursor-pointer group"
                  >
                    <input
                      className="w-5 h-5 rounded border-border-color text-primary focus:ring-primary cursor-pointer"
                      type="checkbox"
                      checked={selectedCategories.includes(cat.slug)}
                      onChange={() => toggleCategory(cat.slug)}
                    />
                    <span className="text-neutral-dark group-hover:text-primary transition-colors">
                      {cat.name}
                    </span>
                  </label>
                ))}
              </div>
            </div>
            <div className="border-t border-border-color pt-6">
              <h3 className="text-lg font-bold text-neutral-dark mb-4">
                Công dụng
              </h3>
              <div className="flex flex-col gap-3">
                {uses.map((u) => (
                  <label
                    key={u.id}
                    className="flex items-center gap-3 cursor-pointer group"
                  >
                    <input
                      className="w-5 h-5 rounded border-border-color text-primary focus:ring-primary cursor-pointer"
                      type="checkbox"
                      checked={selectedUses.includes(u.id)}
                      onChange={() => toggleUse(u.id)}
                    />
                    <span className="text-neutral-dark group-hover:text-primary transition-colors">
                      {u.name}
                    </span>
                  </label>
                ))}
              </div>
            </div>
            <div className="border-t border-border-color pt-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-neutral-dark">
                  Khoảng giá (VND)
                </h3>
              </div>
              <div className="flex items-center gap-2 mb-4">
                <input
                  type="number"
                  min="0"
                  placeholder="Từ..."
                  className="w-1/2 bg-white border border-border-color rounded-lg py-2 px-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  value={minPriceParam}
                  onChange={(e) => updateParam("min_price", e.target.value)}
                />
                <span className="text-neutral-medium">-</span>
                <input
                  type="number"
                  min="0"
                  placeholder="Đến..."
                  className="w-1/2 bg-white border border-border-color rounded-lg py-2 px-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  value={maxPriceParam}
                  onChange={(e) => updateParam("max_price", e.target.value)}
                />
              </div>
            </div>
          </div>
        </aside>

        <section className="w-full lg:w-3/4">
          <div className="flex justify-between items-end mb-6">
            <h1 className="text-3xl font-bold text-neutral-dark hidden lg:block">
              Bộ sưu tập Đèn đá muối
            </h1>
            <div className="flex items-center gap-2">
              <span className="text-neutral-medium text-sm">Sắp xếp theo:</span>
              <select
                className="bg-transparent border-none text-sm font-bold text-neutral-dark focus:ring-0 cursor-pointer pr-8 pl-0 py-0 outline-none"
                value={sortParam}
                onChange={(e) => updateParam("sort", e.target.value)}
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Product grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex flex-col gap-3">
                  <div className="bg-slate-100 rounded-2xl aspect-[4/5] animate-pulse" />
                  <div className="h-5 bg-slate-100 rounded animate-pulse w-3/4" />
                  <div className="h-4 bg-slate-100 rounded animate-pulse w-1/2" />
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="py-20 text-center text-neutral-medium">
              <span className="material-symbols-outlined text-5xl mb-3 block">
                search_off
              </span>
              Không tìm thấy sản phẩm phù hợp
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {products.map((product) => (
                <Link
                  key={product.id}
                  href={`/product/${product.slug}`}
                  className="group flex flex-col gap-3"
                >
                  <div className="relative overflow-hidden rounded-2xl bg-white aspect-[4/5] shadow-sm hover:shadow-md transition-shadow">
                    <img
                      alt={product.name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                      src={getImageUrl(product.image_url)}
                    />
                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        className="bg-white p-2 rounded-full shadow-lg text-neutral-dark hover:text-primary transition-colors"
                        onClick={(e) => e.preventDefault()}
                      >
                        <span className="material-symbols-outlined text-[20px]">
                          favorite
                        </span>
                      </button>
                    </div>
                    {product.is_featured && (
                      <div className="absolute top-3 left-3">
                        <span className="bg-primary/90 text-white backdrop-blur-sm px-2 py-1 rounded-md text-xs font-bold shadow-sm">
                          Nổi bật
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    <h3 className="text-lg font-bold text-neutral-dark group-hover:text-primary transition-colors">
                      {product.name}
                    </h3>
                    <div className="flex items-center gap-1">
                      <StarIcons rating={product.rating ?? 4.5} />
                      <span className="text-xs text-neutral-medium">
                        ({product.reviewCount ?? 0})
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <div className="flex flex-col">
                        <span className="text-xl font-bold text-primary">
                          {formatPrice(product.price)}
                        </span>
                        {(product.original_price ?? product.originalPrice) && (
                          <span className="text-xs text-neutral-medium line-through">
                            {formatPrice(
                              (product.original_price ??
                                product.originalPrice)!,
                            )}
                          </span>
                        )}
                      </div>
                      <button
                        className="flex items-center justify-center p-2 rounded-full bg-neutral-light hover:bg-primary hover:text-white transition-all text-neutral-dark"
                        onClick={(e) => e.preventDefault()}
                      >
                        <span className="material-symbols-outlined text-[20px]">
                          add_shopping_cart
                        </span>
                      </button>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-12 gap-2">
              <button
                className="flex items-center justify-center w-10 h-10 rounded-lg border border-border-color text-neutral-dark hover:bg-neutral-light disabled:opacity-40"
                disabled={currentPage <= 1}
                onClick={() => goToPage(currentPage - 1)}
              >
                <span className="material-symbols-outlined text-sm">
                  arrow_back_ios
                </span>
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <button
                    key={page}
                    className={`flex items-center justify-center w-10 h-10 rounded-lg font-bold ${
                      page === currentPage
                        ? "bg-primary text-white"
                        : "border border-border-color text-neutral-dark hover:bg-neutral-light hover:text-primary"
                    }`}
                    onClick={() => goToPage(page)}
                  >
                    {page}
                  </button>
                ),
              )}
              <button
                className="flex items-center justify-center w-10 h-10 rounded-lg border border-border-color text-neutral-dark hover:bg-neutral-light disabled:opacity-40"
                disabled={currentPage >= totalPages}
                onClick={() => goToPage(currentPage + 1)}
              >
                <span className="material-symbols-outlined text-sm">
                  arrow_forward_ios
                </span>
              </button>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-neutral-medium">
          Đang tải...
        </div>
      }
    >
      <ShopContent />
    </Suspense>
  );
}
