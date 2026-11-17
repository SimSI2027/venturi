// VENTURI 39: everything the page knows about the carburetor, written once in run 1 from ref/
// (parts.txt, fiche.png, manual_carb.pdf pages 6-1..6-10, steps.md, specs.json). Later runs read this file, never ref/.
// 2004 YFZ450, Keihin flat-slide with accelerator pump, I.D. mark 5TG1 00.

// --- the 79 fiche references, names exactly as in parts.txt. role: parts.txt's plain-language role;
// likely: the line was marked "?" (shown as "likely: ..."). group: one of GROUPS. fits: the part it mounts on
// (a part id). step: as written in run 1 (section B 1-27, 'A<n>' section A, null unnamed); replaced below
// STEPS_B by the page's tear-down step 1-29. specs: keys into SPECS (dotted for torque).
export const PARTS = [
  {ref: 1, name: 'CARBURETOR ASSY 1', role: 'complete carburetor (body is not sold separately)', group: 'body', fits: null, step: null, specs: ['carburetor.manufacturer', 'carburetor.id_mark', 'main_air_jet', 'pilot_outlet', 'bypass_1', 'torque.joint_clamp_screw_carb_side_M5', 'torque.clamp_screw_air_duct_side_M6']},
  {ref: 2, name: 'GASKET', role: 'top cover gasket', group: 'top', fits: '1', step: 7},
  {ref: 3, name: 'BOLT', role: 'top cover bolt', group: 'top', fits: '1-top', step: 7},
  {ref: 4, name: 'SCREW', role: 'cover screw', group: 'pump', fits: '27', step: 15},
  {ref: 5, name: 'SCREW (98502-04012)', role: 'float chamber / cover screw', group: 'bowl', fits: '1-bowl', step: 17},
  {ref: 6, name: 'WASHER, PLATE', role: 'plate washer', group: 'pump', fits: '8', step: 15},
  {ref: 7, name: 'WASHER', role: 'washer', group: 'pump', fits: '8', step: 15},
  {ref: 8, name: 'SCREW, ADJUST', role: 'adjusting screw', group: 'pump', fits: '45', step: 15, specs: ['throttle_valve_height_for_pump_timing']},
  {ref: 9, name: 'VALVE, VACUUM CONTROL', role: 'throttle valve (flat slide)', group: 'slide', fits: '1', step: 9, specs: ['cutaway']},
  {ref: 10, name: 'ROLLER', role: 'throttle valve roller', group: 'slide', fits: '9', step: 9},
  {ref: 11, name: 'VALVE, NEEDLE', role: 'throttle valve plate / needle set', likely: true, group: 'slide', fits: '9', step: 10, specs: ['throttle_valve_height_for_pump_timing']},
  {ref: 12, name: 'SEAL', role: 'throttle valve plate seal', likely: true, group: 'slide', fits: '11', step: 10},
  {ref: 13, name: 'CLIP', role: 'jet needle clip', group: 'slide', fits: '48', step: 12, specs: ['jet_needle_clip']},
  {ref: 14, name: 'SCREW, ADJUST', role: 'needle holder', likely: true, group: 'slide', fits: '9', step: 11},
  {ref: 15, name: 'SPRING', role: 'spring', group: 'slide', fits: '14', step: 11},
  {ref: 16, name: 'COLLAR', role: 'collar / spacer', group: 'slide', fits: '48', step: 11},
  {ref: 17, name: 'NOZZLE, MAIN', role: 'needle jet', group: 'jets', fits: '1', step: 23},
  {ref: 18, name: 'JET, SLOW (#42)', role: 'pilot jet #42', group: 'jets', fits: '1', step: 25, specs: ['pilot_jet']},
  {ref: 19, name: 'JET (#90)', role: 'starter jet #90', group: 'jets', fits: '1', step: 26, specs: ['starter_jet']},
  // the known conflict: shown as both, with the stamp check (see CONFLICT_20)
  {ref: 20, name: 'JET, MAIN (#100)', role: 'pilot air jet #100 (the fiche names it a main jet; the manual lists the main jet as #158)', group: 'jets', fits: '1', step: 27, specs: ['pilot_air_jet']},
  {ref: 21, name: 'FLOAT', role: 'float', group: 'float', fits: '22', step: 20, specs: ['float_height']},
  {ref: 22, name: 'PIN, FLOAT ARM', role: 'float pin', group: 'float', fits: '1', step: 19},
  {ref: 23, name: 'VALVE, NEEDLE', role: 'float needle valve', group: 'float', fits: '1', step: 21, specs: ['valve_seat']},
  {ref: 24, name: 'CLIP', role: 'needle valve clip', likely: true, group: 'float', fits: '23', step: 21},
  {ref: 25, name: 'GASKET, FLOAT CHAMBER', role: 'float chamber gasket', group: 'bowl', fits: '1-bowl', step: 17},
  {ref: 26, name: 'PLUG, DRAIN', role: 'float chamber drain plug', group: 'bowl', fits: '1-bowl', step: 17},
  {ref: 27, name: 'COVER 1', role: 'accelerator pump cover', group: 'pump', fits: '1-bowl', step: 15},
  {ref: 28, name: 'DIAPHRAGM, ACC PUMP (DPH#35)', role: 'accelerator pump diaphragm', group: 'pump', fits: '1-bowl', step: 16},
  {ref: 29, name: 'GASKET', role: 'gasket', group: 'pump', fits: '27', step: 15},
  {ref: 30, name: 'SPRING, DIAPHRAGM', role: 'accelerator pump spring', group: 'pump', fits: '28', step: 15},
  {ref: 31, name: 'O-RING', role: 'O-ring', group: 'pump', fits: '1-bowl', step: 16},
  {ref: 32, name: 'PLUNGER, STARTER', role: 'starter (cold start) plunger', group: 'starters', fits: '1', step: 6},
  {ref: 33, name: 'SPRING, PLUNGER', role: 'starter plunger spring', group: 'starters', fits: '32', step: 6},
  {ref: 34, name: 'SEAL', role: 'starter plunger seal', group: 'starters', fits: '32', step: 6},
  {ref: 35, name: 'O-RING', role: 'O-ring', group: 'starters', fits: '32', step: 6},
  {ref: 36, name: 'SCREW', role: 'screw', group: 'sensor', fits: '47', step: 3},
  {ref: 37, name: 'O-RING', role: 'float chamber plug O-ring', group: 'bowl', fits: '38', step: 17},
  {ref: 38, name: 'PLUG, SCREW', role: 'float chamber bottom plug (main jet access)', group: 'bowl', fits: '1-bowl', step: 17},
  {ref: 39, name: 'CLIP', role: 'hose clip', group: 'hoses', fits: '57', step: 2},
  {ref: 40, name: 'PLATE', role: 'plate', group: 'linkage', fits: '1', step: 8},
  {ref: 41, name: 'PLATE', role: 'plate', group: 'linkage', fits: '1', step: 8},
  {ref: 42, name: 'SCREW', role: 'screw', group: 'linkage', fits: '1', step: 8},
  {ref: 43, name: 'SPRING, ADJUST SCREW', role: 'adjusting screw spring', group: 'linkage', fits: '44', step: 8},
  {ref: 44, name: 'SCREW', role: 'screw', group: 'linkage', fits: '40', step: 8},
  {ref: 45, name: 'PLATE', role: 'plate', group: 'pump', fits: '1-bowl', step: 15},
  {ref: 46, name: 'SWITCH, CARBURETOR', role: 'carburetor switch (with throttle stop screw assembly)', group: 'sensor', fits: '1', step: 5, specs: ['engine_idle_speed']},
  {ref: 47, name: 'THROTTLE SENSOR ASSY', role: 'throttle position sensor', group: 'sensor', fits: '1', step: 3, specs: ['tps_input_voltage', 'tps_output_voltage', 'tps_resistance']},
  {ref: 48, name: 'NEEDLE', role: 'jet needle (NDSR, clip groove 4)', group: 'slide', fits: '9', step: 12, specs: ['jet_needle_clip']},
  {ref: 49, name: 'SCREW, PILOT', role: 'pilot screw', group: 'mixture', fits: '1', step: null},
  {ref: 50, name: 'COIL, SPRING', role: 'pilot screw spring', group: 'mixture', fits: '49', step: null},
  {ref: 51, name: 'O-RING', role: 'pilot screw O-ring', group: 'mixture', fits: '49', step: null},
  {ref: 52, name: 'WASHER', role: 'pilot screw washer', group: 'mixture', fits: '49', step: null},
  {ref: 53, name: 'PLUNGER, STARTER', role: 'hot start plunger', likely: true, group: 'starters', fits: '1', step: 6},
  {ref: 54, name: 'CAP', role: 'cap', group: 'starters', fits: '1', step: 6},
  {ref: 55, name: 'SCREW', role: 'screw', group: 'sensor', fits: '59', step: 4},
  {ref: 56, name: 'SPRING', role: 'spring', group: 'starters', fits: '53', step: 6},
  {ref: 57, name: 'PIPE', role: 'air vent pipe/hose', group: 'hoses', fits: '1', step: 2},
  {ref: 58, name: 'HOSE', role: 'hose', group: 'hoses', fits: '1', step: 2},
  {ref: 59, name: 'COVER 1', role: 'cover', group: 'sensor', fits: '1', step: 4},
  {ref: 60, name: 'COVER 2', role: 'cover', group: 'sensor', fits: '59', step: 4},
  {ref: 61, name: 'GASKET', role: 'gasket', group: 'sensor', fits: '59', step: 4},
  {ref: 62, name: 'O-RING', role: 'O-ring', group: 'sensor', fits: '47', step: 3},
  {ref: 63, name: 'PLATE', role: 'plate', group: 'sensor', fits: '46', step: 5},
  {ref: 64, name: 'SPRING, PLUNGER', role: 'plunger spring', group: 'starters', fits: '53', step: 6},
  {ref: 65, name: 'COVER 1', role: 'throttle cable cover', group: 'linkage', fits: '1', step: 'A4', specs: ['torque.throttle_cable_cover_bolt_M5']},
  {ref: 66, name: 'GASKET', role: 'throttle cable cover gasket', likely: true, group: 'linkage', fits: '65', step: 'A4'},
  {ref: 67, name: 'SEAL', role: 'seal', group: 'linkage', fits: '65', step: 'A4'},
  {ref: 68, name: 'HOSE', role: 'hose', group: 'hoses', fits: '65', step: 2},
  {ref: 69, name: 'CLIP', role: 'hose clip', group: 'hoses', fits: '68', step: 2},
  {ref: 70, name: 'BOLT (qty 2)', role: 'throttle cable cover bolt', group: 'linkage', fits: '65', step: 'A4', specs: ['torque.throttle_cable_cover_bolt_M5']},
  {ref: 71, name: 'PIPE', role: 'drain pipe', group: 'hoses', fits: '1-bowl', step: 1},
  {ref: 72, name: 'TUBE, FLEXIBLE VINYL', role: 'drain hose', group: 'hoses', fits: '71', step: 1},
  {ref: 73, name: 'PIPE, FUEL 1', role: 'fuel hose', group: 'hoses', fits: 'K83', step: 'A3'},
  {ref: 74, name: 'CLIP', role: 'fuel hose clip', group: 'hoses', fits: '73', step: 'A3'},
  {ref: 75, name: 'CLAMP', role: 'clamp', group: 'hoses', fits: '72', step: 1},
  {ref: 76, name: 'CLIP', role: 'fuel hose clip', group: 'hoses', fits: '73', step: 'A3'},
  {ref: 77, name: 'JET (#50)', role: 'accelerator (leak) jet', likely: true, group: 'jets', fits: '1-bowl', step: 18},
  {ref: 78, name: 'DIAPHRAGM ASSY', role: 'pilot air diaphragm', group: 'pilot-air', fits: '1', step: 14},
  {ref: 79, name: 'SPRING, DIAPHRAGM', role: 'pilot air diaphragm spring', group: 'pilot-air', fits: '78', step: 13},
];

