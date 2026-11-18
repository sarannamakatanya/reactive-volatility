// assets.js — 16-colour palette sprites; this file IS the art.

export const PALETTE = [
  '#0b0a12', // 0 Void
  '#171423', // 1 Panel plum
  '#2a2438', // 2 Iron
  '#e8e4d8', // 3 Bone
  '#8a7fa8', // 4 Muted lavender
  '#cdd7ff', // 5 Pure
  '#7bc47f', // 6 Harmonious
  '#e05d5d', // 7 Violent
  '#e25822', // 8 Ember orange
  '#7fd4ff', // 9 Frost blue
  '#6ab04c', // a Moss green
  '#f5d76e', // b Storm yellow
  '#9b59b6', // c Gloom purple
  '#ffd700', // d Sun gold
  '#ff9a3c', // e Flame bright
  '#6ee7d8', // f Gem teal
];

const SPRITE_DATA = {
  palette: PALETTE,
  sprites: {
    cauldron_idle: {
      fps: 1,
      frames: [[
        '............222222222222222222222222............',
        '........22221111111111111111111111112222........',
        '......222111114111111111411111111111111222......',
        '......222111111111411111111111111111111222......',
        '......222111111111111111111411111111111222......',
        '....2333333332222222222222222222222222222222....',
        '....2422222222222222222222222222222222222212....',
        '....2422222222222222222222222222222222222212....',
        '221.2422222222222222222222222222222222222212.122',
        '221.2422222222222222222222222222222222222212.122',
        '221.2422222222222222222222222222222222222212.122',
        '....2422222222222222222222222222222222222212....',
        '....2422222222222222222222222222222222222212....',
        '....2422222222222222222222222222222222222212....',
        '....24dddddddddddddddddddddddddddddddddddd12....',
        '....2422222222222222222222222222222222222212....',
        '....2422222222222222222222222222222222222212....',
        '....2442222222222222222222222222222222222212....',
        '....2444222222222222222222222222222222222212....',
        '....2442222222222222222222222222222222222212....',
        '....2422222222222222222222222222222222222212....',
        '....2422222222222222222222222222222222222212....',
        '....2422222222222222222222222222222222222212....',
        '....2422222222222222222222222222222222222212....',
        '....2422222222222222222222222222222222222212....',
        '....2422222222222222222222222222222222222212....',
        '.....24111111111111111111111111111111111112.....',
        '.....24222222222222222222222222222222222212.....',
        '.....24222222222222222222222222222222222212.....',
        '.....24222222222222222222222222222222222212.....',
        '......242222222222222222222222222222222212......',
        '......242222222222222222222222222222222212......',
        '......242222222222222222222222222222222212......',
        '.......2422222222222222222222222222222212.......',
        '........24222222222222222222222222222212........',
        '.........422222222222222222222222222221.........',
        '............422222222222222222222221............',
        '.............2221..............2221.............',
        '.............2221....ee..88....2221.............',
        '.............2221..............2221.............',
      ]],
    },
    cauldron_bubble: {
      fps: 4,
      frames: [[
        '................................',
        '....33......33.......33.........',
        '....33......33.......33.........',
        '................................',
      ], [
        '...33.......33........33........',
        '...33.......33........33........',
        '................................',
        '................................',
      ]],
    },
    cauldron_runaway: {
      fps: 8,
      frames: [[
        '.ee....77....ee......77....ee...',
        '.ee....77....ee......77....ee...',
        '...ee.....77.....ee.....77......',
        '...ee.....77.....ee.....77......',
      ], [
        '...ee.....77.....ee.....77......',
        '...ee.....77.....ee.....77......',
        '.ee....77....ee......77....ee...',
        '.ee....77....ee......77....ee...',
      ]],
    },
    workshop_window: {
      fps: 1,
      frames: [[
        '.....222222.....',
        '....22111122....',
        '...2211111122...',
        '...2113333112...',
        '...2133333312...',
        '..221333333122..',
        '..221333333122..',
        '..221133331122..',
        '..220100010122..',
        '..220110011022..',
        '..220100010122..',
        '..222222222222..',
        '..220100010122..',
        '..220110010122..',
        '..220000000022..',
        '..220000000022..',
        '..222222222222..',
        '.22222222222222.',
      ]],
    },
    workshop_shelf: {
      fps: 1,
      frames: [[
        '...9....c....7....6....9....',
        '..999..ccc..777..666..999...',
        '..999..ccc..777..666..999...',
        '..999..ccc..777..666..999...',
        '..999..ccc..777..666..999...',
        '2222222222222222222222222222',
        '1111111111111111111111111111',
        '............................',
      ]],
    },
    workshop_lantern: {
      fps: 2,
      frames: [[
        '..2222..',
        '..2dd2..',
        '..2222..',
        '.222222.',
        '.2eeee2.',
        '.2edde2.',
        '.2eeee2.',
        '.2edde2.',
        '.222222.',
        '..2222..',
        '...22...',
        '...22...',
      ], [
        '..2222..',
        '..2dd2..',
        '..2222..',
        '.222222.',
        '.2edde2.',
        '.2eeee2.',
        '.2edde2.',
        '.2eeee2.',
        '.222222.',
        '..2222..',
        '...22...',
        '...22...',
      ]],
    },
    workshop_herbs: {
      fps: 1,
      frames: [[
        '....44....',
        '....44....',
        '...aaaa...',
        '..aaaaaa..',
        '..a6aa6a..',
        '.aaaaaaaa.',
        '.aa6aa6aa.',
        '..aaaaaa..',
        '..a6aa6a..',
        '...aaaa...',
        '....aa....',
        '....aa....',
      ]],
    },
    workshop_cat: {
      fps: 1,
      frames: [[
        '..2......2....',
        '..22....22....',
        '..00000000....',
        '.0000000000...',
        '.00d0000d000..',
        '.0000000000...',
      ]],
    },
    portrait_brass: {
      fps: 1,
      frames: [[
        '....dddddd....',
        '...dddddddd...',
        '...deeeeeed...',
        '....333333....',
        '....303303....',
        '....333333....',
        '.....3333.....',
        '....dddddd....',
        '...dddddddd...',
        '..dddddddddd..',
        '..ddedddeddd..',
        '..dddddddddd..',
        '.dddddddddddd.',
        '.dd..eeee..dd.',
      ]],
    },
    portrait_vex: {
      fps: 1,
      frames: [[
        '...cccccccc...',
        '..cccccccccc..',
        '.cccccccccccc.',
        '....333333....',
        '....303303....',
        '....333333....',
        '.....3773.....',
        '....444444....',
        '...44444444...',
        '..cccccccccc..',
        '..cccccccccc..',
        '.cccccccccccc.',
        '.cc........cc.',
        '..............',
      ]],
    },
    portrait_clock: {
      fps: 1,
      frames: [[
        '....999999....',
        '....999999....',
        '...dddddddd...',
        '....d99d99....',
        '....333333....',
        '....303303....',
        '....333333....',
        '.....3333.....',
        '...99999999...',
        '..9999999999..',
        '..999d999d99..',
        '..9999999999..',
        '.999999999999.',
        '..............',
      ]],
    },
    portrait_anselm: {
      fps: 1,
      frames: [[
        '....333333....',
        '...33333333...',
        '...33433333...',
        '....333333....',
        '....303303....',
        '....333333....',
        '.....3333.....',
        '....333333....',
        '...43333334...',
        '..4333333334..',
        '..4333333334..',
        '.433333333334.',
        '.433..33..334.',
        '..............',
      ]],
    },
    portrait_sailor: {
      fps: 1,
      frames: [[
        '....999999....',
        '....999999....',
        '....399993....',
        '....333333....',
        '....303303....',
        '....333333....',
        '.....3333.....',
        '...aaaaaaaa...',
        '..aaaaaaaaaa..',
        '..aa9aaaaa9a..',
        '..aaaaaaaaaa..',
        '.aaaaaaaaaaaa.',
        '.aa........aa.',
        '..............',
      ]],
    },
    portrait_crowe: {
      fps: 1,
      frames: [[
        '....222222....',
        '....222222....',
        '....333333....',
        '....303303....',
        '....333333....',
        '.....3773.....',
        '...77777777...',
        '..7777777777..',
        '..7777777777..',
        '.777777777777.',
        '.777777777777.',
        '.777..2222777.',
        '..7...2222.7..',
        '..............',
      ]],
    },
    ing_ember: {
      fps: 1,
      frames: [[
        '................',
        '.......8........',
        '......888.......',
        '......8e8.......',
        '.....88888......',
        '.....8eee8......',
        '....8888888.....',
        '....88eee88.....',
        '...888888888....',
        '...888ee8888....',
        '...888888888....',
        '..88888888888...',
        '..88888888888...',
        '...888888888....',
        '....8888888.....',
        '................',
      ]],
    },
    ing_frost: {
      fps: 1,
      frames: [[
        '.......99.......',
        '.......99.......',
        '..9....99....9..',
        '...9...99...9...',
        '....9..99..9....',
        '.....9.99.9.....',
        '......9999......',
        '.99999933999999.',
        '......9939......',
        '.....9.99.9.....',
        '....9..99..9....',
        '...9...99...9...',
        '..9....99....9..',
        '.......99.......',
        '.......99.......',
        '................',
      ]],
    },
    ing_moss: {
      fps: 1,
      frames: [[
        '................',
        '................',
        '.....aaaaaa.....',
        '...aaaaaaaaaa...',
        '..aaaaaaaaaaaa..',
        '..aa33aaaa33aa..',
        '..aaaaaaaaaaaa..',
        '..aaaaaaaaaaaa..',
        '...aaaaaaaaaa...',
        '.....aaaaaa.....',
        '.......33.......',
        '.......33.......',
        '.......33.......',
        '......3333......',
        '................',
        '................',
      ]],
    },
    ing_storm: {
      fps: 1,
      frames: [[
        '..........bb....',
        '.........bbb....',
        '........bbbb....',
        '.......bbbbb....',
        '......bbbb......',
        '.....bbdb.......',
        '....bbbbbbbbb...',
        '...bbbbbbbbbb...',
        '....bbbbbb......',
        '.....bbbb.......',
        '.....dbbb.......',
        '....bbbb........',
        '....bbb.........',
        '...bbb..........',
        '..bb............',
        '................',
      ]],
    },
    ing_gloom: {
      fps: 1,
      frames: [[
        '................',
        '.....cccccc.....',
        '...cccccccccc...',
        '..cccccccccccc..',
        '..cc44cccc44cc..',
        '..cccccccccccc..',
        '..cccccccccccc..',
        '...cccccccccc...',
        '.....cccccc.....',
        '.......44.......',
        '.......44.......',
        '.......44.......',
        '......4444......',
        '................',
        '................',
        '................',
      ]],
    },
    ing_sun: {
      fps: 1,
      frames: [[
        '.....e....e.....',
        '......e..e......',
        '.......ee.......',
        '.....dddddd.....',
        '....dddddddd....',
        '...dddddddddd...',
        '...ddd33dddd....',
        '...dddddddddd...',
        '...dddddddddd...',
        '....dddddddd....',
        '.....dddddd.....',
        '.......ee.......',
        '......e..e......',
        '.....e....e.....',
        '................',
        '................',
      ]],
    },
    flame_low: {
      fps: 6,
      frames: [[
        '................',
        '................',
        '................',
        '................',
        '.......8........',
        '......888.......',
        '......8e8.......',
        '.....88888......',
        '.....88e88......',
        '....8888888.....',
        '....8888888.....',
        '....8888888.....',
        '.....88888......',
        '......888.......',
        '.......8........',
        '...2222222222...',
      ], [
        '................',
        '................',
        '................',
        '................',
        '......8.........',
        '.....888........',
        '.....8e8........',
        '....88888.......',
        '....88e88.......',
        '...8888888......',
        '...8888888......',
        '...8888888......',
        '....88888.......',
        '.....888........',
        '......8.........',
        '...2222222222...',
      ]],
    },
    flame_med: {
      fps: 6,
      frames: [[
        '.......8........',
        '......888.......',
        '......8e8.......',
        '.....88888......',
        '.....8eee8......',
        '....8888888.....',
        '....88eee88.....',
        '...888888888....',
        '...88eeeee88....',
        '...888888888....',
        '..88888888888...',
        '..8888eee8888...',
        '..88888888888...',
        '...888888888....',
        '....8888888.....',
        '...2222222222...',
      ], [
        '........8.......',
        '.......888......',
        '.......8e8......',
        '......88888.....',
        '......8eee8.....',
        '.....8888888....',
        '.....88eee88....',
        '....888888888...',
        '....88eeeee88...',
        '....888888888...',
        '...88888888888..',
        '...8888eee8888..',
        '...88888888888..',
        '....888888888...',
        '.....8888888....',
        '...2222222222...',
      ]],
    },
    flame_high: {
      fps: 6,
      frames: [[
        '.......e........',
        '......eee.......',
        '......e7e.......',
        '.....eeeee......',
        '.....ee7ee......',
        '....eeeeeee.....',
        '....ee777ee.....',
        '...eeeeeeeee....',
        '...ee88888ee....',
        '..eeee8888eee...',
        '..ee88888888ee..',
        '..888888888888..',
        '..88888ee88888..',
        '...8888888888...',
        '....88888888....',
        '...2222222222...',
      ], [
        '........e.......',
        '.......eee......',
        '.......e7e......',
        '......eeeee.....',
        '......ee7ee.....',
        '.....eeeeeee....',
        '.....ee777ee....',
        '....eeeeeeeee...',
        '....ee88888ee...',
        '...eeee8888eee..',
        '...ee88888888ee.',
        '...888888888888.',
        '...88888ee88888.',
        '....8888888888..',
        '.....88888888...',
        '...2222222222...',
      ]],
    },
    potion: {
      fps: 2,
      frames: [[
        '......2222......',
        '......3553......',
        '......3553......',
        '......3333......',
        '.....333333.....',
        '....33333333....',
        '...3355555533...',
        '..335555555533..',
        '..355555555553..',
        '..355555555553..',
        '..355555555553..',
        '..335555555533..',
        '...3355555533...',
        '....33333333....',
        '.....333333.....',
        '................',
      ], [
        '......2222......',
        '......3553......',
        '......3553......',
        '......3333......',
        '.....333333.....',
        '....33333333....',
        '...3355555533...',
        '..335355555533..',
        '..355555555553..',
        '..355555555553..',
        '..355555555353..',
        '..335555555533..',
        '...3355555533...',
        '....33333333....',
        '.....333333.....',
        '................',
      ], [
        '......2222......',
        '......3663......',
        '......3663......',
        '......3333......',
        '.....333333.....',
        '....33333333....',
        '...3366666633...',
        '..336666666633..',
        '..366666666663..',
        '..366666666663..',
        '..366666666663..',
        '..336666666633..',
        '...3366666633...',
        '....33333333....',
        '.....333333.....',
        '................',
      ], [
        '......2222......',
        '......3663......',
        '......3663......',
        '......3333......',
        '.....333333.....',
        '....33333333....',
        '...3366666633...',
        '..336366666633..',
        '..366666666663..',
        '..366666666663..',
        '..366666666363..',
        '..336666666633..',
        '...3366666633...',
        '....33333333....',
        '.....333333.....',
        '................',
      ], [
        '......2222......',
        '......3773......',
        '......3773......',
        '......3333......',
        '.....333333.....',
        '....33333333....',
        '...3377777733...',
        '..337777777733..',
        '..377777777773..',
        '..377777777773..',
        '..377777777773..',
        '..337777777733..',
        '...3377777733...',
        '....33333333....',
        '.....333333.....',
        '................',
      ], [
        '......2222......',
        '......3773......',
        '......3773......',
        '......3333......',
        '.....333333.....',
        '....33333333....',
        '...3377777733...',
        '..337377777733..',
        '..377777777773..',
        '..377777777773..',
        '..377777777373..',
        '..337777777733..',
        '...3377777733...',
        '....33333333....',
        '.....333333.....',
        '................',
      ]],
    },
    coin: {
      fps: 1,
      frames: [[
        '....2222....',
        '..22dddd22..',
        '.2dddddddd2.',
        '.2dd33dddd2.',
        '2ddd33ddddd2',
        '2dddddddddd2',
        '2dddddddddd2',
        '2dddddddddd2',
        '.2dddddddd2.',
        '.2ddddddd2..',
        '..22dddd22..',
        '....2222....',
      ]],
    },
    gem: {
      fps: 1,
      frames: [[
        '.....ff.....',
        '....ffff....',
        '...ffffff...',
        '..ffffffff..',
        '.ffffffffff.',
        '.f33ffff99f.',
        '..ffffffff..',
        '...ffffff...',
        '....ffff....',
        '.....ff.....',
        '............',
        '............',
      ]],
    },
    contract_seal: {
      fps: 1,
      frames: [[
        '................',
        '.....777777.....',
        '...7777777777...',
        '..777777777777..',
        '..777333777777..',
        '..773333777777..',
        '..777333777777..',
        '..777777777777..',
        '..777777777777..',
        '..777777777777..',
        '...7777777777...',
        '.....777777.....',
        '......7777......',
        '.....77..77.....',
        '....77....77....',
        '................',
      ]],
    },
    // Affinity sigils in the frozen affinity colours (5/6/7), beside
    // the DOM affinity line — never instead of it.
    sigil_pure: {
      fps: 1,
      frames: [[
        '.....55.....',
        '.....55.....',
        '.....55.....',
        '..5..55..5..',
        '...5.55.5...',
        '....5555....',
        '.5555555555.',
        '....5555....',
        '...5.55.5...',
        '..5..55..5..',
        '.....55.....',
        '.....55.....',
      ]],
    },
    sigil_harmonious: {
      fps: 1,
      frames: [[
        '....66..66..',
        '....66..66..',
        '.....6666...',
        '.....6666...',
        '..66666666..',
        '...666666...',
        '666666666666',
        '...666666...',
        '..66666666..',
        '.....6666...',
        '.....6666...',
        '....66..66..',
      ]],
    },
    sigil_violent: {
      fps: 1,
      frames: [[
        '.......77...',
        '......777...',
        '.....7777...',
        '.....777....',
        '....777.....',
        '...7777777..',
        '..77777777..',
        '....7777....',
        '.....777....',
        '.....77.....',
        '....77......',
        '....77......',
      ]],
    },
    catalyst_salt: {
      fps: 1,
      frames: [[
        '.....33.....',
        '....3333....',
        '....3553....',
        '...333333...',
        '...355553...',
        '..33333333..',
        '..33333333..',
        '...333333...',
        '....3333....',
        '.....33.....',
        '............',
        '............',
      ]],
    },
    catalyst_wild: {
      fps: 1,
      frames: [[
        '.....ee.....',
        '.....ee.....',
        '..e..ee..e..',
        '...e.ee.e...',
        '....eeee....',
        '.eeeeeeeeee.',
        '....eeee....',
        '...e.ee.e...',
        '..e..ee..e..',
        '.....ee.....',
        '.....ee.....',
        '............',
      ]],
    },
    // ticks at 20/40/60. A legend under the DOM meter, never a meter.
    meter_ticks: {
      fps: 2,
      frames: [[
        '66666666666663bbbbbbbbbbbb3eeeeeeeeeee37777777777777777777777777',
        '66666666666663bbbbbbbbbbbb3eeeeeeeeeee37777777777777777777777777',
        '66666666666663bbbbbbbbbbbb3eeeeeeeeeee37777777777777777777777777',
        '66666666666663bbbbbbbbbbbb3eeeeeeeeeee37777777777777777777777777',
        '66666666666663bbbbbbbbbbbb3eeeeeeeeeee37777777777777777777777777',
        '66666666666663bbbbbbbbbbbb3eeeeeeeeeee37777777777777777777777777',
        '66666666666663bbbbbbbbbbbb3eeeeeeeeeee37777777777777777777777777',
        '66666666666663bbbbbbbbbbbb3eeeeeeeeeee37777777777777777777777777',
      ], [
        '66666666666664bbbbbbbbbbbb4eeeeeeeeeee47777777777777777777777777',
        '66666666666664bbbbbbbbbbbb4eeeeeeeeeee47777777777777777777777777',
        '66666666666664bbbbbbbbbbbb4eeeeeeeeeee47777777777777777777777777',
        '66666666666664bbbbbbbbbbbb4eeeeeeeeeee47777777777777777777777777',
        '66666666666664bbbbbbbbbbbb4eeeeeeeeeee47777777777777777777777777',
        '66666666666664bbbbbbbbbbbb4eeeeeeeeeee47777777777777777777777777',
        '66666666666664bbbbbbbbbbbb4eeeeeeeeeee47777777777777777777777777',
        '66666666666664bbbbbbbbbbbb4eeeeeeeeeee47777777777777777777777777',
      ]],
    },
    font_3x5: {
      fps: 1,
      glyphs: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789%!-',
      frames: [
        ['030', '303', '333', '303', '303'], // A
        ['330', '303', '330', '303', '330'], // B
        ['033', '300', '300', '300', '033'], // C
        ['330', '303', '303', '303', '330'], // D
        ['333', '300', '330', '300', '333'], // E
        ['333', '300', '330', '300', '300'], // F
        ['033', '300', '303', '303', '033'], // G
        ['303', '303', '333', '303', '303'], // H
        ['333', '030', '030', '030', '333'], // I
        ['033', '003', '003', '303', '030'], // J
        ['303', '303', '330', '303', '303'], // K
        ['300', '300', '300', '300', '333'], // L
        ['303', '333', '303', '303', '303'], // M
        ['303', '333', '333', '303', '303'], // N
        ['030', '303', '303', '303', '030'], // O
        ['330', '303', '330', '300', '300'], // P
        ['030', '303', '303', '330', '033'], // Q
        ['330', '303', '330', '303', '303'], // R
        ['033', '300', '030', '003', '330'], // S
        ['333', '030', '030', '030', '030'], // T
        ['303', '303', '303', '303', '333'], // U
        ['303', '303', '303', '303', '030'], // V
        ['303', '303', '303', '333', '303'], // W
        ['303', '303', '030', '303', '303'], // X
        ['303', '303', '030', '030', '030'], // Y
        ['333', '003', '030', '300', '333'], // Z
        ['333', '303', '303', '303', '333'], // 0
        ['030', '330', '030', '030', '333'], // 1
        ['333', '003', '333', '300', '333'], // 2
        ['333', '003', '330', '003', '333'], // 3
        ['303', '303', '333', '003', '003'], // 4
        ['333', '300', '333', '003', '333'], // 5
        ['333', '300', '333', '303', '333'], // 6
        ['333', '003', '030', '030', '030'], // 7
        ['333', '303', '333', '303', '333'], // 8
        ['333', '303', '333', '003', '333'], // 9
        ['303', '003', '030', '300', '303'], // %
        ['030', '030', '030', '...', '030'], // !
        ['...', '...', '333', '...', '...'], // -
      ],
    },
  },
};

export default SPRITE_DATA;


const HEX = /^#[0-9a-fA-F]{6}$/;
const CHAR_INDEX = (() => {
  const m = {};
  for (let i = 0; i < 10; i++) m[String(i)] = i;
  for (let i = 0; i < 6; i++) m['abcdef'[i]] = 10 + i;
  return m;
})();

export function charToIndex(ch) {
  if (ch === '.' || ch === ' ') return -1;
  return ch in CHAR_INDEX ? CHAR_INDEX[ch] : undefined;
}

/** Validate sprite data (errors, empty = valid). */
export function validateSprites(data) {
  const errors = [];
  if (!data || typeof data !== 'object') return ['Data must be an object.'];
  const pal = data.palette;
  if (!Array.isArray(pal)) {
    errors.push('palette is missing or not an array.');
  } else {
    if (pal.length === 0) errors.push('palette is empty.');
    if (pal.length > 16) errors.push(`palette has ${pal.length} entries; use at most 16.`);
    const seen = new Map();
    pal.forEach((c, i) => {
      if (typeof c !== 'string' || !HEX.test(c)) {
        errors.push(`palette[${i}] is not a "#rrggbb" string.`);
      } else {
        const k = c.toLowerCase();
        if (seen.has(k)) errors.push(`palette[${i}] duplicates palette[${seen.get(k)}] (${c}); use unique colours.`);
        else seen.set(k, i);
      }
    });
  }
  const palLen = Array.isArray(pal) ? pal.length : 0;
  const sprites = data.sprites;
  if (!sprites || typeof sprites !== 'object') {
    errors.push('sprites is missing or not an object.');
    return errors;
  }
  for (const [name, sp] of Object.entries(sprites)) {
    if (!sp || !Array.isArray(sp.frames) || sp.frames.length === 0) {
      errors.push(`sprite "${name}" has no frames.`);
      continue;
    }
    if ('fps' in sp && (typeof sp.fps !== 'number' || !(sp.fps > 0))) {
      errors.push(`sprite "${name}" fps is not a positive number.`);
    }
    const f0 = sp.frames[0];
    const w0 = Array.isArray(f0) && f0.length ? f0[0].length : 0;
    const h0 = Array.isArray(f0) ? f0.length : 0;
    sp.frames.forEach((frame, fi) => {
      if (!Array.isArray(frame) || frame.length === 0) {
        errors.push(`sprite "${name}" frame ${fi} is empty.`);
        return;
      }
      const w = frame[0].length;
      let opaque = false;
      frame.forEach((row, ri) => {
        if (typeof row !== 'string') {
          errors.push(`sprite "${name}" frame ${fi} row ${ri} is not a string.`);
          return;
        }
        if (row.length !== w) {
          errors.push(`sprite "${name}" frame ${fi} row ${ri} is ragged (length ${row.length}, expected ${w}); pad it to equal width.`);
        }
        for (let ci = 0; ci < row.length; ci++) {
          const idx = charToIndex(row[ci]);
          if (idx === undefined) {
            errors.push(`sprite "${name}" frame ${fi} row ${ri} col ${ci} has illegal character "${row[ci]}"; use ".", " ", 0-9 or a-f.`);
          } else if (idx >= 0) {
            opaque = true;
            if (idx >= palLen) {
              errors.push(`sprite "${name}" frame ${fi} row ${ri} col ${ci} uses palette index ${idx} but palette has ${palLen} entries.`);
            }
          }
        }
      });
      if (!opaque) errors.push(`sprite "${name}" frame ${fi} has no opaque pixel.`);
      if (fi > 0 && (w !== w0 || frame.length !== h0)) {
        errors.push(`sprite "${name}" frame ${fi} is ${w}x${frame.length} but frame 0 is ${w0}x${h0}; make all frames the same size.`);
      }
    });
  }
  return errors;
}

