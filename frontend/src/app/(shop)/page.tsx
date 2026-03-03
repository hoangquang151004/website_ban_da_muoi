"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

// ─── Mock data ────────────────────────────────────────────────
interface Product {
  id: number;
  slug: string;
  name: string;
  price: number;
  rating: number;
  reviews: number;
  badge: string | null;
  badgePrimary: boolean;
  category: string;
  createdOrder: number;
  image: string;
}

const PRODUCTS: Product[] = [
  {
    id: 1,
    slug: "den-da-muoi-tu-nhien",
    name: "Đèn đá muối tự nhiên",
    price: 2000000,
    rating: 4.5,
    reviews: 128,
    badge: "Bán chạy",
    badgePrimary: false,
    category: "den-nuong",
    createdOrder: 3,
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCZZUFEqsTLaX83QBhLLOkcqQ0dA6uXs9J4FNUaB5Srl_4S0AwdMHudb4PwMdo4AacHlNrnwHJH6xQfMnozq7BbVgwOllgAquvyi1UYaeue0ER892TCqmgGDj7BOovq2ZiHIGjqKTyY8GFKtQJQKa1PXPbcPv_IuZb9uQP2JKKOgfe5jEbwKkg4UDszVB1oaC0D_RInPW8iu5VCa6ihRMAI_httldVNML-rOVsf1yv_5t7UD6EvjfFm7vGhlH5lRkNebnHobEAfsS5Z",
  },
  {
    id: 2,
    slug: "den-da-muoi-hinh-cau",
    name: "Đèn đá muối hình cầu",
    price: 2300000,
    rating: 4,
    reviews: 45,
    badge: null,
    badgePrimary: false,
    category: "den-ngu",
    createdOrder: 2,
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCdeOK3eSEdpT8G1WA4S_vD3ivz0Aj4ohFw2YE6UFLdYkqagA-sVBunNgvsmp-jfztkHv94ts41DbSC2y0eF5BgriRNA22Hh7oCcs339uX31ILUzX-5mpEYmuabBrGzTVd0QpMh95QuGy5r4u6j_ZnPdAdj7njtAm-glWhW-9kDzJQbccnWHnKSXppjCwfyUS1NJr2ztSzc11Jnk1cdx5iMvvBaI80Fs1whimhCXJvviygfXriZpvuzqavyC5CFT9NQFwo390H1AlmK",
  },
  {
    id: 3,
    slug: "den-to-da-muoi",
    name: "Đèn tô đá muối",
    price: 5100000,
    rating: 5,
    reviews: 82,
    badge: null,
    badgePrimary: false,
    category: "den-nuong",
    createdOrder: 4,
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDNY_7LA729xsZ66qW6tZTvLRw5wujHEvqBMBoqyYehAltIqOcCfRlo_OcTP1I8qSqThQuyXXQuZ1eMPRtDeVgnpaOZbIrG8dehVUgaoBifxiwqSv4x1TVwNnPYINN988yKlO-nhVtzkjJofZblgfMoiUik1eOKtrpyl99F3zsIBNzePNNB3jjiii4-4A9CMd9KD3mojmrZ4GE0c1mtg-fgBD0NqT9hWO_q1OseimG8Y6FY5-iU8_CIR_8ddD6P9a7lCNm034bW8sQa",
  },
  {
    id: 4,
    slug: "den-da-muoi-kim-tu-thap",
    name: "Đèn đá muối Kim tự tháp",
    price: 4100000,
    rating: 3.5,
    reviews: 14,
    badge: null,
    badgePrimary: false,
    category: "kim-tu-thap",
    createdOrder: 1,
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBrhXFYgxLWpzleBnTyx8zedAHYft9EI-DrEZTzErF4YSUpMt5TmXjfp1Wm1ZaeDYtk-AmsZ_ymw1SUl4kwNbB95JQJvr3NbnN5KGGoecXbbtsrXo-B2x9F_pBw-yMTy2K_IcPhH3ybp3kioaL1XVCe8IDxXMJlhwkkPClUc2epnYzqHzbMzExcfoT9wu8m_6q4DD73A-Lhfth3wlaRKXxnz-XU-Er06Cmayym4tI9NC1JLeYZ-Qr1_0YJS_yJ9R01jCNy8qxvI7Dsa",
  },
  {
    id: 5,
    slug: "den-da-muoi-xam-hiem",
    name: "Đèn đá muối xám hiếm",
    price: 2400000,
    rating: 5,
    reviews: 6,
    badge: "Mới",
    badgePrimary: true,
    category: "den-ngu",
    createdOrder: 6,
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBKmzG4W7ecwZI45RjQ_4HII0ZIpbvhrBurSXy-9WGWdnGBj5I1jHKpysVnSYTnt7lEfCkLzc8WVqVnMlqx6tdhsZM3NPuJ5hO4srhpPZ6_In8efKxM4ieHHQBFItmVCGxCwfT8k7WkeDttQ2oXK33gXQfa-boxAjBT4Vn-c6_arv9aowqtRuA60RCmXiPwe_lg_Xg1hAwXn_-cbtPxG7IjbF0O-xEwHOr2qE9In-cU-zzUaTX_mkmIhA9XQIJgtf1IniLR5Hv6ZwC2",
  },
  {
    id: 6,
    slug: "den-ngu-da-muoi-mini",
    name: "Đèn ngủ đá muối mini",
    price: 1500000,
    rating: 4.5,
    reviews: 210,
    badge: null,
    badgePrimary: false,
    category: "den-ngu",
    createdOrder: 5,
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCJ-CQ3IWhb3-4YdOvlHB6hfTFbNK6wVWlumUED7vSiuj5evTImf26HFXP33xiq407cqQgbvC137wsciSQoFxB0J59lUTHWvYYrry5eWdJnV_NHmLZ6h0-ZIl6q6ZYigD_KjwY1jwuAaL9XCjS17KOKHv4zGpfq43pAu2NsmBJj2SyTEUdoBWX6hnwxggYM8I-LIa2UHngURCl8Jq_WT1qIh6OFDOGG_oCDsyaIg1n3DQo1eoPgymZzrndw25Hw-y8KJFCmsT4TLXnG",
  },
];

