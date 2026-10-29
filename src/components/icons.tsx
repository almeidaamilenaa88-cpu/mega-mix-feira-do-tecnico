export default function Icon({
  name,
  size = 20,
}: {
  name:
    | "cart"
    | "search"
    | "arrow"
    | "close"
    | "plus"
    | "minus"
    | "leaf"
    | "check"
    | "bag";
  size?: number;
}) {
  const paths = {
    cart: (
      <>
        <path d="M3 3h2l2.5 12h10l3-9H6" />
        <circle cx="9" cy="20" r="1" />
        <circle cx="17" cy="20" r="1" />
      </>
    ),
    search: (
      <>
        <circle cx="10.5" cy="10.5" r="6.5" />
        <path d="m16 16 5 5" />
      </>
    ),
    arrow: <path d="M4 12h15m-6-6 6 6-6 6" />,
    close: <path d="m6 6 12 12M6 18 18 6" />,
    plus: <path d="M12 5v14M5 12h14" />,
    minus: <path d="M5 12h14" />,
    leaf: (
      <>
        <path d="M20 3C8 2 3 8 5 15s16 5 15-12Z" />
        <path d="M3 21 15 9" />
      </>
    ),
    check: <path d="m5 12 4 4L20 5" />,
    bag: (
      <>
        <path d="M5 7h14l1 14H4L5 7Z" />
        <path d="M8 8V6a4 4 0 0 1 8 0v2" />
      </>
    ),
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}
