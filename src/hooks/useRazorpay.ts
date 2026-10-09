import { useState, useEffect } from "react";

interface RazorpayWindow extends Window {
  Razorpay?: unknown;
}

export const useRazorpay = () => {
  const [isLoaded, setIsLoaded] = useState(() => {
    return typeof window !== "undefined" && Boolean((window as unknown as RazorpayWindow).Razorpay);
  });

  useEffect(() => {
    if (typeof window !== "undefined" && (window as unknown as RazorpayWindow).Razorpay) {
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;

    script.onload = () => {
      setIsLoaded(true);
    };

    script.onerror = () => {
      console.error("Razorpay SDK failed to load. Please check your internet connection.");
      setIsLoaded(false);
    };

    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  return { isLoaded };
};
