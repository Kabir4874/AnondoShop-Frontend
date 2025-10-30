import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <div>
      <div className="flex flex-col sm:grid grid-cols-[3fr_1fr_1fr] gap-14 my-10 mt-40 text-sm mb-8">
        {/* Brand + About + Socials */}
        <div>
          <Link to="/" className="mb-5 inline-block">
            <span className="prata-regular leading-relaxed !font-medium text-lg md:text-3xl">
              AnondoShop
            </span>
          </Link>

          <p className="w-full text-gray-600 md:w-2/3 mt-2">
            Thank you for shopping with AnondoShop! We&apos;re dedicated to
            bringing you the latest trends and top-quality products. Follow us
            on social media for updates on new arrivals, exclusive offers, and
            more. If you have any questions or need assistance, our friendly
            customer support team is here to help. Subscribe to our newsletter
            for special discounts and be the first to know about our latest
            promotions. Your style journey starts here—let&apos;s make it
            unforgettable!
          </p>

          {/* Social icons */}
          <div className="mt-5">
            <p className="mb-2 text-sm font-semibold text-gray-800">
              FOLLOW US
            </p>
            <div className="flex items-center gap-3">
              {/* TikTok */}
              <a
                href="https://www.tiktok.com/@ami.kinbo.online.shop?_t=ZS-90ebFVXehHE&_r=1"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Visit our TikTok"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-black text-white hover:opacity-90 transition"
                title="TikTok"
              >
                {/* TikTok SVG */}
                <svg
                  viewBox="0 0 48 48"
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M41.5 17.2a12.9 12.9 0 01-7.5-2.4v12.1c0 6.6-5.3 11.9-11.9 11.9S10.2 33.5 10.2 26.9c0-6.6 5.3-11.9 11.9-11.9 1 0 2 .1 2.9.4v5.7a6.3 6.3 0 00-2.9-.7c-3.5 0-6.3 2.8-6.3 6.3S18.6 33 22.1 33s6.3-2.8 6.3-6.3V4.5h5.6a12.9 12.9 0 007.5 7.4v5.3z" />
                </svg>
              </a>

              {/* Facebook */}
              <a
                href="https://www.facebook.com/share/16U8iWoCnU/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Visit our Facebook"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#1877F2] text-white hover:opacity-90 transition"
                title="Facebook"
              >
                {/* Facebook SVG */}
                <svg
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M22 12a10 10 0 1 0-11.563 9.875V14.89H7.898V12h2.54V9.797c0-2.506 1.492-3.89 3.776-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.772-1.63 1.562V12h2.773l-.444 2.89h-2.329v6.984A10.002 10.002 0 0 0 22 12z" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* Company links */}
        <div>
          <p className="mb-5 text-xl font-medium">COMPANY</p>
          <ul className="flex flex-col gap-1 text-gray-600">
            <Link to="/">
              <li>Home</li>
            </Link>
            <Link to="/about">
              <li>About Us</li>
            </Link>
            <Link to="/about">
              <li>Delivery</li>
            </Link>
            <Link to="/about">
              <li>Privacy &amp; Policy</li>
            </Link>
          </ul>
        </div>

        {/* Contact */}
        <div>
          <p className="mb-5 text-xl font-medium">GET IN TOUCH</p>
          <ul className="flex flex-col gap-1 text-gray-600">
            <li>
              <a
                href="tel:+8801876694376"
                className="hover:text-gray-800 transition"
              >
                +8801876694376
              </a>
            </li>
            <li>
              <a
                href="mailto:islamsazedu2@gmail.com"
                className="hover:text-gray-800 transition"
              >
                islamsazedu2@gmail.com
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* Footer bottom */}
      <div className="mb-16">
        <hr />
        <p className="py-5 text-sm text-center">
          Copyright 2025 AnondoShop. All rights reserved. Developed By{" "}
          <a
            href="https://kabir-ahmed.netlify.app"
            target="_blank"
            className="text-blue-500 underline hover:text-blue-600"
          >
            Kabir Ahmed Ridoy
          </a>
        </p>
      </div>
    </div>
  );
};

export default Footer;
