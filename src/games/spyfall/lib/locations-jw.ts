import type { Location } from './locations-standard';

export const LOCATIONS_JW: Location[] = [
  {
    name: { ko: '왕국회관', en: 'Kingdom Hall', zh: '王国聚会所' },
    roles: {
      ko: ['장로', '연설자', '음향담당', '안내인', '성경연구생', '어린이', '자매'],
      en: ['Elder', 'Speaker', 'Sound Operator', 'Attendant', 'Bible Student', 'Child', 'Sister'],
      zh: ['长老', '演讲者', '音响操作员', '招待员', '圣经学生', '小孩', '姊妹'],
    },
  },
  {
    name: { ko: '대회장', en: 'Convention Hall', zh: '大会场地' },
    roles: {
      ko: ['연설자', '침례후보자', '안내봉사자', '구급반', '음향팀', '관객', '자원봉사자'],
      en: ['Speaker', 'Baptism Candidate', 'Attendant', 'First Aid', 'Sound Team', 'Audience', 'Volunteer'],
      zh: ['演讲者', '受浸候选人', '招待员', '急救员', '音响组', '听众', '志愿者'],
    },
  },
  {
    name: { ko: '베델', en: 'Bethel', zh: '伯特利' },
    roles: {
      ko: ['봉사자', '인쇄공', '요리사', '안내인', '번역자', '관리인', '방문객'],
      en: ['Bethelite', 'Printer', 'Cook', 'Guide', 'Translator', 'Caretaker', 'Visitor'],
      zh: ['伯特利成员', '印刷工', '厨师', '导游', '翻译', '管理员', '访客'],
    },
  },
  {
    name: { ko: '노아의 방주', en: "Noah's Ark", zh: '挪亚方舟' },
    roles: {
      ko: ['노아', '셈', '함', '야벳', '노아의아내', '동물관리자', '비둘기'],
      en: ['Noah', 'Shem', 'Ham', 'Japheth', "Noah's Wife", 'Animal Keeper', 'Dove'],
      zh: ['挪亚', '闪', '含', '雅弗', '挪亚的妻子', '动物管理员', '鸽子'],
    },
  },
  {
    name: { ko: '에덴동산', en: 'Garden of Eden', zh: '伊甸园' },
    roles: {
      ko: ['아담', '하와', '천사', '뱀', '새', '양', '나무관리자'],
      en: ['Adam', 'Eve', 'Angel', 'Serpent', 'Bird', 'Sheep', 'Gardener'],
      zh: ['亚当', '夏娃', '天使', '蛇', '鸟', '羊', '园丁'],
    },
  },
  {
    name: { ko: '예루살렘 성전', en: 'Jerusalem Temple', zh: '耶路撒冷圣殿' },
    roles: {
      ko: ['대제사장', '레위인', '순례자', '상인', '바리새인', '경비병', '서기관'],
      en: ['High Priest', 'Levite', 'Pilgrim', 'Merchant', 'Pharisee', 'Guard', 'Scribe'],
      zh: ['大祭司', '利未人', '朝圣者', '商人', '法利赛人', '卫兵', '文士'],
    },
  },
  {
    name: { ko: '다니엘의 사자굴', en: "Daniel's Lions' Den", zh: '但以理的狮子坑' },
    roles: {
      ko: ['다니엘', '사자', '왕', '신하', '천사', '간수', '구경꾼'],
      en: ['Daniel', 'Lion', 'King', 'Advisor', 'Angel', 'Guard', 'Spectator'],
      zh: ['但以理', '狮子', '国王', '大臣', '天使', '看守', '旁观者'],
    },
  },
  {
    name: { ko: '갈릴리 바다', en: 'Sea of Galilee', zh: '加利利海' },
    roles: {
      ko: ['예수', '베드로', '어부', '세리', '군중', '병든사람', '배주인'],
      en: ['Jesus', 'Peter', 'Fisherman', 'Tax Collector', 'Crowd', 'Sick Person', 'Boat Owner'],
      zh: ['耶稣', '彼得', '渔夫', '税吏', '群众', '病人', '船主'],
    },
  },
  {
    name: { ko: '출애굽 광야', en: 'Exodus Wilderness', zh: '出埃及旷野' },
    roles: {
      ko: ['모세', '아론', '미리암', '정탐꾼', '이스라엘백성', '레위인', '불평자'],
      en: ['Moses', 'Aaron', 'Miriam', 'Scout', 'Israelite', 'Levite', 'Complainer'],
      zh: ['摩西', '亚伦', '米利暗', '探子', '以色列人', '利未人', '抱怨者'],
    },
  },
  {
    name: { ko: '봉사 구역', en: 'Ministry Territory', zh: '传道地区' },
    roles: {
      ko: ['개척자', '전도인', '집주인', '관심자', '어린이', '인도자', '차량봉사자'],
      en: ['Pioneer', 'Publisher', 'Householder', 'Interested One', 'Child', 'Leader', 'Driver'],
      zh: ['先驱', '传道员', '住户', '有兴趣的人', '小孩', '带领者', '司机'],
    },
  },
  {
    name: { ko: '성경연구 모임', en: 'Bible Study', zh: '圣经研究' },
    roles: {
      ko: ['인도자', '연구생', '참관자', '어린이', '호스트', '통역자', '새신자'],
      en: ['Conductor', 'Student', 'Observer', 'Child', 'Host', 'Interpreter', 'New One'],
      zh: ['主持人', '学生', '旁听者', '小孩', '东道主', '翻译', '新人'],
    },
  },
  {
    name: { ko: '여리고 성벽', en: 'Walls of Jericho', zh: '耶利哥城墙' },
    roles: {
      ko: ['여호수아', '제사장', '라합', '정탐꾼', '나팔수', '병사', '여리고왕'],
      en: ['Joshua', 'Priest', 'Rahab', 'Spy', 'Trumpeter', 'Soldier', 'King of Jericho'],
      zh: ['约书亚', '祭司', '喇合', '探子', '吹号者', '士兵', '耶利哥王'],
    },
  },
  {
    name: { ko: '베들레헴 마구간', en: 'Bethlehem Stable', zh: '伯利恒马厩' },
    roles: {
      ko: ['마리아', '요셉', '목자', '동방박사', '천사', '여관주인', '양'],
      en: ['Mary', 'Joseph', 'Shepherd', 'Wise Man', 'Angel', 'Innkeeper', 'Sheep'],
      zh: ['马利亚', '约瑟', '牧羊人', '博士', '天使', '客店老板', '羊'],
    },
  },
  {
    name: { ko: '큰 물고기 뱃속', en: 'Inside the Big Fish', zh: '大鱼腹中' },
    roles: {
      ko: ['요나', '물고기', '선원', '기도하는사람', '해초', '파도', '선장'],
      en: ['Jonah', 'Fish', 'Sailor', 'Praying Person', 'Seaweed', 'Wave', 'Captain'],
      zh: ['约拿', '大鱼', '水手', '祷告的人', '海草', '波浪', '船长'],
    },
  },
  {
    name: { ko: '국제 대회', en: 'International Convention', zh: '国际大会' },
    roles: {
      ko: ['해외대표', '통역자', '안내봉사자', '침례후보자', '연설자', '음악팀', '자원봉사자'],
      en: ['Delegate', 'Interpreter', 'Attendant', 'Baptism Candidate', 'Speaker', 'Music Team', 'Volunteer'],
      zh: ['代表', '翻译', '招待员', '受浸候选人', '演讲者', '音乐团队', '志愿者'],
    },
  },
  {
    name: { ko: '바벨탑 공사현장', en: 'Tower of Babel', zh: '巴别塔工地' },
    roles: {
      ko: ['니므롯', '건축가', '벽돌공', '감독관', '노동자', '통역자', '구경꾼'],
      en: ['Nimrod', 'Architect', 'Bricklayer', 'Overseer', 'Worker', 'Interpreter', 'Spectator'],
      zh: ['宁录', '建筑师', '砌砖工', '监工', '工人', '翻译', '旁观者'],
    },
  },
];
