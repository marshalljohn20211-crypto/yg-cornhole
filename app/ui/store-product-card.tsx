import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { formatPrice, type Product } from "../data/products";

export default function StoreProductCard({ product }: { product: Product }) {
  return (
    <article className="store-product-card">
      <Link className="store-product-card__image" href={`/shop/${product.slug}`} aria-label={`View ${product.name}`}>
        <Image src={product.image} alt={product.alt} fill sizes="(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 33vw" />
        {product.badge && <span>{product.badge}</span>}
      </Link>
      <div className="store-product-card__copy">
        <p>{product.eyebrow}</p>
        <h2><Link href={`/shop/${product.slug}`}>{product.name}</Link></h2>
        <div><strong>{formatPrice(product.price)}</strong><Link href={`/shop/${product.slug}`}>View product <ArrowUpRight size={16} /></Link></div>
        {product.category === "custom-boards" ? <small className="store-product-card__shipping">+$100 shipping per board at checkout</small> : null}
      </div>
    </article>
  );
}
