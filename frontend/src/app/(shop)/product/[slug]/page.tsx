"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useParams, useRouter, notFound } from "next/navigation";
import { productService } from "@/services/productService";
import type { Product } from "@/types";
import type { ProductModelViewerRef } from "./ProductModelViewer";

const ProductModelViewer = dynamic(() => import("./ProductModelViewer"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-stone-100 dark:bg-stone-800 text-stone-500 animate-pulse">
      Đang tải mô hình 3D...
    </div>
  ),
});
import { useCartStore } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";
import toast from "react-hot-toast";

// ─── Types ────────────────────────────────────────────────────

interface ReviewItem {
  id: number;
  rating: number;
  comment: string;
  created_at: string;
  admin_reply?: string | null;
  replied_at?: string | null;
  user_id: number;
  user: { full_name: string };
}

interface UseTag {
  id: number;
  name: string;
  icon: string;
  color: string;
}

interface ProductDetail {
  id: number;
  name: string;
  slug: string;
  description: string;
  price: number;
  original_price: number | null;
  stock: number;
  image_url: string | null;
  is_featured: boolean;
  category: { id: number; name: string; slug: string } | null;
  uses: UseTag[];
  reviews: ReviewItem[];
  average_rating: number | null;
  model_3d_url: string | null;
  images?: { id: number; image_url: string }[];
}

// ─── URL Helper ────────────────────────────────────────────────

function getFullUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith("http") || url.startsWith("data:")) return url;
  const baseUrl =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
  const host = baseUrl.replace("/api/v1", "");
  return `${host}${url.startsWith("/") ? "" : "/"}${url}`;
}

// ─── Skeleton ─────────────────────────────────────────────────

function ProductDetailSkeleton() {
  return (
    <main className="flex-grow container mx-auto px-4 py-8 max-w-[1440px]">
      <div className="h-4 bg-slate-100 rounded w-1/3 mb-8 animate-pulse" />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="bg-slate-100 rounded-2xl aspect-[4/3] animate-pulse" />
          <div className="grid grid-cols-4 gap-4">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-slate-100 rounded-xl aspect-square animate-pulse"
              />
            ))}
          </div>
        </div>
        <div className="lg:col-span-5 space-y-4">
          <div className="h-8 bg-slate-100 rounded w-3/4 animate-pulse" />
          <div className="h-6 bg-slate-100 rounded w-1/2 animate-pulse" />
          <div className="h-12 bg-slate-100 rounded animate-pulse" />
          <div className="h-4 bg-slate-100 rounded animate-pulse" />
          <div className="h-4 bg-slate-100 rounded w-5/6 animate-pulse" />
          <div className="h-12 bg-slate-100 rounded animate-pulse" />
        </div>
      </div>
    </main>
  );
}

// ─── Star rating helper ────────────────────────────────────────

