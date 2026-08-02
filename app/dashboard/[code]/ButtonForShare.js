"use client";

import React, { useState } from "react";
import { Share2, Heart } from "lucide-react";
import {
  addToWishlist,
  removeFromWishlist,
  getWishlist,
} from "@/utils/apiHelper";
import toast from "react-hot-toast";
// import { usePathname } from "next/navigation";

const FilledHeart = (props) => (
  <Heart stroke="red" size={25} fill="red" {...props} />
);

export default function ButtonForShare({ product }) {
  const [wishlisted, setWishlisted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [wishlistItemId, setWishlistItemId] = useState(null);

  const handleWishlist = async () => {
    if (!product) return;
    setLoading(true);

    if (wishlisted) {
      let itemId = wishlistItemId;
      if (!itemId) {
        const res = await getWishlist();
        if (res?.status === 401) {
          toast.error("Please login to add to wishlist");
          setLoading(false);
          return;
        }
        const wishlistArray = res?.wishlist || [];
        const item = wishlistArray.find(
          (row) => row.product_code === product.product_code
        );
        itemId = item?.id || null;
      }
      if (!itemId) {
        toast.error("Item not found in wishlist");
        setLoading(false);
        return;
      }
      const removeRes = await removeFromWishlist(itemId);
      if (removeRes.success) {
        setWishlisted(false);
        setWishlistItemId(null);
        toast.success("Removed from wishlist");
      } else if (removeRes?.status === 401) {
        toast.error("Please login to add to wishlist");
      } else {
        toast.error(removeRes.message || "Failed to remove from wishlist");
      }
    } else {
      const addRes = await addToWishlist(product.product_code);
      if (addRes.success) {
        setWishlisted(true);
        const wishlistArray = addRes?.wishlist || [];
        const item = wishlistArray.find(
          (row) => row.product_code === product.product_code
        );
        setWishlistItemId(item?.id || null);
        toast.success("Added to wishlist");
      } else if (addRes?.status === 401) {
        toast.error("Please login to add to wishlist");
      } else {
        toast.error(addRes.message || "Failed to add to wishlist");
      }
    }

    setLoading(false);
  };

  return (
    <div className="flex items-center">
      <button
        onClick={handleWishlist}
        className="flex items-center text-[12px] mr-2"
        title={wishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
        disabled={loading}
      >
        {wishlisted ? (
          <FilledHeart />
        ) : (
          <Heart
            size={25}
            className=" mr-1 text-[#0072bc] hover:text-[#bf0000]"
          />
        )}
        {loading && <span className="ml-2 text-xs">...</span>}
      </button>
      <button
        onClick={() => {
          if (navigator.share) {
            navigator
              .share({
                title: product?.product_name || "Product",
                text: "Check out this product!",
                url: window.location.href,
              })
              .catch((error) => 
                console.log("Error sharing", error));
          } else {
            alert("Sharing not supported on this browser.");
          }
        }}
        className="flex items-center text-[12px]"
      >
        <Share2 className="w-8 h-8 mr-1 text-[#0072bc] hover:text-[#bf0000]" />
      </button>
    </div>
  );
}
