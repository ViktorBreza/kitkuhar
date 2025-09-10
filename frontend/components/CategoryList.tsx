import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { Category } from '@/types';
import { API_ENDPOINTS } from '@/config/api';

const CategoryList: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await axios.get(API_ENDPOINTS.CATEGORIES);
        setCategories(response.data);
      } catch (err: any) {
        setError('Помилка завантаження категорій');
        console.error('Error loading categories:', err);
      } finally {
        setLoading(false);
      }
    };

    loadCategories();
  }, []);

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Завантаження...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger" role="alert">
        {error}
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <div className="row">
        <div className="col-12">
          <h1 className="mb-4">Категорії рецептів</h1>
          <p className="lead">
            Оберіть категорію щоб знайти рецепти за типом страви
          </p>
        </div>
      </div>

      <div className="row">
        {categories.length === 0 ? (
          <div className="col-12">
            <div className="alert alert-info" role="alert">
              <h4 className="alert-heading">Поки що немає категорій</h4>
              <p>Категорії рецептів будуть додані найближчим часом.</p>
            </div>
          </div>
        ) : (
          categories.map(category => (
            <div key={category.id} className="col-lg-3 col-md-4 col-sm-6 mb-4">
              <div className="card h-100 shadow-sm">
                <div className="card-body d-flex flex-column">
                  <h5 className="card-title">{category.name}</h5>
                  <p className="card-text text-muted small">
                    Рецепти категорії "{category.name}"
                  </p>
                  <div className="mt-auto">
                    <Link 
                      href={`/recipes?category=${category.id}`} 
                      className="btn btn-primary btn-sm"
                    >
                      Переглянути рецепти
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Structured data for SEO */}
      <script 
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              {
                "@type": "ListItem",
                "position": 1,
                "name": "Головна",
                "item": "https://kitkuhar.com"
              },
              {
                "@type": "ListItem", 
                "position": 2,
                "name": "Категорії рецептів",
                "item": "https://kitkuhar.com/categories"
              }
            ]
          })
        }}
      />
    </div>
  );
};

export default CategoryList;