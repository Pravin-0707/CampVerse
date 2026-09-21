import ezdxf
import json
import os
import math

def export_2d_map(dxf_path, output_json_path):
    print(f"Processing 2D map: {dxf_path}")
    doc = ezdxf.readfile(dxf_path)
    msp = doc.modelspace()
    
    polylines = []
    hatches = []
    texts = []
    
    min_x, min_y = float('inf'), float('inf')
    max_x, max_y = float('-inf'), float('-inf')

    def update_bounds(x, y):
        nonlocal min_x, min_y, max_x, max_y
        min_x = min(min_x, x)
        min_y = min(min_y, y)
        max_x = max(max_x, x)
        max_y = max(max_y, y)

    # Process LWPOLYLINE
    for entity in msp.query('LWPOLYLINE'):
        layer = entity.dxf.layer
        color = entity.dxf.color
        points = []
        for p in entity.get_points(format='xy'):
            x, y = p[0], p[1]
            update_bounds(x, y)
            points.append({'x': round(x, 2), 'y': round(y, 2)})
        is_closed = entity.closed
        if len(points) > 1:
            polylines.append({
                'layer': layer,
                'color': color,
                'closed': is_closed,
                'points': points
            })

    # Process HATCH
    for entity in msp.query('HATCH'):
        layer = entity.dxf.layer
        paths = []
        for path in entity.paths:
            path_pts = []
            if hasattr(path, 'vertices'):
                for v in path.vertices:
                    x, y = v[0], v[1]
                    update_bounds(x, y)
                    path_pts.append({'x': round(x, 2), 'y': round(y, 2)})
            elif hasattr(path, 'edges'):
                for edge in path.edges:
                    if hasattr(edge, 'start'):
                        x, y = edge.start[0], edge.start[1]
                        update_bounds(x, y)
                        path_pts.append({'x': round(x, 2), 'y': round(y, 2)})
                    if hasattr(edge, 'end'):
                        x, y = edge.end[0], edge.end[1]
                        update_bounds(x, y)
                        path_pts.append({'x': round(x, 2), 'y': round(y, 2)})
            if path_pts:
                paths.append(path_pts)
        if paths:
            hatches.append({'layer': layer, 'paths': paths})

    # Process TEXT and MTEXT
    for entity in msp.query('TEXT MTEXT'):
        layer = entity.dxf.layer
        text_val = entity.dxf.text if hasattr(entity.dxf, 'text') else entity.text
        pos = entity.dxf.insert if hasattr(entity.dxf, 'insert') else (0, 0)
        x, y = pos[0], pos[1]
        update_bounds(x, y)
        texts.append({
            'text': text_val.strip(),
            'layer': layer,
            'x': round(x, 2),
            'y': round(y, 2),
            'height': getattr(entity.dxf, 'height', 1.0)
        })

    data = {
        'bounds': {
            'minX': round(min_x, 2),
            'minY': round(min_y, 2),
            'maxX': round(max_x, 2),
            'maxY': round(max_y, 2),
            'width': round(max_x - min_x, 2),
            'height': round(max_y - min_y, 2)
        },
        'polylines': polylines,
        'hatches': hatches,
        'texts': texts
    }

    os.makedirs(os.path.dirname(output_json_path), exist_ok=True)
    with open(output_json_path, 'w') as f:
        json.dump(data, f)
    print(f"Saved 2D map JSON: {output_json_path} (polylines: {len(polylines)}, hatches: {len(hatches)}, texts: {len(texts)})")

def export_3d_map(dxf_path, output_json_path):
    print(f"Processing 3D map: {dxf_path}")
    doc = ezdxf.readfile(dxf_path)
    msp = doc.modelspace()

    meshes = []
    polylines_3d = []
    texts = []

    min_x, min_y, min_z = float('inf'), float('inf'), float('inf')
    max_x, max_y, max_z = float('-inf'), float('-inf'), float('-inf')

    def update_bounds(x, y, z=0):
        nonlocal min_x, min_y, min_z, max_x, max_y, max_z
        min_x = min(min_x, x)
        min_y = min(min_y, y)
        min_z = min(min_z, z)
        max_x = max(max_x, x)
        max_y = max(max_y, y)
        max_z = max(max_z, z)

    # Process MESH
    for entity in msp.query('MESH'):
        layer = entity.dxf.layer
        vertices = []
        try:
            with entity.edit_data() as data:
                for v in data.vertices:
                    x, y, z = v[0], v[1], v[2]
                    update_bounds(x, y, z)
                    vertices.append([round(x, 2), round(y, 2), round(z, 2)])
                
                faces = []
                for f in data.faces:
                    faces.append(list(f))
                
                if vertices and faces:
                    meshes.append({
                        'layer': layer,
                        'vertices': vertices,
                        'faces': faces
                    })
        except Exception as e:
            pass

    # Process POLYLINE (3D Polyline / Mesh)
    for entity in msp.query('POLYLINE'):
        layer = entity.dxf.layer
        pts = []
        for v in entity.vertices:
            loc = v.dxf.location
            x, y, z = loc[0], loc[1], loc[2]
            update_bounds(x, y, z)
            pts.append([round(x, 2), round(y, 2), round(z, 2)])
        if len(pts) > 1:
            polylines_3d.append({
                'layer': layer,
                'isClosed': entity.is_closed,
                'points': pts
            })

    # Process TEXT
    for entity in msp.query('TEXT MTEXT'):
        layer = entity.dxf.layer
        text_val = entity.dxf.text if hasattr(entity.dxf, 'text') else entity.text
        pos = entity.dxf.insert if hasattr(entity.dxf, 'insert') else (0, 0, 0)
        x = pos[0]
        y = pos[1]
        z = pos[2] if len(pos) > 2 else 0
        update_bounds(x, y, z)
        texts.append({
            'text': text_val.strip(),
            'layer': layer,
            'x': round(x, 2),
            'y': round(y, 2),
            'z': round(z, 2)
        })

    data = {
        'bounds': {
            'minX': round(min_x, 2), 'maxX': round(max_x, 2),
            'minY': round(min_y, 2), 'maxY': round(max_y, 2),
            'minZ': round(min_z, 2), 'maxZ': round(max_z, 2),
            'sizeX': round(max_x - min_x, 2),
            'sizeY': round(max_y - min_y, 2),
            'sizeZ': round(max_z - min_z, 2)
        },
        'meshes': meshes,
        'polylines3d': polylines_3d,
        'texts': texts
    }

    os.makedirs(os.path.dirname(output_json_path), exist_ok=True)
    with open(output_json_path, 'w') as f:
        json.dump(data, f)
    print(f"Saved 3D map JSON: {output_json_path} (meshes: {len(meshes)}, 3D polylines: {len(polylines_3d)})")

if __name__ == '__main__':
    export_2d_map('./Map/clg campustopoexport-C72428/topoexport_2D_vectorial.dxf', './public/maps/campus_2d_main.json')
    export_3d_map('./Map/clg campustopoexport-C72428/topoexport_3D_modeling.dxf', './public/maps/campus_3d_main.json')
    export_2d_map('./Map/clgcampusextendedtopoexport-ADBD1A/topoexport_2D_vectorial.dxf', './public/maps/campus_2d_extended.json')
    export_3d_map('./Map/clgcampusextendedtopoexport-ADBD1A/topoexport_3D_modeling.dxf', './public/maps/campus_3d_extended.json')
