import vtk
import numpy as np
import os
from typing import List, Tuple, Optional

class VTKFrameCapture:
    def __init__(self, width: int = 1920, height: int = 1080, background: Tuple[float, float, float] = (0.2, 0.2, 0.2)):
        """
        Initialize VTK rendering pipeline for server-side frame capture.
        
        Args:
            width: Render window width
            height: Render window height  
            background: RGB background color (0-1 range)
        """
        self.width = width
        self.height = height
        
        # Create rendering components
        self.renderer = vtk.vtkRenderer()
        self.renderer.SetBackground(*background)
        
        self.render_window = vtk.vtkRenderWindow()
        self.render_window.SetOffScreenRendering(True)  # Critical for server-side rendering
        self.render_window.SetSize(width, height)
        self.render_window.AddRenderer(self.renderer)
        
        # Window to image filter for capturing frames
        self.window_to_image = vtk.vtkWindowToImageFilter()
        self.window_to_image.SetInput(self.render_window)
        self.window_to_image.SetInputBufferTypeToRGB()
        self.window_to_image.ReadFrontBufferOff()  # Use back buffer for stability
        
        # PNG writer for saving frames
        self.png_writer = vtk.vtkPNGWriter()
        self.png_writer.SetInputConnection(self.window_to_image.GetOutputPort())
        
        self.actor = None
        self.model_bounds = None

    def load_vtp_model(self, vtp_path: str) -> bool:
        """
        Load a VTP (VTK PolyData) file and set up the actor.
        
        Args:
            vtp_path: Path to the .vtp file
            
        Returns:
            True if successful, False otherwise
        """
        try:
            # Read VTP file
            reader = vtk.vtkXMLPolyDataReader()
            reader.SetFileName(vtp_path)
            reader.Update()
            
            polydata = reader.GetOutput()
            if polydata.GetNumberOfPoints() == 0:
                print(f"Warning: No points found in {vtp_path}")
                return False
            
            # Create mapper
            mapper = vtk.vtkPolyDataMapper()
            mapper.SetInputData(polydata)
            mapper.SetScalarModeToUsePointData()
            mapper.SetColorModeToDirectScalars()
            
            # Create actor
            self.actor = vtk.vtkActor()
            self.actor.SetMapper(mapper)
            
            # Add to renderer
            self.renderer.AddActor(self.actor)
            
            # Store bounds for camera positioning
            self.model_bounds = polydata.GetBounds()
            
            return True
            
        except Exception as e:
            print(f"Error loading VTP file: {e}")
            return False

    def _get_model_info(self) -> Tuple[List[float], float]:
        """Get model center and maximum dimension."""
        if not self.model_bounds:
            raise ValueError("No model loaded")
            
        center = [
            (self.model_bounds[0] + self.model_bounds[1]) / 2,
            (self.model_bounds[2] + self.model_bounds[3]) / 2,
            (self.model_bounds[4] + self.model_bounds[5]) / 2
        ]
        
        max_dim = max(
            self.model_bounds[1] - self.model_bounds[0],
            self.model_bounds[3] - self.model_bounds[2],
            self.model_bounds[5] - self.model_bounds[4]
        )
        
        return center, max_dim

    def _setup_camera_view(self, position: List[float], focal_point: List[float], view_up: List[float]):
        """Configure camera for a specific view."""
        camera = self.renderer.GetActiveCamera()
        camera.SetPosition(*position)
        camera.SetFocalPoint(*focal_point)
        camera.SetViewUp(*view_up)
        self.renderer.ResetCameraClippingRange()

    def generate_camera_views(self) -> List[dict]:
        """
        Generate camera views similar to the JavaScript version.
        
        Returns:
            List of camera view dictionaries with position, focal_point, and view_up
        """
        if not self.model_bounds:
            raise ValueError("No model loaded")
            
        # Reset camera to get base view
        self.renderer.ResetCamera()
        camera = self.renderer.GetActiveCamera()
        
        center, max_dim = self._get_model_info()
        distance = max_dim * 2
        
        # Get base camera orientation
        base_focal_point = list(camera.GetFocalPoint())
        base_position = list(camera.GetPosition())
        base_view_up = list(camera.GetViewUp())
        
        # Calculate orthogonal directions
        view_direction = np.array(base_position) - np.array(base_focal_point)
        view_direction = view_direction / np.linalg.norm(view_direction)
        
        right_direction = np.cross(view_direction, base_view_up)
        right_direction = right_direction / np.linalg.norm(right_direction)
        
        actual_up_direction = np.cross(right_direction, view_direction)
        actual_up_direction = actual_up_direction / np.linalg.norm(actual_up_direction)
        
        focal_point = base_focal_point
        
        views = [
            {  # 1. Front-ish (original)
                'position': base_position,
                'focal_point': focal_point,
                'view_up': actual_up_direction.tolist(),
                'name': 'front'
            },
            {  # 2. Diagonal: Back-Top-Right
                'position': (np.array(focal_point) + 
                           distance * (-view_direction + actual_up_direction + right_direction) / 
                           np.linalg.norm(-view_direction + actual_up_direction + right_direction)).tolist(),
                'focal_point': focal_point,
                'view_up': actual_up_direction.tolist(),
                'name': 'back_top_right'
            },
            {  # 3. Left-ish
                'position': (np.array(focal_point) - distance * right_direction).tolist(),
                'focal_point': focal_point,
                'view_up': actual_up_direction.tolist(),
                'name': 'left'
            },
            {  # 4. Diagonal: Front-Bottom-Left
                'position': (np.array(focal_point) + 
                           distance * (view_direction - actual_up_direction - right_direction) / 
                           np.linalg.norm(view_direction - actual_up_direction - right_direction)).tolist(),
                'focal_point': focal_point,
                'view_up': actual_up_direction.tolist(),
                'name': 'front_bottom_left'
            },
            {  # 5. Diagonal: Back-Bottom-Left
                'position': (np.array(focal_point) + 
                           distance * (-view_direction - actual_up_direction - right_direction) / 
                           np.linalg.norm(-view_direction - actual_up_direction - right_direction)).tolist(),
                'focal_point': focal_point,
                'view_up': actual_up_direction.tolist(),
                'name': 'back_bottom_left'
            },
            {  # 6. Bottom-ish
                'position': (np.array(focal_point) - distance * actual_up_direction).tolist(),
                'focal_point': focal_point,
                'view_up': (-view_direction).tolist(),
                'name': 'bottom'
            }
        ]
        
        return views

    def capture_frames(self, output_dir: str = "frames", filename_prefix: str = "frame") -> List[str]:
        """
        Capture frames from multiple camera views.
        
        Args:
            output_dir: Directory to save frames
            filename_prefix: Prefix for frame filenames
            
        Returns:
            List of saved frame file paths
        """
        if not self.actor:
            raise ValueError("No model loaded")
            
        # Create output directory
        os.makedirs(output_dir, exist_ok=True)
        
        views = self.generate_camera_views()
        saved_files = []
        
        for i, view in enumerate(views):
            try:
                # Set up camera for this view
                self._setup_camera_view(
                    view['position'], 
                    view['focal_point'], 
                    view['view_up']
                )
                
                # Render
                self.render_window.Render()
                
                # Capture frame
                self.window_to_image.Modified()  # Force update
                
                # Save frame
                filename = f"{filename_prefix}_{i+1}_{view['name']}.png"
                filepath = os.path.join(output_dir, filename)
                self.png_writer.SetFileName(filepath)
                self.png_writer.Write()
                
                saved_files.append(filepath)
                print(f"Saved frame {i+1}: {filepath}")
                
            except Exception as e:
                print(f"Error capturing frame {i+1}: {e}")
                continue
                
        return saved_files

    def cleanup(self):
        """Clean up VTK objects."""
        if self.actor:
            self.renderer.RemoveActor(self.actor)
        self.render_window.Finalize()

# Example usage
def main():
    import argparse
    
    parser = argparse.ArgumentParser(description="Capture frames from VTP file")
    parser.add_argument("vtp_file", help="Path to the VTP file")
    parser.add_argument("--output-dir", default="output_frames", help="Output directory for frames")
    parser.add_argument("--width", type=int, default=1920, help="Frame width")
    parser.add_argument("--height", type=int, default=1080, help="Frame height")
    
    args = parser.parse_args()
    
    # Initialize the frame capture system
    capture = VTKFrameCapture(width=args.width, height=args.height)
    
    # Load VTP model
    if not capture.load_vtp_model(args.vtp_file):
        print("Failed to load VTP model")
        return
    
    # Capture frames
    try:
        saved_files = capture.capture_frames(output_dir=args.output_dir)
        print(f"Successfully captured {len(saved_files)} frames")
        for file in saved_files:
            print(f"  - {file}")
    except Exception as e:
        print(f"Error during frame capture: {e}")
    finally:
        capture.cleanup()

if __name__ == "__main__":
    main()

