export interface Location {
  name: { ko: string; en: string; zh: string };
  roles: { ko: string[]; en: string[]; zh: string[] };
}

export const LOCATIONS_STANDARD: Location[] = [
  {
    name: { ko: '비행기', en: 'Airplane', zh: '飞机' },
    roles: {
      ko: ['기장', '승무원', '승객', '보안요원', '어린이', '부기장', '일등석승객'],
      en: ['Pilot', 'Flight Attendant', 'Passenger', 'Air Marshal', 'Child', 'Co-pilot', 'First Class'],
      zh: ['机长', '空乘', '乘客', '空警', '小孩', '副机长', '头等舱'],
    },
  },
  {
    name: { ko: '병원', en: 'Hospital', zh: '医院' },
    roles: {
      ko: ['의사', '간호사', '환자', '방문객', '외과의', '약사', '응급구조사'],
      en: ['Doctor', 'Nurse', 'Patient', 'Visitor', 'Surgeon', 'Pharmacist', 'Paramedic'],
      zh: ['医生', '护士', '病人', '访客', '外科医生', '药剂师', '急救员'],
    },
  },
  {
    name: { ko: '학교', en: 'School', zh: '学校' },
    roles: {
      ko: ['선생님', '학생', '교장', '급식아줌마', '체육교사', '학부모', '청소부'],
      en: ['Teacher', 'Student', 'Principal', 'Lunch Lady', 'Gym Teacher', 'Parent', 'Janitor'],
      zh: ['老师', '学生', '校长', '食堂阿姨', '体育老师', '家长', '清洁工'],
    },
  },
  {
    name: { ko: '해변', en: 'Beach', zh: '海滩' },
    roles: {
      ko: ['수영객', '안전요원', '서퍼', '아이스크림장수', '사진사', '모래성건축가', '낚시꾼'],
      en: ['Swimmer', 'Lifeguard', 'Surfer', 'Ice Cream Vendor', 'Photographer', 'Sandcastle Builder', 'Fisher'],
      zh: ['游泳者', '救生员', '冲浪者', '冰淇淋小贩', '摄影师', '沙堡建造者', '钓鱼者'],
    },
  },
  {
    name: { ko: '식당', en: 'Restaurant', zh: '餐厅' },
    roles: {
      ko: ['요리사', '웨이터', '손님', '식당주인', '음식평론가', '설거지담당', '배달기사'],
      en: ['Chef', 'Waiter', 'Customer', 'Owner', 'Food Critic', 'Dishwasher', 'Delivery Driver'],
      zh: ['厨师', '服务员', '顾客', '老板', '美食评论家', '洗碗工', '外卖员'],
    },
  },
  {
    name: { ko: '영화관', en: 'Movie Theater', zh: '电影院' },
    roles: {
      ko: ['관객', '매표원', '영사기사', '팝콘판매원', '커플', '감독', '청소부'],
      en: ['Audience', 'Ticket Seller', 'Projectionist', 'Popcorn Vendor', 'Couple', 'Director', 'Cleaner'],
      zh: ['观众', '售票员', '放映员', '爆米花售卖员', '情侣', '导演', '清洁工'],
    },
  },
  {
    name: { ko: '우주선', en: 'Spaceship', zh: '宇宙飞船' },
    roles: {
      ko: ['선장', '엔지니어', '과학자', '외계인', '항해사', '의무관', '통신사'],
      en: ['Captain', 'Engineer', 'Scientist', 'Alien', 'Navigator', 'Medic', 'Communications'],
      zh: ['船长', '工程师', '科学家', '外星人', '领航员', '医务官', '通信员'],
    },
  },
  {
    name: { ko: '서커스', en: 'Circus', zh: '马戏团' },
    roles: {
      ko: ['광대', '조련사', '곡예사', '관객', '마술사', '단장', '줄타기선수'],
      en: ['Clown', 'Trainer', 'Acrobat', 'Spectator', 'Magician', 'Ringmaster', 'Tightrope Walker'],
      zh: ['小丑', '驯兽师', '杂技演员', '观众', '魔术师', '团长', '走钢丝演员'],
    },
  },
  {
    name: { ko: '경찰서', en: 'Police Station', zh: '警察局' },
    roles: {
      ko: ['경찰관', '형사', '용의자', '변호사', '피해자', '서장', '감식반'],
      en: ['Officer', 'Detective', 'Suspect', 'Lawyer', 'Victim', 'Chief', 'Forensics'],
      zh: ['警察', '侦探', '嫌疑人', '律师', '受害者', '局长', '法医'],
    },
  },
  {
    name: { ko: '슈퍼마켓', en: 'Supermarket', zh: '超市' },
    roles: {
      ko: ['캐셔', '손님', '매장관리자', '경비원', '시식코너직원', '배달원', '진열담당'],
      en: ['Cashier', 'Shopper', 'Manager', 'Security', 'Sample Lady', 'Delivery', 'Stocker'],
      zh: ['收银员', '顾客', '经理', '保安', '试吃员', '配送员', '理货员'],
    },
  },
  {
    name: { ko: '호텔', en: 'Hotel', zh: '酒店' },
    roles: {
      ko: ['프론트직원', '투숙객', '청소원', '벨보이', '매니저', '요리사', '수영장관리'],
      en: ['Receptionist', 'Guest', 'Housekeeper', 'Bellboy', 'Manager', 'Chef', 'Pool Attendant'],
      zh: ['前台', '住客', '清洁工', '门童', '经理', '厨师', '泳池管理员'],
    },
  },
  {
    name: { ko: '놀이공원', en: 'Amusement Park', zh: '游乐园' },
    roles: {
      ko: ['관람객', '놀이기구운영자', '마스코트', '매점직원', '사진사', '가이드', '안전요원'],
      en: ['Visitor', 'Ride Operator', 'Mascot', 'Vendor', 'Photographer', 'Guide', 'Safety Officer'],
      zh: ['游客', '设备操作员', '吉祥物', '小贩', '摄影师', '导游', '安全员'],
    },
  },
  {
    name: { ko: '도서관', en: 'Library', zh: '图书馆' },
    roles: {
      ko: ['사서', '독서하는사람', '학생', '작가', '노숙자', '컴퓨터이용자', '청소부'],
      en: ['Librarian', 'Reader', 'Student', 'Author', 'Homeless', 'Computer User', 'Janitor'],
      zh: ['图书管理员', '读者', '学生', '作家', '流浪者', '电脑使用者', '清洁工'],
    },
  },
  {
    name: { ko: '은행', en: 'Bank', zh: '银行' },
    roles: {
      ko: ['은행원', '고객', '경비원', '지점장', '강도', '투자상담사', '청소부'],
      en: ['Teller', 'Customer', 'Guard', 'Manager', 'Robber', 'Advisor', 'Janitor'],
      zh: ['柜员', '客户', '保安', '行长', '劫匪', '理财顾问', '清洁工'],
    },
  },
  {
    name: { ko: '캠핑장', en: 'Campsite', zh: '露营地' },
    roles: {
      ko: ['캠퍼', '관리인', '등산객', '가족', '요리담당', '낚시꾼', '곰'],
      en: ['Camper', 'Ranger', 'Hiker', 'Family', 'Cook', 'Fisher', 'Bear'],
      zh: ['露营者', '管理员', '徒步者', '家庭', '厨师', '钓鱼者', '熊'],
    },
  },
  {
    name: { ko: '결혼식', en: 'Wedding', zh: '婚礼' },
    roles: {
      ko: ['신랑', '신부', '주례', '하객', '사진사', '밴드', '꽃배달'],
      en: ['Groom', 'Bride', 'Officiant', 'Guest', 'Photographer', 'Band', 'Florist'],
      zh: ['新郎', '新娘', '主婚人', '宾客', '摄影师', '乐队', '花艺师'],
    },
  },
  {
    name: { ko: '지하철', en: 'Subway', zh: '地铁' },
    roles: {
      ko: ['승객', '기관사', '역무원', '노숙자', '버스킹연주자', '경찰', '관광객'],
      en: ['Passenger', 'Driver', 'Station Staff', 'Homeless', 'Busker', 'Police', 'Tourist'],
      zh: ['乘客', '司机', '站务员', '流浪者', '街头艺人', '警察', '游客'],
    },
  },
  {
    name: { ko: '동물원', en: 'Zoo', zh: '动物园' },
    roles: {
      ko: ['사육사', '관람객', '수의사', '가이드', '매점직원', '사진사', '원숭이'],
      en: ['Zookeeper', 'Visitor', 'Vet', 'Guide', 'Vendor', 'Photographer', 'Monkey'],
      zh: ['饲养员', '游客', '兽医', '导游', '小贩', '摄影师', '猴子'],
    },
  },
];
