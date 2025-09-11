import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';

const Navigation: React.FC = () => {
  const { isAuthenticated, isAdmin, user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <header>
      <div className="d-flex flex-column flex-md-row align-items-center pb-3 mb-4 border-bottom">
        <Link href="/" className="d-flex align-items-center text-dark text-decoration-none">
          <img src="/favicon.ico" alt="Логотип" width="40" height="40" className="me-2" />
          <span className="fs-4">Кіт Кухар</span>
        </Link>

        <nav className="d-inline-flex mt-2 mt-md-0 ms-md-auto align-items-center">
          <Link 
            href="/" 
            className={`me-3 py-2 text-dark text-decoration-none ${router.pathname === '/' ? 'active' : ''}`}
          >
            Головна
          </Link>
          <Link 
            href="/recipes" 
            className={`me-3 py-2 text-dark text-decoration-none ${router.pathname.startsWith('/recipes') ? 'active' : ''}`}
          >
            Рецепти
          </Link>

          {isAuthenticated && (
            <>
              <Link 
                href="/add-recipe" 
                className={`me-3 py-2 text-dark text-decoration-none ${router.pathname === '/add-recipe' ? 'active' : ''}`}
              >
                Додати рецепт
              </Link>
              
              {isAdmin && (
                <div className="dropdown me-3">
                  <button 
                    className="btn btn-outline-primary dropdown-toggle" 
                    type="button" 
                    data-bs-toggle="dropdown" 
                    aria-expanded="false"
                  >
                    Адмін панель
                  </button>
                  <ul className="dropdown-menu">
                    <li>
                      <Link href="/admin/recipes" className="dropdown-item">
                        Керування рецептами
                      </Link>
                    </li>
                    <li>
                      <Link href="/admin/categories-tags" className="dropdown-item">
                        Категорії та теги
                      </Link>
                    </li>
                    <li><hr className="dropdown-divider" /></li>
                    <li>
                      <Link href="/categories" className="dropdown-item">
                        Переглянути категорії
                      </Link>
                    </li>
                    <li>
                      <Link href="/tags" className="dropdown-item">
                        Переглянути теги
                      </Link>
                    </li>
                  </ul>
                </div>
              )}
            </>
          )}

          {isAuthenticated ? (
            <div className="dropdown">
              <button 
                className="btn btn-outline-secondary dropdown-toggle" 
                type="button" 
                data-bs-toggle="dropdown" 
                aria-expanded="false"
              >
                {user?.username}
                {isAdmin && <span className="badge bg-warning text-dark ms-1">Адмін</span>}
              </button>
              <ul className="dropdown-menu">
                <li>
                  <button className="dropdown-item" onClick={handleLogout}>
                    Вийти
                  </button>
                </li>
              </ul>
            </div>
          ) : (
            <>
              <Link 
                href="/login" 
                className={`me-3 py-2 text-dark text-decoration-none ${router.pathname === '/login' ? 'active' : ''}`}
              >
                Вхід
              </Link>
              <Link 
                href="/register" 
                className={`btn btn-outline-primary ${router.pathname === '/register' ? 'active' : ''}`}
              >
                Реєстрація
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Navigation;