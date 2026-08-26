import Link from 'next/link';
import {
  ArrowRight,
  Instagram,
  MapPin,
  Mail,
  MessageCircle,
  Phone,
} from 'lucide-react';

export default function Contact() {
  return (
    <main className="page">

      <div className="container">

        {/* =====================================================
            HEADER
        ===================================================== */}

        <div className="eyebrow">
          Customer care
        </div>

        <h1
          className="section-title"
          style={{ marginTop: 8 }}
        >
          We’re here to help.
        </h1>

        <p
          className="muted"
          style={{ maxWidth: 620 }}
        >
          Questions about a saree, sizing, delivery or
          your order? Connect directly with Shivaay Paridhan.
        </p>


        {/* =====================================================
            CONTACT OPTIONS
        ===================================================== */}

        <div
          className="promise-grid"
          style={{ marginTop: 32 }}
        >

          {/* =================================================
              WHATSAPP
          ================================================= */}

          <div>

            <div className="contact-card-icon">
              <MessageCircle size={26} />
            </div>

            <h3>
              WhatsApp
            </h3>

            <p>
              Chat with the shop team for product help
              and order support.
            </p>

            <Link
              className="text-link"
              href="https://wa.me/918448460446"
              target="_blank"
              rel="noopener noreferrer"
            >
              Start a chat
              <ArrowRight size={15} />
            </Link>

          </div>


          {/* =================================================
              PHONE
          ================================================= */}

          <div>

            <div className="contact-card-icon">
              <Phone size={26} />
            </div>

            <h3>
              Phone
            </h3>

            <p>
              +91 84484 60446
            </p>

            <p>
              Available for customer assistance.
            </p>

            <a
              className="text-link"
              href="tel:+918448460446"
            >
              Call us
              <ArrowRight size={15} />
            </a>

          </div>


          {/* =================================================
              EMAIL
          ================================================= */}

          <div>

            <div className="contact-card-icon">
              <Mail size={26} />
            </div>

            <h3>
              Email
            </h3>

            <p>
              info@shivaayparidhaan.com
            </p>

            <p>
              We’ll get back to your query.
            </p>

            <a
              className="text-link"
              href="mailto:info@shivaayparidhaan.com"
            >
              Email us
              <ArrowRight size={15} />
            </a>

          </div>


          {/* =================================================
              INSTAGRAM
          ================================================= */}

          <div>

            <div className="contact-card-icon">
              <Instagram size={26} />
            </div>

            <h3>
              Instagram
            </h3>

            <p>
              Follow Shivaay Paridhan for new collections,
              styling inspiration and latest updates.
            </p>

            <Link
              className="text-link"
              href="https://www.instagram.com/shivaayparidhan1528?igsi=MTM1eWl0ODFkaWE0dw=="
              target="_blank"
              rel="noopener noreferrer"
            >
              Follow us
              <ArrowRight size={15} />
            </Link>

          </div>


          {/* =================================================
              LOCATION
          ================================================= */}

          <div>

            <div className="contact-card-icon">
              <MapPin size={26} />
            </div>

            <h3>
              Location
            </h3>

            <p>
              Sonari, Jamshedpur,
              Jharkhand, India
            </p>

            <p>
              One shop. One brand.
            </p>

            <a
              className="text-link"
              href="https://www.google.com/maps/search/?api=1&query=Sonari,Jamshedpur,Jharkhand,India"
              target="_blank"
              rel="noopener noreferrer"
            >
              View location
              <ArrowRight size={15} />
            </a>

          </div>

        </div>


        {/* =====================================================
            SHOP CTA
        ===================================================== */}

        <div
          className="offer-strip"
          style={{
            marginTop: 45,
            borderRadius: 14,
          }}
        >

          <div className="container offer-inner">

            <div>

              <span className="eyebrow gold">
                Ready to shop?
              </span>

              <h2>
                Find your perfect look.
              </h2>

            </div>

            <Link
              className="btn btn-light"
              href="/shop"
            >
              Shop Now
            </Link>

          </div>

        </div>

      </div>

    </main>
  );
}