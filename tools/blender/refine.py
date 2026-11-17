# Run 18 (Blender pilot). Headless: blender -b -P tools/blender/refine.py -- [--ids 1-top 1 1-bowl 65] [--dir scratch/blender] [--union]
# Run 19 (pilot 2): --union runs the body (id 1) with an exact boolean union and seam-only bevels, 0 voxel remesh, 0 decimation; see union() below.
# Run 21 (pilot 3): the pieces that are not closed solids are repaired (repair() below) and join the union, which is hole tolerant; 0 stay separate.
# Reads <dir>/in_<id>.glb (tools/blender/export_in.mjs), writes <dir>/out_<id>.glb, <dir>/refine_<id>.blend and <dir>/report_<id>.txt.
# Blender units = mm (a glTF unit is 1 mm here), so the voxel size below is in mm.
#
# Per casting: the imported mesh is kept untouched in collection 00_ORIGINAL (hidden); the work copy in 01_WORK
#   1. is voxel-remeshed at VOXEL mm into 1 closed shape,
#   2. gets ~1 mm fillets only where the original pieces met: a vertex is "at a joint" when 2 or more of the original's loose
#      pieces have a surface within JOINT mm of it; there, concave vertices only (the Laplacian pulls them out of the surface)
#      move toward their neighbours' average, never further than FILL_MAX from where they were. 0.41 mm of fill at the corner
#      of a right-angle joint is a 1 mm fillet radius (r * (sqrt 2 - 1)); convex edges are not touched,
#   3. is decimated to at most the casting's original triangle count,
#   4. gets weighted normals (smooth under 35 degrees, as the page's creased normals are),
#   5. gets box-projected UVs at the page's grain scale (1 UV unit = 10.66 mm, the sketch unit the page's ExtrudeGeometry UVs use),
#   6. is exported (meshopt compressed) with 1 report line.
import bpy, bmesh, sys, os, math, time
import numpy as np
from mathutils import Vector
from mathutils.bvhtree import BVHTree

VOXEL = 0.35      # mm
JOINT = 1.2       # mm: how far from a second piece counts as "where pieces met"
FILL_MAX = 0.42   # mm: peak movement of a joint vertex = about a 1 mm fillet on a right-angle joint
UV_MM = 10.66     # mm per UV unit (the page's grain scale; the material repeat of 1.5 stays on the material)
RIPPLE = 0.07    # mm
CREASE = math.radians(35)
WELD = 3e-3       # mm: union mode, how far apart a piece's own seam vertices (float rounding in three's lathes and extrusions) still weld
BEVEL = 1.0       # mm: union mode, bevel offset on the seams
BEVEL_SEG = 3
SEAM_MIN = math.radians(5)  # a seam between 2 near-coplanar faces has nothing to round

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
OUT = 'scratch/blender'
IDS = ['1-top', '1', '1-bowl', '65']
UNION = '--union' in argv
if UNION:
    IDS = ['1']
if '--dir' in argv:
    OUT = argv[argv.index('--dir') + 1]
if '--ids' in argv:
    i = argv.index('--ids') + 1
    IDS = []
    while i < len(argv) and not argv[i].startswith('--'):
        IDS.append(argv[i]); i += 1


def log(*a):
    print('[refine]', *a, flush=True)


def tri_arrays(me):
    me.calc_loop_triangles()
    n = len(me.loop_triangles)
    t = np.empty(n * 3, dtype=np.int32)
    me.loop_triangles.foreach_get('vertices', t)
    return t.reshape(-1, 3)


def get_co(me):
    a = np.empty(len(me.vertices) * 3, dtype=np.float64)
    me.vertices.foreach_get('co', a)
    return a.reshape(-1, 3)


def vnormals(co, tri):
    fn = np.cross(co[tri[:, 1]] - co[tri[:, 0]], co[tri[:, 2]] - co[tri[:, 0]])
    vn = np.zeros_like(co)
    for k in range(3):
        np.add.at(vn, tri[:, k], fn)
    l = np.linalg.norm(vn, axis=1, keepdims=True)
    return vn / np.maximum(l, 1e-12)


