import React from "react";

type Product = {
  id: string;
  title: string;
  price: string;
  puffCount?: number;
};

interface ComparisonTableProps {
  selectedVendor: string;
  products: Product[];
}

const ComparisonTable: React.FC<ComparisonTableProps> = ({
  selectedVendor,
  products,
}) => {
  return (
    <div>
      {selectedVendor && (
        <h3 className="text-xl font-medium mb-2">{selectedVendor}</h3>
      )}
      {products.length === 0 ? (
        <p>No products found.</p>
      ) : (
        <table className="w-full border-collapse border">
          <thead>
            <tr className="bg-gray-200">
              <th className="border p-2">Name</th>
              <th className="border p-2">Price</th>
              <th className="border p-2">Puffs</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id}>
                <td className="border p-2">{product.title}</td>
                <td className="border p-2">${product.price}</td>
                <td className="border p-2">{product.puffCount || "N/A"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default ComparisonTable;
