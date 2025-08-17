import React, { useEffect, useRef } from 'react';
import '@kitware/vtk.js/Rendering/Profiles/Geometry';
import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkRenderWindow from '@kitware/vtk.js/Rendering/Core/RenderWindow';
import vtkRenderWindowInteractor from '@kitware/vtk.js/Rendering/Core/RenderWindowInteractor';
import vtkRenderer from '@kitware/vtk.js/Rendering/Core/Renderer';
import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';
import vtkXMLPolyDataReader from '@kitware/vtk.js/IO/XML/XMLPolyDataReader';
import vtkCamera from '@kitware/vtk.js/Rendering/Core/Camera';
import vtkOrientationMarkerWidget from '@kitware/vtk.js/Interaction/Widgets/OrientationMarkerWidget';
import vtkAxesActor from '@kitware/vtk.js/Rendering/Core/AxesActor';

interface FourStoreyGeometryProps {
  vtpUrl: string;
}

const FourStoreyGeometry: React.FC<FourStoreyGeometryProps> = ({
  vtpUrl,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const fullScreenRendererRef = useRef<any>(null);
  const rendererRef = useRef<any>(null);
  const renderWindowRef = useRef<any>(null);
  const actorRef = useRef<any>(null);
  const orientationWidgetRef = useRef<any>(null);

  const loadModel = async (url: string) => {
    if (!rendererRef.current || !renderWindowRef.current) return;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const buffer = await response.arrayBuffer();

      const reader = vtkXMLPolyDataReader.newInstance();
      reader.parseAsArrayBuffer(buffer);
      const polydata = reader.getOutputData(0);

      const mapper = vtkMapper.newInstance();
      mapper.setInputData(polydata);
      mapper.setScalarModeToUsePointData();
      mapper.setColorModeToDirectScalars();

      const actor = vtkActor.newInstance();
      actor.setMapper(mapper);
      rendererRef.current.addActor(actor);
      actorRef.current = actor;

      // Get dimensions from bounds
      const bounds = polydata.getBounds();

      // Set up camera
      const camera = rendererRef.current.getActiveCamera();
      const center = [
        (bounds[0] + bounds[1]) / 2,
        (bounds[2] + bounds[3]) / 2,
        (bounds[4] + bounds[5]) / 2
      ];
      const maxDim = Math.max(
        bounds[1] - bounds[0],
        bounds[3] - bounds[2],
        bounds[5] - bounds[4]
      );
      const distance = maxDim * 2;

      // Set camera position and orientation
      camera.set({
        position: [center[0], center[1] - distance, center[2]],
        focalPoint: center,
        viewUp: [0, 0, 1]
      });

      rendererRef.current.resetCamera();
      renderWindowRef.current.render();

      // Add orientation axes after the model is loaded and rendered
      if (!orientationWidgetRef.current) {
        const axes = vtkAxesActor.newInstance();
        const orientationWidget = vtkOrientationMarkerWidget.newInstance({
          actor: axes,
          interactor: renderWindowRef.current.getInteractor(),
        });

        orientationWidget.setEnabled(true);
        orientationWidget.setViewportCorner(
          vtkOrientationMarkerWidget.Corners.BOTTOM_RIGHT
        );
        orientationWidget.setViewportSize(0.15);
        orientationWidget.setMinPixelSize(100);
        orientationWidget.setMaxPixelSize(300);

        orientationWidgetRef.current = orientationWidget;
      }

      // Cleanup
      return () => {
        reader.delete();
        mapper.delete();
        actor.delete();
      };
    } catch (error) {
      console.error('Error loading model:', error);
    }
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Clean up previous renderer if it exists
    if (fullScreenRendererRef.current) {
      fullScreenRendererRef.current.delete();
      fullScreenRendererRef.current = null;
    }

    // Create a new container for VTK
    const vtkContainer = document.createElement('div');
    vtkContainer.style.width = '100%';
    vtkContainer.style.height = '100%';
    container.appendChild(vtkContainer);

    const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
      background: [0.2, 0.2, 0.2],
      container: vtkContainer,
    });
    fullScreenRendererRef.current = fullScreenRenderer;

    const renderer = fullScreenRenderer.getRenderer();
    const renderWindow = fullScreenRenderer.getRenderWindow();

    rendererRef.current = renderer;
    renderWindowRef.current = renderWindow;

    const interactor = renderWindow.getInteractor();
    interactor.initialize();
    interactor.bindEvents(vtkContainer);

    // Initial model load
    loadModel(vtpUrl);

    return () => {
      // Cleanup
      if (orientationWidgetRef.current) {
        orientationWidgetRef.current.delete();
        orientationWidgetRef.current = null;
      }
      if (fullScreenRendererRef.current) {
        fullScreenRendererRef.current.delete();
        fullScreenRendererRef.current = null;
      }
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
      rendererRef.current = null;
      renderWindowRef.current = null;
      actorRef.current = null;
    };
  }, [vtpUrl]);

  return (
    <div 
      key={vtpUrl}
      ref={containerRef} 
      className="w-full h-full bg-canvas-lighter dark:bg-secondary"
      style={{ position: 'relative' }}
    />
  );
};

export default FourStoreyGeometry; 