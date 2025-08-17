"""
DXF Geometry Descriptor
Reads DXF files using ezdxf library and generates descriptive text about the geometry
for use with LLMs and FreeCAD code generation.
"""

import sys
import ezdxf
from typing import List, Dict, Any, Tuple, Optional
import math
from collections import defaultdict


class DXFGeometryDescriptor:
    """Extract and describe geometry from DXF files."""
    
    def __init__(self, dxf_file_path: str, geometry_only: bool = True, exclude_layers: Optional[List[str]] = None):
        """Initialize with DXF file path and filtering options."""
        self.dxf_file_path = dxf_file_path
        self.geometry_only = geometry_only
        self.exclude_layers = exclude_layers or []
        self.doc = None
        
        # Define which entity types are considered pure geometry
        self.geometry_entities = {
            'LINE', 'CIRCLE', 'ARC', 'POLYLINE', 'LWPOLYLINE', 
            'SPLINE', 'ELLIPSE', '3DFACE', 'SOLID', 'REGION'
        }
        
        # Define which entity types to exclude when geometry_only=True
        self.non_geometry_entities = {
            'TEXT', 'MTEXT', 'DIMENSION', 'LEADER', 'MULTILEADER',
            'HATCH', 'POINT', 'XLINE', 'RAY', 'TOLERANCE',
            'ATTRIB', 'ATTDEF', 'VIEWPORT', 'IMAGE'
        }
        
        # Common layer names that often contain non-geometric data
        self.common_non_geometry_layers = {
            'dimensions', 'text', 'notes', 'labels', 'annotations',
            'hatching', 'fills', 'symbols', 'title', 'border',
            'viewport', 'defpoints', '0'  # Layer 0 often contains construction geometry
        }
        
        self.load_document()
    
    def load_document(self) -> None:
        """Load the DXF document."""
        try:
            self.doc = ezdxf.readfile(self.dxf_file_path)
            print(f"Successfully loaded DXF file: {self.dxf_file_path}")
        except IOError:
            print(f"Error: Not a DXF file or generic I/O error for {self.dxf_file_path}")
            sys.exit(1)
        except ezdxf.DXFStructureError:
            print(f"Error: Invalid or corrupted DXF file: {self.dxf_file_path}")
            sys.exit(2)
    
    def describe_point(self, point: Tuple[float, float, float]) -> str:
        """Format a 3D point for description."""
        return f"({point[0]:.3f}, {point[1]:.3f}, {point[2]:.3f})"
    
    def describe_line(self, entity) -> str:
        """Describe a LINE entity."""
        start = entity.dxf.start
        end = entity.dxf.end
        length = math.sqrt(sum((end[i] - start[i])**2 for i in range(3)))
        
        description = f"Line from {self.describe_point(start)} to {self.describe_point(end)}"
        description += f" with length {length:.3f}"
        
        if hasattr(entity.dxf, 'layer'):
            description += f" on layer '{entity.dxf.layer}'"
        
        return description
    
    def describe_circle(self, entity) -> str:
        """Describe a CIRCLE entity."""
        center = entity.dxf.center
        radius = entity.dxf.radius
        
        description = f"Circle centered at {self.describe_point(center)} with radius {radius:.3f}"
        
        if hasattr(entity.dxf, 'layer'):
            description += f" on layer '{entity.dxf.layer}'"
        
        return description
    
    def describe_arc(self, entity) -> str:
        """Describe an ARC entity."""
        center = entity.dxf.center
        radius = entity.dxf.radius
        start_angle = entity.dxf.start_angle
        end_angle = entity.dxf.end_angle
        
        description = f"Arc centered at {self.describe_point(center)} with radius {radius:.3f}"
        description += f" from {start_angle:.1f}° to {end_angle:.1f}°"
        
        if hasattr(entity.dxf, 'layer'):
            description += f" on layer '{entity.dxf.layer}'"
        
        return description
    
    def describe_polyline(self, entity) -> str:
        """Describe a POLYLINE or LWPOLYLINE entity."""
        points = []
        
        if entity.dxftype() == "POLYLINE":
            # Get vertices from POLYLINE
            vertices = entity.vertices
            points = [vertex.dxf.location for vertex in vertices]
        elif entity.dxftype() == "LWPOLYLINE":
            # Get points from LWPOLYLINE
            points = list(entity.get_points())
        
        is_closed = entity.is_closed if hasattr(entity, 'is_closed') else False
        
        description = f"{'Closed polygon' if is_closed else 'Polyline'} with {len(points)} points:"
        for i, point in enumerate(points):
            if len(point) == 2:  # 2D point
                point = (point[0], point[1], 0.0)
            description += f"\n  Point {i+1}: {self.describe_point(point)}"
        
        if hasattr(entity.dxf, 'layer'):
            description += f"\n  On layer '{entity.dxf.layer}'"
        
        return description
    
    def describe_spline(self, entity) -> str:
        """Describe a SPLINE entity."""
        degree = entity.dxf.degree
        control_points = entity.control_points
        
        description = f"Spline of degree {degree} with {len(control_points)} control points:"
        for i, point in enumerate(control_points):
            description += f"\n  Control point {i+1}: {self.describe_point(point)}"
        
        if hasattr(entity.dxf, 'layer'):
            description += f"\n  On layer '{entity.dxf.layer}'"
        
        return description
    
    def describe_ellipse(self, entity) -> str:
        """Describe an ELLIPSE entity."""
        center = entity.dxf.center
        major_axis = entity.dxf.major_axis
        ratio = entity.dxf.ratio
        
        description = f"Ellipse centered at {self.describe_point(center)}"
        description += f" with major axis length {math.sqrt(sum(x**2 for x in major_axis)):.3f}"
        description += f" and ratio {ratio:.3f}"
        
        if hasattr(entity.dxf, 'layer'):
            description += f" on layer '{entity.dxf.layer}'"
        
        return description
    
    def describe_text(self, entity) -> str:
        """Describe a TEXT entity."""
        text_content = entity.dxf.text
        insert_point = entity.dxf.insert
        height = entity.dxf.height
        
        description = f"Text '{text_content}' at {self.describe_point(insert_point)}"
        description += f" with height {height:.3f}"
        
        if hasattr(entity.dxf, 'layer'):
            description += f" on layer '{entity.dxf.layer}'"
        
        return description
    
    def describe_insert(self, entity) -> str:
        """Describe an INSERT (block reference) entity."""
        block_name = entity.dxf.name
        insert_point = entity.dxf.insert
        
        description = f"Block reference '{block_name}' inserted at {self.describe_point(insert_point)}"
        
        if hasattr(entity.dxf, 'xscale'):
            description += f" with scale ({entity.dxf.xscale:.3f}, {entity.dxf.yscale:.3f}, {entity.dxf.zscale:.3f})"
        
        if hasattr(entity.dxf, 'rotation'):
            description += f" rotated {entity.dxf.rotation:.1f}°"
        
        if hasattr(entity.dxf, 'layer'):
            description += f" on layer '{entity.dxf.layer}'"
        
        return description
    
    def describe_entity(self, entity) -> str:
        """Describe any DXF entity."""
        entity_type = entity.dxftype()
        
        if entity_type == "LINE":
            return self.describe_line(entity)
        elif entity_type == "CIRCLE":
            return self.describe_circle(entity)
        elif entity_type == "ARC":
            return self.describe_arc(entity)
        elif entity_type in ["POLYLINE", "LWPOLYLINE"]:
            return self.describe_polyline(entity)
        elif entity_type == "SPLINE":
            return self.describe_spline(entity)
        elif entity_type == "ELLIPSE":
            return self.describe_ellipse(entity)
        elif entity_type == "TEXT":
            return self.describe_text(entity)
        elif entity_type == "INSERT":
            return self.describe_insert(entity)
        else:
            # Generic description for unsupported entities
            description = f"{entity_type} entity"
            if hasattr(entity.dxf, 'layer'):
                description += f" on layer '{entity.dxf.layer}'"
            return description
    
    def is_geometry_entity(self, entity) -> bool:
        """Check if entity represents actual geometry."""
        entity_type = entity.dxftype()
        
        # Filter by entity type
        if self.geometry_only and entity_type in self.non_geometry_entities:
            return False
        
        # Filter by layer
        layer = getattr(entity.dxf, 'layer', '').lower()
        if layer in [l.lower() for l in self.exclude_layers]:
            return False
        
        # Filter common non-geometry layers when geometry_only=True
        if self.geometry_only and layer in self.common_non_geometry_layers:
            return False
        
        return True
    
    def filter_entities(self, entities) -> List:
        """Filter entities to keep only geometry-relevant ones."""
        return [entity for entity in entities if self.is_geometry_entity(entity)]
    
    def group_similar_entities(self, entities) -> Dict[str, List]:
        """Group similar entities together for more concise description."""
        groups = defaultdict(list)
        
        for entity in entities:
            entity_type = entity.dxftype()
            layer = getattr(entity.dxf, 'layer', 'Unknown')
            
            # Group by entity type and layer
            key = f"{entity_type}_{layer}"
            groups[key].append(entity)
        
        return dict(groups)
    
    def describe_entity_group(self, entity_type: str, layer: str, entities: List) -> str:
        """Describe a group of similar entities concisely."""
        count = len(entities)
        base_type = entity_type.split('_')[0]
        
        if base_type == "LINE":
            return self.describe_line_group(entities, layer, count)
        elif base_type == "CIRCLE":
            return self.describe_circle_group(entities, layer, count)
        elif base_type == "ARC":
            return self.describe_arc_group(entities, layer, count)
        elif base_type in ["POLYLINE", "LWPOLYLINE"]:
            return self.describe_polyline_group(entities, layer, count)
        else:
            return f"{count} {base_type} entities on layer '{layer}'"
    
    def describe_line_group(self, entities: List, layer: str, count: int) -> str:
        """Describe a group of lines concisely."""
        if count == 1:
            return self.describe_line(entities[0])
        
        # Calculate total length and identify patterns
        total_length = 0
        lengths = []
        for entity in entities:
            start, end = entity.dxf.start, entity.dxf.end
            length = math.sqrt(sum((end[i] - start[i])**2 for i in range(3)))
            total_length += length
            lengths.append(length)
        
        avg_length = total_length / count
        
        description = f"{count} lines on layer '{layer}'"
        description += f" (total length: {total_length:.3f}, average: {avg_length:.3f})"
        
        # Check if they might form a connected path
        endpoints = set()
        for entity in entities:
            start = tuple(round(x, 3) for x in entity.dxf.start)
            end = tuple(round(x, 3) for x in entity.dxf.end)
            endpoints.add(start)
            endpoints.add(end)
        
        if len(endpoints) < len(entities) + 1:
            description += " - likely forming connected segments"
        
        return description
    
    def describe_circle_group(self, entities: List, layer: str, count: int) -> str:
        """Describe a group of circles concisely."""
        if count == 1:
            return self.describe_circle(entities[0])
        
        radii = [entity.dxf.radius for entity in entities]
        unique_radii = list(set(round(r, 3) for r in radii))
        
        description = f"{count} circles on layer '{layer}'"
        if len(unique_radii) == 1:
            description += f" (all with radius {unique_radii[0]:.3f})"
        else:
            description += f" (radii: {min(radii):.3f} to {max(radii):.3f})"
        
        return description
    
    def describe_arc_group(self, entities: List, layer: str, count: int) -> str:
        """Describe a group of arcs concisely."""
        if count == 1:
            return self.describe_arc(entities[0])
        
        radii = [entity.dxf.radius for entity in entities]
        description = f"{count} arcs on layer '{layer}'"
        description += f" (radii: {min(radii):.3f} to {max(radii):.3f})"
        
        return description
    
    def describe_polyline_group(self, entities: List, layer: str, count: int) -> str:
        """Describe a group of polylines concisely."""
        if count == 1:
            return self.describe_polyline(entities[0])
        
        total_vertices = 0
        closed_count = 0
        
        for entity in entities:
            if entity.dxftype() == "POLYLINE":
                total_vertices += len(list(entity.vertices))
            else:  # LWPOLYLINE
                total_vertices += len(list(entity.get_points()))
            
            if hasattr(entity, 'is_closed') and entity.is_closed:
                closed_count += 1
        
        description = f"{count} polylines on layer '{layer}'"
        description += f" ({closed_count} closed, {count - closed_count} open)"
        description += f" with total of {total_vertices} vertices"
        
        return description
    
    def get_layer_statistics(self, entities) -> Dict[str, int]:
        """Get statistics about entities per layer."""
        layer_stats = defaultdict(int)
        for entity in entities:
            layer = getattr(entity.dxf, 'layer', 'Unknown')
            layer_stats[layer] += 1
        return dict(layer_stats)
    
    def get_entity_type_statistics(self, entities) -> Dict[str, int]:
        """Get statistics about entity types."""
        type_stats = defaultdict(int)
        for entity in entities:
            type_stats[entity.dxftype()] += 1
        return dict(type_stats)
    
    def get_bounding_box(self, entities) -> Tuple[Tuple[float, float, float], Tuple[float, float, float]]:
        """Calculate bounding box of all entities."""
        if not entities:
            return ((0.0, 0.0, 0.0), (0.0, 0.0, 0.0))
        
        min_x = min_y = min_z = float('inf')
        max_x = max_y = max_z = float('-inf')
        
        for entity in entities:
            points = []
            
            if entity.dxftype() == "LINE":
                points = [entity.dxf.start, entity.dxf.end]
            elif entity.dxftype() == "CIRCLE":
                center = entity.dxf.center
                radius = entity.dxf.radius
                points = [
                    (center[0] - radius, center[1] - radius, center[2]),
                    (center[0] + radius, center[1] + radius, center[2])
                ]
            elif entity.dxftype() == "ARC":
                # Simplified bounding box for arc (could be more precise)
                center = entity.dxf.center
                radius = entity.dxf.radius
                points = [
                    (center[0] - radius, center[1] - radius, center[2]),
                    (center[0] + radius, center[1] + radius, center[2])
                ]
            elif entity.dxftype() == "ELLIPSE":
                # Simplified bounding box for ellipse
                center = entity.dxf.center
                major_axis = entity.dxf.major_axis
                major_length = math.sqrt(sum(x**2 for x in major_axis))
                minor_length = major_length * entity.dxf.ratio
                points = [
                    (center[0] - major_length, center[1] - minor_length, center[2]),
                    (center[0] + major_length, center[1] + minor_length, center[2])
                ]
            elif entity.dxftype() in ["POLYLINE", "LWPOLYLINE"]:
                if entity.dxftype() == "POLYLINE":
                    points = [vertex.dxf.location for vertex in entity.vertices]
                else:
                    points = [(p[0], p[1], 0.0) if len(p) == 2 else p for p in entity.get_points()]
            elif entity.dxftype() == "SPLINE":
                points = entity.control_points
            elif entity.dxftype() == "TEXT":
                points = [entity.dxf.insert]
            elif entity.dxftype() == "INSERT":
                points = [entity.dxf.insert]
            
            for point in points:
                min_x = min(min_x, point[0])
                min_y = min(min_y, point[1])
                min_z = min(min_z, point[2])
                max_x = max(max_x, point[0])
                max_y = max(max_y, point[1])
                max_z = max(max_z, point[2])
        
        return ((min_x, min_y, min_z), (max_x, max_y, max_z))
    
    def generate_description(self, concise: bool = True) -> str:
        """Generate complete textual description of the DXF geometry."""
        if not self.doc:
            return "Error: No DXF document loaded."
        
        # Get modelspace (main drawing area)
        msp = self.doc.modelspace()
        all_entities = list(msp)
        
        if not all_entities:
            return "The DXF file contains no entities in modelspace."
        
        # Filter entities if geometry_only is enabled
        entities = self.filter_entities(all_entities) if self.geometry_only else all_entities
        
        if not entities:
            return "No geometry entities found after filtering."
        
        description = []
        description.append("=== DXF GEOMETRY DESCRIPTION ===\n")
        
        # File information
        description.append(f"Source file: {self.dxf_file_path}")
        if self.geometry_only:
            description.append(f"Filtered entities: {len(entities)} geometry entities (from {len(all_entities)} total)")
        else:
            description.append(f"Total entities: {len(entities)}")
        
        # Statistics
        type_stats = self.get_entity_type_statistics(entities)
        layer_stats = self.get_layer_statistics(entities)
        
        description.append(f"\n=== GEOMETRY SUMMARY ===")
        for entity_type, count in sorted(type_stats.items()):
            description.append(f"{entity_type}: {count}")
        
        # Show filtered layers info
        if self.geometry_only:
            filtered_layers = set()
            for entity in all_entities:
                if not self.is_geometry_entity(entity):
                    layer = getattr(entity.dxf, 'layer', 'Unknown')
                    filtered_layers.add(layer)
            
            if filtered_layers:
                description.append(f"\n=== FILTERED OUT LAYERS ===")
                for layer in sorted(filtered_layers):
                    description.append(f"Layer '{layer}' (non-geometry)")
        
        description.append(f"\n=== ACTIVE LAYERS ===")
        for layer, count in sorted(layer_stats.items()):
            description.append(f"Layer '{layer}': {count} entities")
        
        # Bounding box
        try:
            min_point, max_point = self.get_bounding_box(entities)
            description.append(f"\n=== BOUNDING BOX ===")
            description.append(f"Minimum: {self.describe_point(min_point)}")
            description.append(f"Maximum: {self.describe_point(max_point)}")
            dimensions = (max_point[0] - min_point[0], 
                         max_point[1] - min_point[1], 
                         max_point[2] - min_point[2])
            description.append(f"Dimensions: {dimensions[0]:.3f} × {dimensions[1]:.3f} × {dimensions[2]:.3f}")
        except Exception as e:
            description.append(f"\n=== BOUNDING BOX ===")
            description.append(f"Could not calculate bounding box: {e}")
        
        # Entity descriptions
        if concise and len(entities) > 20:
            # Group similar entities for concise description
            description.append(f"\n=== GEOMETRY GROUPS (CONCISE) ===")
            groups = self.group_similar_entities(entities)
            
            for group_key, group_entities in groups.items():
                entity_type, layer = group_key.rsplit('_', 1)
                group_desc = self.describe_entity_group(entity_type, layer, group_entities)
                description.append(f"• {group_desc}")
        else:
            # Detailed individual entity descriptions
            description.append(f"\n=== DETAILED ENTITY DESCRIPTIONS ===")
            for i, entity in enumerate(entities, 1):
                entity_desc = self.describe_entity(entity)
                description.append(f"{i}. {entity_desc}")
        
        # CAD reconstruction summary
        description.append(f"\n=== CAD RECONSTRUCTION SUMMARY ===")
        description.append("Geometric elements for FreeCAD reconstruction:")
        
        for entity_type, count in sorted(type_stats.items()):
            if entity_type == "LINE":
                description.append(f"• {count} line segments → Draft.makeLine() or Part.makeLine()")
            elif entity_type == "CIRCLE":
                description.append(f"• {count} circles → Part.makeCircle()")
            elif entity_type == "ARC":
                description.append(f"• {count} arcs → Part.makeCircle() with angle limits")
            elif entity_type in ["POLYLINE", "LWPOLYLINE"]:
                description.append(f"• {count} polylines → Draft.makeWire() or Part.makePolygon()")
            elif entity_type == "SPLINE":
                description.append(f"• {count} splines → Part.BSplineCurve()")
            elif entity_type == "ELLIPSE":
                description.append(f"• {count} ellipses → Part.makeEllipse()")
        
        return "\n".join(description)


def main():
    """Main function to run the DXF geometry descriptor."""
    import argparse
    
    parser = argparse.ArgumentParser(description='Extract and describe geometry from DXF files')
    parser.add_argument('dxf_file', help='Path to the DXF file')
    parser.add_argument('--all', action='store_true', help='Include all entities (not just geometry)')
    parser.add_argument('--verbose', action='store_true', help='Detailed entity descriptions')
    parser.add_argument('--exclude-layers', nargs='+', help='Layer names to exclude')
    
    args = parser.parse_args()
    
    # Create descriptor with options
    descriptor = DXFGeometryDescriptor(
        args.dxf_file, 
        geometry_only=not args.all,
        exclude_layers=args.exclude_layers or []
    )
    
    # Generate description
    geometry_description = descriptor.generate_description(concise=not args.verbose)
    
    print(geometry_description)
    
    # Save to file
    suffix = '_geometry' if not args.all else '_complete'
    suffix += '_verbose' if args.verbose else '_concise'
    output_file = args.dxf_file.replace('.dxf', f'{suffix}_description.txt')
    
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(geometry_description)
    
    print(f"\nDescription saved to: {output_file}")


if __name__ == "__main__":
    main()
