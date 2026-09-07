import Link from 'next/link';
export default function Footer(){
 return <footer className="site-footer">
  <div className="container footer-main">
   <div className="footer-brand"><img src="/legacy/shivaay.jpeg" alt="Shivaay Paridhan"/><h2>SHIVAAY PARIDHAN</h2><p>Elegance in every drape. Celebrating Indian weaving with premium handcrafted sarees for the modern woman.</p><div className="social-row"><span>â—Ž</span><span>f</span><span>â—‰</span></div></div>
   <div><h3>Shop</h3><Link href="/shop">All Sarees</Link><Link href="/shop?sort=best">Best Sellers</Link><Link href="/shop">New Arrivals</Link><Link href="/shop?sort=sale">Sale</Link></div>
   <div><h3>Occasions</h3><Link href="/shop?occasion=Festive">Festive</Link><Link href="/shop?occasion=Wedding">Wedding</Link><Link href="/shop?occasion=Casual">Casual</Link><Link href="/shop?occasion=Party%20Wear">Party Wear</Link><Link href="/shop?occasion=Formal">Formal</Link></div>
   <div><h3>Fabrics</h3><Link href="/shop?fabric=Silk">Silk</Link><Link href="/shop?fabric=Cotton">Cotton</Link><Link href="/shop?fabric=Kanjivaram">Kanjivaram</Link><Link href="/shop?fabric=Chiffon">Chiffon</Link><Link href="/shop?fabric=Organza">Organza</Link></div>
   <div><h3>Customer Care</h3><Link href="/about">About Us</Link><Link href="/contact">Contact Us</Link><Link href="/checkout">Shipping Policy</Link><Link href="/checkout">Return & Exchange</Link><Link href="/account">FAQ</Link></div>
  </div>
  <div className="footer-bottom">Â© 2026 Shivaay Paridhan. All rights reserved.</div>
 </footer>
}

