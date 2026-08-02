"use client";
import React, { useState } from "react";
import { Heart } from "lucide-react";
import {
  addToWishlist,
  removeFromWishlist,
  getWishlist,
} from "@/utils/apiHelper";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import { getCustomerInfo } from "@/utils/customerApi";

const FilledHeart = (props) => (
  <Heart stroke="red" size={25} fill="red" {...props} />
);

export default function WishListHeart({ product }) {
  const [wishlisted, setWishlisted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [wishlistItemId, setWishlistItemId] = useState(null);
  const router = useRouter();

  const handleWishlist = async () => {
    if (!product) return;
    setLoading(true);

    try {
      const auth = await getCustomerInfo();
      if (!auth?.success) {
        toast.error("Please login to continue");
        router.push("/account");
        return;
      }

      if (wishlisted) {
        let itemId = wishlistItemId;
        if (!itemId) {
          const wishlistRes = await getWishlist();
          const wishlistArray = wishlistRes?.wishlist || [];
          const item = wishlistArray.find(
            (row) => row.product_code === product.product_code
          );
          itemId = item?.id || null;
        }
        if (!itemId) {
          toast.error("Item not found in wishlist");
          return;
        }
        const removeRes = await removeFromWishlist(itemId);
        if (removeRes.success) {
          setWishlisted(false);
          setWishlistItemId(null);
          toast.success("Removed from wishlist");
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
        } else {
          toast.error(addRes.message || "Failed to add to wishlist");
        }
      }
    } catch (error) {
      // console.error("Wishlist error:", error);
      toast.error("Something went wrong");
    }

    setLoading(false);
  };

  return (
    <button
      onClick={handleWishlist}
      className="flex items-center text-[12px] mr-2"
      title={wishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
      disabled={loading}
    >
      {wishlisted ? (
        <FilledHeart />
      ) : (
        <Heart size={25} className="mr-1 text-[#0072bc] hover:text-[#bf0000]" />
      )}
      {loading && <span className="ml-2 text-xs">...</span>}
    </button>
  );
}
