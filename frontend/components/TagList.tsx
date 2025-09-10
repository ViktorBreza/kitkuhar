import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { Tag } from '@/types';
import { API_ENDPOINTS } from '@/config/api';

const TagList: React.FC = () => {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const loadTags = async () => {
      try {
        const response = await axios.get(API_ENDPOINTS.TAGS);
        setTags(response.data);
      } catch (err: any) {
        setError('Помилка завантаження тегів');
        console.error('Error loading tags:', err);
      } finally {
        setLoading(false);
      }
    };

    loadTags();
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
          <h1 className="mb-4">Теги рецептів</h1>
          <p className="lead">
            Знайдіть рецепти за тегами - інгредієнтами, способом приготування або особливостями страви
          </p>
        </div>
      </div>

      <div className="row">
        <div className="col-12">
          {tags.length === 0 ? (
            <div className="alert alert-info" role="alert">
              <h4 className="alert-heading">Поки що немає тегів</h4>
              <p>Теги рецептів будуть додані найближчим часом.</p>
            </div>
          ) : (
            <div className="d-flex flex-wrap gap-2">
              {tags.map(tag => (
                <Link 
                  key={tag.id}
                  href={`/recipes?tag=${tag.id}`}
                  className="badge bg-primary fs-6 text-decoration-none p-2"
                  style={{ cursor: 'pointer' }}
                >
                  #{tag.name}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {tags.length > 0 && (
        <div className="row mt-5">
          <div className="col-12">
            <h3>Популярні теги</h3>
            <p className="text-muted">
              Натисніть на тег щоб знайти всі рецепти з цим тегом
            </p>
          </div>
        </div>
      )}

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
                "name": "Теги рецептів",
                "item": "https://kitkuhar.com/tags"
              }
            ]
          })
        }}
      />
    </div>
  );
};

export default TagList;