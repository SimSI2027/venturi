# Run 18 (Blender pilot): clay renders, old | new, of a refine_<id>.blend (made by refine.py). Workbench engine, 1600 px wide.
# blender -b scratch/blender/refine_<id>.blend -P tools/blender/clay.py -- --out scratch/blender/clay_<id> [--h 700] [--views 0 1 2]
import bpy, sys, math, os
import numpy as np
from mathutils import Vector

argv = sys.argv[sys.argv.index('--') + 1:]
OUT = os.path.abspath(argv[argv.index('--out') + 1])
H = int(argv[argv.index('--h') + 1]) if '--h' in argv else 700
VIEWS = [(1, 0.8, 1), (-1, 0.7, -1), (1, -0.9, -1), (0, 0.15, 1), (0, 1, 0.05)]  # page space (x, y up, z); 0-2 for the pilot, 3 side, 4 top
sel = [int(v) for v in argv[argv.index('--views') + 1:]] if '--views' in argv else [0, 1, 2]
W = 800
sc = bpy.context.scene
sc.render.engine = 'BLENDER_WORKBENCH'
sc.render.resolution_x, sc.render.resolution_y = W, H
sc.render.film_transparent = False
sc.display.render_aa = '8'
sh = sc.display.shading
sh.light = 'STUDIO'; sh.color_type = 'SINGLE'; sh.single_color = (0.66, 0.66, 0.63); sh.show_cavity = True
sh.cavity_type = 'BOTH'; sh.cavity_ridge_factor = 0.5; sh.cavity_valley_factor = 0.7; sh.show_shadows = True; sh.shadow_intensity = 0.35
sc.world = bpy.data.worlds.new('w'); sc.world.color = (0.16, 0.17, 0.19)
cam_d = bpy.data.cameras.new('c'); cam_d.type = 'ORTHO'
cam = bpy.data.objects.new('c', cam_d); sc.collection.objects.link(cam); sc.camera = cam
orig_c, work_c = bpy.data.collections['00_ORIGINAL'], bpy.data.collections['01_WORK']
orig_c.hide_viewport = False; orig_c.hide_render = False
pts = [o.matrix_world @ Vector(c) for o in work_c.objects for c in o.bound_box]
lo = Vector((min(p[i] for p in pts) for i in range(3))); hi = Vector((max(p[i] for p in pts) for i in range(3)))
ctr = (lo + hi) / 2
diag = (hi - lo).length
cam_d.ortho_scale = diag * 0.92
cam_d.clip_end = diag * 10

def shoot(path):
    sc.render.filepath = path
    bpy.ops.render.render(write_still=True)
    im = bpy.data.images.load(path)
    a = np.array(im.pixels[:], dtype=np.float32).reshape(H, W, 4)
    bpy.data.images.remove(im)
    return a

for v in sel:
    d = VIEWS[v]
    dv = Vector((d[0], -d[2], d[1])).normalized()  # page -> Blender
    cam.location = ctr + dv * diag * 3
    cam.rotation_euler = (-dv).to_track_quat('-Z', 'Y').to_euler()
    halves = []
    for show, hide in ((orig_c, work_c), (work_c, orig_c)):
        show.hide_render = False; show.hide_viewport = False
        hide.hide_render = True; hide.hide_viewport = True
        halves.append(shoot(OUT + f'_tmp{len(halves)}.png'))
    both = np.concatenate(halves, axis=1)
    img = bpy.data.images.new('both', 2 * W, H, alpha=True)
    img.pixels = both.ravel().tolist()
    img.filepath_raw = OUT + f'_v{v}.png'; img.file_format = 'PNG'; img.save()
    bpy.data.images.remove(img)
    print('[clay] wrote', OUT + f'_v{v}.png')
for i in (0, 1):
    try: os.remove(OUT + f'_tmp{i}.png')
    except OSError: pass