const CATEGORIES = [
  { slug: "den-nuong", label: "Đèn nướng" },
  { slug: "den-ngu", label: "Đèn ngủ" },
  { slug: "da-ngam-chan", label: "Đá ngâm chân" },
  { slug: "kim-tu-thap", label: "Đèn Kim tự tháp" },
];

const SORT_OPTIONS = [
  { value: "ban-chay", label: "Bán chạy nhất" },
  { value: "gia-tang", label: "Giá: Thấp đến Cao" },
  { value: "gia-giam", label: "Giá: Cao đến Thấp" },
  { value: "moi-nhat", label: "Mới nhất" },
];

function formatPrice(p: number) {
  return p.toLocaleString("vi-VN") + " VND";
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
  const sortParam = searchParams.get("sort") || "ban-chay";

  // Local state for debounced search input
  const [inputValue, setInputValue] = useState(qParam);

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
      router.replace(`/?${params.toString()}`);
    }, 450);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputValue]);

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.replace(`/?${params.toString()}`);
  };

  const toggleCategory = (slug: string) => {
    const current = categoryParam ? categoryParam.split(",") : [];
    const next = current.includes(slug)
      ? current.filter((c) => c !== slug)
      : [...current, slug];
    updateParam("category", next.join(","));
  };

  const selectedCategories = categoryParam ? categoryParam.split(",") : [];

  // ── Filter
  let filtered = PRODUCTS.filter((p) => {
    const matchQ =
      !qParam || p.name.toLowerCase().includes(qParam.toLowerCase());
    const matchCat =
      selectedCategories.length === 0 ||
      selectedCategories.includes(p.category);
    return matchQ && matchCat;
  });

  // ── Sort
  if (sortParam === "gia-tang")
    filtered = [...filtered].sort((a, b) => a.price - b.price);
  else if (sortParam === "gia-giam")
    filtered = [...filtered].sort((a, b) => b.price - a.price);
  else if (sortParam === "moi-nhat")
    filtered = [...filtered].sort((a, b) => b.createdOrder - a.createdOrder);
  else filtered = [...filtered].sort((a, b) => b.reviews - a.reviews); // ban-chay

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
                {CATEGORIES.map((cat) => (
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
                      {cat.label}
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
                {[
                  "Phong thủy",
                  "Trị mất ngủ",
                  "Lọc không khí",
                  "Cải thiện tâm trạng",
                ].map((label) => (
                  <label
                    key={label}
                    className="flex items-center gap-3 cursor-pointer group"
                  >
                    <input
                      className="w-5 h-5 rounded border-border-color text-primary focus:ring-primary cursor-pointer"
                      type="checkbox"
                    />
                    <span className="text-neutral-dark group-hover:text-primary transition-colors">
                      {label}
                    </span>
                  </label>
                ))}
              </div>
            </div>
            <div className="border-t border-border-color pt-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-neutral-dark">
                  Khoảng giá
                </h3>
                <span className="text-sm font-medium text-primary">
                  $20 - $150
                </span>
              </div>
              <input
                className="w-full h-2 bg-neutral-light rounded-lg appearance-none cursor-pointer"
                max="200"
                min="0"
                type="range"
                defaultValue="80"
              />
              <div className="flex justify-between text-xs text-neutral-medium mt-2">
                <span>$0</span>
                <span>$200+</span>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filtered.length === 0 ? (
              <div className="col-span-3 py-20 text-center text-neutral-medium">
                <span className="material-symbols-outlined text-5xl mb-3 block">
                  search_off
                </span>
                Không tìm thấy sản phẩm phù hợp
              </div>
            ) : (
              filtered.map((product) => (
                <Link
                  key={product.id}
                  href={`/product/${product.slug}`}
                  className="group flex flex-col gap-3"
                >
                  <div className="relative overflow-hidden rounded-2xl bg-white aspect-[4/5] shadow-sm hover:shadow-md transition-shadow">
                    <img
                      alt={product.name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                      src={product.image}
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
                    {product.badge && (
                      <div className="absolute top-3 left-3">
                        <span
                          className={`${product.badgePrimary ? "bg-primary/90 text-white" : "bg-white/90 text-neutral-dark"} backdrop-blur-sm px-2 py-1 rounded-md text-xs font-bold shadow-sm`}
                        >
                          {product.badge}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    <h3 className="text-lg font-bold text-neutral-dark group-hover:text-primary transition-colors">
                      {product.name}
                    </h3>
                    <div className="flex items-center gap-1">
                      <StarIcons rating={product.rating} />
                      <span className="text-xs text-neutral-medium">
                        ({product.reviews})
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xl font-bold text-primary">
                        {formatPrice(product.price)}
                      </span>
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
              ))
            )}
          </div>

          <div className="flex justify-center mt-12 gap-2">
            <button className="flex items-center justify-center w-10 h-10 rounded-lg border border-border-color text-neutral-dark hover:bg-neutral-light">
              <span className="material-symbols-outlined text-sm">
                arrow_back_ios
              </span>
            </button>
            <button className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary text-white font-bold">
              1
            </button>
            <button className="flex items-center justify-center w-10 h-10 rounded-lg border border-border-color text-neutral-dark hover:bg-neutral-light hover:text-primary">
              2
            </button>
            <button className="flex items-center justify-center w-10 h-10 rounded-lg border border-border-color text-neutral-dark hover:bg-neutral-light hover:text-primary">
              3
            </button>
            <button className="flex items-center justify-center w-10 h-10 rounded-lg border border-border-color text-neutral-dark hover:bg-neutral-light">
              <span className="material-symbols-outlined text-sm">
                arrow_forward_ios
              </span>
            </button>
          </div>
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