// Reference 1 is the whole assembly; the drawings show these pieces of it, which the fiche does not list on
// their own. Each is clickable as reference 1 with the piece named.
export const PIECES = {
  '1': {piece: 'body (main casting)', group: 'body', fits: null, step: null},
  '1-top': {piece: 'top cover', group: 'top', fits: '1', step: 7},
  '1-pilot': {piece: 'pilot air diaphragm cover', group: 'pilot-air', fits: '1', step: 13},
  '1-bowl': {piece: 'float chamber', group: 'bowl', fits: '1', step: 17, specs: ['float_height']},
  '1-spacer': {piece: 'spacer (under the needle jet)', group: 'jets', fits: '17', step: 24},
  // the manual's main jet #158 has no reference of its own on this fiche (reference 20 is the #100 pilot air jet)
  '1-mainjet': {piece: 'main jet', role: 'main jet (the manual lists #158; this fiche has no reference of its own for it, its #100 jet is reference 20). Check the number stamped on your jet.', group: 'jets', fits: '17', step: 22, specs: ['main_jet']},
  // run 11 (item 3): the Keihin FCR-MX diagram's parts that had no mesh of their own (scratch/parts_map.txt), each a
  // clickable piece of the fiche reference it belongs to (of), named "<name> · part of <of>". k: the Keihin number.
  // step: the tear-down step it comes off with (that of the part it rides on), null: it stays on the body. Run 16 (correction 34): the 5
  // throttle shaft parts (K12, K14, K15, K16, K18; run 17: K16 rides in step 9) are named by no step of the manual's list, so they stay in the body like reference 1.
  K10: {k: 10, of: '65', piece: 'bracket', role: 'cable bracket: holds the throttle cable adjuster', group: 'linkage', fits: '65', step: 1},
  K11: {k: 11, of: '65', piece: 'screw, M5 x 8', role: 'cable bracket screw', group: 'linkage', fits: 'K10', step: 1},
  K12: {k: 12, of: '1', piece: 'throttle shaft', role: 'throttle shaft with the cable wheel on its cable-side end', group: 'body', fits: '1', step: null},
  K14: {k: 14, of: '1', piece: 'coil spring', role: 'throttle return spring, behind the cable wheel', group: 'body', fits: 'K12', step: null},
  K15: {k: 15, of: '1', piece: 'washer', role: 'throttle shaft washer', group: 'body', fits: 'K12', step: null},
  K16: {k: 16, of: '1', piece: 'link arm', role: 'lift lever on the throttle shaft: lifts the throttle valve by its rollers', group: 'body', fits: 'K12', step: 9}, // run 17 (item 5): page 6-2 draws the forked lever under screw 8 coming off with it
  K18: {k: 18, of: '1', piece: 'stop screw', role: 'stop screw in the link arm', group: 'body', fits: 'K16', step: null},
  K36: {k: 36, of: '23', piece: 'valve seat', role: 'float needle valve seat', group: 'float', fits: '1', step: 22, specs: ['valve_seat']},
  K37: {k: 37, of: '23', piece: 'O-ring', role: 'valve seat O-ring', group: 'float', fits: 'K36', step: 22},
  K38: {k: 38, of: '23', piece: 'screw', role: 'valve seat retaining screw', group: 'float', fits: '1', step: 22},
  K44: {k: 44, of: '23', piece: 'fuel screen', role: 'fuel screen on the valve seat', group: 'float', fits: 'K36', step: 22},
  K52: {k: 52, of: '1', piece: 'U-ring', role: 'pump rod seal in the float chamber', group: 'bowl', fits: '1-bowl', step: 18},
  K66: {k: 66, of: '1', piece: 'coil spring 1', role: 'torsion spring on the pump link pin, behind link lever 40', group: 'linkage', fits: '40', step: 9},
  K67: {k: 67, of: '1', piece: 'coil spring 2', role: 'torsion spring on the pump link pin, behind link lever 41', group: 'linkage', fits: '41', step: 9},
  K69: {k: 69, of: '1', piece: 'washer', role: 'pump link pin washer', group: 'linkage', fits: '1', step: 9},
  K70: {k: 70, of: '1', piece: 'E-clip', role: 'pump link pin E-clip', group: 'linkage', fits: '1', step: 9},
  K72: {k: 72, of: '1', piece: 'rod', role: 'accelerator pump rod: link lever 41 pushes the pump diaphragm through it', group: 'bowl', fits: '41', step: 18},
  K83: {k: 83, of: '1', piece: 'fuel joint', role: 'fuel inlet joint: the fuel hose goes on it', group: 'bowl', fits: '1-bowl', step: 18},
  K85: {k: 85, of: '1', piece: 'O-rings (3)', role: 'fuel joint O-rings', group: 'bowl', fits: 'K83', step: 18},
  K91: {k: 91, of: '46', piece: 'washer', role: 'idle speed screw washer', group: 'sensor', fits: '46', step: 6},
  K92: {k: 92, of: '46', piece: 'coil spring', role: 'idle speed screw spring', group: 'sensor', fits: '46', step: 6},
  K103: {k: 103, of: '1', piece: 'main air jet', role: 'main air jet, in the air-box spigot beside the pilot air jet', group: 'jets', fits: '1', step: 28, specs: ['main_air_jet']},
  K177: {k: 177, of: '46', piece: 'stop screw', role: 'carburetor switch screw', group: 'sensor', fits: '63', step: 6},
  // run 13 (item 4): the throttle sensor's hardware, Keihin 241 (Torx screw), 199 (washer) and 109 (collar) on its ear; K140, a body screw
  K109: {k: 109, of: '47', piece: 'collar', role: 'throttle sensor collar, between its ear and the cover plate', group: 'sensor', fits: '47', step: 4},
  K199: {k: 199, of: '47', piece: 'washer', role: 'throttle sensor screw washer', group: 'sensor', fits: '47', step: 4},
  K241: {k: 241, of: '47', piece: 'Torx screw', role: 'throttle sensor Torx screw through its ear', group: 'sensor', fits: '47', step: 4},
  K140: {k: 140, of: '1', piece: 'screw', role: 'small body screw above the carburetor switch stop screw', group: 'sensor', fits: '1', step: 6},
};
/** The Keihin pieces, in Keihin order. */
export const KPIECES = Object.keys(PIECES).filter((id) => PIECES[id].k);

// run 13 (item 3, scratch/parts_map.txt): the Keihin FCR-MX diagram numbers that sit on each fiche reference, and the
// quantities the fiche table gives (refs 61-79; the table's refs 1-60 and its qty are in no source this page may read)
export const KEIHIN = {'2': [6], '3': [7], '4': [8], '5': [7], '6': [249], '9': [19], '10': [20], '11': [21], '12': [22], '13': [24], '14': [25], '15': [243], '16': [244], '17': [26], '18': [28], '19': [29], '20': [30], '21': [39], '22': [40], '23': [42], '24': [43], '25': [45], '26': [46], '27': [47], '28': [51], '30': [53], '31': [54], '32': [55], '36': [100], '37': [122], '38': [123], '39': [152], '40': [64], '41': [65], '43': [251], '44': [250], '45': [209], '46': [90], '47': [96], '48': [23], '49': [32], '50': [33], '51': [34], '52': [35], '53': [245], '57': [148], '58': [206], '62': [180], '65': [264], '68': [207], '70': [265], '75': [205], '78': [211], '79': [213]};
export const QTY = {61: 1, 62: 1, 64: 1, 65: 1, 66: 1, 67: 1, 68: 1, 69: 1, 70: 2, 71: 1, 73: 1, 74: 1, 75: 1, 76: 1, 77: 1, 78: 1, 79: 1};

// run 13 (item 13): the seals, O-rings, gaskets and diaphragms (by their fiche names, and the Keihin pieces that are rings), which are
// usually replaced at a rebuild. qty: the fiche table's quantity where it gives one (refs 61-79) or what the diagram draws (K85: 3
// rings); known: false = the sources give none and the line counts once (1 per carburetor, as the model has it).
const KIT_KIND = (n) => (/^GASKET/.test(n) ? 'gasket' : /^O-RING/.test(n) ? 'O-ring' : /^SEAL/.test(n) ? 'seal' : /^DIAPHRAGM/.test(n) ? 'diaphragm' : null);
export const KIT = [
  ...PARTS.filter((p) => KIT_KIND(p.name)).map((p) => ({id: String(p.ref), kind: KIT_KIND(p.name), qty: QTY[p.ref] ?? 1, known: p.ref in QTY})),
  {id: 'K37', kind: 'O-ring', qty: 1, known: false},
  {id: 'K52', kind: 'seal', qty: 1, known: false},
  {id: 'K85', kind: 'O-ring', qty: 3, known: true},
].sort((a, b) => (parseInt(a.id.replace('K', '1000')) || 0) - (parseInt(b.id.replace('K', '1000')) || 0));
export const KIT_TOTAL = KIT.reduce((s, k) => s + k.qty, 0);
export const inKit = (id) => KIT.some((k) => k.id === id);

export const CONFLICT_20 = 'Fiche: JET, MAIN (#100). Manual: main jet #158, pilot air jet #100. Shown here as the pilot air jet (#100, in the air-box spigot); the #158 main jet has no reference of its own on this fiche. Check the number stamped on your jet.';

// --- the 13 groups, in the manual's disassembly order. dir: the way the group really comes off, carb space
// (+X the spigot toward the engine, -X the spigot toward the air box, +Y up, +Z the throttle sensor side).
export const GROUPS = [
  {key: 'hoses', label: 'Hoses', dir: [0, -1, 0]},
  {key: 'sensor', label: 'Sensor', dir: [0, 0.3, 1]},
  {key: 'starters', label: 'Starters', dir: [0, 0.4, 1]},
  {key: 'top', label: 'Top', dir: [0, 1, 0]},
  {key: 'slide', label: 'Slide', dir: [0, 1, 0]},
  {key: 'linkage', label: 'Linkage', dir: [0, 0, -1]},
  {key: 'pilot-air', label: 'Pilot air', dir: [0, -0.2, 1]},
  {key: 'pump', label: 'Pump', dir: [-0.5, -1, 0]},
  {key: 'bowl', label: 'Bowl', dir: [0, -1, 0]},
  {key: 'float', label: 'Float', dir: [0, -1, 0]},
  {key: 'jets', label: 'Jets', dir: [0, -1, 0]},
  {key: 'mixture', label: 'Mixture', dir: [0.5, -1, 0]},
  {key: 'body', label: 'Body', dir: [0, 0, 0]},
];

// --- steps.md
export const STEPS_A = {
  before: 'Seat, fuel tank cover and both side covers come off first.',
  list: [
    {n: 1, text: 'Throttle position sensor coupler: disconnect', parts: ['47']},
    {n: 2, text: 'Carburetor switch coupler: disconnect', parts: ['46']},
    {n: 3, text: 'Fuel hose, carburetor side', parts: ['73', '74', '76']},
    {n: 4, text: 'Throttle cable cover (2 bolts, 4 Nm)', parts: ['65', '70', '66', '67']},
    {n: 5, text: 'Throttle cable', parts: []},
    {n: 6, text: 'Clamp, air intake duct side: loosen', parts: []},
    {n: 7, text: 'Clamps on the carburetor joint (2): loosen', parts: []},
    {n: 8, text: 'Carburetor', parts: ['1']},
    {n: 9, text: 'Carburetor joint', parts: []},
  ],
  owner:
    "Free the throttle cable at the handlebar housing first for slack; push the air box boot back off the carburetor; loosen the engine-side joint clamp and twist the carburetor rearward off the engine; lower it, turn its bottom toward the shifter side and take it out that side, minding the pilot screw, sensor wires and hoses.",
};

// Section B, manual order; reassembly (REBUILD) is the reverse. parts: the part ids the step takes off.
const MANUAL_B = [
  {n: 1, text: 'Drain hose', parts: ['72', '75', '71']},
  {n: 2, text: 'Air vent hoses (2)', parts: ['57', '58', '39', '68', '69']},
  {n: 3, text: 'Throttle position sensor', parts: ['47', '36', '62']},
  {n: 4, text: 'Cover', parts: ['59', '60', '61', '55']},
  {n: 5, text: 'Carburetor switch / throttle stop screw assembly', parts: ['46', '63']},
  {n: 6, text: 'Starter plunger', parts: ['32', '33', '34', '35', '53', '54', '56', '64']},
  {n: 7, text: 'Carburetor top cover', parts: ['3', '1-top', '2']},
  {n: 8, text: 'Screw (throttle shaft)', parts: ['42', '40', '41', '43', '44']},
  {n: 9, text: 'Throttle valve', parts: ['9', '10']},
  {n: 10, text: 'Throttle valve plate', parts: ['11', '12']},
  {n: 11, text: 'Needle holder', parts: ['14', '15', '16']},
  {n: 12, text: 'Jet needle', parts: ['48', '13']},
  {n: 13, text: 'Cover and spring (pilot air)', parts: ['1-pilot', '79']},
  {n: 14, text: 'Pilot air diaphragm', parts: ['78']},
  {n: 15, text: 'Cover and spring (accelerator pump)', parts: ['27', '30', '4', '29', '45', '8', '6', '7']},
  {n: 16, text: 'Accelerator pump diaphragm', parts: ['28', '31']},
  {n: 17, text: 'Float chamber', parts: ['5', '1-bowl', '25', '26', '38', '37']},
  {n: 18, text: 'Accelerator jet', parts: ['77']},
  {n: 19, text: 'Float pin', parts: ['22']},
  {n: 20, text: 'Float', parts: ['21']},
  {n: 21, text: 'Needle valve', parts: ['23', '24']},
  {n: 22, text: 'Main jet', parts: ['1-mainjet']},
  {n: 23, text: 'Needle jet', parts: ['17']},
  {n: 24, text: 'Spacer', parts: ['1-spacer']},
  {n: 25, text: 'Pilot jet', parts: ['18']},
  {n: 26, text: 'Starter jet', parts: ['19']},
  {n: 27, text: 'Pilot air jet', parts: ['20'], note: 'Reference 20, the #100 jet: check the number stamped on your jet.'},
];
// The page's tear-down: the manual's 27 steps (m: the manual's number) between 2 added steps, so that every
// reference but 1 (the base) comes off in exactly 1 step. added: shown as "added step, not in the manual's list".
export const ADDED_STEP = 'Added step, not in the manual’s list.';
export const STEPS_B = [
  {n: 1, m: null, added: true, text: 'Throttle cable cover and fuel hose', parts: ['70', '65', '66', '67', '73', '74', '76'], note: 'These come off on the ATV, before the carburetor (section A: fuel hose, then the throttle cable cover, 2 bolts, 4 Nm).'},
  ...MANUAL_B.map((s) => ({...s, m: s.n, n: s.n + 1})),
  {n: 29, m: null, added: true, text: 'Pilot screw set', parts: ['49', '50', '52', '51'], note: 'Turn the pilot screw in until it seats, counting the turns, before it comes out.', rnote: 'Turn the pilot screw in until it seats, then out the number of turns you wrote down before disassembly.'},
];
export const N_B = STEPS_B.length;
// run 16 (correction 34): the parts the manual's list names (section A's steps and section B's 27); every other part keeps its step on the page
// but its card says it is not named in the manual's list. The 5 throttle shaft parts have no step at all.
// Run 17 (item 5): 12 parts ride in a step whose manual line does not name them (the plates, spring and screw of the throttle shaft screw's step; the
// starter plunger's second set; the pump cover's plate, screw and washers).
export const NOT_NAMED = ['40', '41', '43', '44', '53', '54', '56', '64', '45', '8', '6', '7'];
const NAMED = new Set([...STEPS_A.list, ...MANUAL_B].flatMap((s) => s.parts).filter((id) => !NOT_NAMED.includes(id)));
export const inManual = (id) => NAMED.has(id);
// each part's tear-down step on the page (reference 1, the body, has none: everything comes off it)
for (const s of STEPS_B) for (const id of s.parts) (PIECES[id] || PARTS.find((p) => String(p.ref) === id)).step = s.n;

// Section C: the notes the page shows at the matching step. at: {mode: 'teardown'|'rebuild', step}
// (rebuild steps are numbered in rebuild order: rebuild n = tear-down step 30 - n).
export const NOTES_C = [
  {key: 'pilot-turns', at: [{mode: 'teardown', step: 1}], text: 'Before disassembly: count and write down the pilot screw turns from seated.'},
  {key: 'clean', at: [{mode: 'rebuild', step: 1}], text: 'Before reassembling, wash all parts in a clean petroleum-based solvent.'},
  {key: 'clip', at: [{mode: 'rebuild', step: 17}], text: 'Jet needle clip: groove 4.'},
  {key: 'float', at: [{mode: 'rebuild', step: 9}], text: 'Float height 8.0 mm: carburetor upside down, gasket removed, float arm resting on the needle valve without compressing it; adjust by bending the tang, then recheck.'},
  {key: 'pump', at: [{mode: 'rebuild', step: 29}], text: 'Pump timing, before the cover goes on: a 3.40 mm rod under the throttle valve plate; turn the adjusting screw fully in, check the link lever has free play, then turn the screw out until it has none.'},
  {key: 'joint', at: [{mode: 'rebuild', step: 29}], text: 'Fitting: the joint projection into the clamp slot, the cylinder head projection into the joint slot, the carburetor projections into the joint slot and the air duct slot.'},
  {key: 'final', at: [{mode: 'rebuild', step: 29}], text: 'After fitting: throttle lever free play 2-4 mm, idle 1,750-1,850 r/min, then the TPS output 0.58-0.78 V, checked with idle already set and the sensor plugged into the harness coupler.'},
];

// --- specs.json, verbatim (never rounded)
export const SPECS = {
  _source: 'YFZ450 service manual, chapter 2 specifications and chapter 6',
  carburetor: {manufacturer: 'Keihin', id_mark: '5TG1 00'},
  main_jet: '#158',
  main_air_jet: '1.0 mm',
  jet_needle_clip: 'NDSR, groove 4',
  cutaway: '1.5',
  pilot_air_jet: '#100',
  pilot_outlet: '0.9 mm',
  pilot_jet: '#42',
  bypass_1: '1.0 mm',
  valve_seat: '3.8 mm',
  starter_jet: '#90',
  float_height: '8.0 mm (0.31 in)',
  engine_idle_speed: '1,750-1,850 r/min',
  throttle_lever_free_play: '2-4 mm',
  throttle_valve_height_for_pump_timing: '3.40 mm (0.134 in)',
  tps_input_voltage: '5 V (blue/black)',
  tps_output_voltage: '0.58-0.78 V (yellow/black)',
  tps_resistance: '4-6 kOhm at 20 C',
  torque: {
    throttle_cable_cover_bolt_M5: '4 Nm',
    joint_clamp_screw_carb_side_M5: '3 Nm',
    joint_clamp_screw_head_side_M4: '3 Nm',
    clamp_screw_air_duct_side_M6: '3 Nm',
  },
};

// Readable labels for the SPECS table and the cards (the values always come from SPECS).
export const SPEC_LABELS = {
  'carburetor.manufacturer': 'Carburetor make',
  'carburetor.id_mark': 'I.D. mark',
  main_jet: 'Main jet',
  main_air_jet: 'Main air jet',
  jet_needle_clip: 'Jet needle / clip',
  cutaway: 'Cutaway',
  pilot_air_jet: 'Pilot air jet',
  pilot_outlet: 'Pilot outlet',
  pilot_jet: 'Pilot jet',
  bypass_1: 'Bypass 1',
  valve_seat: 'Valve seat',
  starter_jet: 'Starter jet',
  float_height: 'Float height',
  engine_idle_speed: 'Engine idle speed',
  throttle_lever_free_play: 'Throttle lever free play',
  throttle_valve_height_for_pump_timing: 'Throttle valve height (pump timing)',
  tps_input_voltage: 'TPS input voltage',
  tps_output_voltage: 'TPS output voltage',
  tps_resistance: 'TPS resistance',
  'torque.throttle_cable_cover_bolt_M5': 'Throttle cable cover bolt M5',
  'torque.joint_clamp_screw_carb_side_M5': 'Joint clamp screw, carb side M5',
  'torque.joint_clamp_screw_head_side_M4': 'Joint clamp screw, head side M4',
  'torque.clamp_screw_air_duct_side_M6': 'Clamp screw, air duct side M6',
};
export const specValue = (k) => k.split('.').reduce((o, p) => (o == null ? o : o[p]), SPECS);

// --- lookups
export const PART = Object.fromEntries(PARTS.map((p) => [String(p.ref), p]));
/** Card data for a part id ('47', or a reference-1 piece such as '1-top'). */
export function info(id) {
  const piece = PIECES[id];
  const p = PART[piece ? piece.of || '1' : id];
  return {...p, id, kk: piece ? [piece.k] : KEIHIN[id] || [], qty: piece ? null : QTY[id] ?? null, k: piece?.k || null, piece: piece?.piece || null, role: piece?.role || p.role, likely: piece ? false : p.likely, group: piece ? piece.group : p.group, fits: piece ? piece.fits : p.fits, step: piece ? piece.step : p.step, specs: piece ? piece.specs || [] : p.specs || []};
}
export const groupIndex = (key) => GROUPS.findIndex((g) => g.key === key);
/** Its name line: "47 · THROTTLE SENSOR ASSY"; a piece names itself first: "Top cover · part of 1", "Valve seat · part of 23". */
export function nameOf(id) {
  const i = info(id);
  return i.piece ? `${i.piece[0].toUpperCase()}${i.piece.slice(1)} · part of ${i.ref}` : `${i.ref} · ${i.name}`;
}

// Run 17 (item 4, manual pages 6-1 and 6-2, looked at once). LT: the screws an LT mark points to. fitNew: the parts a "New" mark points to. A mark
// that did not point to exactly 1 reference is not here (it is listed in STATUS.md).
export const LT_IDS = ['42'];
export const FIT_NEW = ['2', '25', '31', '66'];
export const needsLT = (id) => LT_IDS.includes(id);
export const fitNew = (id) => FIT_NEW.includes(id);
export const LT_TEXT = 'Apply thread locker (LT)';
NOTES_C.push({key: 'lt', at: LT_IDS.map((id) => ({mode: 'rebuild', step: N_B + 1 - PART[id].step})), text: `${LT_TEXT}: ${nameOf(LT_IDS[0])}`});

// Run 17 (item 7): the manual's check lines, quoted in meaning only, 1 per part ('1' the body, '1-bowl' the float chamber, '1-mainjet' the main jet).
const CK = {
  body: 'Cracks or damage: replace. Dirty: clean.',
  valve: 'Dirty: clean. Worn or damaged: the manual says replace the carburetor assembly.',
  slide: 'Scratched, worn or damaged: replace. Sticks in the body: replace the throttle valve and its guide.',
  jet: 'Bent, worn or damaged: replace. Blocked: blow out with compressed air.',
  six: 'Check (manual 6-6).',
};
export const CHECKS = {'1': CK.body, '1-bowl': CK.body, '21': 'Float or tang damaged: replace.', '23': CK.valve, K36: CK.valve, '9': CK.slide, '11': CK.slide,
  '48': 'Bent, worn or damaged: replace. Clip groove worn or loose: replace.', '1-mainjet': CK.jet, '17': CK.jet, '18': CK.jet, '19': CK.jet, '20': CK.jet, '77': CK.jet,
  '28': CK.six, '78': CK.six, '30': CK.six, '79': CK.six};
export const checkLine = (id) => (CHECKS[id] ? (/^Check/.test(CHECKS[id]) ? CHECKS[id] : `Check: ${CHECKS[id]}`) : null);