function StarIcons({ rating }: { rating: number }) {
  const normalizedRating = Math.max(0, Math.min(5, Number(rating) || 0));

  return (
    <div
      className="flex items-center gap-0.5"
      aria-label={`Đánh giá ${normalizedRating.toFixed(1)} trên 5`}
    >
      {[0, 1, 2, 3, 4].map((i) => {
        const fillPercent = Math.max(
          0,
          Math.min(100, (normalizedRating - i) * 100),
        );

        return (
          <span
            key={i}
            className="relative inline-block text-[20px] leading-none"
          >
            <span className="text-stone-300 dark:text-stone-600">★</span>
            <span
              className="absolute inset-y-0 left-0 overflow-hidden text-primary"
              style={{ width: `${fillPercent}%` }}
            >
              ★
            </span>
          </span>
        );
      })}
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFoundError, setNotFoundError] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);
  const [is3DMode, setIs3DMode] = useState(false);
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);

  const viewerRef = React.useRef<ProductModelViewerRef>(null);

  // Review states
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);

  // Edit review states
  const [editingReviewId, setEditingReviewId] = useState<number | null>(null);
  const [editRating, setEditRating] = useState(5);
  const [editComment, setEditComment] = useState("");
  const [isUpdatingReview, setIsUpdatingReview] = useState(false);

  // Description read-more state
  const [descExpanded, setDescExpanded] = useState(false);

  const addItem = useCartStore((s) => s.addItem);

  const fetchProduct = React.useCallback(
    async (silently = false) => {
      if (!slug) return;
      if (!silently) setIsLoading(true);
      try {
        const data = (await productService.getProductBySlug(slug)) as any;
        setProduct(data);

        if (data.category?.slug && !silently) {
          try {
            const relatedRes = await productService.getProducts({
              category_slug: data.category.slug,
              limit: 4,
            });
            const relatedData = (relatedRes as any)?.data ?? relatedRes;
            const items = Array.isArray(relatedData?.items)
              ? relatedData.items
              : [];
            const filteredRelated = items
              .filter((p: any) => p.id !== data.id)
              .slice(0, 3);
            setRelatedProducts(filteredRelated);
          } catch (e) {
            console.error("Lỗi tải sản phẩm gợi ý:", e);
          }
        }
      } catch (err: unknown) {
        const axiosErr = err as { response?: { status?: number } };
        if (axiosErr?.response?.status === 404) setNotFoundError(true);
        console.error("Lỗi tải sản phẩm:", err);
      } finally {
        if (!silently) setIsLoading(false);
      }
    },
    [slug],
  );

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  const displayImage = activeImage || product?.image_url;

  if (isLoading) return <ProductDetailSkeleton />;
  if (notFoundError || !product) return notFound();

  const handleAddToCart = () => {
    addItem({
      id: product.id,
      productId: product.id,
      name: product.name,
      price: product.price,
      image: product.image_url ?? "",
      slug: product.slug,
      quantity,
    });
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const handleBuyNow = () => {
    addItem({
      id: product.id,
      productId: product.id,
      name: product.name,
      price: product.price,
      image: product.image_url ?? "",
      slug: product.slug,
      quantity,
    });
    router.push("/checkout");
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) return toast.error("Vui lòng đăng nhập để đánh giá");
    if (!reviewComment.trim())
      return toast.error("Vui lòng nhập nội dung đánh giá");

    setIsSubmittingReview(true);
    try {
      await productService.submitReview(product!.id, {
        rating: reviewRating,
        comment: reviewComment,
      });
      toast.success("Đã gửi đánh giá thành công!");
      setReviewComment("");
      setReviewRating(5);
      fetchProduct(true);
    } catch (err: unknown) {
      const errorResponse = err as {
        response?: { data?: { detail?: string; message?: string } };
      };
      toast.error(
        errorResponse?.response?.data?.detail ||
          errorResponse?.response?.data?.message ||
          "Có lỗi xảy ra",
      );
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleEditInit = (review: ReviewItem) => {
    setEditingReviewId(review.id);
    setEditRating(review.rating);
    setEditComment(review.comment);
  };

  const handleUpdateReview = async () => {
    if (!editComment.trim())
      return toast.error("Vui lòng nhập nội dung đánh giá");
    setIsUpdatingReview(true);
    try {
      await productService.editReview(editingReviewId!, {
        rating: editRating,
        comment: editComment,
      });
      toast.success("Đã cập nhật đánh giá!");
      setEditingReviewId(null);
      fetchProduct(true);
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Lỗi cập nhật đánh giá");
    } finally {
      setIsUpdatingReview(false);
    }
  };

  const handleDeleteReview = async (reviewId: number) => {
    if (!confirm("Bạn có chắc chắn muốn xóa đánh giá này?")) return;
    try {
      await productService.deleteReview(reviewId);
      toast.success("Đã xóa đánh giá!");
      fetchProduct(true);
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Lỗi xóa đánh giá");
    }
  };

  const discount =
    product.original_price && product.original_price > product.price
      ? Math.round((1 - product.price / product.original_price) * 100)
      : null;

  const rating = product.average_rating ?? 0;
  const reviewCount = product.reviews?.length ?? 0;

  // Render starts below — keep opening tag on next line
  return (
    <main className="flex-grow container mx-auto px-4 py-8 max-w-[1440px]">
      {/* Breadcrumbs */}
      <nav className="flex mb-8 text-sm font-medium text-stone-500 dark:text-stone-400">
        <ol className="flex items-center gap-2 flex-wrap">
          <li>
            <Link className="hover:text-primary transition-colors" href="/">
              Trang chủ
            </Link>
          </li>
          <li>
            <span className="material-symbols-outlined text-xs mt-1">
              chevron_right
            </span>
          </li>
          {product.category && (
            <>
              <li>
                <Link
                  className="hover:text-primary transition-colors"
                  href={`/?category=${product.category.slug}`}
                >
                  {product.category.name}
                </Link>
              </li>
              <li>
                <span className="material-symbols-outlined text-xs mt-1">
                  chevron_right
                </span>
              </li>
            </>
          )}
          <li
            aria-current="page"
            className="text-stone-900 dark:text-stone-100 font-semibold"
          >
            {product.name}
          </li>
        </ol>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Column: Product Image & Gallery */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          {/* Main Image or 3D Model */}
          <div className="relative w-full aspect-[4/3] rounded-2xl bg-white dark:bg-stone-800 shadow-sm border border-stone-200 dark:border-stone-700 overflow-hidden group flex items-center justify-center p-4">
            {/* 3D Viewer or Image Render */}
            {is3DMode && product.model_3d_url ? (
              <div className="w-full h-full">
                <ProductModelViewer
                  ref={viewerRef}
                  modelUrl={getFullUrl(product.model_3d_url)!}
                />
              </div>
            ) : displayImage ? (
              <img
                src={getFullUrl(displayImage)!}
                alt={product.name}
                className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal transition-transform duration-500 group-hover:scale-[1.02]"
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-4 text-stone-400">
                <span className="material-symbols-outlined text-6xl text-primary/60">
                  image
                </span>
                <p className="text-lg font-medium text-stone-500">
                  Chưa có hình ảnh
                </p>
              </div>
            )}

            {/* 3D Toggle Button */}
            {product.model_3d_url && (
              <div className="absolute top-4 right-4 z-10">
                <button
                  onClick={() => setIs3DMode(!is3DMode)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full font-bold text-sm shadow-md border transition-all ${
                    is3DMode
                      ? "bg-primary text-white border-primary"
                      : "bg-white text-stone-700 hover:text-primary hover:border-primary border-stone-200"
                  }`}
                  title={is3DMode ? "Xem hình ảnh" : "Xem mô hình 3D"}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {is3DMode ? "image" : "view_in_ar"}
                  </span>
                  {is3DMode ? "Hình ảnh" : "Mô hình 3D"}
                </button>
              </div>
            )}

            {/* Controls overlay (Only visible in 3D Mode) */}
            {is3DMode && product.model_3d_url && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 bg-white/90 dark:bg-stone-900/90 backdrop-blur px-4 py-2 rounded-full shadow-lg border border-stone-100 dark:border-stone-700 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  className="p-1.5 hover:bg-stone-100 rounded-full transition-colors"
                  title="Zoom In"
                  onClick={() => viewerRef.current?.zoomIn()}
                >
                  <span className="material-symbols-outlined text-stone-700 text-xl">
                    add
                  </span>
                </button>
                <button
                  className="p-1.5 hover:bg-stone-100 rounded-full transition-colors"
                  title="Zoom Out"
                  onClick={() => viewerRef.current?.zoomOut()}
                >
                  <span className="material-symbols-outlined text-stone-700 text-xl">
                    remove
                  </span>
                </button>
                <div className="w-px bg-stone-200 mx-1"></div>
                <button
                  className="p-1.5 hover:bg-stone-100 rounded-full transition-colors"
                  title="Fullscreen"
                  onClick={() => viewerRef.current?.toggleFullscreen()}
                >
                  <span className="material-symbols-outlined text-stone-700 text-xl">
                    fullscreen
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* Thumbnail Gallery */}
          <div className="flex gap-2 flex-wrap">
            {product.image_url && (
              <button
                onClick={() => {
                  setIs3DMode(false);
                  setActiveImage(product.image_url);
                }}
                className={`size-16 rounded-lg overflow-hidden border-2 bg-white p-0.5 transition-all shrink-0 ${
                  (!activeImage || activeImage === product.image_url) &&
                  !is3DMode
                    ? "border-primary shadow-sm"
                    : "border-stone-200 hover:border-primary/50 opacity-70 hover:opacity-100"
                }`}
              >
                <img
                  src={getFullUrl(product.image_url)!}
                  className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal"
                  alt="Thumbnail"
                />
              </button>
            )}
            {product.images?.map((img) => (
              <button
                key={img.id}
                onClick={() => {
                  setIs3DMode(false);
                  setActiveImage(img.image_url);
                }}
                className={`size-16 rounded-lg overflow-hidden border-2 bg-white p-0.5 transition-all shrink-0 ${
                  activeImage === img.image_url && !is3DMode
                    ? "border-primary shadow-sm"
                    : "border-stone-200 hover:border-primary/50 opacity-70 hover:opacity-100"
                }`}
              >
                <img
                  src={getFullUrl(img.image_url)!}
                  className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal"
                  alt="Thumbnail"
                />
              </button>
            ))}
          </div>
        </div>

        {/* Right Column: Product Details */}
        <div className="lg:col-span-5 flex flex-col h-full">
          <div className="sticky top-24">
            <div className="mb-4">
              <div className="flex gap-2 flex-wrap mb-3">
                {product.is_featured && (
                  <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
                    Nổi bật
                  </span>
                )}
                {product.category && (
                  <span className="inline-block px-3 py-1 rounded-full bg-stone-100 text-stone-600 text-xs font-medium uppercase tracking-wider">
                    {product.category.name}
                  </span>
                )}
              </div>
              <h1 className="text-2xl lg:text-3xl font-bold text-stone-900 dark:text-white leading-tight mb-2">
                {product.name}
              </h1>

              {/* Rating */}
              <div className="flex items-center gap-2 mb-4">
                <StarIcons rating={rating} />
                <span className="text-stone-500 dark:text-stone-400 text-sm font-medium">
                  {rating > 0 ? rating.toFixed(1) : "Chưa có đánh giá"} (
                  {reviewCount} đánh giá)
                </span>
              </div>

              {/* Price */}
              <div className="flex items-end gap-3 mb-5">
                <span className="text-3xl font-bold text-primary tracking-tight">
                  {Math.round(product.price).toLocaleString("vi-VN")} ₫
                </span>
                {product.original_price &&
                  product.original_price > product.price && (
                    <>
                      <span className="text-lg text-stone-400 line-through mb-0.5">
                        {Math.round(product.original_price).toLocaleString(
                          "vi-VN",
                        )}{" "}
                        ₫
                      </span>
                      {discount && (
                        <span className="mb-1 px-2 py-0.5 bg-red-100 text-red-600 text-xs font-bold rounded">
                          -{discount}%
                        </span>
                      )}
                    </>
                  )}
              </div>
            </div>

            <hr className="border-stone-200 dark:border-stone-700 mb-6" />

            {/* Description */}
            <div className="mb-5">
              <p
                className={`text-stone-600 dark:text-stone-300 text-base leading-relaxed ${
                  !descExpanded ? "line-clamp-3" : ""
                }`}
              >
                {product.description}
              </p>
              {product.description && product.description.length > 140 && (
                <button
                  onClick={() => setDescExpanded((v) => !v)}
                  className="mt-1.5 text-primary text-sm font-semibold hover:underline flex items-center gap-1"
                >
                  {descExpanded ? "Thu gọn" : "Xem thêm"}
                  <span className="material-symbols-outlined text-[15px]">
                    {descExpanded ? "keyboard_arrow_up" : "keyboard_arrow_down"}
                  </span>
                </button>
              )}
            </div>

            {/* Uses Tags */}
            {product.uses && product.uses.length > 0 && (
              <div className="mb-6">
                <h4 className="text-sm font-bold text-stone-700 dark:text-stone-300 mb-3 uppercase tracking-wider">
                  Công dụng
                </h4>
                <div className="flex flex-wrap gap-2">
                  {product.uses.map((use) => (
                    <span
                      key={use.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary text-sm font-medium rounded-full"
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        {use.icon}
                      </span>
                      {use.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Stock */}
            <div className="mb-6">
              <span
                className={`inline-flex items-center gap-1 text-sm font-semibold ${
                  product.stock > 0 ? "text-green-600" : "text-red-500"
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">
                  {product.stock > 0 ? "check_circle" : "cancel"}
                </span>
                {product.stock > 0
                  ? `Còn hàng (${product.stock} cái)`
                  : "Hết hàng"}
              </span>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-4">
                {/* Quantity Selector */}
                <div className="flex items-center border border-stone-300 dark:border-stone-600 rounded-lg h-12 w-32 bg-white dark:bg-stone-800">
                  <button
                    className="flex-1 h-full flex items-center justify-center hover:bg-stone-100 dark:hover:bg-stone-700 rounded-l-lg transition-colors text-stone-500 disabled:opacity-40"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                  >
                    <span className="material-symbols-outlined text-sm">
                      remove
                    </span>
                  </button>
                  <span className="w-10 text-center bg-transparent text-stone-900 dark:text-white font-bold">
                    {quantity}
                  </span>
                  <button
                    className="flex-1 h-full flex items-center justify-center hover:bg-stone-100 dark:hover:bg-stone-700 rounded-r-lg transition-colors text-stone-500 disabled:opacity-40"
                    onClick={() =>
                      setQuantity((q) => Math.min(product.stock, q + 1))
                    }
                    disabled={quantity >= product.stock}
                  >
                    <span className="material-symbols-outlined text-sm">
                      add
                    </span>
                  </button>
                </div>

                {/* Add to Cart */}
                <button
                  className={`flex-1 h-12 rounded-lg font-bold text-lg shadow-lg flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5 active:translate-y-0 focus:outline-[3px] focus:outline-primary/40 disabled:opacity-50 disabled:cursor-not-allowed ${
                    addedToCart
                      ? "bg-green-500 hover:bg-green-500 text-white shadow-green-200"
                      : "bg-primary hover:bg-primary/90 text-white shadow-primary/30"
                  }`}
                  onClick={handleAddToCart}
                  disabled={product.stock === 0}
                >
                  <span className="material-symbols-outlined">
                    {addedToCart ? "check_circle" : "shopping_cart_checkout"}
                  </span>
                  {addedToCart ? "Đã thêm vào giỏ!" : "Thêm vào giỏ hàng"}
                </button>
              </div>
              <button
                className="w-full h-12 border-2 border-primary/20 hover:border-primary text-primary font-bold rounded-lg transition-colors flex items-center justify-center gap-2 focus:outline-[3px] focus:outline-primary/40 disabled:opacity-50"
                disabled={product.stock === 0}
                onClick={handleBuyNow}
              >
                <span className="material-symbols-outlined text-[20px]">
                  bolt
                </span>
                Mua ngay (Thanh toán COD)
              </button>
            </div>

            {/* Trust Badges */}
            <div className="mt-8 grid grid-cols-3 gap-4 text-center">
              <div className="flex flex-col items-center gap-2 p-3 bg-stone-50 dark:bg-stone-800/50 rounded-lg">
                <span className="material-symbols-outlined text-primary">
                  local_shipping
                </span>
                <span className="text-xs font-medium text-stone-600 dark:text-stone-300">
                  Miễn phí vận chuyển
                </span>
              </div>
              <div className="flex flex-col items-center gap-2 p-3 bg-stone-50 dark:bg-stone-800/50 rounded-lg">
                <span className="material-symbols-outlined text-primary">
                  verified_user
                </span>
                <span className="text-xs font-medium text-stone-600 dark:text-stone-300">
                  Bảo hành 12 tháng
                </span>
              </div>
              <div className="flex flex-col items-center gap-2 p-3 bg-stone-50 dark:bg-stone-800/50 rounded-lg">
                <span className="material-symbols-outlined text-primary">
                  recycling
                </span>
                <span className="text-xs font-medium text-stone-600 dark:text-stone-300">
                  Hoàn trả 7 ngày
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <section className="mt-20 mb-12" id="reviews-section">
        <h3 className="text-2xl font-bold text-stone-900 dark:text-white mb-8">
          Đánh giá sản phẩm
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Reviews List */}
          <div className="lg:col-span-7">
            {product.reviews && product.reviews.length > 0 ? (
              <>
                <div className="flex items-center gap-4 mb-8 bg-stone-50 dark:bg-stone-800/50 p-6 rounded-2xl border border-stone-100 dark:border-stone-700">
                  <span className="text-5xl font-bold text-primary">
                    {rating.toFixed(1)}
                  </span>
                  <div>
                    <StarIcons rating={rating} />
                    <p className="text-sm text-stone-500 mt-1">
                      {reviewCount} đánh giá
                    </p>
                  </div>
                </div>
                <div className="flex flex-col gap-5">
                  {product.reviews.map((review) => (
                    <div
                      key={review.id}
                      className="bg-white dark:bg-stone-800 rounded-xl p-5 border border-stone-100 dark:border-stone-700 shadow-sm"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-bold text-stone-900 dark:text-white flex items-center gap-2">
                            {review.user?.full_name ?? "Ẩn danh"}
                            {user?.id === review.user_id && (
                              <span className="bg-primary/10 text-primary text-[10px] px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">
                                Của bạn
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-stone-400">
                            {new Date(review.created_at).toLocaleDateString(
                              "vi-VN",
                            )}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <StarIcons rating={review.rating} />
                          {user?.id === review.user_id &&
                            editingReviewId !== review.id && (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleEditInit(review)}
                                  className="text-xs text-stone-500 hover:text-primary transition-colors flex items-center gap-1"
                                >
                                  <span className="material-symbols-outlined text-[14px]">
                                    edit
                                  </span>{" "}
                                  Sửa
                                </button>
                                <button
                                  onClick={() => handleDeleteReview(review.id)}
                                  className="text-xs text-stone-500 hover:text-red-500 transition-colors flex items-center gap-1"
                                >
                                  <span className="material-symbols-outlined text-[14px]">
                                    delete
                                  </span>{" "}
                                  Xóa
                                </button>
                              </div>
                            )}
                        </div>
                      </div>

                      {editingReviewId === review.id ? (
                        <div className="flex flex-col gap-3 mt-4 border-t border-stone-100 dark:border-stone-700 pt-4">
                          <div
                            className="flex gap-1"
                            onMouseLeave={() => setEditRating(editRating)}
                          >
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                onClick={() => setEditRating(star)}
                                className={`material-symbols-outlined text-2xl transition-colors ${
                                  star <= editRating
                                    ? "text-primary"
                                    : "text-stone-300 dark:text-stone-600 hover:text-stone-400"
                                }`}
                              >
                                {star <= editRating ? "star" : "star_border"}
                              </button>
                            ))}
                          </div>
                          <textarea
                            rows={3}
                            value={editComment}
                            onChange={(e) => setEditComment(e.target.value)}
                            className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg outline-none focus:border-primary text-sm resize-none"
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => setEditingReviewId(null)}
                              className="px-3 py-1.5 text-xs font-bold text-stone-500 hover:bg-stone-100 rounded-lg transition-colors"
                            >
                              Hủy
                            </button>
                            <button
                              onClick={handleUpdateReview}
                              disabled={isUpdatingReview}
                              className="px-3 py-1.5 text-xs font-bold text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors flex items-center gap-1 disabled:opacity-50"
                            >
                              {isUpdatingReview ? "Ghi..." : "Lưu Thay Đổi"}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-stone-600 dark:text-stone-300 text-sm leading-relaxed">
                          {review.comment}
                        </p>
                      )}
                      {/* Admin reply */}
                      {review.admin_reply && (
                        <div className="mt-3 flex gap-2.5 bg-primary/5 border border-primary/15 rounded-xl p-3.5">
                          <div className="size-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                            <span className="material-symbols-outlined text-primary text-[14px]">
                              storefront
                            </span>
                          </div>
                          <div>
                            <p className="text-xs font-bold text-primary mb-1">
                              Phản hồi từ cửa hàng
                            </p>
                            <p className="text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
                              {review.admin_reply}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center p-12 bg-stone-50 dark:bg-stone-800/50 rounded-2xl border border-stone-100 dark:border-stone-700 text-center h-[300px]">
                <span className="material-symbols-outlined text-6xl text-stone-300 dark:text-stone-600 mb-4">
                  rate_review
                </span>
                <p className="text-stone-500 dark:text-stone-400 font-medium">
                  Chưa có đánh giá nào. Hãy là người đầu tiên đánh giá sản phẩm
                  này!
                </p>
              </div>
            )}
          </div>

          {/* Write Review Form */}
          <div className="lg:col-span-5">
            <div className="bg-white dark:bg-stone-800 rounded-2xl p-6 lg:p-8 border border-stone-100 dark:border-stone-700 shadow-sm sticky top-24">
              <h4 className="text-lg font-bold text-stone-900 dark:text-white mb-6">
                Viết đánh giá
              </h4>
              <form
                onSubmit={handleReviewSubmit}
                className="flex flex-col gap-5"
              >
                <div>
                  <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
                    Đánh giá của bạn
                  </label>
                  <div
                    className="flex gap-1"
                    onMouseLeave={() => setReviewRating(reviewRating)}
                  >
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        className={`material-symbols-outlined text-3xl transition-colors ${
                          star <= reviewRating
                            ? "text-primary hover:text-primary/80"
                            : "text-stone-300 dark:text-stone-600 hover:text-stone-400"
                        } ${!isAuthenticated && "opacity-50 cursor-not-allowed"}`}
                        disabled={!isAuthenticated}
                      >
                        {star <= reviewRating ? "star" : "star_border"}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
                    Nội dung <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={4}
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    disabled={!isAuthenticated}
                    placeholder={
                      isAuthenticated
                        ? "Hãy chia sẻ cảm nhận của bạn về sản phẩm này..."
                        : "Vui lòng đăng nhập để đánh giá"
                    }
                    className="w-full px-4 py-3 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all resize-none text-sm placeholder:text-stone-400 disabled:opacity-70 disabled:cursor-not-allowed"
                  />
                </div>
                <button
                  type="submit"
                  disabled={
                    !isAuthenticated ||
                    isSubmittingReview ||
                    !reviewComment.trim()
                  }
                  className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                >
                  {isSubmittingReview ? (
                    <span className="size-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[20px]">
                        send
                      </span>
                      Gửi đánh giá
                    </>
                  )}
                </button>
                {!isAuthenticated && (
                  <p className="text-sm text-center text-stone-500 mt-2">
                    Bạn cần{" "}
                    <Link
                      href="/login"
                      className="text-primary hover:underline font-medium"
                    >
                      Đăng nhập
                    </Link>{" "}
                    để đánh giá
                  </p>
                )}
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* AI Suggestions Section */}
      <section className="mt-20 mb-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-primary to-orange-400 rounded-lg shadow-md shrink-0">
              <span className="material-symbols-outlined text-white">
                auto_awesome
              </span>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-stone-900 dark:text-white leading-none mb-1">
                AI Gợi ý cho bạn
              </h3>
              <p className="text-stone-500 dark:text-stone-400 text-sm">
                Dựa trên sở thích và xu hướng hiện tại
              </p>
            </div>
          </div>
          <Link
            href="/"
            className="text-primary font-bold hover:underline flex items-center gap-1 self-start md:self-auto"
          >
            Xem tất cả{" "}
            <span className="material-symbols-outlined text-sm">
              arrow_forward
            </span>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {relatedProducts.length > 0 ? (
            relatedProducts.map((item, idx) => (
              <Link
                key={item.id}
                href={`/product/${item.slug}`}
                className="group flex flex-col bg-white dark:bg-stone-800 rounded-xl overflow-hidden shadow-sm hover:shadow-xl hover:shadow-primary/10 transition-all border border-stone-100 dark:border-stone-700"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-stone-100">
                  {idx === 0 && (
                    <div className="absolute top-3 left-3 z-10 bg-primary text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide shadow-sm">
                      Gợi ý hàng đầu
                    </div>
                  )}
                  <img
                    alt={item.name}
                    className="h-full w-full object-contain group-hover:scale-105 transition-transform duration-500 bg-stone-100"
                    src={
                      getFullUrl(item.image_url) ??
                      "https://placehold.co/400x300/f1ede9/c9a97a?text=No+Image"
                    }
                  />
                </div>
                <div className="p-4 flex flex-col flex-grow">
                  <h4 className="font-bold text-lg text-stone-900 dark:text-white mb-1 group-hover:text-primary transition-colors line-clamp-1">
                    {item.name}
                  </h4>
                  <div className="mt-auto flex items-center justify-between">
                    <span className="font-bold text-stone-900 dark:text-stone-100">
                      {Math.round(item.price).toLocaleString("vi-VN")} ₫
                    </span>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="col-span-3 text-center text-stone-500 py-8">
              Chưa có sản phẩm gợi ý nào cho danh mục này.
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