def pieces_of(orig):
    """The original's loose pieces: weld the copy, label connected triangles. Returns [(BVHTree, lo, hi)] for pieces over 20 tris."""
    bm = bmesh.new()
    bm.from_mesh(orig.data)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-4)
    bmesh.ops.triangulate(bm, faces=bm.faces)
    bm.verts.ensure_lookup_table()
    V = np.array([v.co[:] for v in bm.verts])
    T = np.array([[v.index for v in f.verts] for f in bm.faces])
    bm.free()
    lab = np.arange(len(V))
    while True:
        m = lab[T].min(axis=1)
        new = lab.copy()
        for k in range(3):
            np.minimum.at(new, T[:, k], m)
        new = new[new]
        if (new == lab).all():
            break
        lab = new
    tl = lab[T[:, 0]]
    out = []
    for L in np.unique(tl):
        ft = T[tl == L]
        if len(ft) < 20:
            continue
        used = np.unique(ft)
        remap = {int(u): i for i, u in enumerate(used)}
        verts = [Vector(V[u]) for u in used]
        polys = [tuple(remap[int(x)] for x in f) for f in ft]
        out.append((BVHTree.FromPolygons(verts, polys, all_triangles=True), V[used].min(axis=0), V[used].max(axis=0)))
    return out


def joint_weights(co, cand, pieces):
    """w in 0..1 per vertex (only the candidates are tested): 1 on a joint, 0 once a second piece is JOINT mm away."""
    w = np.zeros(len(co))
    d1 = np.full(len(co), 1e9)
    d2 = np.full(len(co), 1e9)
    for bvh, lo, hi in pieces:
        ok = cand[np.all(co[cand] >= lo - JOINT, axis=1) & np.all(co[cand] <= hi + JOINT, axis=1)]
        for i in ok:
            r = bvh.find_nearest(Vector(co[i]), JOINT)
            if r[0] is None:
                continue
            d = r[3]
            if d < d1[i]:
                d2[i], d1[i] = d1[i], d
            elif d < d2[i]:
                d2[i] = d
    sel = d2 < JOINT
    w[sel] = 1.0 - d2[sel] / JOINT
    return w


def fillet(me, orig, steps=40, lam=0.5):
    co = get_co(me)
    tri = tri_arrays(me)
    p0 = co.copy()
    vn = vnormals(co, tri)
    ed = np.empty(len(me.edges) * 2, dtype=np.int64)
    me.edges.foreach_get('vertices', ed)
    ed = ed.reshape(-1, 2)
    deg = np.bincount(ed.ravel(), minlength=len(co)).astype(np.float64)
    avg = lambda c: np.stack([np.bincount(ed[:, 0], c[ed[:, 1], k], len(c)) + np.bincount(ed[:, 1], c[ed[:, 0], k], len(c)) for k in range(3)], 1) / np.maximum(deg, 1)[:, None]
    conc = np.einsum('ij,ij->i', avg(co) - co, vn) > 0
    t0 = time.time()
    w = joint_weights(co, np.nonzero(conc)[0], pieces_of(orig))
    log('joint vertices', int((w > 0).sum()), 'of', len(co), f'({time.time() - t0:.1f} s)')
    for _ in range(4):  # a soft edge to the joint zone: the weights spread over the neighbours
        w = np.maximum(w, avg(np.repeat(w[:, None], 3, 1))[:, 0] * 0.9)
    for s in range(steps):
        d = avg(co) - co
        dn = np.einsum('ij,ij->i', d, vn)
        mv = np.where(((dn > 0) & (w > 0))[:, None], d * (lam * w)[:, None], 0.0)
        co = co + mv
        off = co - p0
        l = np.linalg.norm(off, axis=1)
        big = l > FILL_MAX
        co[big] = p0[big] + off[big] * (FILL_MAX / l[big])[:, None]
        if s % 5 == 4:
            vn = vnormals(co, tri)
    peak = float(np.linalg.norm(co - p0, axis=1).max())
    # the voxel grid's ripple: where the surface is nearly flat (the Laplacian is under RIPPLE mm) it is relaxed; edges and corners stay
    for _ in range(12):
        d = avg(co) - co
        flat = np.linalg.norm(d, axis=1) < RIPPLE
        co = co + np.where(flat[:, None], d * 0.5, 0.0)
    me.vertices.foreach_set('co', co.ravel())
    me.update()
    return peak


