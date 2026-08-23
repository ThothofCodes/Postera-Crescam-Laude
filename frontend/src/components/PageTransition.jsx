// Copyright (c) 2026 Thoth of Codes. Licensed under the MIT License.
// PCL — Circuit Canopy Page Transition wrapper
import { useLocation } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';

export default function PageTransition({ children }) {
  const location = useLocation();
  const [displayChildren, setDisplayChildren] = useState(children);
  const [transitionStage, setTransitionStage] = useState('enter');
  const prevPath = useRef(location.pathname);

  useEffect(() => {
    // Only animate if the path actually changed
    if (location.pathname !== prevPath.current) {
      prevPath.current = location.pathname;

      // Start exit animation
      setTransitionStage('exit');

      // After exit, swap content and start enter
      const exitTimer = setTimeout(() => {
        setDisplayChildren(children);
        setTransitionStage('enter');
      }, 200);

      return () => clearTimeout(exitTimer);
    } else {
      // Same path, just update children (e.g. modal content change)
      setDisplayChildren(children);
    }
  }, [location.pathname, children]);

  return (
    <div
      style={{
        opacity: transitionStage === 'exit' ? 0 : 1,
        transform: transitionStage === 'exit' ? 'translateY(8px)' : 'translateY(0)',
        transition: 'opacity 0.25s cubic-bezier(0.16,1,0.3,1), transform 0.25s cubic-bezier(0.16,1,0.3,1)',
      }}
    >
      {displayChildren}
    </div>
  );
}
