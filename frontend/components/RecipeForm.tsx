import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import { Recipe, Category, Tag, Ingredient } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { API_ENDPOINTS } from '@/config/api';

interface RecipeFormProps {
  recipeId?: number;
}

const RecipeForm: React.FC<RecipeFormProps> = ({ recipeId }) => {
  const [recipe, setRecipe] = useState<Partial<Recipe>>({
    title: '',
    description: '',
    ingredients: [{ name: '', quantity: 1, unit: 'шт' }],
    steps: '',
    servings: 1,
    category: null,
    tags: []
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const { token } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Load categories and tags
    const loadData = async () => {
      try {
        const [categoriesRes, tagsRes] = await Promise.all([
          axios.get(`${API_ENDPOINTS.CATEGORIES}`),
          axios.get(`${API_ENDPOINTS.TAGS}`)
        ]);
        setCategories(categoriesRes.data);
        setTags(tagsRes.data);
      } catch (err) {
        console.error('Error loading form data:', err);
      }
    };

    loadData();

    // Load recipe if editing
    if (recipeId) {
      const loadRecipe = async () => {
        try {
          const response = await axios.get(`${API_ENDPOINTS.RECIPES}/${recipeId}`);
          const recipeData = response.data;
          
          // Ensure ingredients is array
          if (!Array.isArray(recipeData.ingredients)) {
            recipeData.ingredients = [{ name: '', quantity: 1, unit: 'шт' }];
          }
          
          // Ensure tags is array
          if (!Array.isArray(recipeData.tags)) {
            recipeData.tags = [];
          }
          
          setRecipe(recipeData);
        } catch (err) {
          setError('Не вдалося завантажити рецепт');
        }
      };
      
      loadRecipe();
    }
  }, [recipeId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!recipe.title || !recipe.ingredients || recipe.ingredients.length === 0 || !recipe.category) {
      setError('Будь ласка, заповніть всі обов\'язкові поля');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const recipeData = {
        title: recipe.title,
        description: recipe.description,
        ingredients: recipe.ingredients?.filter(ing => ing.name.trim() !== ''),
        steps: typeof recipe.steps === 'string' ? recipe.steps : recipe.steps?.join('\n') || '',
        servings: recipe.servings,
        category_id: recipe.category?.id,
        tags: recipe.tags?.map(tag => tag.id) || []
      };

      if (recipeId) {
        await axios.put(`${API_ENDPOINTS.RECIPES}/${recipeId}`, recipeData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post(API_ENDPOINTS.RECIPES, recipeData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }

      router.push('/recipes');
    } catch (err) {
      setError('Помилка збереження рецепту');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const addIngredient = () => {
    setRecipe({
      ...recipe,
      ingredients: [...(recipe.ingredients || []), { name: '', quantity: 1, unit: 'шт' }]
    });
  };

  const removeIngredient = (index: number) => {
    const newIngredients = recipe.ingredients?.filter((_, i) => i !== index);
    setRecipe({
      ...recipe,
      ingredients: newIngredients
    });
  };

  const updateIngredient = (index: number, field: keyof Ingredient, value: string | number) => {
    const newIngredients = [...(recipe.ingredients || [])];
    newIngredients[index] = {
      ...newIngredients[index],
      [field]: value
    };
    setRecipe({
      ...recipe,
      ingredients: newIngredients
    });
  };

  return (
    <div className="card">
      <div className="card-body">
        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="title" className="form-label">
              Назва рецепту *
            </label>
            <input
              type="text"
              className="form-control"
              id="title"
              value={recipe.title || ''}
              onChange={(e) => setRecipe({ ...recipe, title: e.target.value })}
              required
            />
          </div>

          <div className="mb-3">
            <label htmlFor="description" className="form-label">
              Опис
            </label>
            <textarea
              className="form-control"
              id="description"
              rows={3}
              value={recipe.description || ''}
              onChange={(e) => setRecipe({ ...recipe, description: e.target.value })}
            />
          </div>

          <div className="mb-3">
            <label htmlFor="servings" className="form-label">
              Кількість порцій
            </label>
            <input
              type="number"
              className="form-control"
              id="servings"
              min="1"
              value={recipe.servings || 1}
              onChange={(e) => setRecipe({ ...recipe, servings: parseInt(e.target.value) })}
            />
          </div>

          <div className="mb-3">
            <label htmlFor="category" className="form-label">
              Категорія *
            </label>
            <select
              className="form-control"
              id="category"
              value={recipe.category?.id || ''}
              onChange={(e) => {
                const categoryId = parseInt(e.target.value);
                const selectedCategory = categories.find(c => c.id === categoryId);
                setRecipe({ ...recipe, category: selectedCategory || null });
              }}
              required
            >
              <option value="">Оберіть категорію</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-3">
            <label htmlFor="tags" className="form-label">
              Теги
            </label>
            <div style={{ maxHeight: '150px', overflowY: 'auto', border: '1px solid #ced4da', borderRadius: '0.25rem', padding: '0.5rem' }}>
              {tags.map(tag => (
                <div key={tag.id} className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id={`tag-${tag.id}`}
                    checked={recipe.tags?.some(t => t.id === tag.id) || false}
                    onChange={(e) => {
                      const currentTags = recipe.tags || [];
                      if (e.target.checked) {
                        setRecipe({ ...recipe, tags: [...currentTags, tag] });
                      } else {
                        setRecipe({ ...recipe, tags: currentTags.filter(t => t.id !== tag.id) });
                      }
                    }}
                  />
                  <label className="form-check-label" htmlFor={`tag-${tag.id}`}>
                    {tag.name}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label">Інгредієнти *</label>
            {recipe.ingredients?.map((ingredient, index) => (
              <div key={index} className="row mb-2">
                <div className="col-md-5">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Назва інгредієнта"
                    value={ingredient.name}
                    onChange={(e) => updateIngredient(index, 'name', e.target.value)}
                  />
                </div>
                <div className="col-md-3">
                  <input
                    type="number"
                    className="form-control"
                    placeholder="Кількість"
                    min="0"
                    step="0.1"
                    value={ingredient.quantity}
                    onChange={(e) => updateIngredient(index, 'quantity', parseFloat(e.target.value))}
                  />
                </div>
                <div className="col-md-3">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Одиниця"
                    value={ingredient.unit}
                    onChange={(e) => updateIngredient(index, 'unit', e.target.value)}
                  />
                </div>
                <div className="col-md-1">
                  <button
                    type="button"
                    className="btn btn-outline-danger"
                    onClick={() => removeIngredient(index)}
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
            <button
              type="button"
              className="btn btn-outline-primary btn-sm"
              onClick={addIngredient}
            >
              + Додати інгредієнт
            </button>
          </div>

          <div className="mb-3">
            <label htmlFor="steps" className="form-label">
              Інструкції з приготування *
            </label>
            <textarea
              className="form-control"
              id="steps"
              rows={6}
              value={typeof recipe.steps === 'string' ? recipe.steps : ''}
              onChange={(e) => setRecipe({ ...recipe, steps: e.target.value })}
              placeholder="Опишіть кроки приготування..."
              required
            />
          </div>

          <div className="d-flex justify-content-between">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => router.back()}
            >
              Скасувати
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Збереження...' : (recipeId ? 'Оновити рецепт' : 'Створити рецепт')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RecipeForm;