def non_manifold_edges(me):
    bm = bmesh.new()
    bm.from_mesh(me)
    n = sum(1 for e in bm.edges if not e.is_manifold)
    bm.free()
    return n


def box_uv(obj):
    """Box projection at the page's grain scale. Axes as the page sees them (glTF Y up): x = x, y = z, z = -y of Blender."""
    me = obj.data
    bm = bmesh.new()
    bm.from_mesh(me)
    uvl = bm.loops.layers.uv.verify()
    for f in bm.faces:
        gn = (f.normal.x, f.normal.z, -f.normal.y)
        ga = max(range(3), key=lambda k: abs(gn[k]))  # dominant axis, page space
        sgn = -1.0 if gn[ga] < 0 else 1.0
        for l in f.loops:
            x, y, z = l.vert.co
            g = (x, z, -y)
            u, v = [(g[2], g[1]), (g[0], g[2]), (g[0], g[1])][ga]
            l[uvl].uv = (u * sgn / UV_MM, v / UV_MM)
    bm.to_mesh(me)
    bm.free()


def first_hits(bvh, lo, hi, axis, sign, step):
    """Orthographic first-hit depth map along +/- axis: dict (i, j) -> depth from the bounding box's near face, None = no hit."""
    a, b = [k for k in range(3) if k != axis]
    out = {}
    ext = hi[axis] - lo[axis] + 2.0
    for i, ua in enumerate(np.arange(lo[a] + step / 2, hi[a], step)):
        for j, ub in enumerate(np.arange(lo[b] + step / 2, hi[b], step)):
            o = Vector((0, 0, 0))
            o[a], o[b] = ua, ub
            o[axis] = (lo[axis] - 1.0) if sign > 0 else (hi[axis] + 1.0)
            d = Vector((0, 0, 0))
            d[axis] = sign
            r = bvh.ray_cast(o, d, ext)
            out[(i, j)] = None if r[0] is None else (r[3])
    return out, a, b


def components(cells):
    cells = set(cells)
    comps = []
    while cells:
        c = cells.pop()
        st, comp = [c], [c]
        while st:
            i, j = st.pop()
            for di in (-1, 0, 1):
                for dj in (-1, 0, 1):
                    n = (i + di, j + dj)
                    if n in cells:
                        cells.discard(n); st.append(n); comp.append(n)
        comps.append(comp)
    return comps


def hole_check(orig, work, step=0.5):
    """Compares first-hit depth maps of the original and the work mesh from the 6 axis directions.
    through-holes: pits in the original (no hit, ringed by hits, 3..60 mm2); each must still show no hit (open).
    closed: clusters of 3 mm2 or more where the work mesh's first hit is over 1 mm nearer than the original's (material added)."""
    bo, bw = BVHTree.FromObject(orig, bpy.context.evaluated_depsgraph_get()), BVHTree.FromObject(work, bpy.context.evaluated_depsgraph_get())
    co = get_co(orig.data)
    lo, hi = co.min(axis=0), co.max(axis=0)
    seen = {}
    closed = 0
    for axis in range(3):
        for sign in (1, -1):
            do, a, b = first_hits(bo, lo, hi, axis, sign, step)
            dw, _, _ = first_hits(bw, lo, hi, axis, sign, step)
            pits = [c for c, d in do.items() if d is None]
            for comp in components(pits):
                area = len(comp) * step * step
                edge = any((i + di, j + dj) not in do for i, j in comp for di, dj in ((1, 0), (-1, 0), (0, 1), (0, -1)))
                if edge or not 3.0 <= area <= 60.0:
                    continue
                op = sum(dw[c] is None for c in comp) / len(comp)
                key = (axis, round((np.mean([c[0] for c in comp]) * step + lo[a]) / 2.0), round((np.mean([c[1] for c in comp]) * step + lo[b]) / 2.0))
                seen[key] = seen.get(key, True) and op > 0.9  # the same hole seen from both ends counts once
                if os.environ.get('REFINE_DEBUG'):
                    log('hole', 'xyz'[axis], sign, f'{area:.1f} mm2 open {op:.2f}', key)
            add = [c for c in do if dw[c] is not None and (do[c] is None or do[c] - dw[c] > 1.0)]
            for comp in components(add):
                if len(comp) * step * step >= 3.0:
                    closed += 1
    return len(seen), sum(seen.values()), closed


def refine(cid):
    t0 = time.time()
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=os.path.join(OUT, f'in_{cid}.glb'))
    obj = [o for o in bpy.context.scene.objects if o.type == 'MESH'][0]
    for o in bpy.context.scene.objects:
        o.select_set(o is obj)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.parent_clear(type='CLEAR_KEEP_TRANSFORM')
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    t_orig = len(obj.data.polygons)
    # --- 00_ORIGINAL keeps the untouched copy, 01_WORK the working copy
    c_orig = bpy.data.collections.new('00_ORIGINAL'); c_work = bpy.data.collections.new('01_WORK')
    bpy.context.scene.collection.children.link(c_orig); bpy.context.scene.collection.children.link(c_work)
    for c in list(obj.users_collection):
        c.objects.unlink(obj)
    obj.name = f'{cid}_original'; obj.data.name = f'{cid}_original'
    c_orig.objects.link(obj)
    work = obj.copy(); work.data = obj.data.copy(); work.name = cid; work.data.name = cid
    c_work.objects.link(work)
    for o in bpy.context.scene.objects:
        o.select_set(o is work)
    bpy.context.view_layer.objects.active = work
    # --- 1. voxel remesh
    work.data.remesh_voxel_size = VOXEL
    bpy.ops.object.voxel_remesh()
    bm = bmesh.new(); bm.from_mesh(work.data); bmesh.ops.triangulate(bm, faces=bm.faces); bm.to_mesh(work.data); bm.free()
    t_vox = len(work.data.polygons)
    log(cid, 'voxel', VOXEL, 'mm ->', t_vox, 'tris', f'({time.time() - t0:.1f} s)')
    # --- 2. fillets at the joints
    fill = fillet(work.data, obj)
    # --- 3. decimate to at most the original's triangle count
    ratio = min(1.0, 0.985 * t_orig / t_vox)
    for _ in range(4):
        m = work.modifiers.new('dec', 'DECIMATE'); m.decimate_type = 'COLLAPSE'; m.ratio = ratio; m.use_collapse_triangulate = True
        bpy.ops.object.modifier_apply(modifier=m.name)
        if len(work.data.polygons) <= t_orig:
            break
        ratio = 0.95 * t_orig / len(work.data.polygons)
    # --- 4. weighted normals (smooth under 35 degrees)
    bpy.ops.object.shade_smooth_by_angle(angle=CREASE)
    m = work.modifiers.new('wn', 'WEIGHTED_NORMAL'); m.mode = 'FACE_AREA'; m.weight = 50; m.keep_sharp = True
    bpy.ops.object.modifier_apply(modifier=m.name)
    # --- 5. box-projected UVs at the page's grain scale
    box_uv(work)
    work.data.update()
    tris = len(work.data.polygons)  # all triangles
    nm = non_manifold_edges(work.data)
    holes, still, closed = hole_check(obj, work)
    # --- 6. export (the original collection is hidden and not selected)
    c_orig.hide_viewport = True; c_orig.hide_render = True
    for o in bpy.context.scene.objects:
        o.select_set(o is work)
    path = os.path.join(OUT, f'out_{cid}.glb')
    bpy.ops.export_scene.gltf(filepath=path, export_format='GLB', use_selection=True, export_yup=True, export_apply=False, export_normals=True,
                              export_texcoords=True, export_materials='NONE', export_cameras=False, export_lights=False, export_extras=False,
                              export_meshopt_compression_enable=True)
    kb = os.path.getsize(path) / 1024
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT, f'refine_{cid}.blend'))
    line = (f'{cid}: triangles {tris} (was {t_orig}), non-manifold edges {nm}, {kb:.0f} KB, holes still open {still} of {holes}, '
            f'closed-by-fill clusters {closed}, joint fill peak {fill:.2f} mm, {time.time() - t0:.0f} s')
    open(os.path.join(OUT, f'report_{cid}.txt'), 'w').write(line + '\n')
    log('REPORT', line)


