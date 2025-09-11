import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import axios from 'axios';
import { Recipe } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { API_ENDPOINTS } from '@/config/api';
import StarRating from './StarRating';
import PortionCalculator from './PortionCalculator';

interface RecipeDetailProps {
  recipeId: number;
}

const RecipeDetail: React.FC<RecipeDetailProps> = ({ recipeId }) => {
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const { isAuthenticated, isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const fetchRecipe = async () => {
      try {
        const response = await axios.get(`${API_ENDPOINTS.RECIPES}/${recipeId}`);
        setRecipe(response.data);
      } catch (err) {
        setError('Не вдалося завантажити рецепт');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (recipeId) {
      fetchRecipe();
    }
  }, [recipeId]);

  if (loading) {
    return (
      <div className="text-center">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Завантаження...</span>
        </div>
      </div>
    );
  }

  if (error || !recipe) {
    return (
      <div className="alert alert-danger" role="alert">
        {error || 'Рецепт не знайдено'}
      </div>
    );
  }

  const steps = typeof recipe.steps === 'string' 
    ? recipe.steps.split('\n').filter(step => step.trim())
    : recipe.steps;

  return (
    <div className="recipe-detail">
      <div className="d-flex justify-content-between align-items-start mb-4">
        <div>
          <h1 className="mb-2">{recipe.title}</h1>
          <StarRating recipeId={recipe.id} />
        </div>
        
        {(isAuthenticated || isAdmin) && (
          <div className="btn-group">
            <Link 
              href={`/edit-recipe/${recipe.id}`}
              className="btn btn-outline-secondary"
            >
              Редагувати
            </Link>
          </div>
        )}
      </div>

      {recipe.description && (
        <div className="mb-4">
          <p className="lead">{recipe.description}</p>
        </div>
      )}

      {/* ================================================================ */}
      {/* PORTION CALCULATOR - Interactive ingredient calculator */}
      {/* ================================================================ */}
      <div className="row mb-4">
        <div className="col-lg-8">
          <PortionCalculator 
            originalServings={recipe.servings}
            ingredients={recipe.ingredients}
          />
        </div>
        
        <div className="col-lg-4">
          {/* Recipe metadata */}
          {recipe.category && (
            <div className="mb-3">
              <strong>Категорія:</strong>
              <span className="badge bg-primary ms-2">{recipe.category.name}</span>
            </div>
          )}
          
          {recipe.tags && recipe.tags.length > 0 && (
            <div className="mb-3">
              <strong>Теги:</strong>
              <div className="mt-2">
                {recipe.tags.map(tag => (
                  <span key={tag.id} className="badge bg-secondary me-1">
                    {tag.name}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {/* Additional recipe info */}
          <div className="card bg-light">
            <div className="card-body">
              <h6 className="card-title">
                <i className="bi bi-info-circle me-2"></i>
                Інформація про рецепт
              </h6>
              <p className="card-text small mb-1">
                <strong>Оригінальних порцій:</strong> {recipe.servings}
              </p>
              <p className="card-text small mb-1">
                <strong>Інгредієнтів:</strong> {recipe.ingredients.length}
              </p>
              <p className="card-text small mb-0">
                <strong>Кроків приготування:</strong> {Array.isArray(recipe.steps) ? recipe.steps.length : 1}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <h3>Інструкції</h3>
        <div className="recipe-steps">
          {Array.isArray(steps) ? (
            steps.map((step, index) => (
              <div key={index} className="recipe-step card mb-3">
                <div className="card-body">
                  <div className="d-flex align-items-start">
                    <div className="step-number bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3" style={{width: '2.5rem', height: '2.5rem', flexShrink: 0}}>
                      {typeof step === 'object' && step.stepNumber ? step.stepNumber : index + 1}
                    </div>
                    <div className="step-content flex-grow-1">
                      <p className="mb-0">{typeof step === 'string' ? step : step.description}</p>
                      {typeof step === 'object' && step.media && step.media.length > 0 && (
                        <div className="step-media mt-3">
                          <div className="row">
                            {step.media.map((media, mediaIndex) => (
                              <div key={mediaIndex} className="col-md-6 col-lg-4 mb-2">
                                {media.type === 'image' ? (
                                  <img 
                                    src={media.url} 
                                    alt={media.alt || `Крок ${step.stepNumber}`}
                                    className="img-fluid rounded shadow-sm"
                                    style={{
                                      maxHeight: '200px',         // CRITICAL: Limit height in recipe view
                                      objectFit: 'contain',       // NEVER use 'cover' - it crops images!
                                      width: '100%',              // Fill container width
                                      backgroundColor: '#f8f9fa', // Gray background for transparency
                                      cursor: 'pointer'           // Indicate clickable for modal
                                    }}
                                    onClick={() => setSelectedImage(media.url)} // Open modal with this image
                                  />
                                ) : media.type === 'video' ? (
                                  <video 
                                    src={media.url} 
                                    controls 
                                    className="w-100 rounded shadow-sm"
                                    style={{maxHeight: '200px'}}
                                  >
                                    Ваш браузер не підтримує відео.
                                  </video>
                                ) : null}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="recipe-step card">
              <div className="card-body">
                <p className="mb-0">{steps}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4">
        <Link href="/recipes" className="btn btn-secondary">
          ← Назад до рецептів
        </Link>
      </div>

      {/* ================================================================ */}
      {/* MODAL: Image zoom functionality - IDENTICAL to StepManager! */}
      {/* ================================================================ */}
      {selectedImage && (
        <div 
          className="modal fade show d-block" 
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={() => setSelectedImage(null)} // Close on backdrop click
        >
          <div className="modal-dialog modal-lg modal-dialog-centered"> {/* modal-lg = not full screen */}
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Перегляд зображення</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setSelectedImage(null)} // Close on X button
                ></button>
              </div>
              <div className="modal-body text-center">
                <img 
                  src={selectedImage} 
                  alt="Збільшене зображення" 
                  className="img-fluid"
                  style={{ 
                    maxHeight: '70vh',      // CRITICAL: 70% viewport height - not full screen
                    objectFit: 'contain'    // NEVER use 'cover' here either
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecipeDetail;