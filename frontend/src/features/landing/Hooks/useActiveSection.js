import { useEffect, useState } from 'react';

/**
 * Which of the given page sections is currently being read (the one crossing
 * the middle band of the screen). Used by the landing nav to mark its link.
 * @param {string[]} ids Element ids, in page order.
 * @returns {string | null}
 */
export function useActiveSection(ids) {
  const [active, setActive] = useState(null);
  const key = ids.join(',');

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return undefined;
    const visible = new Set();
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => (entry.isIntersecting ? visible.add(entry.target.id) : visible.delete(entry.target.id)));
      setActive(key.split(',').find((id) => visible.has(id)) ?? null);
    }, { rootMargin: '-45% 0px -45% 0px' });
    key.split(',').forEach((id) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });
    return () => observer.disconnect();
  }, [key]);

  return active;
}