def label_pieces(bm):
    """Face lists of the connected pieces of a welded, triangulated bmesh."""
    seen, comps = set(), []
    for f in bm.faces:
        if f in seen:
            continue
        st, c = [f], [f]
        seen.add(f)
        while st:
            x = st.pop()
            for e in x.edges:
                for g in e.link_faces:
                    if g not in seen:
                        seen.add(g); st.append(g); c.append(g)
        comps.append(c)
    return comps


def piece_bmesh(faces):
    """A piece as its own bmesh, its seam vertices welded at WELD."""
    b = bmesh.new()
    vm = {}
    for f in faces:
        vs = []
        for v in f.verts:
            if v.index not in vm:
                vm[v.index] = b.verts.new(v.co)
            vs.append(vm[v.index])
        try:
            b.faces.new(vs)
        except ValueError:
            pass
    bmesh.ops.remove_doubles(b, verts=b.verts, dist=WELD)
    bmesh.ops.dissolve_degenerate(b, edges=b.edges, dist=1e-6)
    b.verts.ensure_lookup_table(); b.edges.ensure_lookup_table(); b.faces.ensure_lookup_table()
    return b


def piece_check(b):
    """(open edges, edges with 3+ faces, edges whose 2 faces disagree on winding, signed volume)."""
    op = sum(1 for e in b.edges if len(e.link_faces) == 1)
    multi = sum(1 for e in b.edges if len(e.link_faces) > 2)
    flip = sum(1 for e in b.edges if len(e.link_faces) == 2 and not e.is_contiguous)
    vol = sum(f.verts[0].co.dot(f.verts[1].co.cross(f.verts[2].co)) for f in b.faces) / 6
    return op, multi, flip, vol


def repair(b):
    """Pilot 3: close a piece that is not a solid. Merge vertices within 0.01 mm, delete loose geometry and interior faces
    (faces whose every edge has 3+ faces, and the second copy of a face over the same vertices), fill holes, recalculate normals."""
    bmesh.ops.remove_doubles(b, verts=b.verts, dist=0.01)
    bmesh.ops.dissolve_degenerate(b, edges=b.edges, dist=1e-6)
    b.verts.index_update()
    seen, dup = set(), []
    for f in b.faces:
        k = frozenset(v.index for v in f.verts)
        if k in seen:
            dup.append(f)
        seen.add(k)
    bmesh.ops.delete(b, geom=dup, context='FACES_ONLY')
    inner = []
    for _ in range(20):  # interior faces: a sheet (faces joined across 2-face edges) whose whole rim is 3+ face edges; the smallest goes first
        if not any(len(e.link_faces) > 2 for e in b.edges):
            break
        seen, sheets = set(), []
        for f in b.faces:
            if f in seen:
                continue
            st, s = [f], [f]
            seen.add(f)
            while st:
                x = st.pop()
                for e in x.edges:
                    if len(e.link_faces) == 2:
                        for g in e.link_faces:
                            if g not in seen:
                                seen.add(g); st.append(g); s.append(g)
            rim = [e for g in s for e in g.edges if len(e.link_faces) != 2]
            if rim and all(len(e.link_faces) > 2 for e in rim):
                sheets.append((sum(g.calc_area() for g in s), s))
        if not sheets:
            break
        s = min(sheets, key=lambda t: t[0])[1]
        inner += s
        bmesh.ops.delete(b, geom=s, context='FACES_ONLY')
    bmesh.ops.delete(b, geom=[e for e in b.edges if not e.link_faces], context='EDGES')
    bmesh.ops.delete(b, geom=[v for v in b.verts if not v.link_faces], context='VERTS')
    bmesh.ops.holes_fill(b, edges=[e for e in b.edges if len(e.link_faces) == 1], sides=0)
    bmesh.ops.triangulate(b, faces=b.faces)
    bmesh.ops.recalc_face_normals(b, faces=b.faces)
    b.verts.ensure_lookup_table(); b.edges.ensure_lookup_table(); b.faces.ensure_lookup_table()
    return len(dup), len(inner)


