import { useWishlist as useWishlistContext } from "@/contexts/WishlistContext";

export function useWishlist() {
  return useWishlistContext();
}
