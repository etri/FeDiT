import React, { useEffect, useRef } from 'react';
import { Viewer } from '../viewer/viewer';
import '../styles/viewer.css';

interface ViewerComponentProps {
  onReady?: (viewer: Viewer) => void;
}

const ViewerComponent: React.FC<ViewerComponentProps> = ({ onReady }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Viewer | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    let animationId: number;

    // Small delay to ensure DOM is ready
    const initTimeout = setTimeout(() => {
      if (!containerRef.current) return;

      // Debug: Check container dimensions
      console.log('Container dimensions:', {
        width: containerRef.current.clientWidth,
        height: containerRef.current.clientHeight,
        offsetWidth: containerRef.current.offsetWidth,
        offsetHeight: containerRef.current.offsetHeight
      });

      let viewer: Viewer;

      try {
        // Initialize viewer (원본 프로젝트처럼 container만 전달)
        viewer = new Viewer(containerRef.current);
        console.log('Viewer initialized successfully');

        // Debug: Check if canvas was created
        const canvas = containerRef.current.querySelector('canvas');
        console.log('Canvas element:', canvas);
        if (canvas) {
          console.log('Canvas dimensions:', {
            width: canvas.width,
            height: canvas.height,
            clientWidth: canvas.clientWidth,
            clientHeight: canvas.clientHeight
          });
        }

        viewerRef.current = viewer;

        // Remove sample geometry code - tank will be handled by WorkbenchPage
        // The tank rendering is now controlled by WorkbenchPage based on project settings

      } catch (error) {
        console.error('Viewer initialization failed:', error);
        return;
      }

      // Initial resize to ensure proper dimensions
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      if (width > 0 && height > 0) {
        viewer.resize(width, height);
      }

      // Animation loop (원본 프로젝트처럼 update 호출)
      const animate = () => {
        animationId = requestAnimationFrame(animate);
        viewer.update();
      };
      animate();

      // Notify parent component when ready
      if (onReady) {
        onReady(viewer);
      }
    }, 100); // 100ms delay like original project

    // Handle window resize
    const handleResize = () => {
      if (viewerRef.current && containerRef.current) {
        const width = containerRef.current.clientWidth;
        const height = containerRef.current.clientHeight;
        if (width > 0 && height > 0) {
          viewerRef.current.resize(width, height);
        }
      }
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      clearTimeout(initTimeout);
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
      window.removeEventListener('resize', handleResize);
      if (viewerRef.current) {
        viewerRef.current.dispose();
      }
    };
  }, []); // onReady를 dependency에서 제거 - 컴포넌트 마운트 시 한 번만 실행

  return (
    <div 
      ref={containerRef} 
      className="viewer-container"
    />
  );
};

export default ViewerComponent;