import docker
import pathlib
from typing import Optional
import os
from langchain.tools import tool

@tool
def dwg_converter_tool(
    input_path: str,
    output_path: Optional[str] = None,
    docker_image: str = "ghcr.io/bloomcore/libredwg:latest"
) -> str:
    """
    Convert a DWG file to DXF format using a Docker container.

    Args:
        input_path: Path to the input DWG file
        output_path: Optional path for the output DXF file. If not provided,
                   the output will be in the same directory as the input with .dxf extension
        docker_image: Docker image to use for conversion

    Returns:
        Path to the converted DXF file.
    """
    # Convert to Path objects and resolve to absolute paths
    input_path = pathlib.Path(input_path).resolve()
    
    # Validate input file
    if not input_path.exists():
        raise FileNotFoundError(f"Input file not found: {input_path}")
    
    # Set default output path if not provided
    if output_path is None:
        output_path = input_path.with_suffix('.dxf')
    else:
        output_path = pathlib.Path(output_path).resolve()

    # Ensure output directory exists
    output_path.parent.mkdir(parents=True, exist_ok=True)

    # Initialize Docker client
    client = docker.from_env()

    # Run the conversion in a Docker container
    client.containers.run(
        image=docker_image,
        command=[
            "dwg2dxf",
            f"/work/{input_path.name}",
            "-o",
            f"/work/{output_path.name}"
        ],
        volumes={
            str(input_path.parent): {"bind": "/work", "mode": "rw"}
        },
        user=f"{os.getuid()}:{os.getgid()}",
        environment={"LD_LIBRARY_PATH": "/usr/local/lib"},
        remove=True,
        detach=False
    )

    return str(output_path)

# Example usage
if __name__ == "__main__":
    import sys
    from geometry_description_tool import geometry_description_tool

    if len(sys.argv) < 2:
        print("Usage: python -m agent.tools.dwg_converter_tool <input.dwg> [output.dxf]")
        sys.exit(1)
        
    input_file = sys.argv[1]
    output_file = sys.argv[2] if len(sys.argv) > 2 else None
    
    try:
        dxf_file = dwg_converter_tool(input_file, output_file)
        print(f"Conversion successful. DXF file at: {dxf_file}")
        description_file = geometry_description_tool(dxf_file)
        print(f"Geometry description at: {description_file}")
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)
