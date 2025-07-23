import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import type { Category } from "@shared/schema";

export default function Categories() {
  const { data: categories, isLoading } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });

  if (isLoading) {
    return (
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h3 className="text-3xl font-bold text-center text-navy mb-8">Shop by Category</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-gray-200 rounded-2xl p-6 animate-pulse h-32"></div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h3 className="text-3xl font-bold text-center text-navy mb-8">Shop by Category</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
          {categories?.map((category) => (
            <Link 
              key={category.id}
              href={`/category/${category.name}`}
              className={`bg-gradient-to-br ${category.color} rounded-2xl p-6 text-white text-center hover:transform hover:scale-105 transition-all cursor-pointer shadow-lg block`}
            >
              <i className={`${category.icon} text-3xl mb-4`}></i>
              <h4 className="font-bold text-lg">{category.name}</h4>
              <p className="text-sm opacity-90">{category.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
