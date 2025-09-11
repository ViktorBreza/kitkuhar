import React, { useState } from 'react';
import { CookingStep, StepMedia } from '@/types';
import { API_ENDPOINTS } from '@/config/api';
import axios from 'axios';

interface StepManagerProps {
  steps: CookingStep[];
  onChange: (steps: CookingStep[]) => void;
}

const StepManager: React.FC<StepManagerProps> = ({ steps, onChange }) => {
  const [uploadingFiles, setUploadingFiles] = useState<{ [key: number]: boolean }>({});
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const addStep = () => {
    const newStep: CookingStep = {
      id: `step-${Date.now()}`,
      stepNumber: steps.length + 1,
      description: '',
      media: []
    };
    onChange([...steps, newStep]);
  };

  const removeStep = (index: number) => {
    const newSteps = steps.filter((_, i) => i !== index);
    // Renumber steps
    const renumberedSteps = newSteps.map((step, i) => ({
      ...step,
      stepNumber: i + 1
    }));
    onChange(renumberedSteps);
  };

  const updateStepDescription = (index: number, description: string) => {
    const newSteps = [...steps];
    newSteps[index] = {
      ...newSteps[index],
      description
    };
    onChange(newSteps);
  };

  const handleMediaUpload = async (stepIndex: number, files: FileList) => {
    if (!files || files.length === 0) return;

    setUploadingFiles(prev => ({ ...prev, [stepIndex]: true }));

    try {
      const formData = new FormData();
      Array.from(files).forEach(file => {
        formData.append('files', file);
      });

      const response = await axios.post(API_ENDPOINTS.MEDIA_UPLOAD_MULTIPLE, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        const newMedia: StepMedia[] = response.data.files.map((file: any) => ({
          id: file.filename,
          type: file.type,
          filename: file.filename,
          url: file.url,
          alt: `Зображення для кроку ${stepIndex + 1}`
        }));

        const newSteps = [...steps];
        newSteps[stepIndex] = {
          ...newSteps[stepIndex],
          media: [...(newSteps[stepIndex].media || []), ...newMedia]
        };
        onChange(newSteps);
      }
    } catch (error: any) {
      console.error('Media upload error:', error);
      alert(`Помилка завантаження: ${error.response?.data?.detail || error.message}`);
    } finally {
      setUploadingFiles(prev => ({ ...prev, [stepIndex]: false }));
    }
  };

  const removeMedia = async (stepIndex: number, mediaIndex: number) => {
    const media = steps[stepIndex].media?.[mediaIndex];
    if (!media) return;

    try {
      // Delete from server
      await axios.delete(`${API_ENDPOINTS.MEDIA_DELETE}/${media.filename}`);
      
      // Remove from state
      const newSteps = [...steps];
      const currentMedia = newSteps[stepIndex].media || [];
      newSteps[stepIndex] = {
        ...newSteps[stepIndex],
        media: currentMedia.filter((_, i) => i !== mediaIndex)
      };
      onChange(newSteps);
    } catch (error: any) {
      console.error('Media delete error:', error);
      alert(`Помилка видалення: ${error.response?.data?.detail || error.message}`);
    }
  };

  const moveStep = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= steps.length) return;

    const newSteps = [...steps];
    const [movedStep] = newSteps.splice(fromIndex, 1);
    newSteps.splice(toIndex, 0, movedStep);

    // Renumber steps
    const renumberedSteps = newSteps.map((step, i) => ({
      ...step,
      stepNumber: i + 1
    }));
    onChange(renumberedSteps);
  };

  return (
    <div className="step-manager">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5>Кроки приготування</h5>
        <button
          type="button"
          className="btn btn-outline-primary btn-sm"
          onClick={addStep}
        >
          + Додати крок
        </button>
      </div>

      {steps.map((step, index) => (
        <div key={step.id} className="card mb-3">
          <div className="card-header d-flex justify-content-between align-items-center">
            <h6 className="mb-0">Крок {step.stepNumber}</h6>
            <div className="btn-group btn-group-sm">
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => moveStep(index, index - 1)}
                disabled={index === 0}
                title="Перемістити вверх"
              >
                ↑
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => moveStep(index, index + 1)}
                disabled={index === steps.length - 1}
                title="Перемістити вниз"
              >
                ↓
              </button>
              <button
                type="button"
                className="btn btn-outline-danger"
                onClick={() => removeStep(index)}
                disabled={steps.length === 1}
                title="Видалити крок"
              >
                ✕
              </button>
            </div>
          </div>
          <div className="card-body">
            <div className="mb-3">
              <label className="form-label">Опис кроку *</label>
              <textarea
                className="form-control"
                rows={3}
                value={step.description}
                onChange={(e) => updateStepDescription(index, e.target.value)}
                placeholder="Опишіть, що потрібно зробити на цьому кроці..."
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Фото або відео (опціонально)</label>
              <input
                type="file"
                className="form-control"
                multiple
                accept="image/*,video/*"
                onChange={(e) => e.target.files && handleMediaUpload(index, e.target.files)}
                disabled={uploadingFiles[index]}
              />
              <div className="form-text">
                Максимум 5 файлів на крок. Зображення будуть автоматично змінені до розміру 800x600px.
              </div>
              
              {uploadingFiles[index] && (
                <div className="mt-2">
                  <div className="spinner-border spinner-border-sm me-2" role="status">
                    <span className="visually-hidden">Завантаження...</span>
                  </div>
                  Завантаження файлів...
                </div>
              )}
            </div>

            {step.media && step.media.length > 0 && (
              <div className="mt-3">
                <h6>Медіа файли:</h6>
                <div className="row g-2">
                  {step.media.map((media, mediaIndex) => (
                    <div key={media.id} className="col-md-3">
                      <div className="position-relative">
                        {media.type === 'image' ? (
                          <img
                            src={media.url}
                            alt={media.alt}
                            className="img-fluid rounded cursor-pointer"
                            style={{ 
                              maxHeight: '150px',         // CRITICAL: Limit height in container
                              objectFit: 'contain',       // NEVER use 'cover' - it crops images!
                              width: '100%',              // Fill container width
                              backgroundColor: '#f8f9fa', // Gray background for transparency
                              cursor: 'pointer'           // Indicate clickable for modal
                            }}
                            onClick={() => setSelectedImage(media.url)} // Open modal with this image
                          />
                        ) : (
                          <video
                            src={media.url}
                            className="img-fluid rounded"
                            style={{ maxHeight: '150px', objectFit: 'cover', width: '100%' }}
                            controls
                          />
                        )}
                        <button
                          type="button"
                          className="btn btn-danger btn-sm position-absolute top-0 end-0 m-1"
                          onClick={() => removeMedia(index, mediaIndex)}
                          title="Видалити медіа"
                        >
                          ✕
                        </button>
                      </div>
                      <small className="text-muted d-block mt-1">
                        {media.filename}
                      </small>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ))}

      {steps.length === 0 && (
        <div className="text-center py-4">
          <p className="text-muted">Поки немає кроків. Додайте перший крок!</p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={addStep}
          >
            Додати перший крок
          </button>
        </div>
      )}

      {/* ================================================================ */}
      {/* MODAL: Image zoom functionality - DO NOT MODIFY STRUCTURE! */}
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

export default StepManager;