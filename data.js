/* 汐境回响 — 数据层（原创内容） */
window.TW = window.TW || {};
(function (TW) {
  'use strict';

  const ELEMENTS = {
    tide:  { key:'tide',  name:'潮', color:'#3fe0d0', deep:'#0b3f45', icon:'◈', beats:'ember' },
    ember: { key:'ember', name:'焰', color:'#ff8a5c', deep:'#4a1f14', icon:'✦', beats:'gale' },
    gale:  { key:'gale',  name:'岚', color:'#8ef0b0', deep:'#143d2a', icon:'❖', beats:'stone' },
    stone: { key:'stone', name:'岩', color:'#ffd07a', deep:'#453413', icon:'⬢', beats:'tide' },
    void:  { key:'void',  name:'虚', color:'#c08cff', deep:'#2d1a4a', icon:'✧', beats:null }
  };

  const RARITY = {
    N:  { name:'N', color:'#8fa3ad', order:0, sell:10 },
    R:  { name:'R', color:'#4ea8ff', order:1, sell:30 },
    SR: { name:'SR', color:'#b58cff', order:2, sell:80 },
    SSR:{ name:'SSR', color:'#ffca6b', order:3, sell:200 }
  };

  const TPL = {
    SSR: {
      ranger:  { atk:64, hp:430, def:24, spd:1.10, range:2.8, cost:7 },
      mage:    { atk:58, hp:400, def:20, spd:1.45, range:2.6, cost:7 },
      guard:   { atk:46, hp:912, def:44, spd:1.30, range:1.2, cost:6 },
      healer:  { atk:40, hp:480, def:22, spd:1.30, range:2.6, cost:6 },
      support: { atk:42, hp:460, def:21, spd:1.25, range:2.6, cost:6 }
    },
    SR: {
      ranger:  { atk:48, hp:350, def:19, spd:1.15, range:2.6, cost:6 },
      mage:    { atk:44, hp:330, def:17, spd:1.50, range:2.5, cost:6 },
      guard:   { atk:34, hp:744, def:35, spd:1.35, range:1.2, cost:5 },
      healer:  { atk:30, hp:390, def:18, spd:1.35, range:2.6, cost:5 },
      support: { atk:32, hp:380, def:18, spd:1.30, range:2.5, cost:5 }
    },
    R: {
      ranger:  { atk:34, hp:280, def:15, spd:1.20, range:2.5, cost:5 },
      mage:    { atk:32, hp:260, def:14, spd:1.55, range:2.4, cost:5 },
      guard:   { atk:24, hp:600, def:29, spd:1.40, range:1.2, cost:4 },
      healer:  { atk:22, hp:310, def:14, spd:1.40, range:2.5, cost:4 },
      support: { atk:24, hp:300, def:14, spd:1.35, range:2.4, cost:4 }
    },
    N: {
      ranger:  { atk:22, hp:230, def:11, spd:1.30, range:2.2, cost:3 },
      mage:    { atk:21, hp:220, def:10, spd:1.60, range:2.2, cost:3 },
      guard:   { atk:16, hp:432, def:20, spd:1.50, range:1.2, cost:3 },
      healer:  { atk:15, hp:250, def:10, spd:1.50, range:2.2, cost:3 },
      support: { atk:16, hp:240, def:10, spd:1.45, range:2.2, cost:3 }
    }
  };

  function mk(id, name, title, rarity, el, role, art, skill, passive, lore, quote) {
    const t = TPL[rarity][role];
    return Object.assign({ id, name, title, rarity, element:el, role }, t, {
      skill, passive, lore, quote, art
    });
  }

  const HEROES = [
    /* ===== SSR ===== */
    mk('lange','澜歌','潮声的记录者','SSR','tide','healer',
      { form:'robe', hair:'long', weapon:'staff', accent:'#7ff3e6' },
      { name:'潮汐回响', desc:'治疗全队 220% 攻击力，并清除灼烧与减速。', kind:'healAll', mult:2.2, cd:12, radius:0 },
      { name:'余音', desc:'每治疗 3 次，全队攻速 +8%，持续 5 秒。', key:'healHaste', value:0.08 },
      '她把每一次潮汐都写成乐谱，据说听完的人会梦见故乡。','别怕，潮水记得所有名字。'),

    mk('qingnang','青囊','潮心医主','SSR','tide','healer',
      { form:'robe', hair:'long', weapon:'staff', accent:'#ffe0a8', sig:'crown' },
      { name:'潮心复律', desc:'治疗所有战士 260% 攻击力并额外回复 8% 最大生命，给予 18% 最大生命护盾 6 秒；若无战士，则治疗所有友军 180%。', kind:'healGuardTeam', mult:2.6, hpPct:0.08, fallback:1.8, shield:0.18, shieldDur:6, cd:12 },
      { name:'医者仁心', desc:'战士生命低于 40% 时，自动为其回复 20% 最大生命并给予 10% 护盾（18 秒冷却）。', key:'guardSave', value:0.20, shield:0.10, cd:18 },
      '她的药箱里没有名贵药材，只有一叠写满名字的布条。','名字还在，就不能让他沉下去。'),

    mk('jinyu','烬羽','灰烬巡猎','SSR','ember','ranger',
      { form:'hunter', hair:'short', weapon:'bow', accent:'#ff9a6a', scarf:'#ff7a4a' },
      { name:'焚羽连射', desc:'对单体造成 340% 攻击力伤害，并附加灼烧 4 秒。', kind:'single', mult:3.4, cd:9, burn:4 },
      { name:'猎手本能', desc:'暴击率 +12%，暴击伤害 +20%。', key:'crit', value:0.12 },
      '她的箭矢用烬木削成，离弦时自带火光。','追不上风，就烧出一条路。'),

    mk('lanqie','岚切','断风之刃','SSR','gale','ranger',
      { form:'blade', hair:'ponytail', weapon:'blade', accent:'#9cf7bd', scarf:'#6ce8b0' },
      { name:'千刃疾风', desc:'对范围内敌人造成 3 段 180% 攻击力伤害。', kind:'aoe', mult:1.8, hits:3, cd:10, radius:1.6 },
      { name:'风之追猎', desc:'击杀敌人后攻速 +25%，持续 4 秒，可叠 3 层。', key:'killHaste', value:0.25 },
      '没有人见过她收刀，只见过风停下来的样子。','风不留痕，刃留。'),

    mk('panyue','磐岳','不动之礁','SSR','stone','guard',
      { form:'guard', hair:'helm', weapon:'shield', accent:'#ffd89a' },
      { name:'山岳壁垒', desc:'获得 30% 最大生命护盾，并嘲讽周围敌人 3 秒。', kind:'shield', value:0.30, taunt:3, cd:14, radius:1.8 },
      { name:'礁石意志', desc:'受到伤害降低 12%，每 5 秒对周围造成 60% 攻击力伤害。', key:'tank', value:0.12 },
      '他站在原地一千年，海就绕着他改了道。','退潮之前，我不动。'),

    mk('xuyuan','虚渊','裂隙的低语','SSR','void','mage',
      { form:'mage', hair:'hood', weapon:'orb', accent:'#d3a8ff', sig:'horns' },
      { name:'深渊坍缩', desc:'对范围内敌人造成 360% 攻击力伤害，无视 30% 防御。', kind:'aoe', mult:3.6, cd:13, radius:2.0, ignoreDef:0.3 },
      { name:'虚空印记', desc:'技能命中的敌人受到伤害 +10%，持续 5 秒。', key:'vuln', value:0.10 },
      '他从不抬头，因为天空在他眼里只是一层薄壳。','别听。它在学你说话。'),

    mk('miya','弥娅','潮律执笔','SSR','tide','support',
      { form:'robe', hair:'long', weapon:'orb', accent:'#8ff0e4', sig:'crown' },
      { name:'潮律·共鸣', desc:'全队攻击 +30%、每秒回复 1 点潮能，持续 8 秒。', kind:'buff', value:0.30, energy:1, dur:8, cd:16 },
      { name:'节拍', desc:'全队技能冷却 -8%。', key:'cdr', value:0.08 },
      '她写下的每个音符，都会在战场上变成潮水。','跟上节拍，别被浪落下。'),

    /* ===== SR ===== */
    mk('zhulang','逐浪','浪尖的追兵','SR','tide','ranger',
      { form:'hunter', hair:'short', weapon:'blade', accent:'#6ce8dc' },
      { name:'三连水刃', desc:'对单体造成 3 段 90% 攻击力伤害。', kind:'single', mult:0.9, hits:3, cd:8 },
      { name:'顺势', desc:'攻速 +8%。', key:'asPct', value:0.08 },
      '他相信浪头永远比船快。','下一道浪，是我的。'),

    mk('chisha','赤砂','焚风术士','SR','ember','mage',
      { form:'mage', hair:'long', weapon:'staff', accent:'#ff8f63' },
      { name:'赤砂火雨', desc:'对范围内敌人造成 160% 攻击力伤害，并灼烧 4 秒。', kind:'aoe', mult:1.6, burn:4, cd:10, radius:1.8 },
      { name:'余烬', desc:'灼烧伤害 +30%。', key:'burnBoost', value:0.3 },
      '沙暴来的时候，连影子都会被点燃。','烧干净，就不疼了。'),

    mk('fengling','风铃','逐风信使','SR','gale','support',
      { form:'robe', hair:'ponytail', weapon:'orb', accent:'#a6f7c4', scarf:'#7ee0a8', sig:'bell' },
      { name:'风铃急奏', desc:'全队攻速 +20%、移速 +20%，持续 6 秒；敌人减速 30%。', kind:'buff', value:0.20, slow:0.3, dur:6, cd:14 },
      { name:'轻身', desc:'全队受到的范围伤害 -8%。', key:'aoeResist', value:0.08 },
      '铃声响起时，风向就变了。','快一点，再快一点。'),

    mk('yanjia','岩甲','沉默的墙','SR','stone','guard',
      { form:'guard', hair:'helm', weapon:'shield', accent:'#ffcf85' },
      { name:'岩誓', desc:'嘲讽周围敌人 3 秒，自身减伤 40%。', kind:'shield', value:0.15, taunt:3, cd:12, radius:1.6 },
      { name:'重甲', desc:'生命 +10%。', key:'hpPct', value:0.10 },
      '他的盾上没有纹章，只有被撞出来的凹痕。','站我后面。'),

    mk('xingxi','星隙','缝隙行者','SR','void','mage',
      { form:'mage', hair:'hood', weapon:'orb', accent:'#c9a2ff', sig:'star' },
      { name:'穿隙之光', desc:'对直线范围内敌人造成 240% 攻击力伤害。', kind:'aoe', mult:2.4, cd:11, radius:1.2, ignoreDef:0.2 },
      { name:'折跃', desc:'部署后 3 秒内攻速 +30%。', key:'deployHaste', value:0.3 },
      '她走过的路，地图上不会显示。','别眨眼。'),

    mk('baiou','白鸥','潮间护士','SR','tide','healer',
      { form:'robe', hair:'short', weapon:'staff', accent:'#8ef2e6', sig:'satchel' },
      { name:'鸥鸣', desc:'治疗生命最低的友军 300% 攻击力。', kind:'healOne', mult:3.0, cd:9 },
      { name:'急救', desc:'治疗量 +12%。', key:'healBoost', value:0.12 },
      '她的药箱里永远有晒干的海藻糖。','先止血，再说话。'),

    mk('baizhi','白芷','战地医生','SR','tide','healer',
      { form:'robe', hair:'long', weapon:'staff', accent:'#9ef0c8', sig:'satchel' },
      { name:'战地急救', desc:'优先治疗生命最低的战士 420% 攻击力并额外回复 8% 最大生命，给予 12% 最大生命护盾 5 秒；若无受伤战士，则治疗生命最低的友军 260%。', kind:'healGuard', mult:4.2, fallback:2.6, shield:0.12, shieldDur:5, cd:10 },
      { name:'随军医师', desc:'优先治疗战士，治疗战士时治疗量 +40% 且额外回复 2% 最大生命；每 4 秒自动为生命最低的战士回复 80% 攻击力 + 1.5% 最大生命。', key:'medic', value:0.4, aura:0.8, interval:4 },
      '她的药箱里一半是药，一半是给战士的糖。','先救站着的，再救倒下的。'),

    mk('banxia','半夏','走方医者','SR','gale','healer',
      { form:'robe', hair:'short', weapon:'staff', accent:'#a8e6a0', sig:'satchel' },
      { name:'双生药引', desc:'治疗生命最低的两位友军各 220% 攻击力，优先选择战士。', kind:'healTwo', mult:2.2, cd:9 },
      { name:'行医', desc:'治疗战士时治疗量 +20%，并给予 6% 最大生命护盾 4 秒。', key:'triage', value:0.20, shield:0.06, shieldDur:4 },
      '她在每条商路上都留过一包药，收不收钱看当天风向。','别急着谢，先把药喝了。'),

    mk('ronghe','熔核','不熄的炉心','SR','ember','guard',
      { form:'guard', hair:'short', weapon:'fist', accent:'#ff9b70', sig:'mech' },
      { name:'熔壳', desc:'获得 20% 最大生命护盾，受击反弹 50% 攻击力火焰伤害，持续 5 秒。', kind:'shield', value:0.20, thorns:0.5, dur:5, cd:13, radius:0 },
      { name:'余温', desc:'受到伤害时，攻击者灼烧 2 秒。', key:'burnOnHit', value:2 },
      '炉子熄灭那天，他把自己点了。','还暖着。'),

    mk('liekong','裂空','三向猎手','SR','gale','ranger',
      { form:'hunter', hair:'ponytail', weapon:'bow', accent:'#9df0b8', scarf:'#7ce0a0' },
      { name:'裂空齐射', desc:'同时攻击 3 个敌人，各造成 130% 攻击力伤害。', kind:'multi', mult:1.3, targets:3, cd:9 },
      { name:'疾风', desc:'攻速 +10%。', key:'asPct', value:0.10 },
      '三支箭，三个方向，一种结果。','一个都别想跑。'),

    /* ===== R ===== */
    mk('xizu','汐卒','港口的第一个兵','R','tide','guard',
      { form:'guard', hair:'helm', weapon:'shield', accent:'#5fd8cc' },
      { name:'死守', desc:'获得 15% 最大生命护盾，持续 4 秒。', kind:'shield', value:0.15, dur:4, cd:12, radius:0 },
      { name:'耐潮', desc:'受到伤害 -6%。', key:'tank', value:0.06 },
      '他的铠甲是从沉船里捞出来的，编号还看得见。','这班岗，我站。'),

    mk('huochong','火铳手','码头炮手','R','ember','ranger',
      { form:'hunter', hair:'short', weapon:'gun', accent:'#ff9668', sig:'goggles' },
      { name:'霰弹轰击', desc:'对单体造成 260% 攻击力伤害。', kind:'single', mult:2.6, cd:10 },
      { name:'火药味', desc:'暴击率 +5%。', key:'crit', value:0.05 },
      '装填要三秒，骂人要一秒。','让开，要响了。'),

    mk('xunfeng','巡风者','轻装斥候','R','gale','ranger',
      { form:'blade', hair:'ponytail', weapon:'blade', accent:'#9cebb4' },
      { name:'疾斩', desc:'对单体造成 200% 攻击力伤害。', kind:'single', mult:2.0, cd:8 },
      { name:'轻靴', desc:'攻速 +12%。', key:'asPct', value:0.12 },
      '她跑得比信鸽快，也比信鸽安静。','风里有味道。'),

    mk('shijiang','石匠','修墙的人','R','stone','guard',
      { form:'guard', hair:'short', weapon:'hammer', accent:'#f0c47c' },
      { name:'砌墙', desc:'部署后 5 秒内防御 +50%，并嘲讽 2 秒。', kind:'shield', value:0.10, taunt:2, dur:5, cd:14, radius:1.4 },
      { name:'灰浆', desc:'生命 +8%。', key:'hpPct', value:0.08 },
      '城墙塌了三次，他修了四次。','再来。'),

    mk('shiyi','拾遗者','潮退之后的影子','R','void','support',
      { form:'robe', hair:'hood', weapon:'orb', accent:'#b795f0' },
      { name:'拾取', desc:'全队攻击 +12%，持续 6 秒。', kind:'buff', value:0.12, dur:6, cd:12 },
      { name:'寻宝', desc:'击杀敌人额外获得 2 金币。', key:'gold', value:2 },
      '她不捡值钱的，只捡别人忘了的。','这个，还有这个，都是我的。'),

    mk('chaoyi','潮医','码头草药师','R','tide','healer',
      { form:'robe', hair:'short', weapon:'staff', accent:'#63ded2', sig:'satchel' },
      { name:'潮敷', desc:'治疗生命最低的友军 220% 攻击力。', kind:'healOne', mult:2.2, cd:8 },
      { name:'耐药', desc:'治疗量 +8%。', key:'healBoost', value:0.08 },
      '她的药很苦，但从来不缺。','喝下去，别闻。'),

    /* ===== N ===== */
    mk('yufu','渔夫','收网的人','N','tide','ranger',
      { form:'hunter', hair:'short', weapon:'harpoon', accent:'#7fa8b0', sig:'bandana' },
      { name:'掷叉', desc:'对单体造成 180% 攻击力伤害。', kind:'single', mult:1.8, cd:10 },
      { name:'潮汐直觉', desc:'暴击率 +3%。', key:'crit', value:0.03 },
      '他打了一辈子鱼，最后开始打别的东西。','网要收紧了。'),

    mk('dengtong','灯童','提灯的孩子','N','ember','support',
      { form:'robe', hair:'short', weapon:'lantern', accent:'#e0b070' },
      { name:'灯油', desc:'全队攻击 +6%，持续 5 秒。', kind:'buff', value:0.06, dur:5, cd:14 },
      { name:'微光', desc:'全队受到伤害 -2%。', key:'tank', value:0.02 },
      '灯不能灭，灭了就找不到回家的路。','这边走。'),

    mk('xuetu','学徒','抄写员','N','gale','mage',
      { form:'mage', hair:'short', weapon:'book', accent:'#8fb0a0' },
      { name:'风页', desc:'对范围内敌人造成 120% 攻击力伤害。', kind:'aoe', mult:1.2, cd:12, radius:1.4 },
      { name:'速记', desc:'技能冷却 -3%。', key:'cdr', value:0.03 },
      '他抄错了三个咒文，炸了两次实验室。','这次一定对。'),

    mk('kuanggong','矿工','深处的人','N','stone','guard',
      { form:'guard', hair:'helm', weapon:'pick', accent:'#c0a070' },
      { name:'支撑', desc:'获得 10% 最大生命护盾，持续 4 秒。', kind:'shield', value:0.10, dur:4, cd:14, radius:0 },
      { name:'硬头', desc:'生命 +5%。', key:'hpPct', value:0.05 },
      '他挖到的最后一件事物，是一扇门。','下面还有路。')
  ];

  /* ---------- 扩充英雄：78 位（总计 103） ---------- */
  const GEN_ROWS = [
    /* SSR 6 */
    ['沧溟','SSR','tide','mage','orb','long','crown'],
    ['燎原','SSR','ember','ranger','bow','ponytail','bandana'],
    ['风栖','SSR','gale','healer','staff','long','satchel'],
    ['玄岩','SSR','stone','guard','shield','helm','mech'],
    ['蚀月','SSR','void','ranger','blade','short','goggles'],
    ['白露','SSR','tide','support','orb','ponytail','bell'],
    /* SR 22 */
    ['汀兰','SR','tide','healer','staff','long','satchel'],
    ['烟渚','SR','gale','ranger','bow','short','bandana'],
    ['惊蛰','SR','ember','mage','staff','long','goggles'],
    ['赤霄','SR','ember','ranger','gun','short','bandana'],
    ['流火','SR','ember','mage','orb','hood','star'],
    ['山鬼','SR','stone','guard','hammer','short','mech'],
    ['青岚','SR','gale','support','orb','ponytail','bell'],
    ['逐风','SR','gale','ranger','blade','ponytail','bandana'],
    ['砾川','SR','stone','ranger','gun','short','goggles'],
    ['磐石','SR','stone','guard','shield','helm','mech'],
    ['星坠','SR','void','mage','orb','hood','star'],
    ['夜航','SR','void','support','book','hood','satchel'],
    ['空蝉','SR','gale','healer','staff','short','satchel'],
    ['霜栖','SR','tide','mage','staff','long','crown'],
    ['灯汐','SR','tide','support','lantern','short','bell'],
    ['归潮','SR','tide','ranger','harpoon','short','bandana'],
    ['燎砂','SR','ember','guard','fist','short','mech'],
    ['风荷','SR','gale','healer','staff','long','satchel'],
    ['岩雀','SR','stone','ranger','bow','short','goggles'],
    ['幽篁','SR','void','mage','book','hood','star'],
    ['沉璧','SR','tide','guard','shield','helm','mech'],
    ['拾光','SR','void','support','orb','ponytail','bell'],
    /* R 30 */
    ['细沙','R','tide','ranger','bow','short','bandana'],
    ['浅滩','R','tide','guard','shield','helm',''],
    ['盐工','R','stone','guard','pick','short',''],
    ['灯塔','R','ember','mage','staff','long',''],
    ['潮哨','R','tide','ranger','gun','short',''],
    ['木桨','R','tide','guard','hammer','short',''],
    ['鱼篓','R','tide','healer','staff','short',''],
    ['绳结','R','gale','support','orb','short',''],
    ['炭火','R','ember','ranger','gun','short','bandana'],
    ['铁砧','R','stone','guard','hammer','short',''],
    ['磨石','R','stone','ranger','blade','short',''],
    ['风车','R','gale','ranger','bow','short',''],
    ['纸鸢','R','gale','support','book','short',''],
    ['竹哨','R','gale','healer','staff','short',''],
    ['草鞋','R','gale','ranger','blade','ponytail',''],
    ['石臼','R','stone','guard','fist','short',''],
    ['矿灯','R','void','support','lantern','short',''],
    ['短镐','R','stone','ranger','pick','short',''],
    ['灰帽','R','ember','mage','orb','hood',''],
    ['旧锚','R','tide','guard','shield','helm',''],
    ['破帆','R','tide','ranger','harpoon','short',''],
    ['水手','R','tide','ranger','blade','short',''],
    ['夜巡','R','void','ranger','bow','hood',''],
    ['岸哨','R','gale','ranger','gun','short',''],
    ['拾贝','R','tide','healer','staff','short',''],
    ['织网','R','tide','support','orb','short',''],
    ['煮盐','R','ember','mage','staff','short',''],
    ['补船','R','stone','guard','hammer','short',''],
    ['守闸','R','stone','guard','shield','helm',''],
    ['挑夫','R','stone','ranger','pick','short',''],
    /* N 18 */
    ['阿潮','N','tide','ranger','harpoon','short',''],
    ['小满','N','tide','healer','staff','short',''],
    ['阿岩','N','stone','guard','fist','short',''],
    ['阿风','N','gale','ranger','bow','short',''],
    ['灯仔','N','ember','support','lantern','short',''],
    ['盐娃','N','tide','guard','shield','helm',''],
    ['渔童','N','tide','ranger','harpoon','short',''],
    ['矿娃','N','stone','guard','pick','short',''],
    ['守夜','N','void','ranger','bow','hood',''],
    ['拾荒','N','void','support','orb','short',''],
    ['挑水','N','tide','healer','staff','short',''],
    ['砍柴','N','stone','ranger','blade','short',''],
    ['炊烟','N','ember','mage','staff','short',''],
    ['竹篓','N','tide','support','book','short',''],
    ['草帽','N','gale','ranger','gun','short',''],
    ['木屐','N','gale','ranger','blade','short',''],
    ['泥鳅','N','tide','ranger','harpoon','short',''],
    ['贝壳','N','tide','healer','staff','short','']
  ];

  function hslHex(h, sat, light) {
    h = ((h % 360) + 360) % 360 / 360;
    const q = light < 0.5 ? light * (1 + sat) : light + sat - light * sat;
    const p = 2 * light - q;
    function hue(t) {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    }
    const r = Math.round(hue(h + 1 / 3) * 255);
    const g = Math.round(hue(h) * 255);
    const b = Math.round(hue(h - 1 / 3) * 255);
    return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
  }
  const GEN_EPI = ['碎浪','余烬','逆风','岩层','裂隙','潮下','盐雾','深潮','孤灯','旧港','灰潮','暗礁'];
  const ROLE_CN = { guard:'战士', ranger:'猎手', mage:'术士', healer:'医生', support:'引路人' };
  const SK_P = {
    tide:['潮涌','回澜','深潜','汐刃','沧浪','潮歌'],
    ember:['焚风','烬爆','赤焰','熔流','火雨','灼痕'],
    gale:['疾风','裂空','风刃','旋风','逐影','风铃'],
    stone:['岩崩','磐击','地裂','石誓','山岳','碎岩'],
    void:['虚空','蚀界','星陨','裂隙','幽影','湮灭']
  };
  const SK_S = {
    guard:['·壁','·守','·震'],
    ranger:['·斩','·射','·逐'],
    mage:['·爆','·坠','·灭'],
    healer:['·歌','·愈','·汐'],
    support:['·律','·引','·幕']
  };
  const GEN_REGION = { tide:'碎港', ember:'沉钟厂', gale:'盐雾回廊', stone:'珊瑚墓园', void:'深渊裂口' };
  const GEN_TRAIT = ['比潮水更固执','从不留下名字','把退潮当作机会','相信石头也会呼吸','在雾里也能看清路','只对活人收费','把每次战斗写成乐谱','从不回头看爆炸'];
  const GEN_QUOTE = {
    tide:['潮水会记得。','退潮之前，别回头。','跟着浪走。'],
    ember:['烧干净就不疼了。','火还没灭。','让开，要炸了。'],
    gale:['风会替我们开门。','快一点，再快一点。','别站在下风口。'],
    stone:['站住，就是赢。','石头不会退。','再敲一次。'],
    void:['别听，它在学你说话。','裂隙后面还有路。','我看见你的影子了。']
  };

  function genSkill(rarity, element, role, name, i) {
    const rank = { SSR:1, SR:.82, R:.66, N:.5 }[rarity] || .6;
    let kind;
    if (role === 'guard') kind = i % 3 === 0 ? 'aoe' : 'shield';
    else if (role === 'ranger') kind = i % 2 ? 'multi' : 'single';
    else if (role === 'mage') kind = i % 3 === 0 ? 'single' : 'aoe';
    else if (role === 'healer') kind = i % 2 ? 'healAll' : 'healOne';
    else kind = i % 4 === 0 ? 'healOne' : 'buff';

    const burn = element === 'ember' && (kind === 'single' || kind === 'aoe') ? 4 : 0;
    const ignoreDef = element === 'void' && (kind === 'single' || kind === 'aoe') ? 0.2 : 0;
    let mult = 1, cd = 10, radius = 0, hits = 1, targets = 1, value = 0, dur = 0;

    if (kind === 'single') { mult = (3.0 + (i % 3) * 0.15) * rank; cd = 9; }
    else if (kind === 'aoe') { mult = (2.5 + (i % 3) * 0.15) * rank; cd = 11; radius = 1.7; }
    else if (kind === 'multi') { mult = (1.5 + (i % 2) * 0.1) * rank; hits = 1; targets = 3; cd = 9; kind = 'multi'; }
    else if (kind === 'healAll') { mult = 2.1 * rank; cd = 12; }
    else if (kind === 'healOne') { mult = 2.5 * rank; cd = 8; }
    else if (kind === 'buff') { value = 0.3 * rank; dur = 7; cd = 14; }
    else if (kind === 'shield') { value = 0.2 * rank; dur = 4; cd = 12; radius = 1.6; }

    let desc;
    if (kind === 'single') desc = '对单体造成 ' + Math.round(mult * 100) + '% 攻击力伤害' + (burn ? '，并灼烧 4 秒' : '') + '。';
    else if (kind === 'aoe') desc = '对范围内敌人造成 ' + Math.round(mult * 100) + '% 攻击力伤害' + (burn ? '，并灼烧 4 秒' : '') + '。';
    else if (kind === 'multi') desc = '同时攻击 ' + targets + ' 个敌人，各造成 ' + Math.round(mult * 100) + '% 攻击力伤害。';
    else if (kind === 'healAll') desc = '治疗全队 ' + Math.round(mult * 100) + '% 攻击力。';
    else if (kind === 'healOne') desc = '治疗生命最低的友军 ' + Math.round(mult * 100) + '% 攻击力。';
    else if (kind === 'buff') desc = '全队攻击 +' + Math.round(value * 100) + '%，持续 ' + dur + ' 秒。';
    else desc = '获得 ' + Math.round(value * 100) + '% 最大生命护盾，并嘲讽周围敌人 3 秒。';

    return {
      name, desc, kind, mult: +mult.toFixed(2), cd,
      radius: radius || undefined, hits, targets, burn: burn || undefined,
      ignoreDef: ignoreDef || undefined, value: value || undefined, dur: dur || undefined,
      taunt: kind === 'shield' ? 3 : undefined, energy: 100
    };
  }

  function genPassive(role, rarity, i) {
    const scale = { SSR:1.5, SR:1.2, R:1, N:.85 }[rarity] || 1;
    const pools = {
      guard: [
        { key:'tank', name:'坚壳', v:.07, d:'受到伤害 -' },
        { key:'hpPct', name:'厚甲', v:.09, d:'生命 +' }
      ],
      ranger: [
        { key:'crit', name:'锐眼', v:.06, d:'暴击率 +' },
        { key:'asPct', name:'轻装', v:.09, d:'攻速 +' },
        { key:'killHaste', name:'追猎', v:.2, d:'击杀后攻速 +' }
      ],
      mage: [
        { key:'cdr', name:'回响', v:.1, d:'能量回复 +' },
        { key:'energy', name:'涌流', v:1.4, d:'每秒能量 +' },
        { key:'asPct', name:'咏唱', v:.06, d:'攻速 +' }
      ],
      healer: [
        { key:'healBoost', name:'慈悲', v:.1, d:'治疗量 +' },
        { key:'cdr', name:'祷言', v:.08, d:'能量回复 +' }
      ],
      support: [
        { key:'cdr', name:'节拍', v:.1, d:'能量回复 +' },
        { key:'gold', name:'拾遗', v:1.2, d:'击杀额外获得 ' },
        { key:'energy', name:'共鸣', v:1.0, d:'每秒能量 +' }
      ]
    };
    const p = pools[role][i % pools[role].length];
    const v = p.v * scale;
    let desc = p.d;
    if (p.key === 'gold') desc += v.toFixed(1) + ' 金币';
    else if (p.key === 'energy') desc += v.toFixed(1);
    else if (p.key === 'killHaste') desc += Math.round(v * 100) + '%，持续 4 秒';
    else desc += Math.round(v * 100) + '%';
    return { name: p.name, desc, key: p.key, value: +v.toFixed(3) };
  }

  const _skillNames = new Set();
  GEN_ROWS.forEach((row, i) => {
    const name = row[0], rarity = row[1], element = row[2], role = row[3],
      weapon = row[4], hair = row[5], sig = row[6];
    let skillName = SK_P[element][i % 6] + SK_S[role][i % 3];
    if (_skillNames.has(skillName)) skillName += '·' + (i + 1);
    _skillNames.add(skillName);
    const form = role === 'guard' ? 'guard' : role === 'ranger' ? 'hunter' : role === 'mage' ? 'mage' : 'robe';
    const art = { form, hair, weapon, accent: hslHex(170 + i * 47, 0.58, 0.68) };
    if (sig) art.sig = sig;
    const skill = genSkill(rarity, element, role, skillName, i);
    const passive = genPassive(role, rarity, i);
    const title = (rarity === 'SSR' ? GEN_EPI[i % GEN_EPI.length] : GEN_EPI[(i + 3) % GEN_EPI.length]) + '的' + ROLE_CN[role];
    const lore = '在' + GEN_REGION[element] + '长大的' + ROLE_CN[role] + '，' + GEN_TRAIT[i % GEN_TRAIT.length] + '。';
    const quote = GEN_QUOTE[element][i % 3];
    const h = mk('g' + (i + 1), name, title, rarity, element, role, art, skill, passive, lore, quote);
    const mod = 0.96 + (i % 7) * 0.012;
    h.atk = Math.round(h.atk * mod);
    h.hp = Math.round(h.hp * mod);
    h.def = Math.round(h.def * mod);
    HEROES.push(h);
  });

  // 所有治疗定位英雄都归类为「医生」：优先照顾战士
  HEROES.forEach(h => { if (h.role === 'healer') h.doctor = true; });

  const HERO_MAP = {};
  HEROES.forEach(h => HERO_MAP[h.id] = h);

  /* ---------- 章节与关卡 ---------- */
  const CHAPTERS = [
    { n:1, name:'碎港', sub:'潮水退去后，第一座城露出骨头。', rec:600, weather:'rain',
      paths:[ [[-1,2],[2,2],[2,0],[6,0],[6,4],[8,4]] ],
      tint:'#0d3a44', accent:'#3fe0d0',
      story:['潮水退到第三道堤坝时，碎港醒了。','你从盐里爬起来，手里攥着一枚发烫的潮核。','远处的钟楼没有钟，却一直在响。','守门人说：想进城，先证明你能站住。'] },
    { n:2, name:'盐雾回廊', sub:'两条路，都通向同一个深渊。', rec:1600, weather:'fog',
      paths:[ [[-1,2],[2,2],[2,0],[6,0],[6,4],[8,4]], [[-1,4],[4,4],[4,2],[8,2]] ],
      tint:'#123c46', accent:'#5fe8dc',
      story:['回廊里的雾有咸味，也有铁锈味。','墙上的浮雕被磨平了脸，只剩下手。','它们都指向同一个方向。','别回头，雾会记住你的样子。'] },
    { n:3, name:'沉钟厂', sub:'钟声沉在水底，工还在上工。', rec:3400, weather:'ember',
      paths:[ [[-1,3],[2,3],[2,1],[5,1],[5,3],[8,3]], [[-1,0],[6,0],[6,2],[8,2]] ],
      tint:'#1a3a3a', accent:'#7ff0c0',
      story:['沉钟厂的炉子烧了三百年，没人添过柴。','齿轮咬合的节奏像心跳。','有人在里面敲钟，一下，又一下。','那不是报时，是倒计时。'] },
    { n:4, name:'珊瑚墓园', sub:'每一株珊瑚下面，都睡着一个名字。', rec:6200, weather:'tide',
      paths:[ [[-1,1],[3,1],[3,3],[6,3],[6,0],[8,0]], [[-1,4],[5,4],[5,2],[8,2]] ],
      tint:'#2a2338', accent:'#ff9ec4',
      story:['珊瑚不是植物，是骨头长出来的花。','墓园没有墓碑，只有一层层发光的名字。','你找到了自己的名字，刻在很浅的地方。','有人替你擦过。'] },
    { n:5, name:'逆流阶梯', sub:'水往高处流，死人往低处走。', rec:10000, weather:'void',
      paths:[ [[-1,4],[1,4],[1,1],[4,1],[4,3],[6,3],[6,0],[8,0]], [[-1,0],[3,0],[3,2],[8,2]], [[-1,2],[5,2],[5,4],[8,4]] ],
      tint:'#173246', accent:'#8ea8ff',
      story:['阶梯一共九百级，每一级都在往下滴水。','水却往上流。','你数到第四百级时，听见上面有人叫你名字。','别答应。'] },
    { n:6, name:'白潮灯塔', sub:'灯亮着，守灯的人已经不在。', rec:14500, weather:'fog',
      paths:[ [[-1,0],[4,0],[4,2],[2,2],[2,4],[8,4]], [[-1,3],[6,3],[6,1],[8,1]] ],
      tint:'#123a40', accent:'#ffe0a0',
      story:['灯塔的光每十二秒扫过一次海面。','光扫过的地方，影子会站起来。','守灯人的椅子还是温的。','你坐上去，灯就转向了你。'] },
    { n:7, name:'深渊裂口', sub:'有些伤口，是海洋自己撕开的。', rec:19500, weather:'void',
      paths:[ [[-1,2],[2,2],[2,4],[5,4],[5,0],[8,0]], [[-1,1],[4,1],[4,3],[8,3]] ],
      tint:'#241a38', accent:'#c08cff',
      story:['裂口没有底，也没有回声。','你丢下一块石头，三分钟后它从头顶落下来。','深渊在呼吸，节奏和你一样。','它已经学会了你。'] },
    { n:8, name:'潮心王座', sub:'所有潮水的起点，也是终点。', rec:26000, weather:'tide',
      paths:[ [[-1,2],[2,2],[2,0],[5,0],[5,2],[8,2]], [[-1,4],[3,4],[3,2],[6,2],[6,4],[8,4]], [[-1,0],[7,0],[7,4],[8,4]] ],
      tint:'#2e1f2e', accent:'#ffca6b',
      story:['王座是空的，但潮水跪着。','你听见自己的心跳，从很远的地方传来。','那不是你的心跳。','是这座城，终于等到了它的守望者。'] }
  ];

  const ENEMIES = {
    grunt:   { name:'潮骸',   hp:180, spd:52, dmg:1,  r:14, color:'#5b8f96', shape:'blob' },
    runner:  { name:'疾行者', hp:120, spd:94, dmg:1,  r:11, color:'#7fb0a0', shape:'dart',
      abilities:['charge'], charge:7 },
    brute:   { name:'重甲',   hp:520, spd:36, dmg:2,  r:19, color:'#8a7a62', shape:'block',
      abilities:['armor'], armor:0.32 },
    ranged:  { name:'远射',   hp:200, spd:44, dmg:1,  r:13, color:'#b07a8a', shape:'spire', atk:26, atkRange:120 },
    shield:  { name:'护盾兵', hp:300, spd:44, dmg:2,  r:15, color:'#6f8fb0', shape:'block', shield:0.3,
      abilities:['armor'], armor:0.25 },
    flyer:   { name:'飞行',   hp:240, spd:70, dmg:2,  r:12, color:'#9a7ad0', shape:'wing', flying:true },
    summon:  { name:'召唤者', hp:380, spd:34, dmg:2,  r:16, color:'#a06a9a', shape:'orb', summon:8,
      abilities:['heal'], healAura:0.02 },
    elite:   { name:'精英',   hp:800, spd:40, dmg:3,  r:21, color:'#c08cff', shape:'elite',
      abilities:['split','regen'], split:true, regen:0.012 },
    boss:    { name:'首领',   hp:6000,spd:28, dmg:10, r:30, color:'#ffca6b', shape:'boss',
      abilities:['armor','charge'], armor:0.30, charge:6 }
  };

  const DUNGEONS = [
    { id:'gold',  name:'金币潮窟', desc:'潮水淘出的旧币，堆在洞窟深处。', cost:12, daily:3, icon:'coin',  reward:'gold' },
    { id:'exp',   name:'经验回廊', desc:'回声会替你记住战斗过的一切。',   cost:12, daily:3, icon:'book',  reward:'book' },
    { id:'crys',  name:'潮晶矿脉', desc:'晶体在黑暗里生长，像倒着下的雨。', cost:16, daily:3, icon:'crystal', reward:'crystal' },
    { id:'gear',  name:'装备工坊', desc:'废铁与潮晶，能铸出还手的东西。',   cost:16, daily:2, icon:'stone', reward:'stone' }
  ];

  const QUESTS = [
    { id:'q_clear3', name:'推进战线', desc:'完成 3 场主线战斗', target:3, gem:180, gold:120000 },
    { id:'q_pull1',  name:'潮汐的回应', desc:'进行 1 次召唤', target:1, gem:120, gold:60000 },
    { id:'q_level3', name:'磨砺', desc:'升级英雄 3 次', target:3, gem:120, gold:90000 },
    { id:'q_win1',   name:'站稳脚跟', desc:'赢得 1 场战斗', target:1, gem:90, gold:70000 },
    { id:'q_ult3',   name:'潮能涌动', desc:'释放 3 次大招', target:3, gem:90, gold:70000 },
    { id:'q_gold',   name:'积累', desc:'消耗 20 万金币', target:200000, gem:150, gold:60000 }
  ];

  const SIGNIN = [
    { gem:200, gold:50000, book:10 }, { gem:200, gold:50000, book:10 },
    { gem:300, gold:80000, book:16 }, { gem:300, gold:80000, crystal:20 },
    { gem:400, gold:120000, book:20 }, { gem:400, gold:120000, stone:40 },
    { gem:800, gold:240000, book:40, crystal:40 }
  ];

  /* ---------- 关卡生成 ---------- */
  function pointOnPath(c, r, pts) {
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i+1];
      const minx = Math.min(a[0], b[0]) - 0.5, maxx = Math.max(a[0], b[0]) + 0.5;
      const miny = Math.min(a[1], b[1]) - 0.5, maxy = Math.max(a[1], b[1]) + 0.5;
      if (c > minx && c < maxx && r > miny && r < maxy) return true;
    }
    return false;
  }

  function buildStages() {
    const out = [];
    CHAPTERS.forEach(ch => {
      for (let idx = 1; idx <= 12; idx++) {
        const i = (ch.n - 1) * 12 + idx;
        const boss = idx === 12;
        const elite = idx === 4 || idx === 8;
        const deployable = [];
        for (let r = 0; r < 5; r++) for (let c = 0; c < 8; c++) {
          let blocked = false;
          ch.paths.forEach(p => { if (pointOnPath(c, r, p)) blocked = true; });
          if (!blocked) deployable.push([c, r]);
        }
        const waves = [];
        let t = 2;
        const groups = 3 + Math.floor(idx / 3) + (ch.n >= 4 ? 1 : 0);
        for (let g = 0; g < groups; g++) {
          const list = [];
          const base = 3 + Math.floor(idx / 2) + ch.n;
          const pool = ['grunt'];
          if (ch.n >= 2) pool.push('runner');
          if (ch.n >= 3) pool.push('ranged', 'shield');
          if (ch.n >= 5) pool.push('flyer');
          if (ch.n >= 6) pool.push('summon');
          if (g % 2 === 0) pool.push('grunt');
          list.push({ type: pool[g % pool.length], count: base, interval: Math.max(0.45, 0.95 - ch.n * 0.04) });
          if (idx >= 6 && g === 1) list.push({ type:'brute', count: 1 + Math.floor(ch.n/3), interval: 1.6 });
          waves.push({ at: t, enemies: list });
          t += Math.max(9, 14 - ch.n * 0.6);
        }
        if (elite) waves.push({ at: t, enemies: [{ type:'elite', count: 1, interval: 1 }] });
        if (boss) waves.push({ at: t + 4, enemies: [{ type:'boss', count: 1, interval: 1 }] });

        const first = [
          { kind:'gem', amount: 150 + ch.n * 50 },
          { kind:'gold', amount: 150000 + ch.n * 60000 },
          { kind:'book', amount: 12 + ch.n * 4 },
          { kind:'crystal', amount: 12 + ch.n * 4 },
          { kind:'stone', amount: 8 + ch.n * 3 }
        ];
        /* v2.0 首通经济：按章节递增 20%~40%，只放大基础奖励，不动 Boss 额外掉落 */
        const eco = 1.20 + (ch.n - 1) * 0.028;
        first.forEach(r => { r.amount = Math.round(r.amount * eco); });
        if (boss) {
          first.push({ kind:'gem', amount: 1000 });
          first.push({ kind:'crystal', amount: 60 });
          first.push({ kind:'gem', amount: 500 });
          first.push({ kind:'hero', id: ['zhulang','chisha','fengling','yanjia','xingxi','baiou','ronghe','liekong'][ch.n - 1] });
        }

        let modifiers;
        if (boss && ch.n >= 5) modifiers = { enemyHp: 1.10, enemySpeed: 1.05 };
        else if (elite && ch.n >= 6) modifiers = { enemyHp: 1.08 };
        else if (idx === 11 && ch.n >= 7) modifiers = { enemySpeed: 1.06 };

        out.push({
          id: ch.n + '-' + idx,
          chapter: ch.n, index: idx, global: i,
          name: ch.name + ' · ' + (boss ? '终局' : idx) ,
          chapterName: ch.name,
          recommendedPower: Math.round(ch.rec * (1 + 0.025 * (idx - 1))),
          baseHp: 20,
          paths: ch.paths,
          deployable,
          waves,
          boss, elite,
          weather: ch.weather || 'rain',
          modifiers: modifiers,
          timeLimit: boss ? 210 : 150,
          firstClear: first,
          repeat: [
            { kind:'gold', amount: 30000 + ch.n * 8000 },
            { kind:'book', amount: 3 + ch.n },
            { kind:'crystal', amount: 2 + ch.n }
          ],
          story: ch.story,
          tint: ch.tint, accent: ch.accent
        });
      }
    });
    return out;
  }

  const STAGES = buildStages();
  const STAGE_MAP = {};
  STAGES.forEach(s => STAGE_MAP[s.id] = s);

  const RATES = { SSR: 0.022, SR: 0.12, R: 0.35, N: 0.50, hardPity: 60, softStart: 46, softStep: 0.07, displaySSR: 0.03 };

  const SHOP = [
    { id:'s_gem_book', name:'经验书 ×10', cost:{ gem:120 }, gain:{ book:10 }, desc:'用星砂换成长。' },
    { id:'s_gem_gold', name:'金币 ×5 万', cost:{ gem:100 }, gain:{ gold:50000 }, desc:'应急用。' },
    { id:'s_gold_stone', name:'强化石 ×10', cost:{ gold:60000 }, gain:{ stone:10 }, desc:'给装备一点尊严。' },
    { id:'s_gold_crys', name:'潮晶 ×8', cost:{ gold:80000 }, gain:{ crystal:8 }, desc:'突破要用。' },
    { id:'s_gem_pull', name:'潮晶 ×5', cost:{ gem:80 }, gain:{ crystal:5 }, desc:'突破要用，早买早安心。' }
  ];

  /* ---------- v2.0 试炼祝福（Agent C） ---------- */
  const TRIAL_BLESSINGS = [
    /* common：8%~15% */
    { id:'b_atk',      name:'狂潮',     desc:'全队攻击 +12%。',                 tier:'common', icon:'sword',  mods:{ atk:0.12 } },
    { id:'b_hp',       name:'厚壳',     desc:'全队生命 +15%。',                 tier:'common', icon:'shield', mods:{ hp:0.15 } },
    { id:'b_as',       name:'疾桨',     desc:'全队攻速 +10%。',                 tier:'common', icon:'wind',   mods:{ as:0.10 } },
    { id:'b_energy',   name:'潮息',     desc:'每秒额外回复 0.5 点潮能。',       tier:'common', icon:'bolt',   mods:{ energy:0.5 } },
    { id:'b_gold',     name:'拾贝',     desc:'金币获取 +15%。',                 tier:'common', icon:'coin',   mods:{ gold:0.15 } },
    { id:'b_crit',     name:'锐目',     desc:'暴击率 +8%。',                    tier:'common', icon:'target', mods:{ crit:0.08 } },
    { id:'b_heal',     name:'暖流',     desc:'治疗效果 +12%。',                 tier:'common', icon:'drop',   mods:{ heal:0.12 } },
    { id:'b_range',    name:'远望',     desc:'攻击范围 +10%。',                 tier:'common', icon:'eye',    mods:{ range:0.10 } },

    /* rare：18%~25% */
    { id:'b_atk2',     name:'怒潮',     desc:'全队攻击 +22%。',                 tier:'rare',   icon:'sword',  mods:{ atk:0.22 } },
    { id:'b_hp2',      name:'礁壁',     desc:'全队生命 +25%。',                 tier:'rare',   icon:'shield', mods:{ hp:0.25 } },
    { id:'b_as2',      name:'追风',     desc:'全队攻速 +20%。',                 tier:'rare',   icon:'wind',   mods:{ as:0.20 } },
    { id:'b_ult',      name:'终章',     desc:'大招伤害 +20%。',                 tier:'rare',   icon:'star',   mods:{ ultDmg:0.20 } },
    { id:'b_crit2',    name:'猎汛',     desc:'暴击率 +18%。',                   tier:'rare',   icon:'target', mods:{ crit:0.18 } },
    { id:'b_energy2',  name:'涌泉',     desc:'每秒额外回复 1 点潮能。',         tier:'rare',   icon:'bolt',   mods:{ energy:1.0 } },
    { id:'b_heal2',    name:'药香长夜', desc:'治疗效果 +22%。',                 tier:'rare',   icon:'drop',   mods:{ heal:0.22 } },
    { id:'b_range2',   name:'潮线视野', desc:'攻击范围 +18%。',                 tier:'rare',   icon:'eye',    mods:{ range:0.18 } },

    /* epic：30%~45% */
    { id:'b_atk3',     name:'万潮归一', desc:'全队攻击 +40%。',                 tier:'epic',   icon:'wave',   mods:{ atk:0.40 } },
    { id:'b_hp3',      name:'不沉之舟', desc:'全队生命 +45%。',                 tier:'epic',   icon:'shield', mods:{ hp:0.45 } },
    { id:'b_as3',      name:'潮汐疾行', desc:'全队攻速 +35%。',                 tier:'epic',   icon:'wind',   mods:{ as:0.35 } },
    { id:'b_ult3',     name:'深渊回响', desc:'大招伤害 +35%。',                 tier:'epic',   icon:'star',   mods:{ ultDmg:0.35 } },
    { id:'b_crit3',    name:'破隙',     desc:'暴击率 +30%。',                   tier:'epic',   icon:'target', mods:{ crit:0.30 } },
    { id:'b_gold3',    name:'满舱',     desc:'金币获取 +40%。',                 tier:'epic',   icon:'coin',   mods:{ gold:0.40 } },
    { id:'b_energy3',  name:'潮核过载', desc:'每秒额外回复 1.5 点潮能。',       tier:'epic',   icon:'bolt',   mods:{ energy:1.5 } },
    { id:'b_range3',   name:'望海',     desc:'攻击范围 +30%。',                 tier:'epic',   icon:'eye',    mods:{ range:0.30 } },
    { id:'b_heal3',    name:'生潮',     desc:'治疗效果 +35%。',                 tier:'epic',   icon:'drop',   mods:{ heal:0.35 } }
  ];

  /* ---------- v2.0 协同（同队组合加成） ---------- */
  const SYNERGIES = {
    element2:     { atk: 0.06 },
    element3:     { atk: 0.12 },
    guardHealer:  { hp: 0.08 },
    rangerMage:   { crit: 0.05 },
    healerSupport:{ heal: 0.10 }
  };

  const SYNERGY_INFO = {
    element2:      { name:'同源双潮', desc:'同元素 2 人：全队攻击 +6%' },
    element3:      { name:'同源三潮', desc:'同元素 3 人：全队攻击 +12%' },
    guardHealer:   { name:'守愈同心', desc:'战士 + 医生：全队生命 +8%' },
    rangerMage:    { name:'猎法共鸣', desc:'猎手 + 术士：全队暴击 +5%' },
    healerSupport: { name:'潮息相引', desc:'医生 + 引路人：治疗效果 +10%' }
  };

  /* ---------- v2.0 试炼与每日修正 ---------- */
  const TRIAL = {
    waves: 30,
    baseStage: '5-4',
    blessingChoices: 3,
    rewards: {
      gemPerWave: 60, goldPerWave: 25000, bookPerWave: 2,
      clearGem: 3000, clearGold: 1000000
    }
  };

  const DAILY_MODIFIERS = [
    { id:'dm_fog',   name:'浓雾封港', desc:'敌人移速 +10%，我方射程 -15%。',       mods:{ enemySpeed:1.10, playerRange:0.85 } },
    { id:'dm_ebb',   name:'退潮时分', desc:'潮能回复 -20%，金币获取 +25%。',       mods:{ energy:0.80, gold:1.25 } },
    { id:'dm_ember', name:'余烬不熄', desc:'敌人生命 +12%，灼烧伤害 +30%。',       mods:{ enemyHp:1.12, burn:1.30 } },
    { id:'dm_void',  name:'裂隙低语', desc:'敌人攻击 +15%，大招伤害 +25%。',       mods:{ enemyDmg:1.15, ultDmg:1.25 } },
    { id:'dm_tide',  name:'满潮压境', desc:'每波多 1 名敌人，金币获取 +20%。',      mods:{ extraEnemy:1, gold:1.20 } }
  ];

  /* ---------- 难度 ---------- */
  const DIFFICULTY = {
    easy: {
      key: 'easy', name: '休闲', short: '休闲',
      enemyHp: 0.85, enemyDmg: 0.80, enemySpeed: 0.95,
      baseMod: 5, leakMul: 0.8, gold: 1,
      desc: '敌人生命 -15% · 攻击 -20% · 基地 +5 · 适合看剧情'
    },
    normal: {
      key: 'normal', name: '标准', short: '标准',
      enemyHp: 1, enemyDmg: 1, enemySpeed: 1,
      baseMod: 0, leakMul: 1, gold: 1,
      desc: '原版节奏 · 敌人生命与攻击正常'
    },
    hard: {
      key: 'hard', name: '困难', short: '困难',
      enemyHp: 1.55, enemyDmg: 1.30, enemySpeed: 1.04,
      baseMod: -5, leakMul: 1.4, gold: 1.25,
      desc: '敌人生命 +55% · 攻击 +30% · 漏怪伤害提高 · 基地 -5 · 金币 +25%'
    },
    nightmare: {
      key: 'nightmare', name: '噩梦', short: '噩梦',
      enemyHp: 2.40, enemyDmg: 1.65, enemySpeed: 1.10,
      baseMod: -9, leakMul: 1.8, gold: 1.5,
      desc: '敌人生命 +140% · 攻击 +65% · 漏怪伤害大幅提高 · 基地 -9 · 金币 +50%'
    }
  };
  const DIFF_ORDER = ['easy', 'normal', 'hard', 'nightmare'];

  const WEATHER_INFO = {
    rain:  { name:'雨幕',   desc:'雨水压低视野，也掩住了脚步。', color:'#6fb6d8' },
    fog:   { name:'咸雾',   desc:'雾里只剩轮廓，没有距离。',     color:'#9fb8b0' },
    ember: { name:'落烬',   desc:'空中飘着不会熄灭的灰。',       color:'#ff9a6a' },
    void:  { name:'裂隙风', desc:'风从不存在的地方吹来。',       color:'#c08cff' },
    tide:  { name:'满潮',   desc:'潮水贴着地面呼吸。',           color:'#3fe0d0' }
  };

  TW.DATA = {
    ELEMENTS, RARITY, HEROES, HERO_MAP, CHAPTERS, ENEMIES, DUNGEONS,
    QUESTS, SIGNIN, STAGES, STAGE_MAP, RATES, SHOP,
    TRIAL_BLESSINGS, SYNERGIES, SYNERGY_INFO, TRIAL, DAILY_MODIFIERS, WEATHER_INFO,
    DIFFICULTY, DIFF_ORDER,
    LEVEL_CAP:[20,30,40,50,60,80]
  };
})(window.TW);
