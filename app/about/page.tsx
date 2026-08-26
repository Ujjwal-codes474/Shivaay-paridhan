import Image from "next/image";

export default function AboutPage() {
  return (
    <main className="about-page">

    {/* =========================
          ABOUT HERO
      ========================== */}
      <section className="about-hero">
        <div className="container">
          <div className="about-hero-content">
            <span className="eyebrow">THE SHIVAAY STORY</span>

            <h1>
              Tradition, <i>Elegance</i>
              <br />
              & Timeless Style
            </h1>

            <p>
              Shivaay Paridhan celebrates the beauty of Indian fashion by
              bringing together traditional craftsmanship and contemporary
              elegance.
            </p>
          </div>
        </div>
      </section>


    


      {/* =========================
          FOUNDER
      ========================== */}
      <section className="section founder-section">
        <div className="container">

          <div className="ornament-title">
            <span>✦</span>

            <div>
              <span className="eyebrow">THE PERSON BEHIND SHIVAAY</span>

              <h2>Meet Our Founder</h2>
            </div>

            <span>✦</span>
          </div>


          <div className="founder-card">

            <div className="founder-image">
              <img
                src="/shivaay/founder.jpeg"
                alt="Founder of Shivaay Paridhan"
              />
            </div>

            <div className="founder-content">

              <span className="eyebrow">
                FOUNDER & CREATIVE DIRECTOR
              </span>

              <h2>
                SHALINI OJHA
              </h2>

              <div className="founder-line"></div>

              <p>
                Shivaay Paridhan was founded with a passion for Indian
                craftsmanship and a vision to create a fashion destination
                where tradition meets modern elegance.
              </p>
	<span className="eyebrow"> Founder's message</span> 

              <p>
               
Shivaay Paridhan, an apparel and clothing brand  furnishes sarees and suits grounded in tradition and emblazoned with modernity.
Celebrating tapestry on each occasion , Shivaay Paridhan aims to offer immense splendor in quality while being affordable and accessible. 

We heartily wish that our customers are not only gratified and content but also trust Shivaay Paridhan when it comes to choosing the best quality brand whilst making every purchase terrific! 
 
Happy Shopping!
              </p>

              <blockquote>
                “Our goal is not simply to sell clothing, but to preserve the
                beauty of Indian craftsmanship and bring it into everyday life.”
              </blockquote>

              <div className="founder-signature">
               SHALINI OJHA
              </div>

            </div>

          </div>

        </div>
      </section>


      {/* =========================
          SHIVAAY PROMISE
          Formerly: WHY SHOP WITH US
      ========================== */}
      <section className="section promise-section">
        <div className="container">

          <div className="ornament-title">
            <span>✦</span>

            <div>
              <span className="eyebrow">WHY SHIVAAY</span>

              <h2>The Shivaay Promise</h2>
            </div>

            <span>✦</span>
          </div>


          <div className="promise-grid">

            {/* Promise 1 */}
            <div>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
              >
                <path d="M12 3L4 6v5c0 5.5 3.5 8.8 8 10 4.5-1.2 8-4.5 8-10V6l-8-3z" />
                <path d="M9 12l2 2 4-4" />
              </svg>

              <h3>Authentic Craftsmanship</h3>

              <p>
                We carefully select products that celebrate the authenticity
                and craftsmanship of Indian textiles.
              </p>
            </div>


            {/* Promise 2 */}
            <div>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
              >
                <path d="M20 12a8 8 0 1 1-2.34-5.66" />
                <path d="M20 4v6h-6" />
              </svg>

              <h3>Quality You Can Trust</h3>

              <p>
                Every product is selected with quality, comfort and lasting
                value in mind.
              </p>
            </div>


            {/* Promise 3 */}
            <div>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
              >
                <path d="M3 7h13v10H3z" />
                <path d="M16 10h3l2 3v4h-5z" />
                <circle cx="7" cy="19" r="2" />
                <circle cx="18" cy="19" r="2" />
              </svg>

              <h3>Careful Delivery</h3>

              <p>
                Your order is packed with care so that every piece reaches you
                safely and beautifully.
              </p>
            </div>


            {/* Promise 4 */}
            <div>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
              >
                <path d="M20 11a8 8 0 1 1-2.34-5.66" />
                <path d="M20 4v6h-6" />
                <path d="M8 12h8" />
              </svg>

              <h3>Customer First</h3>

              <p>
                We believe in creating a simple, transparent and enjoyable
                shopping experience for every customer.
              </p>
            </div>

          </div>

        </div>
      </section>


      {/* =========================
          CLOSING STATEMENT
      ========================== */}
      <section className="about-closing">
        <div className="container">

          <span className="eyebrow">SHIVAAY PARIDHAN</span>

          <h2>
            Wear the story.
            <br />
            <i>Celebrate the tradition.</i>
          </h2>

          <p>
            Discover timeless Indian fashion crafted for today's generation.
          </p>

        </div>
      </section>

    </main>
  );
}