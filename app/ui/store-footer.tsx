import Link from "next/link";

export default function StoreFooter() {
  return (
    <footer className="store-footer">
      <div className="store-footer__inner">
        <Link className="brand" href="/" aria-label="YG Cornhole home">
          <span className="brand-mark" aria-hidden="true"><b>Y</b><b>G</b><b>B</b><b>C</b></span>
          <span><strong>YG</strong> CORNHOLE</span>
        </Link>
        <p>Competition bags, custom apparel, and equipment with a player&apos;s point of view.</p>
        <nav aria-label="Store footer navigation">
          <Link href="/shop">Shop all</Link>
          <Link href="/about">About YG</Link>
          <Link href="/cart">Your cart</Link>
          <Link href="/contact">Contact the shop</Link>
        </nav>
      </div>
    </footer>
  );
}