def finish(obj):
    """Smooth under 35 degrees, weighted normals, grain UVs: the same last steps as the voxel path."""
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.shade_smooth_by_angle(angle=CREASE)
    m = obj.modifiers.new('wn', 'WEIGHTED_NORMAL'); m.mode = 'FACE_AREA'; m.weight = 50; m.keep_sharp = True
    bpy.ops.object.modifier_apply(modifier=m.name)
    box_uv(obj)
    obj.data.update()


def union(cid):
    """Pilot 2, the body. 1. every face tagged with its piece index (the original's connected pieces); 2. each piece checked for
    manifoldness (open edges, 3+ face edges, winding, negative volume flipped): the ones that are not are listed and kept as separate
    meshes; 3. the rest joined with 1 exact boolean union (self-intersecting, winding rule); 4. only the edges between faces of different
    piece index (and over SEAM_MIN apart in angle) are beveled, BEVEL mm, BEVEL_SEG segments; 5. weighted normals, box UVs; 6. export.
    0 voxel remesh, 0 decimation."""
    t0 = time.time()
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=os.path.join(OUT, f'in_{cid}.glb'))
    obj = [o for o in bpy.context.scene.objects if o.type == 'MESH'][0]
    for o in bpy.context.scene.objects:
        o.select_set(o is obj)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.parent_clear(type='CLEAR_KEEP_TRANSFORM')
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    t_orig = len(obj.data.polygons)
    c_orig = bpy.data.collections.new('00_ORIGINAL'); c_work = bpy.data.collections.new('01_WORK')
    bpy.context.scene.collection.children.link(c_orig); bpy.context.scene.collection.children.link(c_work)
    for c in list(obj.users_collection):
        c.objects.unlink(obj)
    obj.name = f'{cid}_original'; obj.data.name = f'{cid}_original'
    c_orig.objects.link(obj)
    # --- 1. pieces
    bm = bmesh.new(); bm.from_mesh(obj.data)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-3)  # only to find which faces belong together
    bmesh.ops.triangulate(bm, faces=bm.faces)
    bm.verts.ensure_lookup_table(); bm.faces.ensure_lookup_table()
    comps = label_pieces(bm)
    # --- 2. manifold check
    good, bad = [], []
    for i, faces in enumerate(comps):
        b = piece_bmesh(faces)
        op, multi, flip, vol = piece_check(b)
        if op or multi or flip or len(b.faces) < 4:
            nd, ni = repair(b)  # pilot 3: repaired, then joined like the rest (the union is hole tolerant)
            op2, mu2, fl2, vol = piece_check(b)
            log(cid, f'repaired #{i}: {op} open, {multi} 3+, {flip} winding -> {op2} open, {mu2} 3+, {fl2} winding '
                     f'({nd} duplicate, {ni} interior faces deleted), {len(b.faces)} tris')
            bad.append((i, None, op, multi, flip))
        if vol < 0:
            bmesh.ops.reverse_faces(b, faces=b.faces)
        good.append((i, b))
    bm.free()
    log(cid, 'pieces', len(comps), 'repaired', len(bad), [f'#{i}: {op} open, {mu} 3+, {fl} winding' for i, _, op, mu, fl in bad])
    bad = []  # 0 pieces stay separate
    # --- 3. 1 exact boolean union of the manifold pieces, each face tagged with its piece index
    joined = bmesh.new()
    lay = joined.faces.layers.int.new('piece')
    for i, b in good:
        vm = {}
        for v in b.verts:
            vm[v.index] = joined.verts.new(v.co)
        for f in b.faces:
            nf = joined.faces.new([vm[v.index] for v in f.verts])
            nf[lay] = i + 1
        b.free()
    me = bpy.data.meshes.new(cid)
    joined.to_mesh(me); joined.free()
    work = bpy.data.objects.new(cid, me)
    c_work.objects.link(work)
    nul = bpy.data.objects.new('empty_operand', bpy.data.meshes.new('empty_operand'))
    c_work.objects.link(nul)
    bpy.context.view_layer.objects.active = work
    for o in bpy.context.scene.objects:
        o.select_set(o is work)
    m = work.modifiers.new('union', 'BOOLEAN')
    m.operation = 'UNION'; m.solver = 'EXACT'; m.operand_type = 'OBJECT'; m.object = nul; m.use_self = True; m.use_hole_tolerant = True
    bpy.ops.object.modifier_apply(modifier=m.name)
    bpy.data.objects.remove(nul)
    log(cid, 'union', len(work.data.polygons), 'faces, non-manifold edges', non_manifold_edges(work.data), f'({time.time() - t0:.1f} s)', 'attributes', [a.name for a in work.data.attributes if not a.name.startswith('.')])
    # --- 4. bevel only the seams between different piece indices
    bm = bmesh.new(); bm.from_mesh(work.data)
    lay = bm.faces.layers.int.get('piece')
    seams = []
    nseam_all = 0
    for e in bm.edges:
        if len(e.link_faces) == 2 and e.link_faces[0][lay] != e.link_faces[1][lay]:
            nseam_all += 1
            if e.calc_face_angle(0.0) > SEAM_MIN:
                seams.append(e)
    log(cid, 'seam edges', len(seams), 'of', nseam_all, 'between different pieces (the rest are nearly flat)')
    bmesh.ops.bevel(bm, geom=seams, offset=BEVEL, offset_type='OFFSET', segments=BEVEL_SEG, profile=0.5, affect='EDGES', clamp_overlap=True, loop_slide=True)
    bmesh.ops.triangulate(bm, faces=bm.faces)
    bm.to_mesh(work.data); bm.free()
    work.data.attributes.remove(work.data.attributes['piece'])
    finish(work)
    # --- 5. the pieces that were not manifold stay separate meshes
    work_objs = [work]
    nm_open = 0
    for i, b, op, mu, fl in bad:
        bmesh.ops.triangulate(b, faces=b.faces)
        me2 = bpy.data.meshes.new(f'{cid}_open_{i}'); b.to_mesh(me2); b.free()
        o2 = bpy.data.objects.new(f'{cid}_open_{i}', me2)
        c_work.objects.link(o2)
        finish(o2)
        work_objs.append(o2)
        nm_open += op + mu + fl
    nm_union = non_manifold_edges(work.data)
    tris = sum(len(o.data.polygons) for o in work_objs)
    # --- 6. checks and export
    chk = work.copy(); chk.data = work.data.copy(); chk.name = 'chk'
    c_work.objects.link(chk)
    for o in work_objs[1:]:
        o2 = o.copy(); o2.data = o.data.copy(); c_work.objects.link(o2)
        bpy.ops.object.select_all(action='DESELECT')
        chk.select_set(True); o2.select_set(True)
        bpy.context.view_layer.objects.active = chk
        bpy.ops.object.join()
    bpy.context.view_layer.update()
    holes, still, closed = hole_check(obj, chk)
    bpy.data.objects.remove(chk)
    c_orig.hide_viewport = True; c_orig.hide_render = True
    bpy.ops.object.select_all(action='DESELECT')
    for o in work_objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = work
    path = os.path.join(OUT, f'out_{cid}.glb')
    bpy.ops.export_scene.gltf(filepath=path, export_format='GLB', use_selection=True, export_yup=True, export_apply=False, export_normals=True,
                              export_texcoords=True, export_materials='NONE', export_cameras=False, export_lights=False, export_extras=False,
                              export_meshopt_compression_enable=True)
    kb = os.path.getsize(path) / 1024
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT, f'refine_{cid}.blend'))
    line = (f'{cid}: union, triangles {tris} (was {t_orig}), non-manifold edges {nm_union + nm_open} (union {nm_union}, {len(bad)} separate open pieces {nm_open}), '
            f'{kb:.0f} KB, holes still open {still} of {holes}, closed-by-union clusters {closed}, pieces {len(comps)}, {time.time() - t0:.0f} s')
    open(os.path.join(OUT, f'report_{cid}.txt'), 'w').write(line + '\n')
    log('REPORT', line)


for cid in IDS:
    (union if UNION else refine)(cid)
