export default function ShopifyFooter() {
  return (
    <footer className="bg-gray-900 text-white p-6 mt-10">
      <div className="container mx-auto text-center">
        <p>
          &copy; {new Date().getFullYear()} 2cd994.myshopify.com | All rights
          reserved.
        </p>
      </div>
    </footer>
  );
}
