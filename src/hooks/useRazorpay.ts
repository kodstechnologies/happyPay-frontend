import { useState, useEffect } from "react";
import { loadRazorpayScript } from "../utils/razorpay";

export const useRazorpay = () => {
  const [isLoaded, setIsLoaded] = useState(() => {
    return typeof window !== "undefined" && Boolean(window.Razorpay);
  });

  useEffect(() => {
    if (typeof window !== "undefined" && window.Razorpay) {
      return;
    }

    let isMounted = true;

    loadRazorpayScript()
      .then((loaded) => {
        if (isMounted) {
          setIsLoaded(Boolean(loaded));
        }
      })
      .catch((error) => {
        console.error("Razorpay SDK failed to load.", error);
        if (isMounted) {
          setIsLoaded(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return { isLoaded };
};