/** Palette indices the sprite data actually uses. */
export function usedPaletteIndices(data) {
  const used = new Set();
  for (const sp of Object.values(data.sprites || {})) {
    for (const frame of sp.frames || []) {
      for (const row of frame) {
        for (const ch of row) {
          const i = charToIndex(ch);
          if (i !== undefined && i >= 0) used.add(i);
        }
      }
    }
  }
  return [...used].sort((a, b) => a - b);
}

function stubContext() {
  const calls = [];
  return {
    calls,
    imageSmoothingEnabled: false,
    fillStyle: '',
    fillRect(x, y, w, h) { calls.push({ op: 'fillRect', x, y, w, h, fillStyle: this.fillStyle }); },
    drawImage(...args) { calls.push({ op: 'drawImage', args }); },
    clearRect(x, y, w, h) { calls.push({ op: 'clearRect', x, y, w, h }); },
  };
}

/** Bake every sprite frame once to an integer-scaled canvas. */
export function bake(data, scale = 1, doc = globalThis.document) {
  const errs = validateSprites(data);
  if (errs.length) throw new Error(errs.join('\n'));
  if (!Number.isInteger(scale) || scale < 1) throw new Error('scale must be a positive integer.');
  const out = {};
  for (const [name, sp] of Object.entries(data.sprites)) {
    out[name] = sp.frames.map((frame, fi) => {
      const h = frame.length, w = frame[0].length;
      const c = doc.createElement('canvas');
      c.width = w * scale;
      c.height = h * scale;
      let ctx = null;
      try { ctx = c.getContext ? c.getContext('2d') : null; } catch (e) { ctx = null; }
      if (!ctx) {
        ctx = stubContext();
        c._stubCtx = ctx;
        c._sprite = name;
        c._frame = fi;
      }
      ctx.imageSmoothingEnabled = false;
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const idx = charToIndex(frame[y][x]);
          if (idx === undefined || idx < 0) continue;
          ctx.fillStyle = data.palette[idx];
          ctx.fillRect(x * scale, y * scale, scale, scale);
        }
      }
      return c;
    });
  }
  return out;
}

