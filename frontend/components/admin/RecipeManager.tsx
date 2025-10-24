import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Recipe, Category, Tag, Ingredient, CookingStep, RecipeCreate } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { API_ENDPOINTS } from '@/config/api';
import StepManager from '@/components/recipe/StepManager';

const RecipeManager: React.FC = () => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { token, user } = useAuth();

  const [recipeForm, setRecipeForm] = useState<RecipeCreate>({
    title: '',
    description: '',
    ingredients: [{ name: '', quantity: 0, unit: '' }],
    steps: [{
      id: 'step-1',
      stepNumber: 1,
      description: '',
      media: []
    }],
    servings: 1,
    category_id: 0,
    tags: []
  });

  // Only show for admins
  if (!user?.is_admin) {
    return (
      <div className="alert alert-warning">
        У вас немає прав доступу до цієї сторінки.
      </div>
    );
  }

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [recipesRes, categoriesRes, tagsRes] = await Promise.all([
        axios.get(API_ENDPOINTS.ADMIN_RECIPES, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(API_ENDPOINTS.CATEGORIES),
        axios.get(API_ENDPOINTS.TAGS)
      ]);
      setRecipes(recipesRes.data);
      setCategories(categoriesRes.data);
      setTags(tagsRes.data);
    } catch (err: any) {
      setError('Помилка завантаження даних');
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setRecipeForm({
      title: '',
      description: '',
      ingredients: [{ name: '', quantity: 0, unit: '' }],
      steps: [{
        id: 'step-1',
        stepNumber: 1,
        description: '',
        media: []
      }],
      servings: 1,
      category_id: 0,
      tags: []
    });
    setEditingRecipe(null);
    setShowCreateForm(false);
  };

  const handleIngredientChange = (index: number, field: keyof Ingredient, value: string | number) => {
    const newIngredients = [...recipeForm.ingredients];
    newIngredients[index] = { ...newIngredients[index], [field]: value };
    setRecipeForm({ ...recipeForm, ingredients: newIngredients });
  };

  const addIngredient = () => {
    setRecipeForm({
      ...recipeForm,
      ingredients: [...recipeForm.ingredients, { name: '', quantity: 0, unit: '' }]
    });
  };

  const removeIngredient = (index: number) => {
    const newIngredients = recipeForm.ingredients.filter((_, i) => i !== index);
    setRecipeForm({ ...recipeForm, ingredients: newIngredients });
  };

  const handleTagToggle = (tagId: number) => {
    const newTags = recipeForm.tags.includes(tagId)
      ? recipeForm.tags.filter(id => id !== tagId)
      : [...recipeForm.tags, tagId];
    setRecipeForm({ ...recipeForm, tags: newTags });
  };

  const createRecipe = async () => {
    if (!recipeForm.title.trim() || recipeForm.category_id === 0 || 
        recipeForm.steps.length === 0 || 
        recipeForm.steps.some(step => !step.description.trim())) {
      setError('Заповніть всі обовʼязкові поля та додайте хоча б один крок з описом');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await axios.post(API_ENDPOINTS.ADMIN_RECIPES, recipeForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      resetForm();
      loadData();
    } catch (err: any) {
      setError(`Помилка створення рецепту: ${err.response?.data?.detail || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const updateRecipe = async () => {
    if (!editingRecipe) return;

    setLoading(true);
    setError('');
    try {
      await axios.put(API_ENDPOINTS.ADMIN_RECIPE_UPDATE(editingRecipe.id), recipeForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      resetForm();
      loadData();
    } catch (err: any) {
      setError(`Помилка оновлення рецепту: ${err.response?.data?.detail || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const deleteRecipe = async (id: number) => {
    if (!confirm('Ви впевнені, що хочете видалити цей рецепт?')) return;

    setLoading(true);
    try {
      await axios.delete(API_ENDPOINTS.ADMIN_RECIPE_DELETE(id), {
        headers: { Authorization: `Bearer ${token}` }
      });
      loadData();
    } catch (err: any) {
      setError('Помилка видалення рецепту');
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (recipe: Recipe) => {
    setEditingRecipe(recipe);
    setRecipeForm({
      title: recipe.title,
      description: recipe.description || '',
      ingredients: recipe.ingredients,
      steps: Array.isArray(recipe.steps) ? recipe.steps : [{
        id: 'step-1',
        stepNumber: 1,
        description: recipe.steps as string || '',
        media: []
      }],
      servings: recipe.servings,
      category_id: recipe.category?.id || 0,
      tags: recipe.tags.map(tag => tag.id)
    });
    setShowCreateForm(true);
  };

  const renderRecipeForm = () => (
    <div className="card mb-4">
      <div className="card-header">
        <h5>{editingRecipe ? 'Редагувати рецепт' : 'Створити новий рецепт'}</h5>
      </div>
      <div className="card-body">
        <div className="row">
          <div className="col-md-6">
            <div className="mb-3">
              <label className="form-label">Назва *</label>
              <input
                type="text"
                className="form-control"
                value={recipeForm.title}
                onChange={(e) => setRecipeForm({ ...recipeForm, title: e.target.value })}
                placeholder="Назва рецепту"
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Опис</label>
              <textarea
                className="form-control"
                rows={3}
                value={recipeForm.description}
                onChange={(e) => setRecipeForm({ ...recipeForm, description: e.target.value })}
                placeholder="Опис рецепту"
              />
            </div>

            <div className="row">
              <div className="col-md-6">
                <div className="mb-3">
                  <label className="form-label">Категорія *</label>
                  <select
                    className="form-select"
                    value={recipeForm.category_id}
                    onChange={(e) => setRecipeForm({ ...recipeForm, category_id: parseInt(e.target.value) })}
                  >
                    <option value={0}>Оберіть категорію</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="col-md-6">
                <div className="mb-3">
                  <label className="form-label">Порцій</label>
                  <input
                    type="number"
                    className="form-control"
                    min="1"
                    value={recipeForm.servings}
                    onChange={(e) => setRecipeForm({ ...recipeForm, servings: parseInt(e.target.value) || 1 })}
                  />
                </div>
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label">Теги</label>
              <div className="d-flex flex-wrap gap-2">
                {tags.map(tag => (
                  <div key={tag.id} className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id={`tag-${tag.id}`}
                      checked={recipeForm.tags.includes(tag.id)}
                      onChange={() => handleTagToggle(tag.id)}
                    />
                    <label className="form-check-label" htmlFor={`tag-${tag.id}`}>
                      {tag.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="col-md-6">
            <div className="mb-3">
              <label className="form-label">Інгредієнти</label>
              {recipeForm.ingredients.map((ingredient, index) => (
                <div key={index} className="input-group mb-2">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Назва"
                    value={ingredient.name}
                    onChange={(e) => handleIngredientChange(index, 'name', e.target.value)}
                  />
                  <input
                    type="number"
                    className="form-control"
                    placeholder="Кількість"
                    style={{ maxWidth: '100px' }}
                    value={ingredient.quantity}
                    onChange={(e) => handleIngredientChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                  />
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Од."
                    style={{ maxWidth: '80px' }}
                    value={ingredient.unit}
                    onChange={(e) => handleIngredientChange(index, 'unit', e.target.value)}
                  />
                  <button
                    type="button"
                    className="btn btn-outline-danger"
                    onClick={() => removeIngredient(index)}
                    disabled={recipeForm.ingredients.length === 1}
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="btn btn-outline-primary btn-sm"
                onClick={addIngredient}
              >
                Додати інгредієнт
              </button>
            </div>

            <div className="mb-3">
              <StepManager
                steps={recipeForm.steps}
                onChange={(steps) => setRecipeForm({ ...recipeForm, steps })}
              />
            </div>
          </div>
        </div>

        <div className="d-flex justify-content-end gap-2">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={resetForm}
          >
            Скасувати
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={editingRecipe ? updateRecipe : createRecipe}
            disabled={loading || !recipeForm.title.trim() || recipeForm.category_id === 0 || 
                     recipeForm.steps.length === 0 || 
                     recipeForm.steps.some(step => !step.description.trim())}
          >
            {editingRecipe ? 'Оновити' : 'Створити'}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Керування рецептами</h2>
        <button
          className="btn btn-primary"
          onClick={() => setShowCreateForm(true)}
          disabled={showCreateForm}
        >
          Додати рецепт
        </button>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {showCreateForm && renderRecipeForm()}

      <div className="row">
        {recipes.map(recipe => (
          <div key={recipe.id} className="col-md-6 col-lg-4 mb-4">
            <div className="card h-100">
              <div className="card-body">
                <h5 className="card-title">{recipe.title}</h5>
                {recipe.description && (
                  <p className="card-text text-muted small">
                    {recipe.description.length > 100 
                      ? `${recipe.description.substring(0, 100)}...` 
                      : recipe.description}
                  </p>
                )}
                <div className="mb-2">
                  <small className="text-muted">
                    Категорія: <span className="badge bg-secondary">{recipe.category?.name}</span>
                  </small>
                </div>
                <div className="mb-2">
                  <small className="text-muted">Порцій: {recipe.servings}</small>
                </div>
                {recipe.tags.length > 0 && (
                  <div className="mb-2">
                    {recipe.tags.map(tag => (
                      <span key={tag.id} className="badge bg-info text-dark me-1">
                        {tag.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="card-footer">
                <div className="btn-group w-100">
                  <button
                    className="btn btn-outline-primary btn-sm"
                    onClick={() => startEdit(recipe)}
                  >
                    Редагувати
                  </button>
                  <button
                    className="btn btn-outline-danger btn-sm"
                    onClick={() => deleteRecipe(recipe.id)}
                    disabled={loading}
                  >
                    Видалити
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {recipes.length === 0 && !loading && (
        <div className="text-center py-5">
          <p className="text-muted">Рецептів поки немає. Створіть перший!</p>
        </div>
      )}

      {loading && (
        <div className="text-center py-3">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Завантаження...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecipeManager;
// Cache fix trigger
