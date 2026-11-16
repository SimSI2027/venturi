// VENTURI 39: everything the page knows about the carburetor, written once in run 1 from ref/
// (parts.txt, fiche.png, manual_carb.pdf pages 6-1..6-10, steps.md, specs.json). Later runs read this file, never ref/.
// 2004 YFZ450, Keihin flat-slide with accelerator pump, I.D. mark 5TG1 00.

// --- the 79 fiche references, names exactly as in parts.txt. role: parts.txt's plain-language role;
// likely: the line was marked "?" (shown as "likely: ..."). group: one of GROUPS. fits: the part it mounts on
// (a part id). step: tear-down step in section B (1-27), 'A<n>' for a step of section A (off the ATV), null when
// the manual's lists do not name it. specs: keys into SPECS (dotted for torque).
export const PARTS = [
  {ref: 1, name: 'CARBURETOR ASSY 1', role: 'complete carburetor (body is not sold separately)', group: 'body', fits: null, step: null, specs: ['carburetor.manufacturer', 'carburetor.id_mark', 'main_air_jet', 'pilot_outlet', 'bypass_1', 'torque.joint_clamp_screw_carb_side_M5', 'torque.clamp_screw_air_duct_side_M6']},
  {ref: 2, name: 'GASKET', role: 'top cover gasket', likely: true, group: 'top', fits: '1', step: 7},
  {ref: 3, name: 'BOLT', role: 'top cover bolt', likely: true, group: 'top', fits: '1-top', step: 7},
  {ref: 4, name: 'SCREW', role: 'cover screw', group: 'pump', fits: '27', step: 15},
  {ref: 5, name: 'SCREW (98502-04012)', role: 'float chamber / cover screw', likely: true, group: 'bowl', fits: '1-bowl', step: 17},
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
  {ref: 65, name: 'COVER 1', role: 'throttle cable cover', likely: true, group: 'linkage', fits: '1', step: 'A4', specs: ['torque.throttle_cable_cover_bolt_M5']},
  {ref: 66, name: 'GASKET', role: 'throttle cable cover gasket', likely: true, group: 'linkage', fits: '65', step: 'A4'},
  {ref: 67, name: 'SEAL', role: 'seal', group: 'linkage', fits: '65', step: 'A4'},
  {ref: 68, name: 'HOSE', role: 'hose', group: 'hoses', fits: '65', step: 2},
  {ref: 69, name: 'CLIP', role: 'hose clip', group: 'hoses', fits: '68', step: 2},
  {ref: 70, name: 'BOLT (qty 2)', role: 'throttle cable cover bolt', likely: true, group: 'linkage', fits: '65', step: 'A4', specs: ['torque.throttle_cable_cover_bolt_M5']},
  {ref: 71, name: 'PIPE', role: 'drain pipe', group: 'hoses', fits: '1-bowl', step: 1},
  {ref: 72, name: 'TUBE, FLEXIBLE VINYL', role: 'drain hose', group: 'hoses', fits: '71', step: 1},
  {ref: 73, name: 'PIPE, FUEL 1', role: 'fuel hose', group: 'hoses', fits: '1-bowl', step: 'A3'},
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
};

export const CONFLICT_20 = 'Fiche: JET, MAIN (#100). Manual: main jet #158, pilot air jet #100. Shown here as the pilot air jet (#100, in the bell mouth); the #158 main jet has no reference of its own on this fiche. Check the number stamped on your jet.';

// --- the 13 groups, in the manual's disassembly order. dir: the way the group really comes off, carb space
// (+X toward the engine, -X the bell mouth toward the air box, +Y up, +Z the throttle sensor side).
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
export const STEPS_B = [
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
  {n: 13, text: 'Cover and spring', parts: ['1-pilot', '79']},
  {n: 14, text: 'Pilot air diaphragm', parts: ['78']},
  {n: 15, text: 'Cover and spring', parts: ['27', '30', '4', '29', '45', '8', '6', '7']},
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

// Section C: the notes the page shows at the matching step. at: {mode: 'teardown'|'rebuild'|'atv', step}
// (rebuild steps are numbered in rebuild order: rebuild n = tear-down step 28 - n).
export const NOTES_C = [
  {key: 'pilot-turns', at: [{mode: 'teardown', step: 1}], text: 'Before disassembly: count and write down the pilot screw turns from seated.'},
  {key: 'clean', at: [{mode: 'rebuild', step: 1}], text: 'Clean in petroleum-based solvent only, no caustic cleaner; blow out all passages and jets with compressed air.'},
  {key: 'clip', at: [{mode: 'rebuild', step: 16}], text: 'Jet needle clip: groove 4.'},
  {key: 'float', at: [{mode: 'rebuild', step: 8}], text: 'Float height 8.0 mm, carburetor upside down, gasket removed, float arm resting on the needle valve without compressing it; adjust by bending the tang.'},
  {key: 'pump', at: [{mode: 'rebuild', step: 19}], text: 'Accelerator pump timing: rod of 3.40 mm under the throttle valve plate; turn the adjusting screw in fully, then out until the link lever has no free play.'},
  {key: 'joint', at: [{mode: 'atv', step: 9}, {mode: 'atv', step: 8}], text: 'Joint: projection on the joint into the clamp slot; projection on the cylinder head into the joint slot. Carburetor: its projections into the joint slot and the air duct slot.'},
  {key: 'final', at: [{mode: 'rebuild', step: 27}, {mode: 'atv', step: 9}], text: 'After fitting: throttle lever free play 2-4 mm, idle 1,750-1,850 r/min, then check the throttle position sensor (0.58-0.78 V output).'},
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
  const p = PART[piece ? '1' : id];
  return {...p, id, piece: piece?.piece || null, role: piece?.role || p.role, likely: piece ? false : p.likely, group: piece ? piece.group : p.group, fits: piece ? piece.fits : p.fits, step: piece ? piece.step : p.step, specs: piece ? piece.specs || [] : p.specs || []};
}
export const groupIndex = (key) => GROUPS.findIndex((g) => g.key === key);