function frameSize(sp) {
  const f = sp.frames[0];
  return [f[0].length, f.length];
}

function originOf(sp) {
  return Array.isArray(sp.origin) ? sp.origin : [0, 0];
}

/** Create the sprite set once (bake at scale 1; draw() scales by a whole number per canvas). */
export function createSpriteSet(data, scale = 1, doc = globalThis.document) {
  const baked = bake(data, scale, doc);
  const sprites = data.sprites;
  return {
    baked,
    size(name) {
      const [w, h] = frameSize(sprites[name]);
      return [w * scale, h * scale];
    },
    /** Frame index for a time in seconds, from the sprite's fps. */
    frameAt(name, timeSeconds) {
      const sp = sprites[name];
      const fps = typeof sp.fps === 'number' && sp.fps > 0 ? sp.fps : 6;
      const n = sp.frames.length;
      return ((Math.floor(timeSeconds * fps) % n) + n) % n;
    },
    /** Draw a frame at whole pixels (whole-number drawScale, smoothing off). */
    draw(ctx, name, frameIndex, x, y, drawScale = 1) {
      if (!ctx || typeof ctx.drawImage !== 'function') return;
      if (!Number.isInteger(drawScale) || drawScale < 1) throw new Error('drawScale must be a positive integer.');
      const sp = sprites[name];
      const [w, h] = frameSize(sp);
      const [ox, oy] = originOf(sp);
      const list = baked[name];
      const img = list[((frameIndex % list.length) + list.length) % list.length];
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(img, Math.round(x) - ox * drawScale, Math.round(y) - oy * drawScale, w * drawScale, h * drawScale);
    },
  };
}

