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
  {
    name: { ko: '박물관', en: 'Museum', zh: '博物馆' },
    roles: {
      ko: ['큐레이터', '관람객', '안내원', '경비원', '예술가', '학생', '사진사'],
      en: ['Curator', 'Visitor', 'Guide', 'Security', 'Artist', 'Student', 'Photographer'],
      zh: ['馆长', '参观者', '导游', '保安', '艺术家', '学生', '摄影师'],
    },
  },
  {
    name: { ko: '쇼핑몰', en: 'Mall', zh: '商场' },
    roles: {
      ko: ['쇼핑객', '경비원', '점원', '푸드코트 직원', '매니저', '청소부', '부모'],
      en: ['Shopper', 'Security', 'Clerk', 'Food Court Worker', 'Manager', 'Cleaner', 'Parent'],
      zh: ['购物者', '保安', '店员', '美食广场员工', '经理', '清洁工', '家长'],
    },
  },
  {
    name: { ko: '수족관', en: 'Aquarium', zh: '水族馆' },
    roles: {
      ko: ['잠수사', '수생학자', '관람객', '안내원', '사진사', '청소부', '사육사'],
      en: ['Diver', 'Biologist', 'Visitor', 'Guide', 'Photographer', 'Cleaner', 'Keeper'],
      zh: ['潜水员', '生物学家', '参观者', '导游', '摄影师', '清洁工', '饲养员'],
    },
  },
  {
    name: { ko: '경기장', en: 'Stadium', zh: '体育场' },
    roles: {
      ko: ['선수', '코치', '팬', '해설자', '심판', '보안', '매점 직원'],
      en: ['Player', 'Coach', 'Fan', 'Announcer', 'Referee', 'Security', 'Vendor'],
      zh: ['运动员', '教练', '粉丝', '播音员', '裁判', '保安', '小贩'],
    },
  },
  {
    name: { ko: '공항', en: 'Airport', zh: '机场' },
    roles: {
      ko: ['조종사', '수하물 담당', '승객', '세관원', '탑승구 직원', '보안요원', '직원'],
      en: ['Pilot', 'Handler', 'Passenger', 'Customs Officer', 'Gate Agent', 'Security', 'Staff'],
      zh: ['飞行员', '行李员', '乘客', '海关', '登机口工作人员', '保安', '工作人员'],
    },
  },
  {
    name: { ko: '기차역', en: 'Train Station', zh: '火车站' },
    roles: {
      ko: ['기관사', '승객', '매표원', '수하물 운반원', '보안요원', '매점 직원', '기술자'],
      en: ['Conductor', 'Passenger', 'Ticket Seller', 'Porter', 'Security', 'Vendor', 'Engineer'],
      zh: ['列车长', '乘客', '售票员', '搬运工', '保安', '小贩', '工程师'],
    },
  },
  {
    name: { ko: '공장', en: 'Factory', zh: '工厂' },
    roles: {
      ko: ['현장감독', '노동자', '검사관', '엔지니어', '운전사', '인사담당', '청소부'],
      en: ['Foreman', 'Worker', 'Inspector', 'Engineer', 'Driver', 'HR', 'Cleaner'],
      zh: ['主管', '工人', '检查员', '工程师', '司机', '人事', '清洁工'],
    },
  },
  {
    name: { ko: '식료품점', en: 'Grocery Store', zh: '杂货店' },
    roles: {
      ko: ['캐셔', '쇼핑객', '진열원', '매니저', '보안요원', '제빵사', '청소부'],
      en: ['Cashier', 'Shopper', 'Stocker', 'Manager', 'Security', 'Baker', 'Cleaner'],
      zh: ['收银员', '购物者', '理货员', '经理', '保安', '面包师', '清洁工'],
    },
  },
  {
    name: { ko: '우체국', en: 'Post Office', zh: '邮局' },
    roles: {
      ko: ['우편배달부', '사무원', '고객', '감독', '분류원', '보안요원', '운전사'],
      en: ['Carrier', 'Clerk', 'Customer', 'Supervisor', 'Sorter', 'Security', 'Driver'],
      zh: ['邮递员', '职员', '顾客', '主管', '分拣员', '保安', '司机'],
    },
  },
  {
    name: { ko: '대학교', en: 'University', zh: '大学' },
    roles: {
      ko: ['교수', '학생', '연구원', '사서', '학장', '관리인', '식당 직원'],
      en: ['Professor', 'Student', 'Researcher', 'Librarian', 'Dean', 'Janitor', 'Cafeteria Worker'],
      zh: ['教授', '学生', '研究员', '图书管理员', '院长', '管理员', '食堂职员'],
    },
  },
  {
    name: { ko: '감옥', en: 'Prison', zh: '监狱' },
    roles: {
      ko: ['교도관', '수감자', '경비', '변호사', '방문객', '간호사', '요리사'],
      en: ['Warden', 'Inmate', 'Guard', 'Lawyer', 'Visitor', 'Nurse', 'Cook'],
      zh: ['狱警', '囚犯', '卫兵', '律师', '访客', '护士', '厨师'],
    },
  },
  {
    name: { ko: '콘서트홀', en: 'Concert Hall', zh: '音乐厅' },
    roles: {
      ko: ['가수', '음악가', '지휘자', '관객', '매표원', '무대 스태프', '보안'],
      en: ['Singer', 'Musician', 'Conductor', 'Audience', 'Ticket Seller', 'Stagehand', 'Security'],
      zh: ['歌手', '音乐家', '指挥', '观众', '售票员', '舞台工作人员', '保安'],
    },
  },
  {
    name: { ko: '유람선', en: 'Cruise Ship', zh: '游轮' },
    roles: {
      ko: ['선장', '요리사', '선원', '승객', '연예인', '기술자', '항해사'],
      en: ['Captain', 'Chef', 'Crew', 'Passenger', 'Entertainer', 'Engineer', 'Sailor'],
      zh: ['船长', '厨师', '船员', '乘客', '艺人', '工程师', '水手'],
    },
  },
  {
    name: { ko: '스키장', en: 'Ski Resort', zh: '滑雪胜地' },
    roles: {
      ko: ['스키어', '강사', '운영자', '매니저', '제설사', '사진사', '의무원'],
      en: ['Skier', 'Instructor', 'Operator', 'Manager', 'Snowmaker', 'Photographer', 'Medic'],
      zh: ['滑雪者', '教练', '运营员', '经理', '造雪员', '摄影师', '医务员'],
    },
  },
  {
    name: { ko: '볼링장', en: 'Bowling Alley', zh: '保龄球馆' },
    roles: {
      ko: ['볼러', '핀세터', '소유주', '코치', '간식점 직원', '주최자', '청소부'],
      en: ['Bowler', 'Pinsetter', 'Owner', 'Coach', 'Snack Bar Worker', 'Organizer', 'Janitor'],
      zh: ['保龄球手', '换瓶员', '老板', '教练', '小吃店员工', '组织者', '清洁工'],
    },
  },
  {
    name: { ko: '나이트클럽', en: 'Nightclub', zh: '夜店' },
    roles: {
      ko: ['디제이', '바텐더', '무용수', '문지기', '손님', '매니저', '기술자'],
      en: ['DJ', 'Bartender', 'Dancer', 'Bouncer', 'Customer', 'Manager', 'Technician'],
      zh: ['DJ', '酒保', '舞者', '保镖', '顾客', '经理', '技术员'],
    },
  },
  {
    name: { ko: '버스터미널', en: 'Bus Station', zh: '汽车站' },
    roles: {
      ko: ['운전사', '승객', '매표원', '차장', '청소부', '보안', '버스 기사'],
      en: ['Driver', 'Passenger', 'Ticket Seller', 'Conductor', 'Cleaner', 'Security', 'Coach'],
      zh: ['司机', '乘客', '售票员', '列车长', '清洁工', '保安', '教练'],
    },
  },
  {
    name: { ko: '법정', en: 'Courtroom', zh: '法庭' },
    roles: {
      ko: ['판사', '변호사', '피고', '원고', '집행관', '배심원', '기자'],
      en: ['Judge', 'Lawyer', 'Defendant', 'Plaintiff', 'Bailiff', 'Juror', 'Reporter'],
      zh: ['法官', '律师', '被告', '原告', '法警', '陪审员', '记者'],
    },
  },
  {
    name: { ko: '공사현장', en: 'Construction Site', zh: '建筑工地' },
    roles: {
      ko: ['현장감독', '목수', '전기공', '기계공', '측량사', '노동자', '검사관'],
      en: ['Foreman', 'Carpenter', 'Electrician', 'Operator', 'Surveyor', 'Laborer', 'Inspector'],
      zh: ['工地主管', '木匠', '电工', '操作员', '测量员', '工人', '检查员'],
    },
  },
  {
    name: { ko: '사무실건물', en: 'Office Building', zh: '办公楼' },
    roles: {
      ko: ['대표', '비서', '회계사', '개발자', '관리인', '인사담당', '인턴'],
      en: ['CEO', 'Secretary', 'Accountant', 'Developer', 'Janitor', 'HR Manager', 'Intern'],
      zh: ['CEO', '秘书', '会计', '开发者', '管理员', '人事经理', '实习生'],
    },
  },
  {
    name: { ko: '비치리조트', en: 'Beach Resort', zh: '海滩度假村' },
    roles: {
      ko: ['투숙객', '구조대원', '컨시어지', '하우스키퍼', '요리사', '가이드', '바텐더'],
      en: ['Guest', 'Lifeguard', 'Concierge', 'Housekeeper', 'Chef', 'Guide', 'Bartender'],
      zh: ['住客', '救生员', '礼宾员', '管家', '厨师', '向导', '酒保'],
    },
  },
  {
    name: { ko: '농장', en: 'Farm', zh: '农场' },
    roles: {
      ko: ['농부', '목동', '수의사', '정비사', '축사 관리인', '수확자', '방문객'],
      en: ['Farmer', 'Shepherd', 'Vet', 'Mechanic', 'Barn Hand', 'Picker', 'Visitor'],
      zh: ['农夫', '牧羊人', '兽医', '机械师', '棚舍工', '采摘工', '访客'],
    },
  },
  {
    name: { ko: '베이커리', en: 'Bakery', zh: '面包店' },
    roles: {
      ko: ['제빵사', '캐셔', '손님', '데코레이터', '반죽사', '배달원', '청소부'],
      en: ['Baker', 'Cashier', 'Customer', 'Decorator', 'Mixer Operator', 'Delivery Driver', 'Cleaner'],
      zh: ['面包师', '收银员', '顾客', '装饰师', '和面师', '送货员', '清洁工'],
    },
  },
  {
    name: { ko: '타투샵', en: 'Tattoo Parlor', zh: '纹身店' },
    roles: {
      ko: ['타투이스트', '손님', '접수원', '견습생', '피어서', '매니저', '청소부'],
      en: ['Artist', 'Client', 'Receptionist', 'Apprentice', 'Piercer', 'Manager', 'Cleaner'],
      zh: ['纹身师', '顾客', '接待员', '学徒', '穿刺师', '经理', '清洁工'],
    },
  },
  {
    name: { ko: '주유소', en: 'Gas Station', zh: '加油站' },
    roles: {
      ko: ['주유원', '운전사', '캐셔', '매니저', '정비사', '손님', '트럭 기사'],
      en: ['Attendant', 'Driver', 'Cashier', 'Manager', 'Mechanic', 'Customer', 'Truck Driver'],
      zh: ['加油员', '司机', '收银员', '经理', '技师', '顾客', '卡车司机'],
    },
  },
  {
    name: { ko: '소방서', en: 'Fire Station', zh: '消防站' },
    roles: {
      ko: ['소방관', '소방서장', '교신원', '구급대원', '신병', '정비사', '방문객'],
      en: ['Firefighter', 'Chief', 'Dispatcher', 'Paramedic', 'Recruit', 'Mechanic', 'Visitor'],
      zh: ['消防员', '队长', '调度员', '急救员', '新兵', '技师', '访客'],
    },
  },
  {
    name: { ko: '오락실', en: 'Arcade', zh: '游戏厅' },
    roles: {
      ko: ['게이머', '직원', '기술자', '사장', '부모', '캐셔', '청소부'],
      en: ['Gamer', 'Attendant', 'Technician', 'Owner', 'Parent', 'Cashier', 'Janitor'],
      zh: ['玩家', '服务员', '技术员', '老板', '家长', '收银员', '清洁工'],
    },
  },
  {
    name: { ko: '과학실험실', en: 'Science Lab', zh: '科学实验室' },
    roles: {
      ko: ['과학자', '기술자', '조수', '학생', '안전요원', '청소부', '발명가'],
      en: ['Scientist', 'Technician', 'Assistant', 'Student', 'Safety Officer', 'Cleaner', 'Inventor'],
      zh: ['科学家', '技术员', '助理', '学生', '安全员', '清洁工', '发明家'],
    },
  },
  {
    name: { ko: '수의과병원', en: 'Veterinary Clinic', zh: '兽医医院' },
    roles: {
      ko: ['수의사', '주인', '간호사', '접수원', '외과의', '기술자', '환자'],
      en: ['Vet', 'Owner', 'Nurse', 'Receptionist', 'Surgeon', 'Technician', 'Patient'],
      zh: ['兽医', '主人', '护士', '接待员', '外科医生', '技师', '病人'],
    },
  },
  {
    name: { ko: '뉴스룸', en: 'Newsroom', zh: '新闻编辑部' },
    roles: {
      ko: ['기자', '편집자', '카메라 기사', '앵커', '프로듀서', '기술자', '인턴'],
      en: ['Reporter', 'Editor', 'Camera Operator', 'Anchor', 'Producer', 'Engineer', 'Intern'],
      zh: ['记者', '编辑', '摄影师', '主播', '制片人', '工程师', '实习生'],
    },
  },
  {
    name: { ko: '댄스스튜디오', en: 'Dance Studio', zh: '舞蹈工作室' },
    roles: {
      ko: ['강사', '무용수', '안무가', '부모', '음악가', '학생', '사진사'],
      en: ['Instructor', 'Dancer', 'Choreographer', 'Parent', 'Musician', 'Student', 'Photographer'],
      zh: ['教练', '舞者', '编舞', '家长', '音乐家', '学生', '摄影师'],
    },
  },
  {
    name: { ko: '고고학발굴지', en: 'Archaeological Dig', zh: '考古发掘地' },
    roles: {
      ko: ['고고학자', '발굴자', '역사가', '학생', '사진사', '연구소 기술자', '경비원'],
      en: ['Archaeologist', 'Excavator', 'Historian', 'Student', 'Photographer', 'Lab Tech', 'Guard'],
      zh: ['考古学家', '发掘者', '历史学家', '学生', '摄影师', '实验室技术员', '守卫'],
    },
  },
];
