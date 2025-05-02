// utils.js

/**
 * Crea y devuelve una versión “debounced” de la función `func`,
 * que retrasa su ejecución hasta que hayan pasado `wait` milisegundos
 * desde la última invocación.
 * 
 * @param {Function} func      — La función a “debouncear”
 * @param {number}   wait      — Tiempo de espera en ms (default: 300)
 * @param {boolean}  immediate — Si es true, llama a func inmediatamente
 *                               en la primera llamada y luego bloquea
 * @returns {Function}         — Función envuelta con debounce
 */
export function debounce(func, wait = 300, immediate = false) {
    let timeoutId;
  
    return function debounced(...args) {
      const context = this;
  
      const later = () => {
        timeoutId = null;
        if (!immediate) {
          func.apply(context, args);
        }
      };
  
      const callNow = immediate && !timeoutId;
  
      clearTimeout(timeoutId);
      timeoutId = setTimeout(later, wait);
  
      if (callNow) {
        func.apply(context, args);
      }
    };
  }
  