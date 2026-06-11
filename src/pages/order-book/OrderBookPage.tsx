import { useEffect } from "react";
import { useOrderBookStore } from "@/entities/order-book";
import type { RawOrderBookSnapshot } from "@/entities/order-book";
import { OrderBookWidget } from "@/widgets/order-book";

const MOCK_SNAPSHOT: RawOrderBookSnapshot = {
  bids: [
    { price: "67250.50", quantity: "1.2500" },
    { price: "67249.00", quantity: "0.8000" },
    { price: "67248.25", quantity: "2.1000" },
    { price: "67247.00", quantity: "0.5500" },
    { price: "67246.50", quantity: "3.0000" },
  ],
  asks: [
    { price: "67251.00", quantity: "0.9000" },
    { price: "67252.50", quantity: "1.5000" },
    { price: "67253.75", quantity: "0.3000" },
    { price: "67254.00", quantity: "2.0000" },
    { price: "67255.50", quantity: "1.1000" },
  ],
  sequence: 1,
};

export function OrderBookPage(): JSX.Element {
  const applySnapshot = useOrderBookStore((s) => s.applySnapshot);
  const setStatus = useOrderBookStore((s) => s.setStatus);
  const reset = useOrderBookStore((s) => s.reset);

  useEffect(() => {
    setStatus("loading");
    applySnapshot(MOCK_SNAPSHOT);
    return () => reset();
  }, [applySnapshot, setStatus, reset]);

  return (
    <div>
      <h1>Order Book</h1>
      <OrderBookWidget />
    </div>
  );
}