// drawText uses font_3x5 glyphs — never the canvas text API (off-palette
// plus 1 px spacing; scale must be a whole number.

export function textWidth(text) {
  const s = String(text).toUpperCase();
  return s.length === 0 ? 0 : s.length * 4 - 1;
}

export function drawText(ctx, text, x, y, colorIndex = 3, scale = 1) {
  if (!ctx || typeof ctx.fillRect !== 'function') return 0;
  if (!Number.isInteger(scale) || scale < 1) throw new Error('drawText scale must be a positive integer.');
  const font = SPRITE_DATA.sprites.font_3x5;
  const s = String(text).toUpperCase();
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = SPRITE_DATA.palette[colorIndex];
  let cx = Math.round(x);
  const cy = Math.round(y);
  for (const ch of s) {
    if (ch !== ' ') {
      const gi = font.glyphs.indexOf(ch);
      if (gi >= 0) {
        const frame = font.frames[gi];
        for (let gy = 0; gy < frame.length; gy++) {
          for (let gx = 0; gx < frame[gy].length; gx++) {
            if (frame[gy][gx] !== '.' && frame[gy][gx] !== ' ' && frame[gy][gx] !== '0') {
              ctx.fillRect(cx + gx * scale, cy + gy * scale, scale, scale);
            }
          }
        }
      }
    }
    cx += 4 * scale;
  }
  return cx - Math.round(x) - scale;
}

