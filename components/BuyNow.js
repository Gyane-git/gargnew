import { ShoppingCart } from "lucide-react";
import useCartStore from "@/stores/useCartStore";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { getCustomerInfo } from "@/utils/customerApi";
// import { toast } from "react-toastify";

export function BuyNow({ product }) {
  const router = useRouter();
  const setSelectedItemsStore = useCartStore((state) => state.setSelectedItems);
  const handleAdd = async () => {
    const auth = await getCustomerInfo();
    if (!auth?.success) {
      toast.error("Please login to continue");
      router.push("/account");
      return;
    }

    console.warn(product.sell_price + " inside buy now ! ");
    const formattedProduct = {
      id: product.id,
      image: product.image_url,
      name: product.product_name,
      product_code: product.product_code,
      quantity: 1,
      price: parseFloat(product.sell_price),
      category: product.category,
      available_quantity: product.available_quantity,
      stock_quantity: product.stock_quantity,
    };
    setSelectedItemsStore([formattedProduct]);
    toast.success("Product added for checkout");
    // console.log("selectedItems after", formattedProduct);
    router.push("/cart/checkout-buy-now");
  };
  if (product.available_quantity === 0 && product.stock_quantity === 0) {
    return <div className="w-full "> {"  "}</div>;
  }

  return (
    <button
      onClick={handleAdd}
      // disabled={added}
      className="btn py-1 mt-1 mb-1 sm:py-2 bg-[#0072bc] hover:bg-red-600 text-white w-full px-1 rounded-md font-medium flex items-center justify-center space-x-1 sm:space-x-2 transition-colors duration-200 text-xs sm:text-sm cursor-pointer"
    >
      <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-3" />
      Buy Now
    </button>
  );
}
