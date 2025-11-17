import { Helmet } from "react-helmet-async";
import { SITE_URL } from "../App";
import { assets } from "../assets/assets";
import NewsLetterBox from "../components/NewsLetterBox";
import Title from "../components/Title";

const Contact = () => {
  const canonicalUrl = `${SITE_URL}/contact`;

  return (
    <>
      <Helmet>
        <title>Contact Us | AnondoShop</title>
        <meta
          name="description"
          content="Get in touch with AnondoShop. Contact us for order support, product inquiries or general questions about our online store in Bangladesh."
        />
        <link rel="canonical" href={canonicalUrl} />

        {/* Open Graph */}
        <meta property="og:site_name" content="AnondoShop" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Contact AnondoShop" />
        <meta
          property="og:description"
          content="Need help with your AnondoShop order or have a question? Reach out to our support team via phone or email."
        />
        <meta property="og:image" content={assets.contact_img} />
        <meta property="og:url" content={canonicalUrl} />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Contact AnondoShop" />
        <meta
          name="twitter:description"
          content="Contact AnondoShop customer support for assistance with orders, products, payments and more."
        />
        <meta name="twitter:image" content={assets.contact_img} />
      </Helmet>

      <div>
        <div className="pt-10 text-2xl text-center border-t">
          <Title text1={"CONTACT"} text2={"US"} />
        </div>
        <div className="flex flex-col justify-center gap-10 my-10 md:flex-row mb-28">
          <img
            className="w-full md:max-w-[480px]"
            src={assets.contact_img}
            alt="Contact AnondoShop"
          />
          <div className="flex flex-col items-start justify-center gap-6">
            <p className="text-xl font-semibold text-gray-600">Our Store</p>
            <p className="text-gray-500">
              AnondoShop <br />
              Bhola
            </p>
            <p className="text-gray-500">
              Tel: +8801876694376 <br />
              Email: islamsazedu2@gmail.com
            </p>
          </div>
        </div>
        <NewsLetterBox />
      </div>
    </>
  );
};

export default Contact;
