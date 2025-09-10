import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Category, Tag } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { API_ENDPOINTS } from '@/config/api';

const CategoriesTagsManager: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newTagName, setNewTagName] = useState('');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { token, user } = useAuth();

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
      const [categoriesRes, tagsRes] = await Promise.all([
        axios.get(API_ENDPOINTS.CATEGORIES),
        axios.get(API_ENDPOINTS.TAGS)
      ]);
      setCategories(categoriesRes.data);
      setTags(tagsRes.data);
    } catch (err) {
      setError('Помилка завантаження даних');
    }
  };

  // Categories
  const createCategory = async () => {
    if (!newCategoryName.trim()) return;
    
    setLoading(true);
    try {
      await axios.post(API_ENDPOINTS.CATEGORIES, 
        { name: newCategoryName },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNewCategoryName('');
      loadData();
    } catch (err) {
      setError('Помилка створення категорії');
    } finally {
      setLoading(false);
    }
  };

  const updateCategory = async () => {
    if (!editingCategory) return;
    
    setLoading(true);
    try {
      await axios.put(`${API_ENDPOINTS.CATEGORIES}/${editingCategory.id}`, 
        { name: editingCategory.name },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEditingCategory(null);
      loadData();
    } catch (err) {
      setError('Помилка оновлення категорії');
    } finally {
      setLoading(false);
    }
  };

  const deleteCategory = async (id: number) => {
    if (!confirm('Ви впевнені, що хочете видалити цю категорію?')) return;
    
    setLoading(true);
    try {
      await axios.delete(`${API_ENDPOINTS.CATEGORIES}/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      loadData();
    } catch (err) {
      setError('Помилка видалення категорії');
    } finally {
      setLoading(false);
    }
  };

  // Tags
  const createTag = async () => {
    if (!newTagName.trim()) return;
    
    setLoading(true);
    try {
      await axios.post(API_ENDPOINTS.TAGS, 
        { name: newTagName },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNewTagName('');
      loadData();
    } catch (err) {
      setError('Помилка створення тегу');
    } finally {
      setLoading(false);
    }
  };

  const updateTag = async () => {
    if (!editingTag) return;
    
    setLoading(true);
    try {
      await axios.put(`${API_ENDPOINTS.TAGS}/${editingTag.id}`, 
        { name: editingTag.name },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEditingTag(null);
      loadData();
    } catch (err) {
      setError('Помилка оновлення тегу');
    } finally {
      setLoading(false);
    }
  };

  const deleteTag = async (id: number) => {
    if (!confirm('Ви впевнені, що хочете видалити цей тег?')) return;
    
    setLoading(true);
    try {
      await axios.delete(`${API_ENDPOINTS.TAGS}/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      loadData();
    } catch (err) {
      setError('Помилка видалення тегу');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-4">
      <h2>Керування категоріями та тегами</h2>
      
      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      <div className="row">
        {/* Categories */}
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h4>Категорії</h4>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <div className="input-group">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Назва нової категорії"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                  />
                  <button
                    className="btn btn-primary"
                    onClick={createCategory}
                    disabled={loading || !newCategoryName.trim()}
                  >
                    Додати
                  </button>
                </div>
              </div>

              <div className="list-group">
                {categories.map(category => (
                  <div key={category.id} className="list-group-item d-flex justify-content-between align-items-center">
                    {editingCategory?.id === category.id ? (
                      <div className="flex-grow-1 me-2">
                        <input
                          type="text"
                          className="form-control"
                          value={editingCategory.name}
                          onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                        />
                      </div>
                    ) : (
                      <span className="flex-grow-1">{category.name}</span>
                    )}
                    
                    <div className="btn-group btn-group-sm">
                      {editingCategory?.id === category.id ? (
                        <>
                          <button
                            className="btn btn-success"
                            onClick={updateCategory}
                            disabled={loading}
                          >
                            Зберегти
                          </button>
                          <button
                            className="btn btn-secondary"
                            onClick={() => setEditingCategory(null)}
                          >
                            Скасувати
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            className="btn btn-outline-primary"
                            onClick={() => setEditingCategory(category)}
                          >
                            Редагувати
                          </button>
                          <button
                            className="btn btn-outline-danger"
                            onClick={() => deleteCategory(category.id)}
                            disabled={loading}
                          >
                            Видалити
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Tags */}
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h4>Теги</h4>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <div className="input-group">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Назва нового тегу"
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                  />
                  <button
                    className="btn btn-primary"
                    onClick={createTag}
                    disabled={loading || !newTagName.trim()}
                  >
                    Додати
                  </button>
                </div>
              </div>

              <div className="list-group">
                {tags.map(tag => (
                  <div key={tag.id} className="list-group-item d-flex justify-content-between align-items-center">
                    {editingTag?.id === tag.id ? (
                      <div className="flex-grow-1 me-2">
                        <input
                          type="text"
                          className="form-control"
                          value={editingTag.name}
                          onChange={(e) => setEditingTag({ ...editingTag, name: e.target.value })}
                        />
                      </div>
                    ) : (
                      <span className="flex-grow-1">{tag.name}</span>
                    )}
                    
                    <div className="btn-group btn-group-sm">
                      {editingTag?.id === tag.id ? (
                        <>
                          <button
                            className="btn btn-success"
                            onClick={updateTag}
                            disabled={loading}
                          >
                            Зберегти
                          </button>
                          <button
                            className="btn btn-secondary"
                            onClick={() => setEditingTag(null)}
                          >
                            Скасувати
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            className="btn btn-outline-primary"
                            onClick={() => setEditingTag(tag)}
                          >
                            Редагувати
                          </button>
                          <button
                            className="btn btn-outline-danger"
                            onClick={() => deleteTag(tag.id)}
                            disabled={loading}
                          >
                            Видалити
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoriesTagsManager;