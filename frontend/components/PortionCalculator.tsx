// ============================================================================
// PORTION CALCULATOR COMPONENT - Interactive ingredient quantity calculator
// ============================================================================
//
// IMPORTANT: This component allows users to adjust recipe servings dynamically
// 
// Key features:
// 1. Adjusts ingredient quantities based on desired servings
// 2. Maintains original recipe proportions
// 3. Formats numbers nicely (removes unnecessary decimals)
// 4. Provides intuitive UI with +/- buttons and direct input
//
// CALCULATION LOGIC:
// newQuantity = (originalQuantity / originalServings) * desiredServings
//
import React, { useState } from 'react';
import { Ingredient } from '@/types';

interface PortionCalculatorProps {
  originalServings: number;
  ingredients: Ingredient[];
  onServingsChange?: (newServings: number) => void; // Optional callback
}

// ============================================================================
// PORTION CALCULATOR - Calculates ingredient quantities for different servings
// ============================================================================
const PortionCalculator: React.FC<PortionCalculatorProps> = ({ 
  originalServings, 
  ingredients,
  onServingsChange 
}) => {
  const [currentServings, setCurrentServings] = useState<number>(originalServings);

  // ========================================================================
  // CALCULATION UTILITIES - Handle portion math and formatting
  // ========================================================================
  
  // Calculate new quantity based on serving ratio
  const calculateQuantity = (originalQuantity: number): number => {
    const ratio = currentServings / originalServings;
    return originalQuantity * ratio;
  };

  // Format quantity to remove unnecessary decimals
  const formatQuantity = (quantity: number): string => {
    // Round to 2 decimal places to avoid floating point errors
    const rounded = Math.round(quantity * 100) / 100;
    
    // If it's a whole number, show as integer
    if (rounded === Math.floor(rounded)) {
      return rounded.toString();
    }
    
    // If it has decimals, show up to 2 decimal places, removing trailing zeros
    return rounded.toFixed(2).replace(/\.?0+$/, '');
  };

  // ========================================================================
  // EVENT HANDLERS - Manage serving changes
  // ========================================================================
  
  const handleServingsChange = (newServings: number) => {
    // Ensure minimum of 1 serving
    const servings = Math.max(1, newServings);
    setCurrentServings(servings);
    
    // Call optional callback
    if (onServingsChange) {
      onServingsChange(servings);
    }
  };

  const incrementServings = () => {
    handleServingsChange(currentServings + 1);
  };

  const decrementServings = () => {
    handleServingsChange(currentServings - 1);
  };

  const handleDirectInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value > 0) {
      handleServingsChange(value);
    }
  };

  return (
    <div className="portion-calculator">
      {/* ================================================================ */}
      {/* SERVING CONTROL - Interactive serving adjustment */}
      {/* ================================================================ */}
      <div className="card mb-4">
        <div className="card-header bg-primary text-white">
          <h5 className="mb-0">
            <i className="bi bi-calculator me-2"></i>
            Калькулятор порцій
          </h5>
        </div>
        <div className="card-body">
          <div className="row align-items-center">
            <div className="col-md-6">
              <div className="d-flex align-items-center justify-content-center">
                <button 
                  className="btn btn-outline-primary btn-sm me-2"
                  onClick={decrementServings}
                  disabled={currentServings <= 1}
                  title="Зменшити кількість порцій"
                >
                  <i className="bi bi-dash"></i>
                </button>
                
                <div className="text-center mx-3">
                  <label htmlFor="servings-input" className="form-label small text-muted mb-1">
                    Кількість порцій
                  </label>
                  <input 
                    id="servings-input"
                    type="number" 
                    className="form-control text-center fw-bold"
                    style={{ width: '80px' }}
                    value={currentServings}
                    onChange={handleDirectInput}
                    min="1"
                    max="100"
                  />
                </div>
                
                <button 
                  className="btn btn-outline-primary btn-sm ms-2"
                  onClick={incrementServings}
                  title="Збільшити кількість порцій"
                >
                  <i className="bi bi-plus"></i>
                </button>
              </div>
            </div>
            
            <div className="col-md-6 text-md-end mt-3 mt-md-0">
              <small className="text-muted">
                {currentServings === originalServings ? (
                  <>
                    <i className="bi bi-info-circle me-1"></i>
                    Оригінальна кількість порцій
                  </>
                ) : (
                  <>
                    <i className="bi bi-arrow-left-right me-1"></i>
                    Збільшено в {(currentServings / originalServings).toFixed(1)}x
                  </>
                )}
              </small>
            </div>
          </div>
        </div>
      </div>

      {/* ================================================================ */}
      {/* INGREDIENTS LIST - Calculated quantities */}
      {/* ================================================================ */}
      <div className="ingredients-list">
        <h4 className="mb-3">
          <i className="bi bi-list-check me-2"></i>
          Інгредієнти для {currentServings} {currentServings === 1 ? 'порції' : 'порцій'}
        </h4>
        
        <ul className="list-unstyled">
          {ingredients.map((ingredient, index) => {
            const calculatedQuantity = calculateQuantity(ingredient.quantity);
            
            return (
              <li key={index} className="mb-2 d-flex align-items-center">
                <i className="bi bi-check-circle-fill text-success me-3"></i>
                
                <div className="flex-grow-1">
                  <span className="fw-semibold text-primary">
                    {formatQuantity(calculatedQuantity)} {ingredient.unit}
                  </span>
                  <span className="ms-2">{ingredient.name}</span>
                  
                  {/* Show original quantity if different */}
                  {currentServings !== originalServings && (
                    <small className="text-muted ms-2">
                      (оригінал: {formatQuantity(ingredient.quantity)} {ingredient.unit})
                    </small>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

export default PortionCalculator;