"use client";

import { useEffect, useState } from "react";
import ProductCard from "@/app/components/ProductCard";

const mockProducts = [
  {
    id: "1",
    name: "Premium Dog Food - Large Breed",
    price: 45000,
    comparePrice: 55000,
    image: "/product-placeholder.jpg",
    category: "Food",
    inStock: true,
  },
  {
    id: "2",
    name: "Boerboel Chew Toy - Extra Strong",
    price: 8500,
    comparePrice: 0,
    image: "/product-placeholder.jpg",
    category: "Toys",
    inStock: true,
  },
  {
    id: "3",
    name: "Grooming Kit - Professional",
    price: 35000,
    comparePrice: 42000,
    image: "/product-placeholder.jpg",
    category: "Grooming",
    inStock: false,
  },
  {
    id: "4",
    name: "Training Treats - 500g",
    price: 6500,
    comparePrice: 0,
    image: "/product-placeholder.jpg",
    category: "Treats",
    inStock: true,
  },
];

export default function PawshopPage() {
  const [products] = useState(mockProducts);
  const [categories, setCategories] = useState<string[]>(["all"]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const uniqueCategories = [
      "all",
      ...new Set(mockProducts.map((p) => p.category)),
    ];
    setCategories(uniqueCategories as string[]);
    setLoading(false);
  }, []);

  const filteredProducts =
    selectedCategory === "all"
      ? products
      : products.filter((p) => p.category === selectedCategory);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="h-8 bg-gray-200 rounded w-48 mb-2 animate-pulse" />
        <div className="h-4 bg-gray-200 rounded w-64 mb-8 animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-gray-100 rounded-xl h-64 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl md:text-5xl font-bold mb-2">Dsire Pawshop</h1>
        <p className="text-gray-600 text-lg">
          Everything your Boerboel needs, delivered to your door
        </p>
      </div>

      <div className="mb-8 overflow-x-auto pb-2">
        <div className="flex gap-2 min-w-max">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full font-medium transition ${
                selectedCategory === category
                  ? "bg-black text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {category === "all" ? "All Products" : category}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {filteredProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}