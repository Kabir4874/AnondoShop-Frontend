import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <div>
      <div className="flex flex-col sm:grid grid-cols-[3fr_1fr_1fr] gap-14 my-10 mt-40 text-sm">
        <div>
          <Link to="/" className="mb-5">
            <span className="prata-regular leading-relaxed !font-medium text-lg md:text-3xl">
              AnondoShop
            </span>
          </Link>
          <p className="w-full text-gray-600 md:w-2/3 mt-2">
            Thank you for shopping with AnondoShop! We're dedicated to bringing
            you the latest trends and top-quality products. Follow us on social
            media for updates on new arrivals, exclusive offers, and more. If
            you have any questions or need assistance, our friendly customer
            support team is here to help. Subscribe to our newsletter for
            special discounts and be the first to know about our latest
            promotions. Your style journey starts here—let's make it
            unforgettable!
          </p>
        </div>

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
              <li>Privacy & Policy</li>
            </Link>
          </ul>
        </div>

        <div>
          <p className="mb-5 text-xl font-medium">GET IN TOUCH</p>
          <ul className="flex flex-col gap-1 text-gray-600">
            <li>+8801876694376</li>
            <li>islamsazedu2@gmail.com</li>
          </ul>
        </div>
      </div>
      <div>
        <hr />
        <p className="py-5 text-sm text-center">
          Copyright 2025 AnondoShop. All rights reserved. Developed By{" "}
          <a href="#" className="text-blue-500 underline">
            Kabir Ahmed Ridoy
          </a>
        </p>
      </div>
    </div>
  );
};

export default Footer;
